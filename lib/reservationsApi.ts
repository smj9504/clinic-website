"use client";

/**
 * 관리자용 예약 신청 조회/변경 API 클라이언트
 */

import type { ReservationDraft, ReservationRequest, ReservationStatus } from "./reservations";

function notifyError(message: string) {
  window.dispatchEvent(new CustomEvent("siteDataSaveError", { detail: message }));
}

function headers(withBody: boolean): Record<string, string> {
  const password = sessionStorage.getItem("clinic_admin_pw") ?? "";
  return {
    "x-admin-password": password,
    ...(withBody ? { "content-type": "application/json" } : {}),
  };
}

async function request<T>(
  url: string,
  method: "GET" | "POST" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: headers(method !== "GET"),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      notifyError(
        res.status === 401
          ? "인증이 만료되었습니다. 다시 로그인해 주세요."
          : json?.error ?? `요청 실패 (${res.status})`
      );
      return null;
    }
    return json as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    notifyError(`네트워크 오류가 발생했습니다. (${message})`);
    return null;
  }
}

export async function fetchReservationRequests(): Promise<{
  reservations: ReservationRequest[];
  setupRequired?: boolean;
} | null> {
  return request("/api/reservation-requests", "GET");
}

/**
 * @param reservationDt "confirmed"로 바꿀 때 필수 — 시그마(한의원 내부 예약
 *   시스템)에 등록할 정확한 예약 일시("YYYY-MM-DD HH:MM"). 그 외 상태
 *   전환에는 쓰이지 않는다.
 */
export async function updateReservationStatus(
  id: string,
  status: ReservationStatus,
  reservationDt?: string
): Promise<ReservationRequest | null> {
  const res = await request<{ reservation: ReservationRequest }>(
    `/api/reservation-requests/${encodeURIComponent(id)}`,
    "PATCH",
    reservationDt !== undefined ? { status, reservationDt } : { status }
  );
  return res?.reservation ?? null;
}

export async function updateReservationNote(
  id: string,
  adminNote: string
): Promise<ReservationRequest | null> {
  const res = await request<{ reservation: ReservationRequest }>(
    `/api/reservation-requests/${encodeURIComponent(id)}`,
    "PATCH",
    { adminNote }
  );
  return res?.reservation ?? null;
}

export async function deleteReservationRequest(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(
    `/api/reservation-requests/${encodeURIComponent(id)}`,
    "DELETE"
  );
  return res?.success === true;
}

/**
 * 특정 날짜에 병원 시스템(시그마)에 이미 잡혀 있는 예약 시각("HH:MM") 목록을 조회한다.
 * upstreamFailed가 true면 시그마 조회에 실패한 것 — 호출부는 이 경우 슬롯을
 * 제한 없이 보여주는 폴백으로 처리해야 한다.
 */
export async function fetchAvailableSlots(
  date: string
): Promise<{ bookedTimes: string[]; upstreamFailed?: boolean } | null> {
  return request(`/api/admin/available-slots?date=${encodeURIComponent(date)}`, "GET");
}

export type ReservationSyncLogRow = {
  id: string;
  trigger: "scheduled" | "manual";
  checked_count: number;
  updated_count: number;
  error_count: number;
  details: Array<{
    reservationId: string;
    name: string;
    sigmaReservationDt: string;
    reason: "cancelled_in_sigma" | "sigma_lookup_failed";
  }>;
  created_at: string;
};

/** 관리자의 "지금 동기화" 버튼 — 시그마 상태를 즉시 1회 대조해 어긋난 상태를 바로잡는다 */
export async function syncReservationsWithSigma(): Promise<{
  summary: { checkedCount: number; updatedCount: number; errorCount: number };
  reservations: ReservationRequest[];
} | null> {
  return request("/api/admin/reservations/sync", "POST");
}

/** 최근 동기화 실행 이력 */
export async function fetchReservationSyncLogs(): Promise<{ logs: ReservationSyncLogRow[] } | null> {
  return request("/api/admin/reservations/sync", "GET");
}

/** 공개 예약 신청 폼에서 사용 — 인증 헤더 불필요 */
export async function submitReservationRequest(
  draft: ReservationDraft
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/reservation-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(draft),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json?.error ?? "예약 신청에 실패했습니다." };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `네트워크 오류로 신청에 실패했습니다. (${message})` };
  }
}
