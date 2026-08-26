/**
 * 예약 신청 — 타입 · DB row 변환
 *
 * 병원 예약 시스템은 병원 내부망(설치형)에만 존재해 홈페이지 서버가
 * 직접 연동할 수 없다. 그래서 홈페이지는 "예약 신청"만 접수해 전용
 * 테이블에 저장하고(스키마는 supabase-schema.sql 참고), 병원
 * 직원이 관리자 화면에서 확인한 뒤 병원 시스템에 직접 입력한다.
 */

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

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
};

/** 신청 폼 입력 검증. 통과하면 null, 실패하면 에러 메시지를 돌려준다. */
export function validateReservationDraft(draft: Partial<ReservationDraft>): string | null {
  if (!draft.name?.trim()) return "이름을 입력해 주세요.";
  if (!draft.phone?.trim()) return "연락처를 입력해 주세요.";
  if (!/^[0-9-]{9,14}$/.test(draft.phone.trim())) return "올바른 연락처 형식이 아닙니다.";
  if (!draft.desiredDate?.trim()) return "희망 날짜를 선택해 주세요.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.desiredDate.trim())) return "올바른 날짜 형식이 아닙니다.";
  if (!draft.verificationToken?.trim()) return "휴대폰 본인인증을 완료해 주세요.";
  return null;
}

export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}
