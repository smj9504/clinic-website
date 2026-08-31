/**
 * 시술 카탈로그 — 타입 · DB row 변환 · 다국어 텍스트 선택
 *
 * 시술 데이터는 site_data JSON 블롭이 아니라 전용 테이블 3개에 저장된다.
 * (스키마는 supabase-schema.sql 참고)
 *
 * 언어 공통 값(이미지 URL, 가격, 순서, 노출 여부)은 컬럼에 두고,
 * 번역 대상 텍스트만 각 레코드의 i18n 안에 넣는다. 이렇게 하면
 *   · 번역해도 이미지가 사라지지 않고
 *   · 순서를 바꾸거나 중간을 지워도 한/영 짝이 어긋나지 않는다
 */

import type { Locale } from "./i18n";
import { todayKST } from "./date";

// ─── 다국어 ───

export type I18nMap<T> = Partial<Record<Locale, T>>;

// ─── 가격 ───

/** percent: N% 할인 · amount: N원 할인 · final: 최종가 직접 입력 */
export type DiscountType = "percent" | "amount" | "final";

export type ServicePriceText = {
  /** 옵션명 — "1회 체험가" · "3회 패키지" */
  label: string;
  /** 비고 — "부가세 별도" · "1부위 기준" */
  note?: string;
};

export type ServicePrice = {
  id: string;
  originalPrice: number;
  /** 할인 선택 적용 — 꺼두면 정가만 표시된다 */
  discountEnabled: boolean;
  discountType: DiscountType;
  discountValue: number;
  i18n: I18nMap<ServicePriceText>;
};

// ─── 상세 블록 ───

export type ServiceBlockType =
  | "richtext"  // 시술 안내 — 서식글, 본문에 이미지 삽입 가능
  | "points"    // 시술 추천 — POINT 01 · 02 · 03
  | "steps"     // 시술 효과 및 주기 — 01 · 02 번호 목록
  | "notice"    // 주의 사항 — 경고 톤
  | "qna"       // Q&A — 아코디언
  | "gallery"   // 시술 사진 — 이미지 그리드
  | "checklist"; // 이런 증상, 고민 — 사진 + 체크마크 목록 (2단 레이아웃)

export type QnaPair = { q: string; a: string };

export type ServiceBlockText = {
  /** 섹션 제목 — 관리자가 직접 바꿀 수 있다 */
  title: string;
  html?: string;                     // richtext
  items?: string[];                  // points · steps · notice
  qna?: QnaPair[];                   // qna
  captions?: Record<string, string>; // gallery — 이미지 id → 캡션
};

/** 갤러리 이미지. URL은 언어 공통이라 i18n 밖에 둔다 */
export type ServiceBlockImage = { id: string; url: string };

export type ServiceBlock = {
  id: string;
  type: ServiceBlockType;
  isHidden: boolean;
  images?: ServiceBlockImage[];
  i18n: I18nMap<ServiceBlockText>;
};

// ─── 분류 · 시술 ───

export const SERVICE_BADGES = ["NEW", "HOT", "BEST"] as const;
export type ServiceBadge = (typeof SERVICE_BADGES)[number];

export type ServiceCategory = {
  id: string;
  slug: string;
  image: string;
  sortOrder: number;
  isHidden: boolean;
  i18n: I18nMap<{ name: string; description?: string }>;
};

export type ServiceSubcategory = {
  id: string;
  categoryId: string;
  slug: string;
  sortOrder: number;
  isHidden: boolean;
  i18n: I18nMap<{ name: string }>;
};

export type Service = {
  id: string;
  subcategoryId: string;
  image: string;
  tag?: string;
  badges: ServiceBadge[];
  /** "2026-08-01" — 이 날짜 전에는 노출되지 않는다 */
  saleStartDate?: string;
  /** "2026-08-31" — 카드에 "2026-08-31까지"로 표시되고, 지나면 숨겨진다 */
  saleEndDate?: string;
  sortOrder: number;
  isHidden: boolean;
  i18n: I18nMap<{ name: string; summary: string }>;
  prices: ServicePrice[];
  /** 이 시술이 적용받는 이벤트 id 목록 (site_data의 events 배열 참조, locale 무관) */
  eventIds?: number[];
  /** 목록 응답에는 포함되지 않는다 (상세 조회에서만 채워진다) */
  blocks?: ServiceBlock[];
};

export type ServiceCatalog = {
  categories: ServiceCategory[];
  subcategories: ServiceSubcategory[];
  services: Service[];
};

// ─── 다국어 텍스트 선택 ───

/** undefined·null·빈 문자열·빈 배열은 덮어쓰지 않는다 (번역이 비어 있으면 한국어로 폴백) */
function mergeDefined<T extends object>(base: T, patch?: Partial<T>): T {
  if (!patch) return base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    if (typeof value === "string" && value.trim() === "") continue;
    if (Array.isArray(value) && value.length === 0) continue;
    out[key] = value;
  }
  return out as T;
}

/** 요청한 언어 → 한국어 → 기본값 순으로 필드 단위 폴백 */
export function pickText<T extends object>(
  i18n: I18nMap<T> | undefined,
  locale: Locale,
  fallback: T
): T {
  let out = mergeDefined(fallback, i18n?.ko);
  if (locale !== "ko") out = mergeDefined(out, i18n?.[locale]);
  return out;
}

export function categoryText(c: ServiceCategory, locale: Locale) {
  return pickText(c.i18n, locale, { name: "", description: "" });
}

export function subcategoryText(s: ServiceSubcategory, locale: Locale) {
  return pickText(s.i18n, locale, { name: "" });
}

export function serviceText(s: Service, locale: Locale) {
  return pickText(s.i18n, locale, { name: "", summary: "" });
}

export function priceText(p: ServicePrice, locale: Locale) {
  return pickText(p.i18n, locale, { label: "", note: "" });
}

export function blockText(b: ServiceBlock, locale: Locale): ServiceBlockText {
  return pickText(b.i18n, locale, {
    title: "",
    html: "",
    items: [],
    qna: [],
    captions: {},
  });
}

/**
 * 편집기 전용 — 폴백 없이 해당 언어에 실제로 저장된 값만 읽는다.
 *
 * pickText는 영어가 비면 한국어로 떨어뜨리는데, 편집기에서 그러면
 * 번역이 이미 채워진 것처럼 보이고 그대로 저장하면 한국어가 영어 칸에 복사된다.
 */
export function rawText<T extends object>(
  i18n: I18nMap<T> | undefined,
  locale: Locale
): Partial<T> {
  return (i18n?.[locale] ?? {}) as Partial<T>;
}

/** 편집 중인 언어만 갈아끼운다. 다른 언어의 값은 그대로 둔다. */
export function withLocalized<T extends object>(
  i18n: I18nMap<T> | undefined,
  locale: Locale,
  patch: Partial<T>
): I18nMap<T> {
  return {
    ...(i18n ?? {}),
    [locale]: { ...((i18n?.[locale] ?? {}) as Partial<T>), ...patch },
  } as I18nMap<T>;
}

// ─── 노출 판정 ───

/**
 * 공개 화면에 보일지 여부. 이벤트와 같은 KST 기준.
 * 숨김 처리됐거나, 시작 전이거나, 종료일이 지나면 숨긴다.
 */
export function isServiceVisible(s: Service, today = todayKST()): boolean {
  if (s.isHidden) return false;
  if (s.saleStartDate && s.saleStartDate > today) return false;
  if (s.saleEndDate && s.saleEndDate < today) return false;
  return true;
}

// ─── 새 항목 기본값 ───

let idCounter = 0;

/** 가격 옵션·상세 블록처럼 JSONB 안에서만 쓰이는 로컬 id (DB의 uuid와 무관) */
export function newId(prefix = "id"): string {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

/** 블록 타입별 기본 제목. 관리자가 언제든 바꿀 수 있다 */
export const BLOCK_PRESETS: Record<ServiceBlockType, { ko: string; en: string }> = {
  richtext: { ko: "시술 안내", en: "Treatment Overview" },
  points: { ko: "시술 추천", en: "Recommended For" },
  steps: { ko: "시술 효과 및 주기", en: "Results & Frequency" },
  notice: { ko: "주의 사항", en: "Precautions" },
  qna: { ko: "Q&A", en: "Q&A" },
  gallery: { ko: "시술 사진", en: "Photos" },
  checklist: { ko: "이런 증상, 고민이라면", en: "Is This You?" },
};

export function createBlock(type: ServiceBlockType): ServiceBlock {
  const preset = BLOCK_PRESETS[type];
  return {
    id: newId("blk"),
    type,
    isHidden: false,
    ...(type === "gallery" || type === "checklist" ? { images: [] } : {}),
    i18n: {
      ko: { title: preset.ko },
      en: { title: preset.en },
    },
  };
}

/** 새 시술을 만들 때 기본으로 들어가는 5개 — 빈 화면부터 시작하지 않도록 */
export function createDefaultBlocks(): ServiceBlock[] {
  return (["richtext", "points", "steps", "notice", "qna"] as const).map(createBlock);
}

export function createPrice(): ServicePrice {
  return {
    id: newId("prc"),
    originalPrice: 0,
    discountEnabled: false,
    discountType: "percent",
    discountValue: 0,
    i18n: {},
  };
}

// ─── 표시 순서 ───

/**
 * 카테고리 → 서브카테고리 → 시술 순으로 정렬한다.
 * services.sort_order는 서브카테고리 안에서의 순서라, 전체 목록을 그대로
 * 정렬하면 분류가 뒤섞인다. 상위 순서를 앞세워 묶어 준다.
 */
export function sortServicesForDisplay(catalog: ServiceCatalog): Service[] {
  const LAST = Number.MAX_SAFE_INTEGER;
  // API가 이미 sort_order로 정렬해 주므로 배열 인덱스가 곧 표시 순서다
  const categoryRank = new Map(catalog.categories.map((c, i) => [c.id, i]));
  const subcategoryRank = new Map(
    catalog.subcategories.map((s, i) => [
      s.id,
      { category: categoryRank.get(s.categoryId) ?? LAST, own: i },
    ])
  );
  const rankOf = (s: Service) =>
    subcategoryRank.get(s.subcategoryId) ?? { category: LAST, own: LAST };

  return [...catalog.services].sort((a, b) => {
    const ra = rankOf(a);
    const rb = rankOf(b);
    return ra.category - rb.category || ra.own - rb.own || a.sortOrder - b.sortOrder;
  });
}

// ─── 기타 ───

const VIDEO_EXT_RE = /\.(mp4|webm|mov|m4v)(\?|#|$)/i;

/**
 * 대표 이미지 URL이 동영상인지 판별한다 (확장자 기반).
 * 시술 대표 이미지는 사진/동영상을 같은 필드에 저장하므로, 공개 페이지에서
 * <Image>(next/image)로 렌더링할지 <video>로 재생할지 이걸로 분기한다.
 */
export function isVideoUrl(url: string): boolean {
  return VIDEO_EXT_RE.test(url);
}

const PLACEHOLDER_IMAGE_HOSTS = ["images.unsplash.com"];

/**
 * 초기 데모 시딩 단계에서 넣어둔 Unsplash 임의 사진인지 판별한다.
 * 실제 업로드된 사진은 Supabase Storage(site-assets) URL을 갖는다 —
 * "사진이 없으면 임의 사진 대신 폴백을 보여준다"는 원칙에 따라, 관리자가
 * 아직 실사진으로 교체하지 않은 장비는 사진이 아예 없는 것과 동일하게
 * 취급해 클리닉 로고로 대체한다.
 */
export function isPlaceholderImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return PLACEHOLDER_IMAGE_HOSTS.some((host) => url.includes(host));
}

/** 장비 이미지로 실제 표시해도 되는지 — 비어있지 않고 데모 placeholder가 아닌 경우 */
export function hasRealEquipmentImage(image: string | null | undefined): image is string {
  return Boolean(image) && !isPlaceholderImageUrl(image);
}

/**
 * 분류의 안정적인 키. 이름이 한글이면 남는 글자가 없으므로 임의 문자열로 떨어진다.
 * URL에는 uuid를 쓰므로 slug는 내부 식별용이고, 관리자가 나중에 고칠 수 있다.
 */
export function slugify(name: string, prefix = "c"): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * 테이블이 아직 없을 때(= supabase-schema.sql 미실행)인지 판별한다.
 * 이 경우 500 대신 빈 카탈로그를 돌려주어 공개 사이트가 깨지지 않게 한다.
 */
export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

// ─── DB row ↔ 앱 타입 ───

type Json = Record<string, unknown>;

export type CategoryRow = {
  id: string;
  slug: string;
  image: string | null;
  sort_order: number;
  is_hidden: boolean;
  i18n: Json | null;
};

export type SubcategoryRow = {
  id: string;
  category_id: string;
  slug: string;
  sort_order: number;
  is_hidden: boolean;
  i18n: Json | null;
};

export type ServiceRow = {
  id: string;
  subcategory_id: string;
  image: string | null;
  tag: string | null;
  badges: string[] | null;
  sale_start_date: string | null;
  sale_end_date: string | null;
  sort_order: number;
  is_hidden: boolean;
  i18n: Json | null;
  prices: unknown;
  blocks?: unknown;
  event_ids?: number[] | null;
};

export function toCategory(row: CategoryRow): ServiceCategory {
  return {
    id: row.id,
    slug: row.slug,
    image: row.image ?? "",
    sortOrder: row.sort_order,
    isHidden: row.is_hidden,
    i18n: (row.i18n ?? {}) as ServiceCategory["i18n"],
  };
}

export function toSubcategory(row: SubcategoryRow): ServiceSubcategory {
  return {
    id: row.id,
    categoryId: row.category_id,
    slug: row.slug,
    sortOrder: row.sort_order,
    isHidden: row.is_hidden,
    i18n: (row.i18n ?? {}) as ServiceSubcategory["i18n"],
  };
}

export function toService(row: ServiceRow): Service {
  const service: Service = {
    id: row.id,
    subcategoryId: row.subcategory_id,
    image: row.image ?? "",
    tag: row.tag ?? undefined,
    badges: (row.badges ?? []).filter((b): b is ServiceBadge =>
      (SERVICE_BADGES as readonly string[]).includes(b)
    ),
    saleStartDate: row.sale_start_date ?? undefined,
    saleEndDate: row.sale_end_date ?? undefined,
    sortOrder: row.sort_order,
    isHidden: row.is_hidden,
    i18n: (row.i18n ?? {}) as Service["i18n"],
    prices: Array.isArray(row.prices) ? (row.prices as ServicePrice[]) : [],
    eventIds: row.event_ids ?? [],
  };
  // 목록 조회는 blocks를 SELECT하지 않는다 — 없으면 필드 자체를 만들지 않는다
  if (row.blocks !== undefined) {
    service.blocks = Array.isArray(row.blocks) ? (row.blocks as ServiceBlock[]) : [];
  }
  return service;
}

/** 빈 문자열 날짜는 null로 — date 컬럼에 ""를 넣으면 Postgres가 거부한다 */
function toDateOrNull(v: string | undefined | null): string | null {
  return v && v.trim() !== "" ? v : null;
}

export function categoryToRow(c: Partial<ServiceCategory>): Json {
  const row: Json = {};
  if (c.slug !== undefined) row.slug = c.slug;
  if (c.image !== undefined) row.image = c.image;
  if (c.sortOrder !== undefined) row.sort_order = c.sortOrder;
  if (c.isHidden !== undefined) row.is_hidden = c.isHidden;
  if (c.i18n !== undefined) row.i18n = c.i18n;
  return row;
}

export function subcategoryToRow(s: Partial<ServiceSubcategory>): Json {
  const row: Json = {};
  if (s.categoryId !== undefined) row.category_id = s.categoryId;
  if (s.slug !== undefined) row.slug = s.slug;
  if (s.sortOrder !== undefined) row.sort_order = s.sortOrder;
  if (s.isHidden !== undefined) row.is_hidden = s.isHidden;
  if (s.i18n !== undefined) row.i18n = s.i18n;
  return row;
}

export function serviceToRow(s: Partial<Service>): Json {
  const row: Json = {};
  if (s.subcategoryId !== undefined) row.subcategory_id = s.subcategoryId;
  if (s.image !== undefined) row.image = s.image;
  if (s.tag !== undefined) row.tag = s.tag || null;
  if (s.badges !== undefined) row.badges = s.badges;
  if (s.saleStartDate !== undefined) row.sale_start_date = toDateOrNull(s.saleStartDate);
  if (s.saleEndDate !== undefined) row.sale_end_date = toDateOrNull(s.saleEndDate);
  if (s.sortOrder !== undefined) row.sort_order = s.sortOrder;
  if (s.isHidden !== undefined) row.is_hidden = s.isHidden;
  if (s.i18n !== undefined) row.i18n = s.i18n;
  if (s.prices !== undefined) row.prices = s.prices;
  if (s.blocks !== undefined) row.blocks = s.blocks;
  if (s.eventIds !== undefined) row.event_ids = s.eventIds;
  return row;
}
