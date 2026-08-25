import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import {
  isMissingTableError,
  toReservation,
  validateReservationDraft,
  type ReservationDraft,
  type ReservationRow,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

/**
 * GET /api/reservation-requests — 예약 신청 목록 (관리자 전용)
 * Header: x-admin-password
 */
export async function GET(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reservation_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({ reservations: [], setupRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const reservations = ((data ?? []) as ReservationRow[]).map(toReservation);
  return NextResponse.json({ reservations });
}

/**
 * POST /api/reservation-requests — 환자의 예약 신청 접수 (공개)
 * Body: { name, phone, desiredDate, desiredTime?, memo? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const draft = body as Partial<ReservationDraft> | null;

  const validationError = validateReservationDraft(draft ?? {});
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reservation_requests")
    .insert({
      name: draft!.name!.trim(),
      phone: draft!.phone!.trim(),
      desired_date: draft!.desiredDate!.trim(),
      desired_time: draft!.desiredTime?.trim() ?? "",
      memo: draft!.memo?.trim() ?? "",
    })
    .select("*")
    .single();

  if (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        { error: "예약 신청 기능이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reservation: toReservation(data as ReservationRow) }, { status: 201 });
}
