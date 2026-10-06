import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { sendVerificationCodeSms } from "@/lib/sms";
import {
  codeTtlSec,
  generateVerificationCode,
  isMissingTableError,
  isValidMobilePhone,
  resendCooldownSec,
} from "@/lib/smsAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/sms/send — 휴대폰 본인인증 인증번호 발송 (공개)
 * Body: { phone: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!phone) {
    return NextResponse.json({ error: "연락처를 입력해 주세요." }, { status: 400 });
  }
  if (!isValidMobilePhone(phone)) {
    return NextResponse.json({ error: "올바른 휴대폰 번호 형식이 아닙니다." }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 남용 방지 — 같은 번호로 최근 발송 이력이 쿨다운 이내면 재발송을 막는다.
  const cooldownSince = new Date(Date.now() - resendCooldownSec() * 1000).toISOString();
  const { data: recent, error: recentError } = await supabase
    .from("sms_verifications")
    .select("id")
    .eq("phone", phone)
    .gt("created_at", cooldownSince)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (recentError) {
    if (isMissingTableError(recentError)) {
      return NextResponse.json(
        { error: "본인인증 기능이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: recentError.message }, { status: 500 });
  }
  if (recent) {
    return NextResponse.json(
      { error: `잠시 후 다시 시도해 주세요. (${resendCooldownSec()}초마다 재발송 가능)` },
      { status: 429 }
    );
  }

  const code = generateVerificationCode();
  const expiresAt = new Date(Date.now() + codeTtlSec() * 1000).toISOString();

  const { error: insertError } = await supabase
    .from("sms_verifications")
    .insert({ phone, code, expires_at: expiresAt });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 인증번호 발송은 필수 성공 경로다 — best-effort로 무시하면 사용자가
  // 문자를 못 받고도 "발송됨" 응답을 받아 영원히 대기하게 된다.
  try {
    await sendVerificationCodeSms(phone, code);
  } catch (smsError) {
    console.error("인증번호 SMS 발송 실패:", smsError);
    return NextResponse.json(
      { error: "인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
