/**
 * Supabase에 기본 사이트 데이터 시딩
 * 사용법: node scripts/seed.js
 */
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Inline default data (same as lib/data.ts + lib/storage.ts defaults)
const sampleImages = {
  hero1: "https://images.unsplash.com/photo-1512290923902-8a9f81dc236c?w=1920&q=80",
  hero2: "https://plus.unsplash.com/premium_photo-1719615566924-5648f8bdd206?w=1920&q=80",
  hero3: "https://plus.unsplash.com/premium_photo-1661864014725-9d77f571f00a?w=1920&q=80",
  event1: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&q=80",
  event2: "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=800&q=80",
  event3: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&q=80",
  director: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800&q=80",
  facility: "https://images.unsplash.com/photo-1631247869033-a8b88c0be391?w=1200&q=80",
  facility2: "https://images.unsplash.com/photo-1598242930255-c25f98ff11e5?w=1200&q=80",
  facility3: "https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?w=1200&q=80",
};

const koData = {
  menus: [
    { id: "m1", label: "홈", href: "/", isHidden: false, sortOrder: 0 },
    { id: "m2", label: "진행중인 이벤트", href: "/events", isHidden: false, sortOrder: 1 },
    { id: "m3", label: "진료 내용", href: "/treatments", isHidden: false, sortOrder: 2 },
    { id: "m4", label: "한의원 소개", href: "/about", isHidden: false, sortOrder: 3 },
    { id: "m5", label: "공지사항", href: "/community/notice", isHidden: false, sortOrder: 4 },
  ],
  heroSlides: [
    { id: 1, label: "Korean Medicine Clinic", title: "지친 마음을 먼저 헤아리는\n한 첩의 위로와 회복", subtitle: "오늘의 아픔이 내일의 걸림돌이 되지 않도록\n잊고 지냈던 건강하고 활기찬 일상을 당신께 돌려드립니다", image: sampleImages.hero1 },
    { id: 2, label: "Tradition meets Modern", title: "몸과 마음의 쉼표가 되는 곳\n온전한 회복을 처방합니다", subtitle: "전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아\n당신의 건강한 일상을 처방합니다", image: sampleImages.hero2 },
    { id: 3, label: "Care from the Root", title: "시간이 빚어낸 정성으로\n건강의 뿌리를 다스립니다", subtitle: "당신의 체질과 일상을 깊이 살피며\n근본적인 회복을 도와드립니다", image: sampleImages.hero3 },
  ],
  events: [
    { id: 1, title: "5월 다이어트 패키지", subtitle: "30% 할인 이벤트", description: "한의학적 체질 분석을 바탕으로 한 개인 맞춤 다이어트 프로그램. 5월 한 달 특별 할인.", image: sampleImages.event1, date: "EVENT · 2026.05" },
    { id: 2, title: "환절기 면역력 보강", subtitle: "보약 처방 안내", description: "환절기에 약해지는 면역력. 체질에 맞는 보약으로 건강을 미리 챙기세요.", image: sampleImages.event2, date: "EVENT · 2026.05" },
    { id: 3, title: "총명탕 신학기 이벤트", subtitle: "수험생 집중력 회복", description: "집중력과 체력이 동시에 필요한 수험생을 위한 맞춤 처방. 5월 신학기 특별가.", image: sampleImages.event3, date: "EVENT · 2026.05" },
  ],
  treatments: [
    { id: 1, number: "01", title: "통증진료", description: "허리·목·관절 등 만성 통증을 근본부터 회복하는 한의 치료", slug: "pain" },
    { id: 2, number: "02", title: "자동차보험\n진료", description: "교통사고 후 통증·후유증을 보험 적용으로 안심 치료", slug: "insurance" },
    { id: 3, number: "03", title: "다이어트\n진료", description: "체질 분석 기반 맞춤 처방으로 건강한 체중 감량", slug: "diet" },
    { id: 4, number: "04", title: "미용시술\n진료", description: "한의 미용 시술로 자연스러운 안면 라인과 피부 관리", slug: "beauty" },
    { id: 5, number: "05", title: "보약처방", description: "개인 체질에 맞춘 보약으로 기력 회복과 면역력 강화", slug: "tonic" },
  ],
  director: {
    name: "허은주", nameEn: "HEO EUNJU", title: "대표 원장",
    quote: "환자분의 몸과 마음을 함께 살피며,\n근본적인 회복을 돕는 진료를 추구합니다.",
    bio: ["경희대학교 한의과대학 졸업", "경희대학교 대학원 한의학 석·박사 취득", "대한스포츠한의학회 팀닥터 과정 수료", "척추신경추나의학회 정회원 및 인증의", "대한한방내과학회 정회원"],
    image: sampleImages.director,
  },
  about: {
    philosophyTitle: "진료 철학",
    philosophyBody: "우리 한의원은 단순히 증상을 가라앉히는 치료가 아닌, 환자분의 체질과 생활 습관을 깊이 이해하고 근본 원인을 살피는 진료를 추구합니다. 전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아, 당신의 일상을 회복하는 처방을 드립니다.",
    facilityImages: [sampleImages.facility, sampleImages.facility2, sampleImages.facility3],
  },
  notices: [
    { id: 1, type: "event", title: "5월 다이어트 패키지 30% 할인 이벤트 안내", date: "2026.05.14", startDate: "2026-05-14", endDate: "" },
    { id: 2, type: "notice", title: "석가탄신일 휴진 안내 (5월 25일)", date: "2026.05.10", startDate: "2026-05-10", endDate: "" },
    { id: 3, type: "notice", title: "진료 시간 변경 안내 - 토요일 오후 진료 추가", date: "2026.05.02", startDate: "2026-05-02", endDate: "" },
    { id: 4, type: "notice", title: "신규 한의사 부원장 부임 안내", date: "2026.04.20", startDate: "2026-04-20", endDate: "" },
  ],
  faqs: [
    { id: "f1", category: "진료", question: "진료 시간이 어떻게 되나요?", answer: "평일은 오전 9시부터 오후 7시까지, 토요일은 오전 9시부터 오후 2시까지 진료합니다. 일요일과 공휴일은 휴진입니다.", sortOrder: 0 },
    { id: "f2", category: "예약", question: "예약 없이 방문해도 진료가 가능한가요?", answer: "예약 환자분을 우선으로 진료하지만, 시간이 비는 경우 워크인 환자분도 진료가 가능합니다.", sortOrder: 1 },
    { id: "f3", category: "이용", question: "주차 시설이 있나요?", answer: "건물 지하에 무료 주차 공간이 있습니다. 진료 환자분께는 2시간 무료 주차를 지원합니다.", sortOrder: 2 },
    { id: "f4", category: "보험", question: "자동차보험 진료가 가능한가요?", answer: "네, 가능합니다. 교통사고 후 통증·후유증 치료에 대해 자동차보험 적용이 가능하며, 보험사를 통한 진료비 청구를 도와드립니다.", sortOrder: 3 },
  ],
  popup: {
    id: "p1", title: "5월 다이어트 패키지\n30% 할인",
    body: "한의학적 체질 분석을 바탕으로 한 개인 맞춤 다이어트 프로그램. 5월 한 달 동안 30% 특별 할인.",
    image: sampleImages.event1, linkUrl: "/events", isActive: true,
  },
  schedulePopup: {
    id: "sp1", title: "6월 진료 일정", month: "2026.06",
    rows: [
      { day: "평일", hours: "09:00 – 19:00" },
      { day: "토요일", hours: "09:00 – 14:00" },
      { day: "일·공휴일", hours: "휴진" },
      { day: "6/6 (현충일)", hours: "휴진", note: "공휴일" },
    ],
    notice: "점심시간 13:00 – 14:00", isActive: true,
  },
  showStats: false,
  clinicInfo: {
    name: "고운빛한의원", phone: "02-XXX-XXXX", address: "서울특별시 ○○구 ○○대로 123",
    hours: { weekday: "평일 09:00 – 19:00", saturday: "토요일 09:00 – 14:00", closed: "일·공휴일 휴진" },
    reservationUrl: "https://m.place.naver.com/place/2015359820/booking?entry=plt",
    socialLinks: { blog: "#", instagram: "#", kakao: "#" },
  },
};

const enData = {
  menus: [
    { id: "m1", label: "Home", href: "/", isHidden: false, sortOrder: 0 },
    { id: "m2", label: "Events", href: "/events", isHidden: false, sortOrder: 1 },
    { id: "m3", label: "Treatments", href: "/treatments", isHidden: false, sortOrder: 2 },
    { id: "m4", label: "About", href: "/about", isHidden: false, sortOrder: 3 },
    { id: "m5", label: "Community", href: "/community/notice", isHidden: false, sortOrder: 4 },
  ],
  heroSlides: [
    { id: 1, label: "Korean Medicine Clinic", title: "A Prescription of\nComfort and Recovery", subtitle: "So today's pain doesn't become tomorrow's obstacle\nWe restore the vibrant daily life you've been missing", image: sampleImages.hero1 },
    { id: 2, label: "Tradition meets Modern", title: "A Place of Rest for\nBody and Mind", subtitle: "Combining the wisdom of traditional Korean medicine\nwith modern precision for your healthy life", image: sampleImages.hero2 },
    { id: 3, label: "Care from the Root", title: "Treating Health\nat Its Roots", subtitle: "We carefully examine your constitution and lifestyle\nto support fundamental recovery", image: sampleImages.hero3 },
  ],
  events: [
    { id: 1, title: "May Diet Package", subtitle: "30% Off", description: "A personalized diet program based on constitutional analysis. Special 30% discount for May.", image: sampleImages.event1, date: "EVENT · 2026.05" },
    { id: 2, title: "Seasonal Immunity Boost", subtitle: "Herbal Tonic Prescription", description: "Strengthen your immunity during seasonal transitions with personalized herbal medicine.", image: sampleImages.event2, date: "EVENT · 2026.05" },
    { id: 3, title: "Student Focus Package", subtitle: "Concentration & Energy", description: "Custom herbal prescriptions for students who need both focus and stamina.", image: sampleImages.event3, date: "EVENT · 2026.05" },
  ],
  treatments: [
    { id: 1, number: "01", title: "Pain Treatment", description: "Korean medicine treatment for chronic pain in the back, neck, and joints", slug: "pain" },
    { id: 2, number: "02", title: "Auto Insurance\nTreatment", description: "Post-accident pain and aftereffect treatment covered by auto insurance", slug: "insurance" },
    { id: 3, number: "03", title: "Diet\nProgram", description: "Healthy weight loss through personalized prescriptions based on body constitution", slug: "diet" },
    { id: 4, number: "04", title: "Cosmetic\nTreatment", description: "Natural facial contouring and skin care through Korean medicine aesthetics", slug: "beauty" },
    { id: 5, number: "05", title: "Herbal Tonic", description: "Customized herbal tonics for energy recovery and immune system support", slug: "tonic" },
  ],
  director: {
    name: "Eunju Heo", nameEn: "HEO EUNJU", title: "Director",
    quote: "I pursue treatment that cares for both\nbody and mind, helping fundamental recovery.",
    bio: ["Graduated from Kyung Hee University, College of Korean Medicine", "M.S. & Ph.D. in Korean Medicine, Kyung Hee University", "Sports Korean Medicine Team Doctor Certification", "Certified Member, Spinal Nerve Chuna Medicine Society", "Member, Korean Society of Oriental Internal Medicine"],
    image: sampleImages.director,
  },
  about: {
    philosophyTitle: "Our Philosophy",
    philosophyBody: "Our clinic pursues treatment that goes beyond merely alleviating symptoms — we deeply understand each patient's constitution and lifestyle to address root causes.",
    facilityImages: [sampleImages.facility, sampleImages.facility2, sampleImages.facility3],
  },
  notices: [
    { id: 1, type: "event", title: "May Diet Package - 30% Off Promotion", date: "2026.05.14", startDate: "2026-05-14", endDate: "" },
    { id: 2, type: "notice", title: "Closed on Buddha's Birthday (May 25)", date: "2026.05.10", startDate: "2026-05-10", endDate: "" },
    { id: 3, type: "notice", title: "Schedule Change - Saturday Afternoon Hours Added", date: "2026.05.02", startDate: "2026-05-02", endDate: "" },
    { id: 4, type: "notice", title: "New Associate Director Joining Announcement", date: "2026.04.20", startDate: "2026-04-20", endDate: "" },
  ],
  faqs: [
    { id: "f1", category: "Treatment", question: "What are your office hours?", answer: "We are open weekdays from 9 AM to 7 PM, and Saturdays from 9 AM to 2 PM. Closed on Sundays and holidays.", sortOrder: 0 },
    { id: "f2", category: "Reservation", question: "Can I visit without a reservation?", answer: "Walk-in patients are welcome when time permits, but we prioritize patients with reservations.", sortOrder: 1 },
    { id: "f3", category: "Facility", question: "Is parking available?", answer: "Free parking is available in the building basement. Patients receive 2 hours of complimentary parking.", sortOrder: 2 },
    { id: "f4", category: "Insurance", question: "Do you accept auto insurance?", answer: "Yes. We provide treatment covered by auto insurance and assist with claims.", sortOrder: 3 },
  ],
  popup: {
    id: "p1", title: "May Diet Package\n30% Off",
    body: "A personalized diet program based on constitutional analysis. Special 30% discount throughout May.",
    image: sampleImages.event1, linkUrl: "/events", isActive: true,
  },
  schedulePopup: {
    id: "sp1", title: "June Schedule", month: "2026.06",
    rows: [
      { day: "Weekdays", hours: "09:00 – 19:00" },
      { day: "Saturday", hours: "09:00 – 14:00" },
      { day: "Sun & Holidays", hours: "Closed" },
      { day: "Jun 6 (Memorial Day)", hours: "Closed", note: "Holiday" },
    ],
    notice: "Lunch break 13:00 – 14:00", isActive: true,
  },
  showStats: false,
  clinicInfo: {
    name: "Gowoonbit Korean Medicine Clinic", phone: "02-XXX-XXXX", address: "123, OO-daero, OO-gu, Seoul",
    hours: { weekday: "Weekdays 09:00 – 19:00", saturday: "Saturday 09:00 – 14:00", closed: "Sun & Holidays Closed" },
    reservationUrl: "https://m.place.naver.com/place/2015359820/booking?entry=plt",
    socialLinks: { blog: "#", instagram: "#", kakao: "#" },
  },
};

async function seed() {
  console.log("Seeding site_data...");

  const { error: e1 } = await supabase
    .from("site_data")
    .upsert({ locale: "ko", data: koData, updated_at: new Date().toISOString() }, { onConflict: "locale" });
  if (e1) { console.error("ko error:", e1); return; }
  console.log("✓ ko data seeded");

  const { error: e2 } = await supabase
    .from("site_data")
    .upsert({ locale: "en", data: enData, updated_at: new Date().toISOString() }, { onConflict: "locale" });
  if (e2) { console.error("en error:", e2); return; }
  console.log("✓ en data seeded");

  // Verify
  const { data } = await supabase.from("site_data").select("locale, updated_at");
  console.log("✓ Verification:", data);
}

seed();
