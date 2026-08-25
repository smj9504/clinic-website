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
  method: "GET" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: headers(body !== undefined),
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

export async function updateReservationStatus(
  id: string,
  status: ReservationStatus
): Promise<ReservationRequest | null> {
  const res = await request<{ reservation: ReservationRequest }>(
    `/api/reservation-requests/${encodeURIComponent(id)}`,
    "PATCH",
    { status }
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
