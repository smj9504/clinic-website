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

export type HeroSlide = {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  image: string;
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

export type SubPage = {
  id: string;
  slug: string;
  parentMenuId: string;
  title: string;
  intro?: string;
  body: string;
  image?: string;
  /** 허브 페이지(피부미용/한방치료)에서 이 항목 블록 아래에 좌우 꽉 채워 표시하는 이미지 */
  fullBleedImage?: string;
  isHidden: boolean;
  sortOrder: number;
  /** 사진 위 클릭 가능한 부위 핫스팟을 보여주는 인터랙티브 맵 (선택 사항) */
  areaMap?: SubPageAreaMap;
};

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
  title: string;
  subtitle?: string;
  tags: string[];
  /** 이 장비를 사용하는 시술의 id 목록 (services 테이블 참조, locale 무관) */
  serviceIds?: string[];
  description: string;
  isHidden: boolean;
  sortOrder: number;
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
