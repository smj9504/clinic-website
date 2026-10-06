/**
 * 안내 챗봇 — 홈페이지에 실제로 게시된 내용만으로 답한다 (서버 전용)
 *
 * site_data(병원 정보·FAQ·이벤트·공지·소개·하위 페이지·장비)와 시술 카탈로그
 * (가격·상세 블록·Q&A)를 문서 목록으로 펼친 뒤, 질문과 가장 많이 겹치는 문서를
 * 찾아 그 문서의 내용을 그대로 돌려준다. 문서에 없는 말은 만들어내지 않는다 —
 * 관리자 화면에서 내용을 고치면 챗봇 답변도 그대로 따라간다.
 *
 * 한국어는 띄어쓰기·조사가 제각각이라 단어 대신 글자 2개짜리 묶음(bigram)으로
 * 비교한다. "리프팅은 얼마예요" → 리프·프팅·팅은·얼마·마예·예요 처럼 쪼개면
 * "리프팅" 이 들어간 문서와 조사와 무관하게 겹친다.
 */

import type { Locale } from "./i18n";
import type { SiteData } from "./storage";
import { htmlToText } from "./html";
import { isEventEnded, todayKST } from "./date";
import { computePrice, formatKRW } from "./price";
import {
  blockText,
  categoryText,
  isServiceVisible,
  priceText,
  serviceText,
  subcategoryText,
  type ServiceCatalog,
} from "./services";

export type ChatLink = { label: string; href: string; external?: boolean };

export type ChatAnswer = {
  text: string;
  links: ChatLink[];
  /** false면 홈페이지에서 관련 내용을 찾지 못한 것 */
  found: boolean;
};

type Doc = {
  kind: "info" | "faq" | "service" | "qna" | "event" | "notice" | "page" | "equipment" | "about";
  /** 질문과 비교할 때 가장 무겁게 보는 텍스트 (제목·질문) */
  title: string;
  /** 제목 다음으로 보는 텍스트 (분류명·키워드·태그) */
  keywords: string;
  /** 본문 */
  body: string;
  answer: string;
  links: ChatLink[];
  /** 같은 시술에서 나온 문서끼리 묶어 중복 답변을 막는다 */
  groupId?: string;
};

// ─── 토큰화 ───

/** 질문에서 의미 없이 반복되는 말. 이 말들이 겹친다고 관련 문서가 되진 않는다 */
const QUERY_STOPWORDS = [
  "어떻게", "어떤가요", "어때요", "되나요", "되요", "돼요", "인가요", "있나요", "있어요", "있을까요",
  "알려주세요", "알려줘", "알고", "싶어요", "싶은데", "궁금해요", "궁금합니다", "궁금", "문의",
  "하나요", "하나", "해요", "할까요", "할수", "수있나요", "가능한가요", "가능해요", "가능",
  "받을", "받고", "받으려면", "맞을", "맞고", "하려면", "입니다", "이에요", "예요", "에요", "요", "좀", "혹시", "그", "이", "저", "거", "건가요", "뭐예요", "뭔가요",
  "what", "how", "is", "are", "do", "does", "the", "a", "an", "can", "i", "you", "your", "to", "of", "for", "in", "and",
];

const HANGUL_RE = /[가-힣]+/g;
const LATIN_RE = /[a-z0-9]+/g;

/** 질문 끝에 붙는 어미 — "얼마예요" → "얼마", "하나요" → "하" */
const QUERY_ENDING_RE = /(이에요|이예요|인가요|인데요|예요|에요|나요|가요|까요|어요|아요|해요|세요|는데|요)$/;
/** 단어 끝 조사 — "리프팅은" → "리프팅". 2글자 단어는 조사인지 단어 일부인지 알 수 없어 건드리지 않는다 */
const QUERY_PARTICLE_RE = /(은|는|이|가|을|를|도|에|의|로|으로|랑|하고|에서)$/;

const SINGLE_CHAR_STOPWORDS = new Set(
  "수 및 등 더 꼭 좀 또 그 이 저 것 거 때 안 잘 못 위 후 전 중 한 두 세 내 제 각 별 약 총 는 은 을 를 가 의 에 도 와 과 로 고 요 만 뭐 왜 걸 게 데 분 번 회 개 곳".split(" ")
);

/** 증상을 말로 풀어 묻는 질문을 홈페이지의 용어로 바꿔 함께 찾는다 */
const QUERY_SYNONYMS: [RegExp, string][] = [
  [/아프|아파|아픈|쑤시|결리|저리|뻐근/, "통증"],
  [/빼|제거/, "제거"],
  [/주름|처짐|처진|탄력/, "리프팅"],
  [/기미|잡티|색소/, "기미 잡티"],
  [/털/, "제모"],
  [/사고/, "교통사고"],
];

function normalizeQueryWord(word: string): string {
  let w = word.replace(/[?!.,~]+$/, "");
  if (QUERY_STOPWORDS.includes(w)) return "";
  const noEnding = w.replace(QUERY_ENDING_RE, "");
  if (noEnding.length >= 2) w = noEnding;
  const noParticle = w.replace(QUERY_PARTICLE_RE, "");
  if (w.length >= 3 && noParticle.length >= 2) w = noParticle;
  const synonym = QUERY_SYNONYMS.find(([re]) => re.test(w));
  if (synonym && !w.includes(synonym[1])) {
    // 짧은 활용형("아파", "빼는데")은 동의어로 바꾸고, 긴 단어("사고났을때")는 원래 말도 남긴다.
    // 활용형을 그대로 두면 어느 문서에도 없어 겹침 비율만 깎는다
    return w.length <= 3 ? synonym[1] : `${w} ${synonym[1]}`;
  }
  return w;
}

function tokenize(text: string, { stripStopwords = false } = {}): string[] {
  let src = text.toLowerCase();
  if (stripStopwords) {
    src = src.split(/\s+/).map(normalizeQueryWord).filter(Boolean).join(" ");
  }
  const tokens: string[] = [];
  for (const word of src.match(HANGUL_RE) ?? []) {
    // 한 글자 단어는 "점·침·뜸" 처럼 뜻이 있는 것만 비교한다 ("수", "좀", "등" 은 제외)
    if (word.length === 1) {
      if (!SINGLE_CHAR_STOPWORDS.has(word)) tokens.push(word);
      continue;
    }
    for (let i = 0; i < word.length - 1; i++) tokens.push(word.slice(i, i + 2));
  }
  for (const word of src.match(LATIN_RE) ?? []) {
    if (word.length >= 2 || /\d/.test(word)) tokens.push(word);
  }
  return tokens;
}

type IndexedDoc = Doc & { titleSet: Set<string>; keywordSet: Set<string>; bodySet: Set<string> };

function indexDoc(doc: Doc): IndexedDoc {
  return {
    ...doc,
    // FAQ·Q&A의 제목은 사용자 질문과 같은 꼴("…어떻게 되나요?")이라 질문과 같은 방식으로 쪼갠다
    titleSet: new Set(tokenize(doc.title, { stripStopwords: doc.kind === "faq" || doc.kind === "qna" })),
    keywordSet: new Set(tokenize(doc.keywords)),
    bodySet: new Set(tokenize(doc.body)),
  };
}

// ─── 문서 만들기 ───

const L = {
  ko: {
    hours: "진료 시간 안내입니다.",
    phone: "전화번호",
    address: "주소",
    reservation: "네이버 예약으로 온라인 예약이 가능합니다.",
    reservationRequest: "홈페이지 상담 신청",
    naverBooking: "네이버 예약",
    callUs: "전화 문의",
    price: "가격",
    period: "기간",
    viewDetail: "자세히 보기",
    related: "함께 찾아본 내용",
    notFound: "죄송합니다. 홈페이지에서 해당 질문과 관련된 내용을 찾지 못했습니다.",
    notFoundCall: "자세한 내용은 전화로 문의해 주세요",
    servicesFound: "관련 시술 안내입니다.",
    priceInquiry: "가격은 상담 후 안내드립니다.",
    ongoingEvents: "현재 진행 중인 이벤트입니다.",
    noEvents: "현재 진행 중인 이벤트는 없습니다.\n\n시술별 가격은 '이벤트/시술가격' 메뉴에서 확인하실 수 있습니다.",
    servicePrices: "시술 가격 보기",
  },
  en: {
    hours: "Here are our office hours.",
    phone: "Phone",
    address: "Address",
    reservation: "You can book online through Naver Booking.",
    reservationRequest: "Consultation request",
    naverBooking: "Naver Booking",
    callUs: "Call us",
    price: "Price",
    period: "Period",
    viewDetail: "View details",
    related: "Related",
    notFound: "Sorry, we couldn't find anything on our website related to your question.",
    notFoundCall: "Please call us for more details",
    servicesFound: "Here are the related treatments.",
    priceInquiry: "Pricing is provided after consultation.",
    ongoingEvents: "Here are our current events.",
    noEvents: "There are no events running right now.\n\nYou can check treatment prices on the Events/Prices page.",
    servicePrices: "View prices",
  },
} as const;

function clip(text: string, max: number): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
}

function servicePriceLines(prices: ServiceCatalog["services"][number]["prices"], locale: Locale): string[] {
  return prices.map((p) => {
    const { label, note } = priceText(p, locale);
    const { final, hasDiscount } = computePrice(p);
    const amount = hasDiscount
      ? `${formatKRW(final)} (${formatKRW(p.originalPrice)} → ${formatKRW(final)})`
      : formatKRW(final);
    return `• ${label ? `${label}: ` : ""}${amount}${note ? ` — ${note}` : ""}`;
  });
}

function buildDocs(site: SiteData, catalog: ServiceCatalog, locale: Locale): Doc[] {
  const t = L[locale];
  const docs: Doc[] = [];
  const info = site.clinicInfo;
  const today = todayKST();

  // 진료 시간 — 진료 일정 팝업이 켜져 있으면 그 달의 일정(접수 마감·점심시간)도 함께 안내한다
  const hourLines = [info.hours.weekday, info.hours.saturday, info.hours.closed].filter(Boolean).map((h) => `• ${h}`);
  const schedule = site.schedulePopup;
  // 지난 달 일정(예: 10월에 "8월 진료 일정")은 틀린 안내가 되므로 이번 달이거나 월 지정이 없을 때만 쓴다
  const thisMonth = today.slice(0, 7).replace("-", ".");
  const scheduleIsCurrent = !schedule?.month || schedule.month.replace(/[-/]/g, ".").startsWith(thisMonth);
  if (schedule?.isActive && scheduleIsCurrent && schedule.rows?.length) {
    hourLines.push("", schedule.title || "");
    for (const row of schedule.rows) {
      hourLines.push(`• ${row.day}: ${row.hours}${row.note ? ` (${row.note})` : ""}`);
    }
    if (schedule.notice) hourLines.push(`※ ${schedule.notice}`);
  }
  if (hourLines.length) {
    docs.push({
      kind: "info",
      title: "진료 시간 영업 시간 hours",
      keywords:
        "몇시 언제 오픈 마감 접수마감 점심시간 평일 토요일 주말 일요일 공휴일 휴진 휴무 야간 office hours open close weekend saturday sunday lunch",
      body: hourLines.join(" "),
      answer: `${t.hours}\n\n${hourLines.join("\n").trim()}`,
      links: [],
    });
  }

  if (info.phone) {
    docs.push({
      kind: "info",
      title: "전화번호 연락처 phone",
      keywords: "전화 번호 연락 문의 상담 call contact number",
      body: info.phone,
      answer: `${t.phone}: ${info.phone}`,
      links: [{ label: t.callUs, href: `tel:${info.phone.replace(/[^0-9+]/g, "")}`, external: true }],
    });
  }

  if (info.address) {
    docs.push({
      kind: "info",
      title: "주소 위치 오시는 길 location",
      keywords: "어디 찾아가는 길 지도 역 근처 위치 address where map directions",
      body: info.address,
      answer: `${t.address}: ${info.address}`,
      links: [
        {
          label: locale === "ko" ? "네이버 지도" : "Naver Map",
          href: `https://map.naver.com/p/search/${encodeURIComponent(info.name || info.address)}`,
          external: true,
        },
      ],
    });
  }

  if (info.reservationUrl || info.phone) {
    const lines: string[] = [t.reservation];
    if (info.phone) lines.push(`${t.phone}: ${info.phone}`);
    docs.push({
      kind: "info",
      title: "예약 방법 reservation",
      keywords: "예약 접수 신청 상담 네이버 온라인 book booking appointment",
      body: lines.join(" "),
      answer: lines.join("\n"),
      links: [
        ...(info.reservationUrl ? [{ label: t.naverBooking, href: info.reservationUrl, external: true }] : []),
        { label: t.reservationRequest, href: "/reservation" },
      ],
    });
  }

  // FAQ — 관리자가 직접 쓴 답변이 가장 정확하므로 그대로 쓴다
  for (const faq of site.faqs ?? []) {
    if (!faq.question || !faq.answer) continue;
    docs.push({
      kind: "faq",
      title: faq.question,
      keywords: faq.category ?? "",
      body: faq.answer,
      answer: faq.answer,
      links: [],
    });
  }

  // 시술 — 이름·요약·분류·가격·상세 블록 전체
  const visibleCategories = new Map(catalog.categories.filter((c) => !c.isHidden).map((c) => [c.id, c]));
  const visibleSubcategories = new Map(
    catalog.subcategories
      .filter((s) => !s.isHidden && visibleCategories.has(s.categoryId))
      .map((s) => [s.id, s])
  );
  for (const svc of catalog.services) {
    const sub = visibleSubcategories.get(svc.subcategoryId);
    if (!sub || !isServiceVisible(svc, today)) continue;
    const cat = visibleCategories.get(sub.categoryId);
    const { name, summary } = serviceText(svc, locale);
    if (!name) continue;
    const catName = cat ? categoryText(cat, locale).name : "";
    const subName = subcategoryText(sub, locale).name;
    const href = `/services/${svc.id}`;

    const blockTexts: string[] = [];
    for (const block of svc.blocks ?? []) {
      if (block.isHidden) continue;
      const bt = blockText(block, locale);
      blockTexts.push(bt.title);
      if (bt.html) blockTexts.push(htmlToText(bt.html));
      if (bt.items?.length) blockTexts.push(bt.items.join(" "));
      for (const pair of bt.qna ?? []) {
        if (!pair.q || !pair.a) continue;
        blockTexts.push(pair.q, pair.a);
        docs.push({
          kind: "qna",
          title: `${name} ${pair.q}`,
          keywords: `${catName} ${subName}`,
          body: pair.a,
          answer: `[${name}] ${pair.q}\n\n${pair.a}`,
          links: [{ label: `${name} ${t.viewDetail}`, href }],
          groupId: svc.id,
        });
      }
    }

    const priceLines = servicePriceLines(svc.prices ?? [], locale);
    const answerLines = [`[${name}]`];
    if (summary) answerLines.push(summary);
    if (svc.saleEndDate) answerLines.push(`${t.period}: ~ ${svc.saleEndDate.replace(/-/g, ".")}`);
    answerLines.push("", priceLines.length ? priceLines.join("\n") : t.priceInquiry);

    docs.push({
      kind: "service",
      title: name,
      keywords: `${catName} ${subName} ${svc.tag ?? ""} 시술 가격 비용 얼마 금액 price cost`,
      body: [summary, ...blockTexts].join(" "),
      answer: answerLines.join("\n").trim(),
      links: [{ label: `${name} ${t.viewDetail}`, href }],
      groupId: svc.id,
    });
  }

  // 이벤트 — 종료된 것은 안내하지 않는다
  const ongoingEvents = (site.events ?? []).filter(
    (ev) => ev.title && !isEventEnded(ev) && !(ev.startDate && ev.startDate > today)
  );
  // "이벤트 있어요?" 처럼 특정 이벤트를 짚지 않은 질문에 답하는 목록
  docs.push({
    kind: "info",
    title: "이벤트 진행 중인 이벤트 events",
    keywords: "이벤트 할인 특가 프로모션 행사 혜택 event promotion discount sale",
    body: ongoingEvents.map((ev) => ev.title).join(" "),
    answer: ongoingEvents.length
      ? [t.ongoingEvents, ...ongoingEvents.map((ev) => `• ${ev.title}${ev.endDate ? ` (~ ${ev.endDate.replace(/-/g, ".")})` : ""}`)].join("\n")
      : t.noEvents,
    links: [
      ...ongoingEvents.slice(0, 3).map((ev) => ({ label: ev.title, href: `/events/${ev.id}` })),
      { label: t.servicePrices, href: "/services" },
    ],
  });
  for (const ev of ongoingEvents) {
    const desc = htmlToText(ev.description ?? "", "\n");
    const period =
      ev.startDate || ev.endDate
        ? `${t.period}: ${(ev.startDate ?? "").replace(/-/g, ".")} ~ ${(ev.endDate ?? "").replace(/-/g, ".")}`
        : "";
    docs.push({
      kind: "event",
      title: `${ev.title} ${ev.subtitle ?? ""}`,
      keywords: "이벤트 할인 특가 프로모션 행사 event promotion discount sale",
      body: desc,
      answer: [`[${ev.title}]`, ev.subtitle, period, desc && clip(desc, 400)].filter(Boolean).join("\n"),
      links: [{ label: t.viewDetail, href: `/events/${ev.id}` }],
    });
  }

  // 공지사항
  for (const n of site.notices ?? []) {
    if (!n.title || isEventEnded(n)) continue;
    const content = htmlToText(n.content ?? "", "\n");
    docs.push({
      kind: "notice",
      title: n.title,
      keywords: "공지 공지사항 안내 소식 notice news",
      body: content,
      answer: [`[${n.title}]`, content && clip(content, 400)].filter(Boolean).join("\n\n"),
      links: [{ label: t.viewDetail, href: `/community/notice/${n.id}` }],
    });
  }

  // 피부미용·한방치료 하위 페이지 (리프팅, 통증치료, 교통사고 후유증 …)
  const menuLabel = new Map<string, string>();
  for (const m of site.menus ?? []) menuLabel.set(m.id, m.label);
  for (const page of site.subPages ?? []) {
    if (page.isHidden || !page.title) continue;
    const sections: string[] = [];
    if (page.intro) sections.push(htmlToText(page.intro, "\n"));
    for (const block of page.checklistBlocks ?? []) {
      sections.push(
        [block.title, block.body && htmlToText(block.body, "\n"), ...(block.items ?? []).map((i) => `• ${i.text}`)]
          .filter(Boolean)
          .join("\n")
      );
    }
    if (page.body) sections.push(htmlToText(page.body, "\n"));
    const structured = [
      page.pointCards && [page.pointCards.title, ...page.pointCards.items.map((i) => `${i.title} ${htmlToText(i.body)}`)].join(" "),
      page.stepProcess && [page.stepProcess.title, page.stepProcess.intro, ...page.stepProcess.items.map((i) => i.text)].join(" "),
      page.tabs &&
        [
          page.tabs.title,
          page.tabs.intro,
          ...page.tabs.items.map((i) => `${i.title} ${htmlToText(i.body)} ${i.tags.join(" ")} ${i.benefits.join(" ")}`),
        ].join(" "),
      page.sequentialChecklist && [page.sequentialChecklist.title, ...page.sequentialChecklist.items.map((i) => i.text)].join(" "),
      page.checklistHero && [page.checklistHero.title, ...page.checklistHero.items.map((i) => `${i.label} ${i.detail}`)].join(" "),
    ]
      .filter(Boolean)
      .join(" ");
    const full = sections.join("\n").trim();
    docs.push({
      kind: "page",
      title: page.title,
      keywords: `${menuLabel.get(page.parentMenuId) ?? ""} 치료 시술 진료`,
      body: `${full} ${structured}`,
      answer: [`[${page.title}]`, clip(full || structured, 350)].filter(Boolean).join("\n"),
      links: [{ label: `${page.title} ${t.viewDetail}`, href: `/subpages/${page.slug}` }],
    });
  }

  // 메인 진료 분야 카드
  for (const tr of site.treatments ?? []) {
    if (!tr.title) continue;
    const title = tr.title.replace(/\s+/g, " ");
    docs.push({
      kind: "page",
      title,
      keywords: "진료 과목 분야 치료 treatment",
      body: `${tr.description ?? ""} ${tr.longDescription ?? ""}`,
      answer: [`[${title}]`, tr.description, tr.longDescription].filter(Boolean).join("\n"),
      links: tr.linkUrl ? [{ label: t.viewDetail, href: tr.linkUrl }] : [],
    });
  }

  // 장비
  for (const eq of site.equipment ?? []) {
    if (eq.isHidden || !eq.title) continue;
    docs.push({
      kind: "equipment",
      title: `${eq.title} ${eq.subtitle ?? ""}`,
      keywords: `장비 기계 레이저 ${(eq.tags ?? []).join(" ")} equipment device`,
      body: eq.description ?? "",
      answer: [`[${eq.title}]`, eq.subtitle, eq.description].filter(Boolean).join("\n"),
      links: [{ label: t.viewDetail, href: "/equipment" }],
    });
  }

  // 원장 · 진료 철학
  const dir = site.director;
  if (dir?.name) {
    const bio = (dir.bio ?? []).filter(Boolean);
    docs.push({
      kind: "about",
      title: `${dir.name} ${dir.title} 원장 의료진`,
      keywords: "원장님 의사 한의사 의료진 약력 경력 학력 doctor director",
      body: `${dir.quote ?? ""} ${bio.join(" ")}`,
      answer: [`${dir.name} ${dir.title}`, dir.quote, bio.map((b) => `• ${b}`).join("\n")].filter(Boolean).join("\n\n"),
      links: [{ label: t.viewDetail, href: "/about" }],
    });
  }
  if (site.about?.philosophyBody) {
    const body = site.about.philosophyBody;
    docs.push({
      kind: "about",
      title: `${site.about.philosophyTitle || "진료 철학"} ${info.name} 소개`,
      keywords: "한의원 소개 철학 병원 about clinic philosophy",
      body,
      answer: clip(body, 400),
      links: [{ label: t.viewDetail, href: "/about" }],
    });
  }

  return docs;
}

// ─── 지식 베이스 캐시 ───

type KnowledgeBase = { docs: IndexedDoc[]; idf: Map<string, number>; phone: string };

const CACHE_TTL_MS = 60_000;
const cache = new Map<Locale, { at: number; kb: KnowledgeBase }>();

export function buildKnowledgeBase(site: SiteData, catalog: ServiceCatalog, locale: Locale): KnowledgeBase {
  const docs = buildDocs(site, catalog, locale).map(indexDoc);
  const df = new Map<string, number>();
  for (const d of docs) {
    for (const tok of new Set([...d.titleSet, ...d.keywordSet, ...d.bodySet])) {
      df.set(tok, (df.get(tok) ?? 0) + 1);
    }
  }
  const n = docs.length || 1;
  const idf = new Map<string, number>();
  for (const [tok, count] of df) idf.set(tok, Math.log(1 + n / count));
  return { docs, idf, phone: site.clinicInfo?.phone ?? "" };
}

export async function getKnowledgeBase(
  locale: Locale,
  load: () => Promise<{ site: SiteData; catalog: ServiceCatalog }>
): Promise<KnowledgeBase> {
  const hit = cache.get(locale);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.kb;
  const { site, catalog } = await load();
  const kb = buildKnowledgeBase(site, catalog, locale);
  cache.set(locale, { at: Date.now(), kb });
  return kb;
}

// ─── 검색 · 답변 ───

const PRICE_WORDS = /가격|얼마|비용|금액|요금|가격표|price|cost|how much/i;

function scoreDoc(doc: IndexedDoc, queryTokens: string[], idf: Map<string, number>): number {
  let score = 0;
  let coverage = 0;
  let matchedTitle = 0;
  for (const tok of queryTokens) {
    const w = idf.get(tok) ?? 0;
    if (doc.titleSet.has(tok)) {
      score += w * 3;
      coverage += 1;
      matchedTitle++;
    } else if (doc.keywordSet.has(tok)) {
      score += w * 2;
      coverage += 1;
    } else if (doc.bodySet.has(tok)) {
      score += w * 0.6;
      coverage += 0.5;
    }
  }
  // "오늘 날씨 어때" 가 원장 인사말의 "오늘" 하나로 걸리지 않도록, 질문의 일정 비율 이상이 겹쳐야 한다.
  // 본문에만 스친 말은 절반만 친다
  if (coverage / queryTokens.length < MIN_COVERAGE) return 0;
  if (doc.titleSet.size && matchedTitle) {
    // 질문 토큰이 제목에 거의 다 들어 있으면 (FAQ 문구를 그대로 누른 경우 등) 확실한 답이다
    if (matchedTitle / queryTokens.length >= 0.7) score *= 1.5;
    // 같은 말이 걸려도 제목이 짧을수록 그 주제를 직접 다루는 문서다
    // ("예약" → "예약 방법" 이 "예약 없이 방문해도 진료가 가능한가요" 보다 앞선다)
    score *= 0.8 + 0.4 * (matchedTitle / doc.titleSet.size);
  }
  return score;
}

const MIN_COVERAGE = 0.4;

/** 이 점수 아래면 홈페이지 내용과 관련 없는 질문으로 본다 */
const MIN_SCORE = 1.5;

export function answerQuestion(kb: KnowledgeBase, question: string, locale: Locale): ChatAnswer {
  const t = L[locale];
  const queryTokens = [...new Set(tokenize(question, { stripStopwords: true }))];
  const fallback: ChatAnswer = {
    text: `${t.notFound}\n\n${t.notFoundCall}${kb.phone ? `: ${kb.phone}` : "."}`,
    links: kb.phone ? [{ label: t.callUs, href: `tel:${kb.phone.replace(/[^0-9+]/g, "")}`, external: true }] : [],
    found: false,
  };
  if (!queryTokens.length) return fallback;

  const asksPrice = PRICE_WORDS.test(question);
  const ranked = kb.docs
    .map((doc) => {
      let score = scoreDoc(doc, queryTokens, kb.idf);
      if (asksPrice && doc.kind === "service") score *= 1.4;
      // 관리자가 직접 쓴 FAQ 답변이 자동으로 조합한 안내보다 자세하다 — 비슷하면 FAQ를 고른다
      if (doc.kind === "faq") score *= 1.1;
      return { doc, score };
    })
    .filter((r) => r.score >= MIN_SCORE)
    .sort((a, b) => b.score - a.score);

  // 같은 시술에서 나온 문서(시술 카드 + 그 시술의 Q&A)는 가장 높은 것 하나만 남긴다
  const seen = new Set<string>();
  const results = ranked.filter(({ doc }) => {
    if (!doc.groupId) return true;
    if (seen.has(doc.groupId)) return false;
    seen.add(doc.groupId);
    return true;
  });
  if (!results.length) return fallback;

  const top = results[0];
  const close = results.filter((r) => r.score >= top.score * 0.75);

  // "리프팅 가격" 처럼 여러 시술이 비슷하게 걸리면 한 개만 고르지 말고 함께 보여준다
  const closeServices = close.filter((r) => r.doc.kind === "service").slice(0, 4);
  if (top.doc.kind === "service" && closeServices.length > 1) {
    return {
      text: [t.servicesFound, ...closeServices.map((r) => r.doc.answer)].join("\n\n"),
      links: closeServices.flatMap((r) => r.doc.links),
      found: true,
    };
  }

  const related = results
    .slice(1)
    .filter((r) => r.score >= top.score * 0.6 && r.doc.links.length)
    .slice(0, 2)
    .flatMap((r) => r.doc.links)
    .filter((l) => !top.doc.links.some((tl) => tl.href === l.href));

  return {
    text: top.doc.answer,
    links: [...top.doc.links, ...related],
    found: true,
  };
}
