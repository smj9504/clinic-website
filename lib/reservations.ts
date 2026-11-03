/**
 * 예약 신청 — 타입 · DB row 변환
 *
 * 병원 예약 시스템은 병원 내부망(설치형)에만 존재해 홈페이지 서버가
 * 직접 연동할 수 없다. 그래서 홈페이지는 "예약 신청"만 접수해 전용
 * 테이블에 저장하고(스키마는 supabase-schema.sql 참고), 병원
 * 직원이 관리자 화면에서 확인한 뒤 병원 시스템에 직접 입력한다.
 */

import { PRIVACY_REQUIRED_MESSAGE, SENSITIVE_REQUIRED_MESSAGE } from "./privacy";

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

/** 장바구니에서 선택한 시술의 스냅샷 — 예약 시점의 이름·가격을 그대로 보존한다 */
export type CartItemSnapshot = {
  serviceId: string;
  priceId: string;
  serviceName: string;
  priceLabel: string;
  originalPrice: number;
  finalPrice: number;
};

export type ReservationRequest = {
  id: string;
  name: string;
  phone: string;
  desiredDate: string; // YYYY-MM-DD
  desiredTime: string; // "오전" | "오후" | "14:00" 등 자유 입력
  memo: string;
  /** 신청 시점에 장바구니에 담겨 있던 시술 — 없으면 빈 배열 */
  selectedServices: CartItemSnapshot[];
  status: ReservationStatus;
  adminNote: string;
  /** 확정 처리 시 시그마에 실제로 등록된 예약 UUID. 확정 전에는 없다 */
  sigmaReservationUuid: string | null;
  /** 확정 처리 시 관리자가 입력한 정확한 예약 일시("YYYY-MM-DD HH:MM") */
  sigmaReservationDt: string | null;
  /** 개인정보 수집·이용 동의 일시. 동의 기록 컬럼이 생기기 전 신청은 null */
  privacyAgreedAt: string | null;
  /** 민감정보(건강정보) 처리 동의 일시. 동의하지 않았으면 null */
  sensitiveAgreedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ReservationRow = {
  id: string;
  name: string;
  phone: string;
  desired_date: string;
  desired_time: string;
  memo: string;
  selected_services: CartItemSnapshot[] | null;
  status: string;
  admin_note: string;
  sigma_reservation_uuid: string | null;
  sigma_reservation_dt: string | null;
  privacy_agreed_at?: string | null;
  sensitive_agreed_at?: string | null;
  created_at: string;
  updated_at: string;
};

export function toReservation(row: ReservationRow): ReservationRequest {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    desiredDate: row.desired_date,
    desiredTime: row.desired_time ?? "",
    memo: row.memo ?? "",
    selectedServices: Array.isArray(row.selected_services) ? row.selected_services : [],
    status: (row.status as ReservationStatus) ?? "pending",
    adminNote: row.admin_note ?? "",
    sigmaReservationUuid: row.sigma_reservation_uuid ?? null,
    sigmaReservationDt: row.sigma_reservation_dt ?? null,
    privacyAgreedAt: row.privacy_agreed_at ?? null,
    sensitiveAgreedAt: row.sensitive_agreed_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * 시그마(병원 내부 예약 시스템) 연동 사용 여부 — NEXT_PUBLIC_SIGMA_ENABLED=true일 때만 켠다.
 *
 * 시그마는 병원 내부망에만 있어 Vercel 배포 환경에서는 접근할 수 없다. 꺼져
 * 있으면 "확정 처리"는 홈페이지 상태만 바꾸고(병원 시스템 등록·환자 안내는
 * 직원이 직접 한다), 시그마 취소 연동·상태 동기화도 실행하지 않는다.
 * 서버·클라이언트가 같은 값을 보도록 NEXT_PUBLIC_ 환경변수를 쓴다(빌드 시 고정).
 */
export const SIGMA_ENABLED = process.env.NEXT_PUBLIC_SIGMA_ENABLED === "true";

/** 시그마 API가 요구하는 "YYYY-MM-DD HH:MM" 형식 검증 */
export function isValidSigmaDateTime(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(value.trim());
}

export type ReservationDraft = {
  name: string;
  phone: string;
  desiredDate: string;
  desiredTime?: string;
  memo?: string;
  /** 휴대폰 본인인증 완료 후 발급받은 1회용 토큰 (app/api/auth/sms/verify 응답) */
  verificationToken: string;
  selectedServices?: CartItemSnapshot[];
  /** [필수] 개인정보 수집·이용 동의 */
  privacyAgreed?: boolean;
  /** [선택] 민감정보(건강정보) 처리 동의 — memo를 적었으면 필요하다 */
  sensitiveAgreed?: boolean;
};

/** 신청 폼 입력 검증. 통과하면 null, 실패하면 에러 메시지를 돌려준다. */
/** 상담 신청 입력 길이 한도 — 화면(maxLength)과 서버 검증이 같은 값을 쓴다 */
export const RESERVATION_LIMITS = {
  name: 30,
  desiredTime: 30,
  memo: 1000,
  selectedServices: 30,
  serviceText: 200,
} as const;

function isValidSnapshot(item: unknown): boolean {
  if (!item || typeof item !== "object") return false;
  const it = item as Record<string, unknown>;
  const text = (v: unknown) => typeof v === "string" && v.length <= RESERVATION_LIMITS.serviceText;
  const price = (v: unknown) => typeof v === "number" && Number.isFinite(v) && v >= 0 && v < 1e9;
  return text(it.serviceId) && text(it.priceId) && text(it.serviceName) && text(it.priceLabel) && price(it.originalPrice) && price(it.finalPrice);
}

export function validateReservationDraft(draft: Partial<ReservationDraft>): string | null {
  if (typeof draft.name !== "string" || !draft.name.trim()) return "이름을 입력해 주세요.";
  if (draft.name.trim().length > RESERVATION_LIMITS.name) return `이름은 ${RESERVATION_LIMITS.name}자 이내로 입력해 주세요.`;
  if (draft.desiredTime !== undefined && (typeof draft.desiredTime !== "string" || draft.desiredTime.length > RESERVATION_LIMITS.desiredTime))
    return "희망 시간대 형식이 올바르지 않습니다.";
  if (draft.memo !== undefined && typeof draft.memo !== "string") return "증상·요청사항 형식이 올바르지 않습니다.";
  if (typeof draft.memo === "string" && draft.memo.trim().length > RESERVATION_LIMITS.memo)
    return `증상·요청사항은 ${RESERVATION_LIMITS.memo.toLocaleString()}자 이내로 입력해 주세요.`;
  if (draft.selectedServices !== undefined) {
    if (!Array.isArray(draft.selectedServices) || draft.selectedServices.length > RESERVATION_LIMITS.selectedServices)
      return `선택한 시술은 ${RESERVATION_LIMITS.selectedServices}개까지 신청할 수 있습니다.`;
    if (!draft.selectedServices.every(isValidSnapshot)) return "선택한 시술 정보가 올바르지 않습니다.";
  }
  if (typeof draft.verificationToken === "string" && draft.verificationToken.length > 100) return "휴대폰 본인인증을 다시 진행해 주세요.";
  if (typeof draft.phone !== "string" || !draft.phone.trim()) return "연락처를 입력해 주세요.";
  if (!/^[0-9-]{9,14}$/.test(draft.phone.trim())) return "올바른 연락처 형식이 아닙니다.";
  if (typeof draft.desiredDate !== "string" || !draft.desiredDate.trim()) return "희망 날짜를 선택해 주세요.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.desiredDate.trim())) return "올바른 날짜 형식이 아닙니다.";
  if (!draft.verificationToken?.trim()) return "휴대폰 본인인증을 완료해 주세요.";
  if (draft.privacyAgreed !== true) return PRIVACY_REQUIRED_MESSAGE;
  if (draft.memo?.trim() && draft.sensitiveAgreed !== true) return SENSITIVE_REQUIRED_MESSAGE;
  return null;
}

export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}
