/**
 * 개인정보 처리방침 · 상담 신청 동의 문구의 원본
 *
 * 처리방침 페이지(app/privacy), 상담 신청 화면의 동의 체크박스
 * (components/reservation/ConsentCheckboxes), 서버 보관기간 삭제(lib/retention)가
 * 모두 이 값을 쓴다. 문구나 보관기간을 바꿀 때는 여기만 고치면 세 곳이 함께 바뀐다.
 *
 * 처리방침 내용을 바꾸면 POLICY_EFFECTIVE_DATE를 새 시행일로 올리고,
 * 바뀌기 전 내용은 git 이력으로 남긴다(처리방침 변경 이력).
 */

export const CLINIC = {
  name: "고운빛한의원",
  phone: "02-783-7525",
  address: "서울시 영등포구 국회대로62길 15, 광복회관 지하1층",
} as const;

export const PRIVACY_OFFICER = {
  name: "허은주",
  position: "대표원장",
  phone: "010-9860-7525",
} as const;

/** 처리방침 시행일 (YYYY-MM-DD) */
export const POLICY_EFFECTIVE_DATE = "2026-11-03";

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
