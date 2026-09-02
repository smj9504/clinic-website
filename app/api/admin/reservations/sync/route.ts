import { NextRequest, NextResponse } from "next/server";
import { requireAdminRequest } from "@/lib/adminAuth";
import { getServiceClient } from "@/lib/supabase";
import { syncReservationsWithSigma } from "@/lib/reservationSync";
import { isMissingTableError, toReservation, type ReservationRow } from "@/lib/reservations";

export const dynamic = "force-dynamic";

/**
 * POST /api/admin/reservations/sync — 시그마 상태 수동 동기화 (관리자 전용)
 * Header: x-admin-password
 *
 * app/instrumentation.ts의 30분 주기 자동 동기화와 동일한 로직을
 * 즉시 1회 실행한다. 관리자 화면의 "지금 동기화" 버튼에서 호출한다.
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const summary = await syncReservationsWithSigma("manual");

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reservation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ summary, reservations: [], setupRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reservations = (data as ReservationRow[]).map(toReservation);
  return NextResponse.json({ summary, reservations });
}

/**
 * GET /api/admin/reservations/sync — 최근 동기화 이력 조회 (관리자 전용)
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reservation_sync_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ logs: [], setupRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ logs: data ?? [] });
}
