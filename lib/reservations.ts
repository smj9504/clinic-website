/**
 * 예약 신청 — 타입 · DB row 변환
 *
 * 병원 예약 시스템은 병원 내부망(설치형)에만 존재해 홈페이지 서버가
 * 직접 연동할 수 없다. 그래서 홈페이지는 "예약 신청"만 접수해 전용
 * 테이블에 저장하고(스키마는 supabase-reservations.sql 참고), 병원
 * 직원이 관리자 화면에서 확인한 뒤 병원 시스템에 직접 입력한다.
 */

export type ReservationStatus = "pending" | "confirmed" | "cancelled";

export type ReservationRequest = {
  id: string;
  name: string;
  phone: string;
  desiredDate: string; // YYYY-MM-DD
  desiredTime: string; // "오전" | "오후" | "14:00" 등 자유 입력
  memo: string;
  status: ReservationStatus;
  adminNote: string;
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
  status: string;
  admin_note: string;
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
    status: (row.status as ReservationStatus) ?? "pending",
    adminNote: row.admin_note ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export type ReservationDraft = {
  name: string;
  phone: string;
  desiredDate: string;
  desiredTime?: string;
  memo?: string;
};

/** 신청 폼 입력 검증. 통과하면 null, 실패하면 에러 메시지를 돌려준다. */
export function validateReservationDraft(draft: Partial<ReservationDraft>): string | null {
  if (!draft.name?.trim()) return "이름을 입력해 주세요.";
  if (!draft.phone?.trim()) return "연락처를 입력해 주세요.";
  if (!/^[0-9-]{9,14}$/.test(draft.phone.trim())) return "올바른 연락처 형식이 아닙니다.";
  if (!draft.desiredDate?.trim()) return "희망 날짜를 선택해 주세요.";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(draft.desiredDate.trim())) return "올바른 날짜 형식이 아닙니다.";
  return null;
}

export function isMissingTableError(
  error: { code?: string | null; message?: string | null } | null
): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}
