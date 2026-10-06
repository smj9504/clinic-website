import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import { sendReservationNotificationEmail } from "@/lib/email";
import { sendReservationCreatedSms } from "@/lib/sms";
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
 * Body: { name, phone, desiredDate, desiredTime?, memo?, verificationToken, selectedServices? }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const draft = body as Partial<ReservationDraft> | null;

  const validationError = validateReservationDraft(draft ?? {});
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const supabase = getServiceClient();
  const phone = draft!.phone!.trim();

  // 휴대폰 본인인증 재검증 — 클라이언트가 verificationToken을 임의로 위조해
  // "인증됨" 상태를 보내는 것을 막는다. app/api/auth/sms/verify에서 검증
  // 성공 시 발급한 토큰이 실제로 이 전화번호에 대해 유효한지 DB에서 다시
  // 확인한다. phone까지 같이 검증해야 "다른 번호로 받은 토큰을 붙이는" 우회도
  // 막을 수 있다.
  const { data: verification, error: verificationError } = await supabase
    .from("sms_verifications")
    .select("id")
    .eq("verified_token", draft!.verificationToken)
    .eq("phone", phone)
    .eq("verified", true)
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();

  if (verificationError && !isMissingTableError(verificationError)) {
    return NextResponse.json({ error: verificationError.message }, { status: 500 });
  }
  if (!verification) {
    return NextResponse.json({ error: "휴대폰 본인인증이 필요합니다." }, { status: 400 });
  }

  // 토큰 소모 — 같은 토큰으로 예약을 두 번 넣는 것을 막는다 (1회성 보장)
  await supabase.from("sms_verifications").update({ verified_token: null }).eq("id", verification.id);

  const { data, error } = await supabase
    .from("reservation_requests")
    .insert({
      name: draft!.name!.trim(),
      phone,
      desired_date: draft!.desiredDate!.trim(),
      desired_time: draft!.desiredTime?.trim() ?? "",
      memo: draft!.memo?.trim() ?? "",
      phone_verified: true,
      phone_verified_at: new Date().toISOString(),
      selected_services: draft!.selectedServices ?? [],
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

  const reservation = toReservation(data as ReservationRow);

  // 관리자 알림 이메일 · 환자 알림 SMS — 둘 다 best-effort 부가 기능.
  // 예약 신청(DB insert)은 이미 성공했으므로, 발송이 실패해도 환자에게는
  // 정상적으로 접수 완료 응답을 돌려줘야 한다. 서버리스 환경에서는 응답
  // 전송 후 백그라운드 작업이 중간에 끊길 수 있어 응답 전에 await로 완료를
  // 기다리되, 실패는 로그만 남기고 무시한다.
  try {
    await sendReservationNotificationEmail(reservation, request.nextUrl.origin);
  } catch (emailError) {
    console.error("예약 신청 알림 이메일 발송 실패:", emailError);
  }
  try {
    await sendReservationCreatedSms(reservation);
  } catch (smsError) {
    console.error("예약 신청 알림 SMS 발송 실패:", smsError);
  }

  return NextResponse.json({ reservation }, { status: 201 });
}
