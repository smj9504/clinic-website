/**
 * 개인정보 처리방침 · 상담 신청 동의 문구의 원본
 *
 * 처리방침 페이지(app/privacy), 상담 신청 화면의 동의 체크박스
 * (components/reservation/ConsentCheckboxes), 서버 보관기간 삭제(lib/retention)가
 * 모두 이 값을 쓴다. 문구나 보관기간을 바꿀 때는 여기만 고치면 세 곳이 함께 바뀐다.
 *
 * 처리방침 내용을 바꾸면 POLICY_HISTORY 맨 앞에 시행일과 변경 요약을 추가한다.
 * 페이지에 변경 이력이 표시되고, 바뀌기 전 문구는 git 이력으로 남는다.
 */

export const CLINIC = {
  name: "고운빛한의원",
  phone: "02-783-7525",
  address: "서울시 영등포구 국회대로62길 15, 광복회관 지하1층",
  kakaoChannel: "https://pf.kakao.com/_xiVxjfX",
  website: "www.gowoonbit-kmc.com",
} as const;

export const PRIVACY_OFFICER = {
  name: "허은주",
  position: "대표원장",
  phone: "010-9860-7525",
} as const;

/**
 * 처리방침 변경 이력 — 최신이 맨 앞. 내용을 바꾸면 맨 앞에 한 줄을 추가한다.
 * 맨 앞 항목의 날짜가 현재 시행일이 된다.
 */
export const POLICY_HISTORY: { date: string; summary: string }[] = [
  { date: "2026-11-03", summary: "최초 제정 (같은 날 자동 수집 장치 조항에 관리자 로그인 쿠키 안내 추가)" },
];

/** 처리방침 시행일 (YYYY-MM-DD) */
export const POLICY_EFFECTIVE_DATE = POLICY_HISTORY[0].date;

/** 동의 문구 버전 — 문구를 바꾸면 올린다. 동의 기록(consent_version)에 함께 남는다 */
export const CONSENT_VERSION = "2026-11-03";

/** 홈페이지 상담 신청 정보 보관기간: 신청일로부터 1년 */
export const RESERVATION_RETENTION_DAYS = 365;
/** 휴대폰 인증번호 기록 보관기간: 발급 후 24시간 */
export const SMS_VERIFICATION_RETENTION_HOURS = 24;

export type ConsentNotice = {
  id: "privacy" | "sensitive";
  required: boolean;
  title: string;
  rows: { label: string; value: string }[];
  refusal: string;
};

export const PRIVACY_CONSENT: ConsentNotice = {
  id: "privacy",
  required: true,
  title: "개인정보 수집·이용 동의",
  rows: [
    { label: "수집 항목", value: "이름, 휴대폰 번호, 희망 상담 일자·시간대, 관심 시술" },
    { label: "수집·이용 목적", value: "상담 신청 접수, 휴대폰 본인 확인, 상담 일정 안내 연락(문자·전화)" },
    {
      label: "보유·이용 기간",
      value: "신청일로부터 1년 (기간이 지나면 지체 없이 파기합니다. 휴대폰 인증번호 기록은 24시간 이내 파기합니다)",
    },
  ],
  refusal:
    "동의를 거부할 수 있습니다. 거부하시면 온라인 상담 신청은 할 수 없으며, 전화(" +
    CLINIC.phone +
    ")로 상담을 신청하실 수 있습니다. 만 14세 미만은 법정대리인이 신청해 주세요.",
};

export const SENSITIVE_CONSENT: ConsentNotice = {
  id: "sensitive",
  required: false,
  title: "민감정보(건강정보) 처리 동의",
  rows: [
    { label: "수집 항목", value: "‘증상 · 요청사항’에 적으신 증상, 병력 등 건강에 관한 정보" },
    { label: "수집·이용 목적", value: "상담 준비 및 상담 내용 안내" },
    { label: "보유·이용 기간", value: "신청일로부터 1년 (기간이 지나면 지체 없이 파기합니다)" },
  ],
  refusal:
    "동의를 거부할 수 있습니다. 거부하시면 ‘증상 · 요청사항’을 비워 두고 상담을 신청하실 수 있습니다.",
};

/** 증상·요청사항을 적었는데 민감정보 동의가 없을 때 보여줄 문구 */
export const SENSITIVE_REQUIRED_MESSAGE =
  "‘증상 · 요청사항’을 남기시려면 민감정보(건강정보) 처리에 동의해 주세요. 동의하지 않으시려면 해당 칸을 비워 주세요.";

export const PRIVACY_REQUIRED_MESSAGE = "개인정보 수집·이용에 동의해 주세요.";

/**
 * 업체가 자동으로 남기는 접속 기록의 보관기간 — 요금제에 따라 다르다.
 * 요금제를 바꾸면 여기도 바꾼다.
 *   Vercel  Hobby 1시간 / Pro 1일 / Observability Plus 30일
 *   Supabase Free 1일 / Pro 7일 / Team 28일
 */
export const VENDOR_LOG_RETENTION = {
  vercel: "1시간",
  supabase: "1일",
} as const;

/** 개인정보 처리업무 위탁 (처리방침 위탁 조항) */
export const OUTSOURCING: { company: string; task: string }[] = [
  { company: "솔라피 주식회사", task: "휴대폰 인증번호 및 상담 신청 안내 문자 발송" },
  { company: "네이버 주식회사", task: "상담 신청 알림 이메일 발송·수신(네이버 메일)" },
  { company: "Vercel Inc.", task: "홈페이지 서버 운영(호스팅)" },
  { company: "Supabase Pte. Ltd.", task: "홈페이지 데이터베이스 운영(상담 신청 정보 보관), 홈페이지 이미지 제공" },
];

/** 개인정보 국외 이전 (「개인정보 보호법」 제28조의8 제2항의 고지 항목) */
export const OVERSEAS_TRANSFERS: {
  company: string;
  contact: string;
  country: string;
  items: string;
  when: string;
  purpose: string;
  period: string;
}[] = [
  {
    company: "Supabase Pte. Ltd.",
    contact: "privacy@supabase.com",
    country: "싱가포르",
    items:
      "상담 신청 정보(이름, 휴대폰 번호, 희망 일시, 관심 시술, 증상·요청사항), 휴대폰 인증 기록, 홈페이지 이미지를 불러올 때의 접속 정보(IP 주소, 접속 일시, 브라우저 정보)",
    when: "상담 신청 시, 홈페이지 이용 시 정보통신망으로 전송",
    purpose: "데이터베이스 보관, 홈페이지 이미지 제공",
    period: `상담 신청 정보: 신청일로부터 1년 / 인증 기록: 24시간 / 접속 정보: ${VENDOR_LOG_RETENTION.supabase}`,
  },
  {
    company: "Vercel Inc.",
    contact: "privacy@vercel.com",
    country: "미국",
    items: "상담 신청 정보(전송 과정에서 처리), 접속 정보(IP 주소, 접속 일시, 브라우저 정보)",
    when: "홈페이지 이용 시 정보통신망으로 전송",
    purpose: "홈페이지 서버 운영",
    period: `상담 신청 정보: 저장하지 않음(전달만 함) / 접속 정보: ${VENDOR_LOG_RETENTION.vercel}`,
  },
];

/**
 * 병원(내원·진료) 개인정보 처리방침의 주소.
 * 홈페이지 처리방침은 홈페이지에서 처리하는 개인정보만 다루고, 진료·CCTV 등은
 * 병원용 처리방침이 다룬다. 병원용을 홈페이지에 올리면 그 주소를 넣는다 —
 * 넣으면 홈페이지 처리방침과 푸터에 링크가 생긴다. null이면 "병원에 비치"로 안내한다.
 */
export const CLINIC_POLICY_URL: string | null = null;
