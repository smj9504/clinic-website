import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import { toReservation, type ReservationRow, type ReservationStatus } from "@/lib/reservations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES: ReservationStatus[] = ["pending", "confirmed", "cancelled"];

/**
 * PATCH /api/reservation-requests/[id] — 상태·메모 변경 (관리자 전용)
 * Header: x-admin-password
 * Body: { status?: "pending" | "confirmed" | "cancelled", adminNote?: string }
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as ReservationStatus | undefined;
  const adminNote = body?.adminNote as string | undefined;

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "올바르지 않은 상태 값입니다" }, { status: 400 });
  }

  const row: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status !== undefined) row.status = status;
  if (adminNote !== undefined) row.admin_note = adminNote;

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("reservation_requests")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ reservation: toReservation(data as ReservationRow) });
}

/**
 * DELETE /api/reservation-requests/[id] — 신청 삭제 (관리자 전용)
 * Header: x-admin-password
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const { id } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase.from("reservation_requests").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
