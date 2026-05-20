/**
 * Mock data — 실제 운영 시 백엔드 API로 대체됩니다.
 * Admin 페이지에서 수정한 콘텐츠가 이 데이터 구조 그대로 DB에 저장됩니다.
 */

// 샘플 이미지 (Unsplash) — 한의원/wellness 분위기
// 실제 운영 시 클라이언트가 제공한 이미지로 교체
export const sampleImages = {
  // 히어로용 — 한의원 진료 분위기
  hero1: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1920&q=80",  // 한약재/허브 따뜻한 톤
  hero2: "https://plus.unsplash.com/premium_photo-1719615566924-5648f8bdd206?w=1920&q=80",  // 침술 치료
  hero3: "https://plus.unsplash.com/premium_photo-1661864014725-9d77f571f00a?w=1920&q=80",  // 추나/마사지 치료

  // 이벤트 카드 — 건강/한의학 관련
  event1: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",  // 건강식/다이어트
  event2: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",  // 의료/건강 상담
  event3: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",  // 의약품/처방

  // 대표원장 — 여성 의사
  director: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",

  // 시설 사진 — 깔끔한 한의원/클리닉 인테리어
  facility: "https://images.unsplash.com/photo-1631247869033-a8b88c0be391?w=1200&q=80",  // 화분/깔끔한 인테리어
  facility2: "https://images.unsplash.com/photo-1598242930255-c25f98ff11e5?w=1200&q=80", // 대기실 소파
  facility3: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80", // 진료실
};

export type Event = {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  date: string;
};

export const events: Event[] = [
  {
    id: 1,
    title: "5월 다이어트 패키지",
    subtitle: "30% 할인 이벤트",
    description:
      "한의학적 체질 분석을 바탕으로 한 개인 맞춤 다이어트 프로그램. 5월 한 달 특별 할인.",
    image: sampleImages.event1,
    date: "EVENT · 2026.05",
  },
  {
    id: 2,
    title: "환절기 면역력 보강",
    subtitle: "보약 처방 안내",
    description:
      "환절기에 약해지는 면역력. 체질에 맞는 보약으로 건강을 미리 챙기세요.",
    image: sampleImages.event2,
    date: "EVENT · 2026.05",
  },
  {
    id: 3,
    title: "총명탕 신학기 이벤트",
    subtitle: "수험생 집중력 회복",
    description:
      "집중력과 체력이 동시에 필요한 수험생을 위한 맞춤 처방. 5월 신학기 특별가.",
    image: sampleImages.event3,
    date: "EVENT · 2026.05",
  },
];

export type Treatment = {
  id: number;
  number: string;
  title: string;
  description: string;
  longDescription?: string;
  slug: string;
};

export const treatments: Treatment[] = [
  {
    id: 1,
    number: "01",
    title: "통증진료",
    description: "허리·목·관절 등 만성 통증을 근본부터 회복하는 한의 치료",
    slug: "pain",
  },
  {
    id: 2,
    number: "02",
    title: "자동차보험\n진료",
    description: "교통사고 후 통증·후유증을 보험 적용으로 안심 치료",
    slug: "insurance",
  },
  {
    id: 3,
    number: "03",
    title: "다이어트\n진료",
    description: "체질 분석 기반 맞춤 처방으로 건강한 체중 감량",
    slug: "diet",
  },
  {
    id: 4,
    number: "04",
    title: "미용시술\n진료",
    description: "한의 미용 시술로 자연스러운 안면 라인과 피부 관리",
    slug: "beauty",
  },
  {
    id: 5,
    number: "05",
    title: "보약처방",
    description: "개인 체질에 맞춘 보약으로 기력 회복과 면역력 강화",
    slug: "tonic",
  },
];

export type Director = {
  name: string;
  nameEn: string;
  title: string;
  quote: string;
  bio: string[];
  image: string;
};

export const director: Director = {
  name: "허은주",
  nameEn: "HEO EUNJU",
  title: "대표 원장",
  quote:
    "환자분의 몸과 마음을 함께 살피며,\n근본적인 회복을 돕는 진료를 추구합니다.",
  bio: [
    "경희대학교 한의과대학 졸업",
    "경희대학교 대학원 한의학 석·박사 취득",
    "대한스포츠한의학회 팀닥터 과정 수료",
    "척추신경추나의학회 정회원 및 인증의",
    "대한한방내과학회 정회원",
  ],
  image: sampleImages.director,
};

export type Notice = {
  id: number;
  type: "notice" | "event";
  title: string;
  date: string;
};

export const notices: Notice[] = [
  {
    id: 1,
    type: "event",
    title: "5월 다이어트 패키지 30% 할인 이벤트 안내",
    date: "2026.05.14",
  },
  { id: 2, type: "notice", title: "석가탄신일 휴진 안내 (5월 25일)", date: "2026.05.10" },
  {
    id: 3,
    type: "notice",
    title: "진료 시간 변경 안내 - 토요일 오후 진료 추가",
    date: "2026.05.02",
  },
  { id: 4, type: "notice", title: "신규 한의사 부원장 부임 안내", date: "2026.04.20" },
];

export type HeroSlide = {
  id: number;
  label: string;
  title: string;
  subtitle: string;
  image: string;
};

export const heroSlides: HeroSlide[] = [
  {
    id: 1,
    label: "Korean Medicine Clinic",
    title: "지친 마음을 먼저 헤아리는\n한 첩의 위로와 회복",
    subtitle:
      "오늘의 아픔이 내일의 걸림돌이 되지 않도록\n잊고 지냈던 건강하고 활기찬 일상을 당신께 돌려드립니다",
    image: sampleImages.hero1,
  },
  {
    id: 2,
    label: "Tradition meets Modern",
    title: "몸과 마음의 쉼표가 되는 곳\n온전한 회복을 처방합니다",
    subtitle:
      "전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아\n당신의 건강한 일상을 처방합니다",
    image: sampleImages.hero2,
  },
  {
    id: 3,
    label: "Care from the Root",
    title: "시간이 빚어낸 정성으로\n건강의 뿌리를 다스립니다",
    subtitle:
      "당신의 체질과 일상을 깊이 살피며\n근본적인 회복을 도와드립니다",
    image: sampleImages.hero3,
  },
];

export const clinicInfo = {
  name: "고운빛한의원",
  phone: "02-XXX-XXXX",
  address: "서울특별시 ○○구 ○○대로 123",
  hours: {
    weekday: "평일 09:00 – 19:00",
    saturday: "토요일 09:00 – 14:00",
    closed: "일·공휴일 휴진",
  },
  reservationUrl: "https://map.naver.com",
  socialLinks: {
    blog: "#",
    instagram: "#",
    kakao: "#",
  },
};

// ─── English Defaults ───

export const eventsEn: Event[] = [
  {
    id: 1,
    title: "May Diet Package",
    subtitle: "30% Off",
    description:
      "A personalized diet program based on constitutional analysis. Special 30% discount for May.",
    image: sampleImages.event1,
    date: "EVENT · 2026.05",
  },
  {
    id: 2,
    title: "Seasonal Immunity Boost",
    subtitle: "Herbal Tonic Prescription",
    description:
      "Strengthen your immunity during seasonal transitions with personalized herbal medicine.",
    image: sampleImages.event2,
    date: "EVENT · 2026.05",
  },
  {
    id: 3,
    title: "Student Focus Package",
    subtitle: "Concentration & Energy",
    description:
      "Custom herbal prescriptions for students who need both focus and stamina. Special spring pricing.",
    image: sampleImages.event3,
    date: "EVENT · 2026.05",
  },
];

export const treatmentsEn: Treatment[] = [
  {
    id: 1,
    number: "01",
    title: "Pain Treatment",
    description: "Korean medicine treatment for chronic pain in the back, neck, and joints",
    slug: "pain",
  },
  {
    id: 2,
    number: "02",
    title: "Auto Insurance\nTreatment",
    description: "Post-accident pain and aftereffect treatment covered by auto insurance",
    slug: "insurance",
  },
  {
    id: 3,
    number: "03",
    title: "Diet\nProgram",
    description: "Healthy weight loss through personalized prescriptions based on body constitution",
    slug: "diet",
  },
  {
    id: 4,
    number: "04",
    title: "Cosmetic\nTreatment",
    description: "Natural facial contouring and skin care through Korean medicine aesthetics",
    slug: "beauty",
  },
  {
    id: 5,
    number: "05",
    title: "Herbal Tonic",
    description: "Customized herbal tonics for energy recovery and immune system support",
    slug: "tonic",
  },
];

export const directorEn: Director = {
  name: "Eunju Heo",
  nameEn: "HEO EUNJU",
  title: "Director",
  quote:
    "I pursue treatment that cares for both\nbody and mind, helping fundamental recovery.",
  bio: [
    "Graduated from Kyung Hee University, College of Korean Medicine",
    "M.S. & Ph.D. in Korean Medicine, Kyung Hee University",
    "Sports Korean Medicine Team Doctor Certification",
    "Certified Member, Spinal Nerve Chuna Medicine Society",
    "Member, Korean Society of Oriental Internal Medicine",
  ],
  image: sampleImages.director,
};

export const noticesEn: Notice[] = [
  {
    id: 1,
    type: "event",
    title: "May Diet Package - 30% Off Promotion",
    date: "2026.05.14",
  },
  { id: 2, type: "notice", title: "Closed on Buddha's Birthday (May 25)", date: "2026.05.10" },
  {
    id: 3,
    type: "notice",
    title: "Schedule Change - Saturday Afternoon Hours Added",
    date: "2026.05.02",
  },
  { id: 4, type: "notice", title: "New Associate Director Joining Announcement", date: "2026.04.20" },
];

export const heroSlidesEn: HeroSlide[] = [
  {
    id: 1,
    label: "Korean Medicine Clinic",
    title: "A Prescription of\nComfort and Recovery",
    subtitle:
      "So today's pain doesn't become tomorrow's obstacle\nWe restore the vibrant daily life you've been missing",
    image: sampleImages.hero1,
  },
  {
    id: 2,
    label: "Tradition meets Modern",
    title: "A Place of Rest for\nBody and Mind",
    subtitle:
      "Combining the wisdom of traditional Korean medicine\nwith modern precision for your healthy life",
    image: sampleImages.hero2,
  },
  {
    id: 3,
    label: "Care from the Root",
    title: "Treating Health\nat Its Roots",
    subtitle:
      "We carefully examine your constitution and lifestyle\nto support fundamental recovery",
    image: sampleImages.hero3,
  },
];

export const clinicInfoEn = {
  name: "Gowoonbit Korean Medicine Clinic",
  phone: "02-XXX-XXXX",
  address: "123, OO-daero, OO-gu, Seoul, South Korea",
  hours: {
    weekday: "Weekdays 09:00 – 19:00",
    saturday: "Saturday 09:00 – 14:00",
    closed: "Sun & Holidays Closed",
  },
  reservationUrl: "https://map.naver.com",
  socialLinks: {
    blog: "#",
    instagram: "#",
    kakao: "#",
  },
};
