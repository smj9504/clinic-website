/**
 * SMS 본인인증 — 타입 · DB row 변환 · 검증 로직
 *
 * 예약 신청 폼에서 휴대폰 본인인증(인증번호 발송→검증)에 쓰는 임시 데이터.
 * 스키마는 supabase-schema.sql 참고.
 *
 * 흐름:
 *   1) POST /api/auth/sms/send  — 인증번호를 생성해 저장하고 SMS로 발송
 *   2) POST /api/auth/sms/verify — 인증번호를 확인하고, 통과하면 1회용
 *      verified_token을 발급한다.
 *   3) POST /api/reservation-requests — 클라이언트가 보낸 verificationToken을
 *      phone과 함께 재조회해 실제로 검증된 것인지 확인한 뒤, 토큰을 소모한다.
 *      (클라이언트가 임의로 "인증됨" 상태를 위조하는 것을 막기 위함 — phone까지
 *      같이 검증해야 다른 번호로 받은 토큰을 붙이는 우회도 막을 수 있다.)
 */

export type SmsVerificationRow = {
  id: string;
  phone: string;
  code: string;
  verified: boolean;
  verified_token: string | null;
  attempt_count: number;
  expires_at: string;
  created_at: string;
};

/** 휴대폰 전용 정규식. lib/reservations.ts의 연락처 정규식(유선전화도 통과)과 달리
 *  SMS 인증은 010 등 휴대폰 번호만 받아야 하므로 별도로 강화한다. */
const MOBILE_PHONE_RE = /^01[0-9]-?\d{3,4}-?\d{4}$/;

export function isValidMobilePhone(phone: string): boolean {
  return MOBILE_PHONE_RE.test(phone.trim());
}

const RESEND_COOLDOWN_SEC = 60;
const CODE_TTL_SEC = 180;
const MAX_ATTEMPTS = 5;

export function resendCooldownSec(): number {
  return RESEND_COOLDOWN_SEC;
}

export function codeTtlSec(): number {
  return CODE_TTL_SEC;
}

export function maxAttempts(): number {
  return MAX_ATTEMPTS;
}

/** 6자리 인증번호 생성 */
export function generateVerificationCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}
