const ko = {
  // Nav
  "nav.reservation": "예약하기",
  "nav.menuOpen": "메뉴 열기",

  // Hero
  "hero.reservation": "예약하기 →",
  "hero.treatments": "진료 안내",

  // Section headers
  "section.treatments": "진료 내용",
  "section.events": "진행중인 이벤트",
  "section.director": "대표원장 소개",
  "section.notices": "공지사항",
  "section.more": "더 보기 →",
  "section.detail": "자세히",

  // Badges
  "badge.event": "이벤트",
  "badge.notice": "공지",

  // Footer
  "footer.description":
    "전통 한의학의 지혜와 현대 의학의 정밀함을 함께 담아, 당신의 건강한 일상을 처방합니다.",
  "footer.contact": "연락처",
  "footer.hours": "진료 시간",
  "footer.follow": "팔로우",
  "footer.blog": "네이버 블로그",
  "footer.instagram": "인스타그램",
  "footer.kakao": "카카오 채널",
  "footer.terms": "이용약관",
  "footer.privacy": "개인정보 처리방침",

  // About page
  "about.title": "한의원 소개",
  "about.facility": "시설 안내",
  "about.hoursTitle": "진료 시간",
  "about.weekday": "평일",
  "about.saturday": "토요일",
  "about.holiday": "일·공휴일",
  "about.closed": "휴진",

  // Events page
  "events.title": "진행중인 이벤트",
  "events.empty": "진행중인 이벤트가 없습니다.",
  "events.period": "이벤트 기간",
  "events.contact": "문의",

  // Treatments page
  "treatments.title": "진료 내용",

  // Community
  "notice.title": "공지사항",
  "notice.tab": "공지사항",
  "notice.empty": "등록된 공지가 없습니다.",
  "faq.title": "자주 묻는 질문",
  "faq.tab": "FAQ",
  "faq.empty": "등록된 FAQ가 없습니다.",

  // Popup
  "popup.label": "이 달의 이벤트",
  "popup.scheduleLabel": "진료 일정",
  "popup.dismiss": "오늘 하루 보지 않기",
  "popup.detail": "자세히 →",
  "popup.close": "팝업 닫기",

  // Chat
  "chat.title": "무엇을 도와드릴까요?",
  "chat.disclaimer": "※ 진료 상담이 아닌 안내용 챗봇입니다",
  "chat.greeting":
    "안녕하세요! 자주 묻는 질문을 골라보시거나, 궁금한 점을 입력해 주세요.",
  "chat.q1": "진료 시간이 어떻게 되나요?",
  "chat.q2": "주차장이 있나요?",
  "chat.q3": "예약은 어떻게 하나요?",
  "chat.q4": "보험 적용이 되나요?",
  "chat.placeholder": "질문을 입력하세요...",
  "chat.close": "닫기",
  "chat.open": "문의하기",

  // Slide
  "slide.label": "슬라이드",

  // Stats
  "stats.years": "진료 경력",
  "stats.yearSuffix": "년",
  "stats.patients": "누적 환자",
  "stats.patientSuffix": "명+",
  "stats.satisfaction": "환자 만족도",
  "stats.treatments": "진료 분야",
  "stats.treatmentSuffix": "개",
} as const;

const en: Record<keyof typeof ko, string> = {
  // Nav
  "nav.reservation": "Book Now",
  "nav.menuOpen": "Open menu",

  // Hero
  "hero.reservation": "Book Now →",
  "hero.treatments": "Our Treatments",

  // Section headers
  "section.treatments": "Treatments",
  "section.events": "Current Events",
  "section.director": "Meet the Director",
  "section.notices": "Notices",
  "section.more": "See More →",
  "section.detail": "Details",

  // Badges
  "badge.event": "Event",
  "badge.notice": "Notice",

  // Footer
  "footer.description":
    "Combining the wisdom of traditional Korean medicine with modern precision to restore your healthy daily life.",
  "footer.contact": "Contact",
  "footer.hours": "Hours",
  "footer.follow": "Follow",
  "footer.blog": "Naver Blog",
  "footer.instagram": "Instagram",
  "footer.kakao": "Kakao Channel",
  "footer.terms": "Terms of Service",
  "footer.privacy": "Privacy Policy",

  // About page
  "about.title": "About Us",
  "about.facility": "Our Facility",
  "about.hoursTitle": "Office Hours",
  "about.weekday": "Weekdays",
  "about.saturday": "Saturday",
  "about.holiday": "Sun & Holidays",
  "about.closed": "Closed",

  // Events page
  "events.title": "Current Events",
  "events.empty": "No current events.",
  "events.period": "Period",
  "events.contact": "Contact",

  // Treatments page
  "treatments.title": "Treatments",

  // Community
  "notice.title": "Notices",
  "notice.tab": "Notices",
  "notice.empty": "No notices available.",
  "faq.title": "FAQ",
  "faq.tab": "FAQ",
  "faq.empty": "No FAQs available.",

  // Popup
  "popup.label": "Monthly Event",
  "popup.scheduleLabel": "Schedule",
  "popup.dismiss": "Don't show today",
  "popup.detail": "Details →",
  "popup.close": "Close popup",

  // Chat
  "chat.title": "How can we help?",
  "chat.disclaimer": "※ Info chatbot, not for medical consultation",
  "chat.greeting":
    "Hello! Choose a frequently asked question or type your own.",
  "chat.q1": "What are your office hours?",
  "chat.q2": "Is parking available?",
  "chat.q3": "How do I make a reservation?",
  "chat.q4": "Is insurance accepted?",
  "chat.placeholder": "Type your question...",
  "chat.close": "Close",
  "chat.open": "Contact",

  // Slide
  "slide.label": "Slide",

  // Stats
  "stats.years": "Years of Practice",
  "stats.yearSuffix": "yr",
  "stats.patients": "Patients Served",
  "stats.patientSuffix": "+",
  "stats.satisfaction": "Satisfaction Rate",
  "stats.treatments": "Specialties",
  "stats.treatmentSuffix": "",
};

export const translations = { ko, en } as const;
export type TranslationKey = keyof typeof ko;
