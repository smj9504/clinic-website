/**
 * Storage Abstraction Layer
 *
 * 현재: LocalStorage 기반 (데모용)
 * 추후: FastAPI + PostgreSQL로 교체 시, 이 파일의 함수만 fetch() 호출로 갈아끼우면 됨.
 *
 * 모든 사이트 콘텐츠를 단일 객체로 관리하여 Admin에서 일괄 수정 가능.
 * 다국어 지원: 언어별(ko/en) 별도 저장.
 */

import {
  events as defaultEvents,
  eventsEn as defaultEventsEn,
  treatments as defaultTreatments,
  treatmentsEn as defaultTreatmentsEn,
  director as defaultDirector,
  directorEn as defaultDirectorEn,
  notices as defaultNotices,
  noticesEn as defaultNoticesEn,
  heroSlides as defaultHeroSlides,
  heroSlidesEn as defaultHeroSlidesEn,
  clinicInfo as defaultClinicInfo,
  clinicInfoEn as defaultClinicInfoEn,
  sampleImages,
  type Event,
  type Treatment,
  type Director,
  type Notice,
  type HeroSlide,
} from "./data";

import type { Locale } from "./i18n";

const STORAGE_KEY_PREFIX = "clinic_site_data";
const STORAGE_VERSION = "v2";

function storageKey(locale: Locale) {
  return `${STORAGE_KEY_PREFIX}_${locale}_${STORAGE_VERSION}`;
}

// ─── Menu 타입 (Admin에서 동적 관리) ───
export type MenuItem = {
  id: string;
  label: string;
  href: string;
  isHidden: boolean;
  sortOrder: number;
  bannerImage?: string;
  children?: MenuItem[];
};

export const defaultMenus: MenuItem[] = [
  { id: "m1", label: "홈", href: "/", isHidden: false, sortOrder: 0 },
  {
    id: "m2",
    label: "진행중인 이벤트",
    href: "/events",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "m3",
    label: "진료 내용",
    href: "/treatments",
    isHidden: false,
    sortOrder: 2,
  },
  { id: "m4", label: "한의원 소개", href: "/about", isHidden: false, sortOrder: 3 },
  {
    id: "m5",
    label: "커뮤니티",
    href: "/community/notice",
    isHidden: false,
    sortOrder: 4,
  },
];

export const defaultMenusEn: MenuItem[] = [
  { id: "m1", label: "Home", href: "/", isHidden: false, sortOrder: 0 },
  {
    id: "m2",
    label: "Events",
    href: "/events",
    isHidden: false,
    sortOrder: 1,
  },
  {
    id: "m3",
    label: "Treatments",
    href: "/treatments",
    isHidden: false,
    sortOrder: 2,
  },
  { id: "m4", label: "About", href: "/about", isHidden: false, sortOrder: 3 },
  {
    id: "m5",
    label: "Community",
    href: "/community/notice",
    isHidden: false,
    sortOrder: 4,
  },
];

// ─── FAQ 타입 ───
export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export const defaultFaqs: FaqItem[] = [
  {
    id: "f1",
    category: "진료",
    question: "진료 시간이 어떻게 되나요?",
    answer:
      "평일은 오전 9시부터 오후 7시까지, 토요일은 오전 9시부터 오후 2시까지 진료합니다. 일요일과 공휴일은 휴진입니다.",
    sortOrder: 0,
  },
  {
    id: "f2",
    category: "예약",
    question: "예약 없이 방문해도 진료가 가능한가요?",
    answer:
      "예약 환자분을 우선으로 진료하지만, 시간이 비는 경우 워크인 환자분도 진료가 가능합니다. 가능하면 네이버 예약을 통해 미리 예약하시기를 권장드립니다.",
    sortOrder: 1,
  },
  {
    id: "f3",
    category: "이용",
    question: "주차 시설이 있나요?",
    answer:
      "건물 지하에 무료 주차 공간이 있습니다. 진료 환자분께는 2시간 무료 주차를 지원합니다.",
    sortOrder: 2,
  },
  {
    id: "f4",
    category: "보험",
    question: "자동차보험 진료가 가능한가요?",
    answer:
      "네, 가능합니다. 교통사고 후 통증·후유증 치료에 대해 자동차보험 적용이 가능하며, 보험사를 통한 진료비 청구를 도와드립니다.",
    sortOrder: 3,
  },
];

export const defaultFaqsEn: FaqItem[] = [
  {
    id: "f1",
    category: "Treatment",
    question: "What are your office hours?",
    answer:
      "We are open weekdays from 9 AM to 7 PM, and Saturdays from 9 AM to 2 PM. We are closed on Sundays and public holidays.",
    sortOrder: 0,
  },
  {
    id: "f2",
    category: "Reservation",
    question: "Can I visit without a reservation?",
    answer:
      "Walk-in patients are welcome when time permits, but we prioritize patients with reservations. We recommend booking in advance through Naver Reservation.",
    sortOrder: 1,
  },
  {
    id: "f3",
    category: "Facility",
    question: "Is parking available?",
    answer:
      "Free parking is available in the building basement. Patients receive 2 hours of complimentary parking.",
    sortOrder: 2,
  },
  {
    id: "f4",
    category: "Insurance",
    question: "Do you accept auto insurance?",
    answer:
      "Yes. We provide treatment for post-accident pain and aftereffects covered by auto insurance, and assist with insurance claims.",
    sortOrder: 3,
  },
];

// ─── Popup ───
export type PopupItem = {
  eventId: number;
  title: string;
  body: string;
  image: string;
  linkUrl: string;
};

export type Popup = {
  id: string;
  title: string;
  body: string;
  image: string;
  linkUrl: string;
  isActive: boolean;
  items?: PopupItem[];
};

export const defaultPopup: Popup = {
  id: "p1",
  title: "5월 다이어트 패키지\n30% 할인",
  body: "한의학적 체질 분석을 바탕으로 한 개인 맞춤 다이어트 프로그램. 5월 한 달 동안 30% 특별 할인.",
  image: sampleImages.event1,
  linkUrl: "/events",
  isActive: true,
};

export const defaultPopupEn: Popup = {
  id: "p1",
  title: "May Diet Package\n30% Off",
  body: "A personalized diet program based on constitutional analysis. Special 30% discount throughout May.",
  image: sampleImages.event1,
  linkUrl: "/events",
  isActive: true,
};

// ─── Schedule Popup (진료일정 팝업) ───
export type SchedulePopup = {
  id: string;
  title: string;
  month: string;
  rows: { day: string; hours: string; note?: string }[];
  notice: string;
  isActive: boolean;
};

export const defaultSchedulePopup: SchedulePopup = {
  id: "sp1",
  title: "6월 진료 일정",
  month: "2026.06",
  rows: [
    { day: "평일", hours: "09:00 – 19:00" },
    { day: "토요일", hours: "09:00 – 14:00" },
    { day: "일·공휴일", hours: "휴진" },
    { day: "6/6 (현충일)", hours: "휴진", note: "공휴일" },
  ],
  notice: "점심시간 13:00 – 14:00",
  isActive: true,
};

export const defaultSchedulePopupEn: SchedulePopup = {
  id: "sp1",
  title: "June Schedule",
  month: "2026.06",
  rows: [
    { day: "Weekdays", hours: "09:00 – 19:00" },
    { day: "Saturday", hours: "09:00 – 14:00" },
    { day: "Sun & Holidays", hours: "Closed" },
    { day: "Jun 6 (Memorial Day)", hours: "Closed", note: "Holiday" },
  ],
  notice: "Lunch break 13:00 – 14:00",
  isActive: true,
};

// ─── About 페이지 콘텐츠 ───
export type AboutContent = {
  philosophyTitle: string;
  philosophyBody: string;
  facilityImages: string[];
};

export const defaultAbout: AboutContent = {
  philosophyTitle: "진료 철학",
  philosophyBody:
    "우리 한의원은 단순히 증상을 가라앉히는 치료가 아닌, 환자분의 체질과 생활 습관을 깊이 이해하고 근본 원인을 살피는 진료를 추구합니다. 전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아, 당신의 일상을 회복하는 처방을 드립니다.",
  facilityImages: [sampleImages.facility, sampleImages.facility2, sampleImages.facility3],
};

export const defaultAboutEn: AboutContent = {
  philosophyTitle: "Our Philosophy",
  philosophyBody:
    "Our clinic pursues treatment that goes beyond merely alleviating symptoms — we deeply understand each patient's constitution and lifestyle to address root causes. Combining the wisdom of traditional Korean medicine with modern medical precision, we prescribe recovery for your daily life.",
  facilityImages: [sampleImages.facility, sampleImages.facility2, sampleImages.facility3],
};

// ─── 통합 사이트 데이터 ───
export type SiteData = {
  menus: MenuItem[];
  heroSlides: HeroSlide[];
  events: Event[];
  treatments: Treatment[];
  director: Director;
  about: AboutContent;
  notices: Notice[];
  faqs: FaqItem[];
  popup: Popup;
  schedulePopup: SchedulePopup;
  showStats: boolean;
  clinicInfo: typeof defaultClinicInfo;
};

const defaultSiteDataByLocale: Record<Locale, SiteData> = {
  ko: {
    menus: defaultMenus,
    heroSlides: defaultHeroSlides,
    events: defaultEvents,
    treatments: defaultTreatments,
    director: defaultDirector,
    about: defaultAbout,
    notices: defaultNotices,
    faqs: defaultFaqs,
    popup: defaultPopup,
    schedulePopup: defaultSchedulePopup,
    showStats: false,
    clinicInfo: defaultClinicInfo,
  },
  en: {
    menus: defaultMenusEn,
    heroSlides: defaultHeroSlidesEn,
    events: defaultEventsEn,
    treatments: defaultTreatmentsEn,
    director: defaultDirectorEn,
    about: defaultAboutEn,
    notices: defaultNoticesEn,
    faqs: defaultFaqsEn,
    popup: defaultPopupEn,
    schedulePopup: defaultSchedulePopupEn,
    showStats: false,
    clinicInfo: defaultClinicInfoEn,
  },
};

export function getDefaultSiteData(locale: Locale = "ko"): SiteData {
  return defaultSiteDataByLocale[locale];
}

// Keep backward compat for imports that use defaultSiteData
export const defaultSiteData: SiteData = defaultSiteDataByLocale.ko;

// ─── 스토리지 API (Supabase DB + 메모리 캐시 + localStorage 텍스트 캐시) ───

/**
 * 메모리 캐시: 이미지 포함 전체 데이터 (세션 내 즉시 반영용)
 * localStorage: base64 이미지를 제외한 텍스트 데이터만 저장 (새로고침 시 빠른 초기 렌더용)
 * DB: 실제 데이터 저장소
 */
const _memCache: Partial<Record<Locale, SiteData>> = {};

/** base64 이미지를 제거한 버전으로 변환 (localStorage 저장용) */
function stripBase64Images(data: SiteData): SiteData {
  const strip = (s: string) => (s?.startsWith("data:") ? "" : s);
  return {
    ...data,
    heroSlides: data.heroSlides.map((s) => ({ ...s, image: strip(s.image) })),
    events: data.events.map((e) => ({ ...e, image: strip(e.image) })),
    treatments: data.treatments.map((t) => ({ ...t, image: strip(t.image ?? "") })),
    director: { ...data.director, image: strip(data.director.image) },
    about: {
      ...data.about,
      facilityImages: data.about.facilityImages.map(strip),
    },
    popup: { ...data.popup, image: strip(data.popup.image) },
    menus: data.menus.map((m) => ({ ...m, bannerImage: strip(m.bannerImage ?? "") })),
  };
}

/** 동기적으로 읽기 (초기 렌더용): 메모리 캐시 → localStorage → 기본값 */
export function getSiteData(locale: Locale = "ko"): SiteData {
  if (_memCache[locale]) return _memCache[locale]!;
  if (typeof window === "undefined") return getDefaultSiteData(locale);
  try {
    const raw = localStorage.getItem(storageKey(locale));
    if (!raw) return getDefaultSiteData(locale);
    const parsed = JSON.parse(raw);
    return { ...getDefaultSiteData(locale), ...parsed };
  } catch {
    return getDefaultSiteData(locale);
  }
}

/** DB에서 비동기로 최신 데이터 로드 → 캐시 갱신 */
export async function fetchSiteData(locale: Locale = "ko"): Promise<SiteData> {
  try {
    const res = await fetch(`/api/site-data?locale=${locale}`, { cache: "no-store" });
    const json = await res.json();
    if (json.data) {
      const merged = { ...getDefaultSiteData(locale), ...json.data };
      _memCache[locale] = merged;
      try {
        localStorage.setItem(storageKey(locale), JSON.stringify(stripBase64Images(merged)));
      } catch {}
      return merged;
    }
  } catch {
    // API 실패 시 캐시/기본값 반환
  }
  return getSiteData(locale);
}

/** 메모리 캐시 + localStorage(텍스트만) + DB에 저장 */
export function setSiteData(data: SiteData, locale: Locale = "ko") {
  if (typeof window === "undefined") return;
  _memCache[locale] = data;
  try {
    localStorage.setItem(storageKey(locale), JSON.stringify(stripBase64Images(data)));
  } catch {}
  window.dispatchEvent(new CustomEvent("siteDataUpdated"));

  // DB에 비동기 저장
  const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
  fetch("/api/site-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale, data, password }),
  })
    .then((res) => {
      if (!res.ok) {
        res.text().then((msg) => {
          window.dispatchEvent(
            new CustomEvent("siteDataSaveError", { detail: `저장 실패 (${res.status}): ${msg}` })
          );
        });
      }
    })
    .catch((err) => {
      window.dispatchEvent(
        new CustomEvent("siteDataSaveError", { detail: `네트워크 오류로 저장에 실패했습니다. (${err?.message ?? err})` })
      );
    });
}

export function updateSiteData(
  updater: (data: SiteData) => SiteData,
  locale: Locale = "ko"
) {
  const current = getSiteData(locale);
  const next = updater(current);
  setSiteData(next, locale);
}

// ─── 이미지 동기화 (언어 무관하게 동일한 이미지 유지) ───
export function syncImages(locale: Locale) {
  const otherLocale = locale === "ko" ? "en" : "ko";
  const current = getSiteData(locale);
  const other = getSiteData(otherLocale);

  const synced: SiteData = {
    ...other,
    heroSlides: other.heroSlides.map((s, i) => ({
      ...s,
      image: current.heroSlides[i]?.image ?? s.image,
    })),
    events: other.events.map((e, i) => ({
      ...e,
      image: current.events[i]?.image ?? e.image,
    })),
    treatments: other.treatments.map((t, i) => ({
      ...t,
      image: current.treatments[i]?.image ?? t.image,
    })),
    director: { ...other.director, image: current.director.image },
    about: { ...other.about, facilityImages: current.about.facilityImages },
    popup: { ...other.popup, image: current.popup.image },
    menus: other.menus.map((m, i) => ({
      ...m,
      bannerImage: current.menus[i]?.bannerImage ?? m.bannerImage,
    })),
    clinicInfo: {
      ...other.clinicInfo,
      bannerImages: current.clinicInfo.bannerImages,
    },
  };

  setSiteData(synced, otherLocale);
}

export function resetSiteData() {
  if (typeof window === "undefined") return;
  // 메모리 캐시 초기화
  delete _memCache["ko"];
  delete _memCache["en"];
  // localStorage 잔여 데이터 정리
  try {
    localStorage.removeItem(storageKey("ko"));
    localStorage.removeItem(storageKey("en"));
    localStorage.removeItem("clinic_site_data_v1");
  } catch {}
  // DB도 기본값으로 리셋
  const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
  fetch("/api/site-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: "ko", data: getDefaultSiteData("ko"), password }),
  });
  fetch("/api/site-data", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ locale: "en", data: getDefaultSiteData("en"), password }),
  });
  window.dispatchEvent(new CustomEvent("siteDataUpdated"));
}

// ─── 자동 번역 (한국어 → 영어 동기화) ───

/** 한국어 데이터를 번역하여 영어 데이터에 반영 (이미지·구조는 유지, 텍스트만 번역) */
export async function translateAndSyncToEnglish(): Promise<{ success: boolean; error?: string }> {
  const koData = getSiteData("ko");
  const enData = getSiteData("en");
  const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";

  // 번역할 텍스트 수집 (key로 위치 추적)
  const textsToTranslate: string[] = [];
  const pushText = (t: string) => { textsToTranslate.push(t || ""); };

  // Hero slides
  koData.heroSlides.forEach((s) => { pushText(s.label); pushText(s.title); pushText(s.subtitle); });
  // Events
  koData.events.forEach((e) => { pushText(e.title); pushText(e.subtitle); pushText(e.description); pushText(e.date); });
  // Treatments
  koData.treatments.forEach((t) => { pushText(t.title); pushText(t.description); });
  // Director
  pushText(koData.director.title);
  pushText(koData.director.name);
  pushText(koData.director.nameEn);
  pushText(koData.director.quote);
  koData.director.bio.forEach((b) => pushText(b));
  // About
  pushText(koData.about.philosophyTitle);
  pushText(koData.about.philosophyBody);
  // Notices
  koData.notices.forEach((n) => { pushText(n.title); pushText(n.content); });
  // FAQs
  koData.faqs.forEach((f) => { pushText(f.question); pushText(f.answer); pushText(f.category); });
  // Popup
  pushText(koData.popup.title);
  pushText(koData.popup.body);
  // Schedule popup
  pushText(koData.schedulePopup.title);
  pushText(koData.schedulePopup.notice);
  koData.schedulePopup.rows.forEach((r) => { pushText(r.day); pushText(r.hours); pushText(r.note || ""); });
  // Menus
  koData.menus.forEach((m) => pushText(m.label));

  try {
    // 배치 번역 (50개씩 분할)
    const BATCH = 50;
    const allTranslated: string[] = [];
    for (let i = 0; i < textsToTranslate.length; i += BATCH) {
      const batch = textsToTranslate.slice(i, i + BATCH);
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texts: batch, source: "ko", target: "en", password }),
      });
      if (!res.ok) throw new Error(`Translation API error: ${res.status}`);
      const { translations } = await res.json();
      allTranslated.push(...translations);
    }

    // 번역 결과를 영어 데이터에 매핑
    let idx = 0;
    const next = () => allTranslated[idx++] || "";

    const translatedEn: SiteData = {
      ...enData,
      heroSlides: koData.heroSlides.map((s, i) => ({
        ...enData.heroSlides[i] || s,
        id: s.id,
        label: next(),
        title: next(),
        subtitle: next(),
        image: s.image,
      })),
      events: koData.events.map((e, i) => ({
        ...enData.events[i] || e,
        id: e.id,
        title: next(),
        subtitle: next(),
        description: next(),
        date: next(),
        image: e.image,
        startDate: e.startDate,
        endDate: e.endDate,
      })),
      treatments: koData.treatments.map((t, i) => ({
        ...enData.treatments[i] || t,
        id: t.id,
        slug: t.slug,
        number: t.number,
        title: next(),
        description: next(),
        image: t.image,
      })),
      director: {
        ...enData.director,
        title: next(),
        name: next(),
        nameEn: next(),
        quote: next(),
        bio: koData.director.bio.map(() => next()),
        image: koData.director.image,
      },
      about: {
        ...enData.about,
        philosophyTitle: next(),
        philosophyBody: next(),
        facilityImages: koData.about.facilityImages,
      },
      notices: koData.notices.map((n, i) => ({
        ...enData.notices[i] || n,
        id: n.id,
        title: next(),
        content: next(),
        date: n.date,
      })),
      faqs: koData.faqs.map((f, i) => ({
        ...enData.faqs[i] || f,
        id: f.id,
        question: next(),
        answer: next(),
        category: next(),
        sortOrder: f.sortOrder,
      })),
      popup: {
        ...enData.popup,
        title: next(),
        body: next(),
        image: koData.popup.image,
        linkUrl: koData.popup.linkUrl,
        isActive: koData.popup.isActive,
        items: koData.popup.items,
      },
      schedulePopup: {
        ...enData.schedulePopup,
        title: next(),
        notice: next(),
        rows: koData.schedulePopup.rows.map((r) => ({
          day: next(),
          hours: next(),
          note: next() || undefined,
        })),
        isActive: koData.schedulePopup.isActive,
        month: koData.schedulePopup.month,
      },
      menus: koData.menus.map((m, i) => ({
        ...enData.menus[i] || m,
        id: m.id,
        href: m.href,
        isHidden: m.isHidden,
        sortOrder: m.sortOrder,
        label: next(),
        bannerImage: m.bannerImage,
      })),
      showStats: koData.showStats,
      clinicInfo: enData.clinicInfo,
    };

    setSiteData(translatedEn, "en");
    return { success: true };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

// ─── ID 생성 ───
export function generateId(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

// ─── 인증 (단독 계정, 데모용) ───
const AUTH_KEY = "clinic_admin_auth";
const DEFAULT_PASSWORD = "admin1234"; // 데모용. 실 운영 시 백엔드 인증으로 교체.

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export function login(password: string): boolean {
  if (password === DEFAULT_PASSWORD) {
    sessionStorage.setItem(AUTH_KEY, "true");
    return true;
  }
  return false;
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
}
