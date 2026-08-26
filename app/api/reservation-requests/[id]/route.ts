import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import { sendReservationCancelledSms } from "@/lib/sms";
import { createSigmaReservation } from "@/lib/sigma";
import {
  isValidSigmaDateTime,
  toReservation,
  type ReservationRow,
  type ReservationStatus,
} from "@/lib/reservations";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

const ALLOWED_STATUSES: ReservationStatus[] = ["pending", "confirmed", "cancelled"];

/**
 * PATCH /api/reservation-requests/[id] — 상태·메모 변경 (관리자 전용)
 * Header: x-admin-password
 * Body: { status?: "pending" | "confirmed" | "cancelled", adminNote?: string, reservationDt?: string }
 *
 * status를 "confirmed"로 바꾸는 요청은 reservationDt("YYYY-MM-DD HH:MM")가
 * 필수다 — 관리자가 직접 입력한 정확한 예약 시각을 시그마(한의원 내부
 * 예약 시스템)에 전달해 실제 예약을 생성해야 하기 때문이다(lib/sigma.ts
 * 참고). 시그마 호출이 실패하면 DB의 status도 바꾸지 않는다 — 병원
 * 시스템에 실제로 예약이 생성되지 않았는데 홈페이지만 "확정"으로
 * 표시하면 안 된다.
 *
 * 확정 알림 SMS는 더 이상 여기서 보내지 않는다 — 시그마에 예약이
 * 생성되면 병원 내부 시스템이 자체적으로 문자를 보낸다. 취소 알림은
 * 시그마와 무관한 홈페이지 자체 기능이라 그대로 유지한다.
 */
export async function PATCH(request: NextRequest, { params }: Params) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const status = body?.status as ReservationStatus | undefined;
  const adminNote = body?.adminNote as string | undefined;
  const reservationDt = typeof body?.reservationDt === "string" ? body.reservationDt.trim() : undefined;

  if (status !== undefined && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "올바르지 않은 상태 값입니다" }, { status: 400 });
  }
  if (status === "confirmed") {
    if (!reservationDt) {
      return NextResponse.json({ error: "확정할 예약 일시를 입력해 주세요." }, { status: 400 });
    }
    if (!isValidSigmaDateTime(reservationDt)) {
      return NextResponse.json(
        { error: "예약 일시는 YYYY-MM-DD HH:MM 형식으로 입력해 주세요." },
        { status: 400 }
      );
    }
  }

  const supabase = getServiceClient();

  // status가 실제로 바뀌는지 감지하기 위해, 업데이트 전 이전 값과 신청자
  // 정보를 먼저 조회한다. adminNote만 바꾸는 요청(status === undefined)은
  // 이 조회를 건너뛴다.
  let previousStatus: ReservationStatus | null = null;
  let existingRow: { name: string; phone: string; memo: string } | null = null;
  if (status !== undefined) {
    const { data: existing } = await supabase
      .from("reservation_requests")
      .select("status, name, phone, memo")
      .eq("id", id)
      .maybeSingle();
    previousStatus = (existing?.status as ReservationStatus) ?? null;
    existingRow = existing ? { name: existing.name, phone: existing.phone, memo: existing.memo } : null;
  }

  const statusActuallyChanges = status !== undefined && previousStatus !== null && previousStatus !== status;

  // 확정 처리는 시그마 호출이 성공해야만 진행한다 — 실패 시 DB를 건드리지 않고 즉시 에러를 반환한다.
  let sigmaFields: { sigma_reservation_uuid: string; sigma_reservation_dt: string } | null = null;
  if (status === "confirmed" && statusActuallyChanges && existingRow) {
    const sigmaResult = await createSigmaReservation({
      reservationDt: reservationDt!,
      name: existingRow.name,
      phone: existingRow.phone,
      memo: existingRow.memo,
    });
    if (!sigmaResult.ok) {
      return NextResponse.json(
        { error: `병원 예약 시스템 연동에 실패했습니다: ${sigmaResult.error}` },
        { status: sigmaResult.status ?? 502 }
      );
    }
    sigmaFields = {
      sigma_reservation_uuid: sigmaResult.reservation.reservationUuid,
      sigma_reservation_dt: reservationDt!,
    };
  }

  const row: Record<string, string> = { updated_at: new Date().toISOString() };
  if (status !== undefined) row.status = status;
  if (adminNote !== undefined) row.admin_note = adminNote;
  if (sigmaFields) Object.assign(row, sigmaFields);

  const { data, error } = await supabase
    .from("reservation_requests")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "not found" }, { status: 404 });

  const reservation = toReservation(data as ReservationRow);

  // 취소 알림 SMS — best-effort. 아래 3가지 조건이 모두 참일 때만 보낸다:
  //   (1) 이번 요청에 status가 실제로 포함됨 (adminNote만 바꾼 요청 제외)
  //   (2) 이전 상태 조회에 성공함
  //   (3) 이전 값과 실제로 다름 — 이미 cancelled인 건을 실수로 다시
  //       "취소 처리" 눌러도 재발송되지 않도록 방어한다
  //       (app/admin/reservations/page.tsx의 setStatus가 버튼 클릭마다
  //       무조건 PATCH를 호출하는 구조라 이 방어가 필요하다)
  if (status === "cancelled" && statusActuallyChanges) {
    try {
      await sendReservationCancelledSms(reservation);
    } catch (smsError) {
      console.error("예약 취소 알림 SMS 발송 실패:", smsError);
    }
  }

  return NextResponse.json({ reservation });
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
