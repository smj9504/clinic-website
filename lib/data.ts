/**
 * 타입 정의.
 * 실제 콘텐츠는 전부 Supabase(site_data 테이블)에서 로드된다 — scripts/seed.js로 최초 시딩.
 */

export type Event = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  date: string;
  startDate?: string; // "2026-05-01"
  endDate?: string;   // "2026-05-31"
};

export type Treatment = {
  id: number;
  number: string;
  title: string;
  description: string;
  longDescription?: string;
  slug: string;
  image?: string;
};

export type Director = {
  name: string;
  nameEn: string;
  title: string;
  quote: string;
  bio: string[];
  image: string;
};

export type Notice = {
  id: number;
  type: "notice" | "event";
  title: string;
  content?: string;
  date: string;
  startDate?: string; // "2026-05-01"
  endDate?: string;   // "2026-05-31"
};

/** Ken Burns 이펙트 종류. 미지정 시 슬라이드 인덱스로 자동 배정(기존 동작과 동일). */
export type HeroSlideEffect = "pan-right" | "pan-left" | "zoom" | "none";

/**
 * effect 필드가 없는 기존 슬라이드를 위한 인덱스 기반 폴백.
 * 과거 Hero.tsx에 하드코딩되어 있던 규칙(세 번째 슬라이드는 줌, 나머지는 좌우 번갈아 팬)을 그대로 보존한다.
 */
export function defaultHeroEffect(index: number): HeroSlideEffect {
  if (index === 2) return "zoom";
  return index % 2 === 0 ? "pan-right" : "pan-left";
}

export type HeroSlide = {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  image: string;
  /** "video"면 image 필드에 동영상 URL을 담고 Ken Burns 대신 자동재생한다. 미지정 시 "image". */
  mediaType?: "image" | "video";
  /** mediaType이 "video"일 땐 무시된다(동영상엔 Ken Burns 미적용). */
  effect?: HeroSlideEffect;
  linkLabel?: string;
  linkUrl?: string;
};

export type SubPageAreaHotspot = {
  id: string;
  /** 핫스팟 위치 — 이미지 기준 백분율 좌표 (0~100) */
  x: number;
  y: number;
  label: string;
  description: string;
};

export type SubPageAreaMap = {
  enabled: boolean;
  /** face = 얼굴형 맵(3:2), body = 신체형 맵(3:4~4:3 + pulse 애니메이션) */
  kind: "face" | "body";
  title: string;
  highlight: string;
  image: string | null;
  imageAlt: string;
  areas: SubPageAreaHotspot[];
  /** kind="body"일 때만 사용 — 부위로 표현되지 않는 나머지 항목을 맵 아래에 나열 */
  footnote?: string[];
};

export type SubPageStepItem = {
  id: string;
  text: string;
  image: string | null;
};

/** "OO치료는 이렇게 진행됩니다" 류의 순서 안내 — 스텝마다 개별 사진을 지정할 수 있다 */
export type SubPageStepProcess = {
  title: string;
  intro: string;
  items: SubPageStepItem[];
  /** 스텝 목록 아래에 표시되는 자유 서식 보충 설명 (선택 사항, richtext) */
  note?: string;
};

export type SubPagePointItem = {
  id: string;
  title: string;
  body: string;
  image: string | null;
};

/** "POINT 01/02/03" 류의 3열 카드 — 카드마다 개별 사진을 지정할 수 있다 */
export type SubPagePointCards = {
  title: string;
  items: SubPagePointItem[];
  /** 카드 목록 아래에 표시되는 자유 서식 보충 설명 (선택 사항, richtext) */
  note?: string;
};

export type SubPageChecklistItem = {
  id: string;
  text: string;
  image: string | null;
};

/** "이런 분들께 추천합니다" 류의 좌측 체크리스트 자동강조 + 우측 사진 전환 */
export type SubPageSequentialChecklist = {
  title: string;
  items: SubPageChecklistItem[];
  /** 체크리스트 아래에 표시되는 자유 서식 보충 설명 (선택 사항, richtext) */
  note?: string;
};

/** ChecklistHero 카드가 사진 위에서 자리잡는 사방 프리셋 위치 — x/y가 없는 구버전 데이터의 폴백으로만 쓰인다 */
export type SubPageChecklistHeroPosition = "top-left" | "right-mid" | "bottom-left" | "bottom-right";

export type SubPageChecklistHeroItem = {
  id: string;
  label: string;
  detail: string;
  /** 카드 중심의 사진 기준 백분율 좌표 (0~100). 있으면 position 프리셋보다 우선한다 */
  x?: number;
  y?: number;
  /** x/y가 없는 구버전 데이터에서만 쓰이는 사방 프리셋 폴백 */
  position?: SubPageChecklistHeroPosition;
};

/** 인물 사진 위에 체크리스트 카드가 사방에 겹쳐 떠 있는 히어로 섹션 (선택 사항) — 있으면 slug 화이트리스트 기반 richtext 자동 감지보다 우선한다 */
export type SubPageChecklistHero = {
  eyebrow: string;
  title: string;
  /** 이 히어로 전용 배경 사진 (선택 사항) — 없으면 넓은 배너 이미지, 그것도 없으면 대표 이미지를 재사용한다 */
  image?: string | null;
  imageAlt?: string;
  items: SubPageChecklistHeroItem[];
};

export type SubPageChecklistBlockItem = {
  id: string;
  text: string;
};

/**
 * "이런 변화가 느껴진다면 / 고운빛의 리프팅 접근 / 이런 분들께 권해드립니다" 류의
 * 소제목 + (선택)본문 문단 + (선택)01·02… 번호 목록 반복 블록. 예전에는 본문
 * richtext 안에 h3+p / h3+ul 마크업으로 직접 작성해야만 했고(.prose h3+ul CSS로만
 * 스타일링), admin에 전용 UI가 없어 편집하려면 HTML 구조를 알아야 했다.
 */
export type SubPageChecklistBlock = {
  id: string;
  title: string;
  /** 목록 위에 표시되는 자유 서술 문단 (선택 사항, plain text) */
  body?: string;
  /** 비어 있으면 번호 목록 없이 제목(+본문)만 표시된다 */
  items: SubPageChecklistBlockItem[];
};

export type SubPage = {
  id: string;
  slug: string;
  parentMenuId: string;
  title: string;
  intro?: string;
  body: string;
  image?: string;
  /** 상세페이지 맨 위 제목 영역의 배경(30% 밝기). 비어 있으면 image로 대체된다 */
  titleBgImage?: string;
  /** 허브 페이지(피부미용/한방치료)에서 이 항목 블록 아래에 좌우 꽉 채워 표시하는 이미지 */
  fullBleedImage?: string;
  isHidden: boolean;
  sortOrder: number;
  /** 사진 위 클릭 가능한 부위 핫스팟을 보여주는 인터랙티브 맵 (선택 사항) */
  areaMap?: SubPageAreaMap;
  /** 순서 안내 섹션 (선택 사항) — 있으면 본문 richtext의 자동 감지 STEP 패턴보다 우선한다 */
  stepProcess?: SubPageStepProcess;
  /** POINT 카드 섹션 (선택 사항) — 있으면 본문 richtext의 자동 감지 카드 패턴보다 우선한다 */
  pointCards?: SubPagePointCards;
  /** 추천 체크리스트 섹션 (선택 사항) — 있으면 slug 화이트리스트 기반 자동 감지보다 우선한다 */
  sequentialChecklist?: SubPageSequentialChecklist;
  /** 인물 사진 위에 겹쳐 뜨는 체크리스트 히어로 섹션 (선택 사항) — 있으면 slug 화이트리스트 기반 자동 감지보다 우선한다 */
  checklistHero?: SubPageChecklistHero;
  /** 소제목+본문+번호 목록 반복 블록 (선택 사항) — 순서대로 렌더링되며, 본문(body) 상단에 표시된다 */
  checklistBlocks?: SubPageChecklistBlock[];
  /**
   * 구조화 섹션 6개(areaMap · stepProcess · pointCards · checklist ·
   * checklistHero · checklistBlocks)의 공개 페이지 표시 순서. 값이 없거나
   * 일부 id가 빠져 있으면 이 기본 순서로 취급한다 — DEFAULT_SUBPAGE_SECTION_ORDER
   * 참고. 본문(body)은 이 목록에 포함되지 않고 항상 구조화 섹션들 다음에 온다.
   */
  sectionOrder?: SubPageSectionId[];
};

/** app/admin/subpages/[id]/page.tsx의 순서 조정 탭, app/subpages/[slug]/page.tsx의 렌더 순서가 함께 참조하는 6개 구조화 섹션 id */
export type SubPageSectionId =
  | "areaMap"
  | "stepProcess"
  | "pointCards"
  | "checklist"
  | "checklistHero"
  | "checklistBlocks";

/** sectionOrder가 비어 있거나 불완전할 때 쓰는 기본 순서. 기존(리팩터링 전) 공개 페이지의 하드코딩 렌더 순서와 동일하게 맞춰, 이 필드가 없는 기존 서브페이지들의 화면이 바뀌지 않게 한다 */
export const DEFAULT_SUBPAGE_SECTION_ORDER: SubPageSectionId[] = [
  "checklistHero",
  "areaMap",
  "checklist",
  "checklistBlocks",
  "pointCards",
  "stepProcess",
];

/**
 * 저장된 sectionOrder를 항상 6개 id 전부를 포함한 완전한 순열로 정규화한다.
 * admin에서 새 섹션 id가 추가되거나(예: 이후 7번째 섹션 도입), 저장 시점 이후
 * 알 수 없는 값이 섞여도 공개 페이지 렌더링이 깨지지 않도록 여기서 한 번에 방어한다.
 * 알려진 id는 저장된 순서를 그대로 두고, 목록에 없는 id는 기본 순서상의 상대
 * 위치를 유지하며 끝에 이어붙인다.
 */
export function normalizeSectionOrder(order: SubPageSectionId[] | undefined): SubPageSectionId[] {
  const known = new Set(DEFAULT_SUBPAGE_SECTION_ORDER);
  const deduped = [...new Set(order ?? [])].filter((id): id is SubPageSectionId => known.has(id));
  const missing = DEFAULT_SUBPAGE_SECTION_ORDER.filter((id) => !deduped.includes(id));
  return [...deduped, ...missing];
}

/** 메인페이지에 표시되는 섹션 id (Hero 제외 — Hero는 항상 최상단 고정) */
export type HomeSectionId =
  | "stats"
  | "signature"
  | "events"
  | "treatments"
  | "director"
  | "notice";

export type HomeSectionConfig = {
  id: HomeSectionId;
  isHidden: boolean;
  sortOrder: number;
};

export type Equipment = {
  id: string;
  image: string;
  /**
   * /skin-beauty의 EquipmentShowcase 하단 전체폭(16:9 · 데스크톱 21:9) 미디어에만
   * 쓰이는 고화질 와이드 이미지. 카드 썸네일용 image(4:3)와 비율이 달라 그대로
   * 재사용하면 화질이 떨어지거나 크롭이 부자연스러워 별도로 관리한다. 비어 있으면
   * image로 폴백한다.
   */
  showcaseImage?: string;
  title: string;
  subtitle?: string;
  tags: string[];
  /** 이 장비를 사용하는 시술의 id 목록 (services 테이블 참조, locale 무관) */
  serviceIds?: string[];
  description: string;
  isHidden: boolean;
  sortOrder: number;
};

/**
 * /skin-beauty 페이지의 EquipmentShowcase(탭+미디어), EquipmentCarousel
 * (원형 캐러셀) 두 섹션에 admin에서 직접 입력한 문구·이미지만 표시하기
 * 위한 필드. 예전에는 lib/translations.ts에 하드코딩된 기본 문구를
 * 폴백으로 썼으나, admin에 입력하지 않은 텍스트가 화면에 나타나는
 * 문제(코드 배포 없이는 못 고침)로 그 폴백을 없앴다 — 비어 있으면
 * (undefined/"") 해당 텍스트 요소를 아예 렌더링하지 않는다.
 * 장비 구성(showcaseIds/carouselIds)도 "장비소개" admin과 중복 관리되는
 * 문제가 있어 제거했다 — 두 섹션 모두 항상 장비소개의 전체 목록을
 * sortOrder 그대로 보여준다.
 */
export type SkinBeautyEquipmentSections = {
  introLabel?: string;
  introTitle?: string;
  introBody?: string;
  introCta?: string;
  /** 콜라주 6칸 이미지. 비어 있는 칸은 undefined/null로 두면 그 자리만 마스터
   * 장비 목록의 해당 순번 이미지로 폴백한다 (부분 커스터마이즈 지원). */
  collageImages?: (string | null | undefined)[];
  carouselTitle?: string;
  carouselTitleHighlight?: string;
  carouselSubtitle?: string;
};

export const clinicInfoShape = {
  name: "",
  phone: "",
  address: "",
  hours: {
    weekday: "",
    saturday: "",
    closed: "",
  },
  reservationUrl: "",
  socialLinks: {
    blog: "#",
    instagram: "#",
    kakao: "#",
  },
  bannerImages: {
    events: "",
    treatments: "",
    about: "",
    community: "",
  },
  defaultImage: "",
};

export type ClinicInfo = typeof clinicInfoShape;
