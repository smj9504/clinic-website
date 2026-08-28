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
  clinicInfoShape,
  type Event,
  type Treatment,
  type Director,
  type Notice,
  type HeroSlide,
  type SubPage,
  type SubPageAreaMap,
  type Equipment,
  type SkinBeautyEquipmentSections,
  type ClinicInfo,
  type HomeSectionConfig,
} from "./data";

/** 메인페이지 섹션 기본 순서 (Hero는 항상 최상단 고정이라 목록에서 제외) */
export const defaultHomeSections: HomeSectionConfig[] = [
  { id: "stats", isHidden: false, sortOrder: 0 },
  { id: "treatments", isHidden: false, sortOrder: 1 },
  { id: "signature", isHidden: false, sortOrder: 2 },
  { id: "events", isHidden: false, sortOrder: 3 },
  { id: "director", isHidden: false, sortOrder: 4 },
  { id: "notice", isHidden: false, sortOrder: 5 },
];

const emptyEvents: Event[] = [];
const emptyTreatments: Treatment[] = [];
const emptyDirector: Director = { name: "", nameEn: "", title: "", quote: "", bio: [], image: "" };
const emptyNotices: Notice[] = [];
const emptyHeroSlides: HeroSlide[] = [];
const emptySubPages: SubPage[] = [];
const emptyEquipment: Equipment[] = [];
const emptyClinicInfo: ClinicInfo = clinicInfoShape;

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
  { id: "m5", label: "소개", href: "/about", isHidden: false, sortOrder: 1 },
  {
    id: "m7",
    label: "피부미용",
    href: "/skin-beauty",
    isHidden: false,
    sortOrder: 2,
    children: [
      { id: "m7c1", label: "리프팅", href: "/subpages/lifting", isHidden: false, sortOrder: 0 },
      { id: "m7c2", label: "레이저", href: "/subpages/laser", isHidden: false, sortOrder: 1 },
      { id: "m7c3", label: "스킨부스터", href: "/subpages/skin-booster", isHidden: false, sortOrder: 2 },
    ],
  },
  {
    id: "m8",
    label: "한방치료",
    href: "/korean-treatment",
    isHidden: false,
    sortOrder: 3,
    children: [
      { id: "m8c1", label: "통증치료", href: "/subpages/pain-treatment", isHidden: false, sortOrder: 0 },
      { id: "m8c2", label: "교통사고 후유증", href: "/subpages/traffic-accident", isHidden: false, sortOrder: 1 },
      { id: "m8c3", label: "한약클리닉", href: "/subpages/herbal-clinic", isHidden: false, sortOrder: 2 },
      { id: "m8c4", label: "추나치료", href: "/subpages/chuna", isHidden: false, sortOrder: 3 },
      { id: "m8c5", label: "약침치료", href: "/subpages/pharmacopuncture", isHidden: false, sortOrder: 4 },
    ],
  },
  {
    id: "m4",
    label: "이벤트/시술가격",
    href: "/services",
    isHidden: false,
    sortOrder: 4,
  },
  {
    id: "m6",
    label: "공지사항",
    href: "/community/notice",
    isHidden: false,
    sortOrder: 5,
  },
];

export const defaultMenusEn: MenuItem[] = [
  { id: "m1", label: "Home", href: "/", isHidden: false, sortOrder: 0 },
  { id: "m5", label: "About", href: "/about", isHidden: false, sortOrder: 1 },
  {
    id: "m7",
    label: "Skin Beauty",
    href: "/skin-beauty",
    isHidden: false,
    sortOrder: 2,
    children: [
      { id: "m7c1", label: "Lifting", href: "/subpages/lifting", isHidden: false, sortOrder: 0 },
      { id: "m7c2", label: "Laser", href: "/subpages/laser", isHidden: false, sortOrder: 1 },
      { id: "m7c3", label: "Skin Booster", href: "/subpages/skin-booster", isHidden: false, sortOrder: 2 },
    ],
  },
  {
    id: "m8",
    label: "Korean Medicine Treatment",
    href: "/korean-treatment",
    isHidden: false,
    sortOrder: 3,
    children: [
      { id: "m8c1", label: "Pain Treatment", href: "/subpages/pain-treatment", isHidden: false, sortOrder: 0 },
      { id: "m8c2", label: "Traffic Accident Aftereffects", href: "/subpages/traffic-accident", isHidden: false, sortOrder: 1 },
      { id: "m8c3", label: "Herbal Medicine Clinic", href: "/subpages/herbal-clinic", isHidden: false, sortOrder: 2 },
      { id: "m8c4", label: "Chuna Therapy", href: "/subpages/chuna", isHidden: false, sortOrder: 3 },
      { id: "m8c5", label: "Pharmacopuncture", href: "/subpages/pharmacopuncture", isHidden: false, sortOrder: 4 },
    ],
  },
  {
    id: "m4",
    label: "Events & Pricing",
    href: "/services",
    isHidden: false,
    sortOrder: 4,
  },
  {
    id: "m6",
    label: "Notice",
    href: "/community/notice",
    isHidden: false,
    sortOrder: 5,
  },
];

/**
 * 구버전(진행중인 이벤트/진료 내용/시술 안내/한의원 소개/커뮤니티 6개 평면 메뉴)으로
 * 이미 저장된 site_data를 새 구조(홈/소개/피부미용/한방치료/이벤트-시술가격/공지사항)로
 * 자가 치유한다. 매 로드마다 실행되므로 멱등성이 보장되어야 한다.
 */
export function migrateMenus(menus: MenuItem[], locale: Locale): MenuItem[] {
  const hasChildren = menus.some((m) => m.children && m.children.length > 0);
  const hasNewIds = menus.some((m) => m.id === "m7" || m.id === "m8");
  if (hasChildren || hasNewIds) return menus; // 이미 마이그레이션된 구조

  const isOldShape =
    menus.some((m) => m.href === "/events") && menus.length <= 6;
  if (!isOldShape) return menus; // 구버전 형태가 아니면 손대지 않음 (관리자가 자유롭게 커스텀한 구조일 수 있음)

  // id는 관리자가 메뉴를 추가/재구성하면서 기본값과 어긋날 수 있으므로,
  // 항상 안정적으로 유지되는 href를 기준으로 기존 항목을 찾는다.
  const byHref = new Map(menus.map((m) => [m.href, m]));
  const fresh = locale === "en" ? defaultMenusEn : defaultMenus;

  return fresh.map((freshItem) => {
    const existing = byHref.get(freshItem.href);
    if (!existing) return freshItem; // /skin-beauty, /korean-treatment처럼 새로 생기는 항목은 기본값 그대로
    // 기존에 admin이 편집했을 라벨/배너/숨김 상태는 보존, 구조(순서/children)는 새 기본값 사용
    return {
      ...freshItem,
      label: existing.label,
      bannerImage: existing.bannerImage,
      isHidden: existing.isHidden,
    };
  });
}

/**
 * lifting/pain-treatment 서브페이지는 areaMap 필드가 생기기 전부터 부위별
 * 인터랙티브 맵이 컴포넌트에 하드코딩된 데이터로 렌더링되고 있었다. 기존
 * site_data엔 이 필드가 없으므로 배포 후 최초 로드 시 이전 하드코딩 값을
 * areaMap 기본값으로 시딩해 화면이 갑자기 비지 않게 한다. 이미 값이
 * 있으면(관리자 편집 또는 이미 마이그레이션됨) 절대 덮어쓰지 않는다.
 */
const LEGACY_AREA_MAP_SEEDS: Record<string, SubPageAreaMap> = {
  lifting: {
    enabled: true,
    kind: "face",
    title: "리프팅",
    highlight: "시술 가능 부위",
    image: "/lifting-face.jpg",
    imageAlt: "리프팅 시술 가능 부위를 표시한 얼굴 정면 사진",
    areas: [
      { id: "forehead", x: 50, y: 21, label: "이마", description: "가로 주름과 처짐으로 인상이 무거워 보이는 부위입니다. 탄력을 끌어올려 이마 라인을 매끄럽게 정리합니다." },
      { id: "eye", x: 60, y: 40, label: "눈가", description: "피부가 얇아 탄력 저하가 가장 먼저 드러나는 부위입니다. 잔주름과 처짐을 함께 개선합니다." },
      { id: "cheek", x: 39, y: 49, label: "볼", description: "볼륨이 아래로 이동하며 얼굴 라인이 흐려지는 부위입니다. 처진 볼륨을 끌어올려 갸름한 인상을 만듭니다." },
      { id: "nasolabial", x: 61, y: 57, label: "팔자주름", description: "볼 처짐과 함께 깊어지는 팔자 라인입니다. 주변 조직을 탄탄하게 잡아주어 주름을 완화합니다." },
      { id: "jawline", x: 40, y: 65, label: "턱", description: "턱선이 무너지며 얼굴형이 흐트러지는 부위입니다. 턱 라인을 선명하게 잡아 윤곽을 살립니다." },
      { id: "double-chin", x: 56, y: 71, label: "이중턱", description: "지방과 처짐이 함께 작용해 이중턱으로 이어지는 부위입니다. 턱 아래 라인을 정리해 옆모습을 매끈하게 만듭니다." },
    ],
  },
  "pain-treatment": {
    enabled: true,
    kind: "body",
    title: "통증이 자주 느껴지는",
    highlight: "부위",
    image: null,
    imageAlt: "통증 부위를 표시한 전신 정면 사진",
    areas: [
      { id: "neck-shoulder", x: 50, y: 18, label: "목·어깨", description: "목과 어깨가 자주 결리고 뻣뻣한 느낌이 지속되거나, 일자목·거북목 등 체형 불균형이 신경 쓰이는 부위입니다." },
      { id: "lower-back", x: 50, y: 45, label: "허리", description: "앉아있거나 움직일 때 통증과 불편함이 느껴지는 부위입니다. 정렬 불균형이나 근육 긴장이 원인일 수 있습니다." },
      { id: "knee", x: 38, y: 72, label: "무릎", description: "무릎 관절 부위에 통증이 있거나, 운동·활동 중 부상 이후 회복이 필요한 부위입니다." },
      { id: "ankle", x: 55, y: 93, label: "발목", description: "발목 관절 부위의 통증이나 부상 후 회복 관리가 필요한 부위입니다." },
    ],
    footnote: ["운동·활동 중 부상 회복", "척추·관절 수술 후 재활 관리", "골절 후 회복 과정 관리"],
  },
};

export function migrateAreaMaps(subPages: SubPage[]): SubPage[] {
  return subPages.map((sp) => {
    if (sp.areaMap) return sp;
    const seed = LEGACY_AREA_MAP_SEEDS[sp.slug];
    if (!seed) return sp;
    return { ...sp, areaMap: seed };
  });
}

/**
 * homeSections 필드가 생기기 전 저장된 site_data를 위한 마이그레이션.
 * 기존 데이터엔 이 필드가 없으므로 기본 순서로 시딩한다. 새로 추가되는
 * 섹션 id(예: 이후 도입될 섹션)는 기존 목록에 없으면 기본값에서 이어붙인다.
 */
export function migrateHomeSections(sections: HomeSectionConfig[] | undefined): HomeSectionConfig[] {
  if (!sections || sections.length === 0) return defaultHomeSections;
  const existingIds = new Set(sections.map((s) => s.id));
  const missing = defaultHomeSections.filter((d) => !existingIds.has(d.id));
  if (missing.length === 0) return sections;
  const maxOrder = Math.max(-1, ...sections.map((s) => s.sortOrder));
  return [...sections, ...missing.map((m, i) => ({ ...m, sortOrder: maxOrder + 1 + i }))];
}

// ─── FAQ 타입 ───
export type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  sortOrder: number;
};

export const defaultFaqs: FaqItem[] = [];

export const defaultFaqsEn: FaqItem[] = [];

// ─── Popup ───
export type PopupItem = {
  eventId: number;
  title: string;
  body: string;
  image: string;
  linkUrl: string;
  /** 이미지 위 어두운 브랜드 틴트 오버레이 표시 여부 (미지정 시 true = 기존 동작) */
  imageOverlay?: boolean;
  /** 팝업 하단 카테고리 탭에 표시할 짧은 라벨 (미지정 시 이벤트 제목으로 대체) */
  categoryLabel?: string;
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
  title: "",
  body: "",
  image: "",
  linkUrl: "/events",
  isActive: false,
  items: [],
};

export const defaultPopupEn: Popup = {
  id: "p1",
  title: "",
  body: "",
  image: "",
  linkUrl: "/events",
  isActive: false,
  items: [],
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
  title: "",
  month: "",
  rows: [],
  notice: "",
  isActive: false,
};

export const defaultSchedulePopupEn: SchedulePopup = {
  id: "sp1",
  title: "",
  month: "",
  rows: [],
  notice: "",
  isActive: false,
};

// ─── About 페이지 콘텐츠 ───
export type AboutContent = {
  philosophyTitle: string;
  philosophyBody: string;
  facilityImages: string[];
};

export const defaultAbout: AboutContent = {
  philosophyTitle: "",
  philosophyBody: "",
  facilityImages: [],
};

export const defaultAboutEn: AboutContent = {
  philosophyTitle: "",
  philosophyBody: "",
  facilityImages: [],
};

// ─── 통합 사이트 데이터 ───
/** 종료 항목 숨김 설정: "immediately" = 즉시, 숫자 = N일 후 */
export type EndedVisibility = "immediately" | number;

export type StatItem = {
  label: string;
  value: number;
  suffix: string;
};

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
  stats?: StatItem[];
  clinicInfo: ClinicInfo;
  /** 종료된 이벤트 숨김: "immediately" = 종료 즉시, 숫자 = 종료 후 N일 뒤 숨김 */
  eventEndedHide?: EndedVisibility;
  /** 종료된 공지사항 숨김: "immediately" = 종료 즉시, 숫자 = 종료 후 N일 뒤 숨김 */
  noticeEndedHide?: EndedVisibility;
  /** 피부미용/한방치료 서브메뉴가 연결되는 콘텐츠 페이지 */
  subPages?: SubPage[];
  /** 장비소개 카탈로그 */
  equipment?: Equipment[];
  /** /skin-beauty 페이지의 두 장비소개 섹션이 각각 보여줄 장비 구성 (선택 사항) */
  skinBeautyEquipmentSections?: SkinBeautyEquipmentSections;
  /** 메인페이지 섹션 표시 순서/숨김 (Hero 제외) */
  homeSections?: HomeSectionConfig[];
};

const defaultSiteDataByLocale: Record<Locale, SiteData> = {
  ko: {
    menus: defaultMenus,
    heroSlides: emptyHeroSlides,
    events: emptyEvents,
    treatments: emptyTreatments,
    director: emptyDirector,
    about: defaultAbout,
    notices: emptyNotices,
    faqs: defaultFaqs,
    popup: defaultPopup,
    schedulePopup: defaultSchedulePopup,
    showStats: false,
    stats: [],
    clinicInfo: emptyClinicInfo,
    subPages: emptySubPages,
    equipment: emptyEquipment,
    homeSections: defaultHomeSections,
  },
  en: {
    menus: defaultMenusEn,
    heroSlides: emptyHeroSlides,
    events: emptyEvents,
    treatments: emptyTreatments,
    director: emptyDirector,
    about: defaultAboutEn,
    notices: emptyNotices,
    faqs: defaultFaqsEn,
    popup: defaultPopupEn,
    schedulePopup: defaultSchedulePopupEn,
    showStats: false,
    stats: [],
    clinicInfo: emptyClinicInfo,
    subPages: emptySubPages,
    equipment: emptyEquipment,
    homeSections: defaultHomeSections,
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
    clinicInfo: { ...data.clinicInfo, defaultImage: strip(data.clinicInfo.defaultImage ?? "") },
    subPages: (data.subPages ?? []).map((sp) => ({
      ...sp,
      image: strip(sp.image ?? ""),
      fullBleedImage: strip(sp.fullBleedImage ?? ""),
      areaMap: sp.areaMap
        ? { ...sp.areaMap, image: sp.areaMap.image ? strip(sp.areaMap.image) : sp.areaMap.image }
        : sp.areaMap,
    })),
    equipment: (data.equipment ?? []).map((eq) => ({ ...eq, image: strip(eq.image ?? "") })),
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
    const merged: SiteData = { ...getDefaultSiteData(locale), ...parsed };
    merged.menus = migrateMenus(merged.menus, locale);
    merged.subPages = migrateAreaMaps(merged.subPages ?? []);
    merged.homeSections = migrateHomeSections(merged.homeSections);
    return merged;
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
      const merged: SiteData = { ...getDefaultSiteData(locale), ...json.data };
      merged.menus = migrateMenus(merged.menus, locale);
      merged.subPages = migrateAreaMaps(merged.subPages ?? []);
      merged.homeSections = migrateHomeSections(merged.homeSections);
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

/** 메모리 캐시 + localStorage(텍스트만) + DB에 저장. DB 저장이 실제로 성공했는지 여부를 반환한다. */
export async function setSiteData(data: SiteData, locale: Locale = "ko"): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const prev = _memCache[locale];
  _memCache[locale] = data;
  try {
    localStorage.setItem(storageKey(locale), JSON.stringify(stripBase64Images(data)));
  } catch {}
  window.dispatchEvent(new CustomEvent("siteDataUpdated"));

  // DB에 저장 (완료 대기)
  const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
  try {
    const res = await fetch("/api/site-data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale, data, password }),
    });
    if (!res.ok) {
      const msg = await res.text();
      // DB 저장 실패 → 캐시 롤백
      if (prev) {
        _memCache[locale] = prev;
        try { localStorage.setItem(storageKey(locale), JSON.stringify(stripBase64Images(prev))); } catch {}
        window.dispatchEvent(new CustomEvent("siteDataUpdated"));
      }
      window.dispatchEvent(
        new CustomEvent("siteDataSaveError", { detail: `저장 실패 (${res.status}): ${msg}` })
      );
      return false;
    }
    return true;
  } catch (err: unknown) {
    // 네트워크 오류 → 캐시 롤백
    if (prev) {
      _memCache[locale] = prev;
      try { localStorage.setItem(storageKey(locale), JSON.stringify(stripBase64Images(prev))); } catch {}
      window.dispatchEvent(new CustomEvent("siteDataUpdated"));
    }
    const message = err instanceof Error ? err.message : String(err);
    window.dispatchEvent(
      new CustomEvent("siteDataSaveError", { detail: `네트워크 오류로 저장에 실패했습니다. (${message})` })
    );
    return false;
  }
}

/** DB 저장이 실제로 성공했는지 여부를 반환한다. 호출부는 이 값을 확인한 뒤에만 저장 완료 UI를 보여줘야 한다. */
export async function updateSiteData(
  updater: (data: SiteData) => SiteData,
  locale: Locale = "ko"
): Promise<boolean> {
  const current = getSiteData(locale);
  const next = updater(current);
  return setSiteData(next, locale);
}

// ─── 이미지 동기화 (언어 무관하게 동일한 이미지 유지) ───
export async function syncImages(locale: Locale) {
  const otherLocale = locale === "ko" ? "en" : "ko";
  const current = getSiteData(locale);
  const other = getSiteData(otherLocale);

  const synced: SiteData = {
    ...other,
    heroSlides: other.heroSlides.map((s, i) => ({
      ...s,
      image: current.heroSlides[i]?.image ?? s.image,
    })),
    events: current.events.map((ce) => {
      const oe = other.events.find((o) => o.id === ce.id);
      return oe ? { ...oe, image: ce.image } : { ...ce };
    }),
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
      defaultImage: current.clinicInfo.defaultImage,
    },
    subPages: (other.subPages ?? []).map((sp) => {
      const cur = (current.subPages ?? []).find((c) => c.id === sp.id);
      return {
        ...sp,
        image: cur?.image ?? sp.image,
        fullBleedImage: cur?.fullBleedImage ?? sp.fullBleedImage,
        areaMap: sp.areaMap
          ? { ...sp.areaMap, image: cur?.areaMap?.image !== undefined ? cur.areaMap.image : sp.areaMap.image }
          : sp.areaMap,
      };
    }),
    equipment: (other.equipment ?? []).map((eq) => {
      const cur = (current.equipment ?? []).find((c) => c.id === eq.id);
      return { ...eq, image: cur?.image ?? eq.image, serviceIds: cur?.serviceIds ?? eq.serviceIds };
    }),
  };

  await setSiteData(synced, otherLocale);
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


/**
 * 시술 카탈로그 번역. 서버가 몇 건씩 나눠 처리하므로 커서를 따라간다.
 * (시술은 site_data가 아니라 전용 테이블에 있어 별도 엔드포인트를 쓴다)
 */
async function translateServicesToEnglish(): Promise<void> {
  const password = sessionStorage.getItem("clinic_admin_pw") || "";
  let cursor: number | null = 0;
  let guard = 0;
  while (cursor !== null && guard++ < 500) {
    const res: Response = await fetch("/api/services/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-password": password },
      body: JSON.stringify({ cursor }),
    });
    if (!res.ok) throw new Error(`시술 번역 실패 (${res.status})`);
    const json: { nextCursor?: number | null } = await res.json();
    cursor = typeof json.nextCursor === "number" ? json.nextCursor : null;
  }
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
  koData.notices.forEach((n) => { pushText(n.title); pushText(n.content ?? ""); });
  // FAQs
  koData.faqs.forEach((f) => { pushText(f.question); pushText(f.answer); pushText(f.category); });
  // Popup
  pushText(koData.popup.title);
  pushText(koData.popup.body);
  // Schedule popup
  pushText(koData.schedulePopup.title);
  pushText(koData.schedulePopup.notice);
  koData.schedulePopup.rows.forEach((r) => { pushText(r.day); pushText(r.hours); pushText(r.note || ""); });
  // Menus (children 포함)
  koData.menus.forEach((m) => {
    pushText(m.label);
    (m.children ?? []).forEach((c) => pushText(c.label));
  });
  // Stats
  (koData.stats ?? []).forEach((s) => { pushText(s.label); pushText(s.suffix); });
  // SubPages
  (koData.subPages ?? []).forEach((sp) => {
    pushText(sp.title);
    pushText(sp.intro ?? "");
    pushText(sp.body);
    // 부위 안내 맵 텍스트 — sp.areaMap이 존재하면 push (enabled 여부 무관: enabled:false여도
    // 콘텐츠는 남아있고 다시 켰을 때 기존 번역이 보존돼야 하므로 토글로 커버리지를 가르지 않는다).
    // 아래 조건(`if (sp.areaMap)`)은 pull 섹션(subPages 매핑 안)의 동일 조건과 텍스트 그대로
    // 일치해야 한다 — 하나만 바뀌면 그 이후 모든 subPage/필드가 밀려서 잘못된 번역이 매칭된다.
    // 수정 시 두 곳을 함께 바꿀 것.
    if (sp.areaMap) {
      pushText(sp.areaMap.title);
      pushText(sp.areaMap.highlight);
      pushText(sp.areaMap.imageAlt);
      sp.areaMap.areas.forEach((area) => {
        pushText(area.label);
        pushText(area.description);
      });
      if (sp.areaMap.kind === "body") {
        (sp.areaMap.footnote ?? []).forEach((line) => pushText(line));
      }
    }
  });
  // Equipment
  (koData.equipment ?? []).forEach((eq) => {
    pushText(eq.title);
    pushText(eq.subtitle ?? "");
    pushText(eq.description);
    eq.tags.forEach((tag) => pushText(tag));
  });

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
        type: n.type,
        title: next(),
        content: next(),
        date: n.date,
        startDate: n.startDate,
        endDate: n.endDate,
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
        children: (m.children ?? []).map((c, ci) => ({
          ...(enData.menus[i]?.children?.[ci] || c),
          id: c.id,
          href: c.href,
          isHidden: c.isHidden,
          sortOrder: c.sortOrder,
          label: next(),
        })),
      })),
      stats: (koData.stats ?? []).map((s) => ({
        ...s,
        label: next(),
        suffix: next(),
      })),
      showStats: koData.showStats,
      clinicInfo: enData.clinicInfo,
      eventEndedHide: koData.eventEndedHide,
      noticeEndedHide: koData.noticeEndedHide,
      subPages: (koData.subPages ?? []).map((sp, i) => {
        const enSp = (enData.subPages ?? [])[i];
        return {
          ...(enSp || sp),
          id: sp.id,
          slug: sp.slug,
          parentMenuId: sp.parentMenuId,
          title: next(),
          intro: next() || undefined,
          body: next(),
          image: sp.image,
          fullBleedImage: sp.fullBleedImage,
          isHidden: sp.isHidden,
          sortOrder: sp.sortOrder,
          // push 섹션의 동일 조건(`if (sp.areaMap)`)과 텍스트 그대로 일치해야 한다.
          // sp.areaMap이 없으면 push 때 아무 것도 넣지 않았으므로 여기서도 next()를 호출하지
          // 않고, en 쪽에 값이 없어도 이 함수가 임의로 areaMap을 새로 만들지 않는다.
          areaMap: sp.areaMap
            ? {
                kind: sp.areaMap.kind,
                enabled: sp.areaMap.enabled,
                title: next(),
                highlight: next(),
                image: sp.areaMap.image,
                imageAlt: next(),
                areas: sp.areaMap.areas.map((koArea) => {
                  const enArea = enSp?.areaMap?.areas?.find((a) => a.id === koArea.id);
                  return {
                    ...(enArea || koArea),
                    id: koArea.id,
                    x: koArea.x,
                    y: koArea.y,
                    label: next(),
                    description: next(),
                  };
                }),
                footnote:
                  sp.areaMap.kind === "body" && sp.areaMap.footnote && sp.areaMap.footnote.length > 0
                    ? sp.areaMap.footnote.map(() => next())
                    : undefined,
              }
            : sp.areaMap,
        };
      }),
      equipment: (koData.equipment ?? []).map((eq, i) => ({
        ...((enData.equipment ?? [])[i] || eq),
        id: eq.id,
        title: next(),
        subtitle: next() || undefined,
        description: next(),
        tags: eq.tags.map(() => next()),
        image: eq.image,
        isHidden: eq.isHidden,
        sortOrder: eq.sortOrder,
        serviceIds: eq.serviceIds ?? [],
      })),
    };

    await setSiteData(translatedEn, "en");
    await translateServicesToEnglish();
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

// ─── 인증 ───
const AUTH_KEY = "clinic_admin_auth";

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "true";
}

export async function login(password: string): Promise<boolean> {
  try {
    const res = await fetch("/api/admin-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    if (res.ok) {
      sessionStorage.setItem(AUTH_KEY, "true");
      sessionStorage.setItem("clinic_admin_pw", password);
      return true;
    }
  } catch {}
  return false;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch("/api/admin-password", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const json = await res.json();
    if (res.ok) {
      sessionStorage.setItem("clinic_admin_pw", newPassword);
      return { success: true };
    }
    return { success: false, error: json.error };
  } catch {
    return { success: false, error: "네트워크 오류" };
  }
}

export function logout() {
  sessionStorage.removeItem(AUTH_KEY);
  sessionStorage.removeItem("clinic_admin_pw");
}
