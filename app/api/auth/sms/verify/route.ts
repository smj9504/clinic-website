import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { isMissingTableError, isValidMobilePhone, maxAttempts, type SmsVerificationRow } from "@/lib/smsAuth";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/sms/verify — 휴대폰 본인인증 인증번호 검증 (공개)
 * Body: { phone: string, code: string }
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";

  if (!phone || !isValidMobilePhone(phone)) {
    return NextResponse.json({ error: "올바른 휴대폰 번호 형식이 아닙니다." }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "인증번호를 입력해 주세요." }, { status: 400 });
  }

  const supabase = getServiceClient();
  const nowIso = new Date().toISOString();

  const { data: match, error: matchError } = await supabase
    .from("sms_verifications")
    .select("*")
    .eq("phone", phone)
    .eq("code", code)
    .eq("verified", false)
    .gt("expires_at", nowIso)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (matchError) {
    if (isMissingTableError(matchError)) {
      return NextResponse.json(
        { error: "본인인증 기능이 아직 설정되지 않았습니다. 관리자에게 문의해 주세요." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: matchError.message }, { status: 500 });
  }

  if (!match) {
    // 오답 — 같은 번호의 가장 최근 미검증 시도에 시도 횟수를 누적하고,
    // 임계값을 넘으면 그 번호의 미검증 레코드를 전부 즉시 만료시켜
    // 브루트포스로 인증번호를 맞히는 것을 막는다.
    const { data: latest } = await supabase
      .from("sms_verifications")
      .select("id, attempt_count")
      .eq("phone", phone)
      .eq("verified", false)
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest) {
      const nextAttempts = (latest.attempt_count ?? 0) + 1;
      if (nextAttempts >= maxAttempts()) {
        await supabase
          .from("sms_verifications")
          .update({ expires_at: nowIso })
          .eq("phone", phone)
          .eq("verified", false);
      } else {
        await supabase.from("sms_verifications").update({ attempt_count: nextAttempts }).eq("id", latest.id);
      }
    }

    return NextResponse.json({ error: "인증번호가 일치하지 않습니다." }, { status: 401 });
  }

  const verificationToken = randomUUID();
  const { error: updateError } = await supabase
    .from("sms_verifications")
    .update({ verified: true, verified_token: verificationToken })
    .eq("id", (match as SmsVerificationRow).id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ verificationToken });
}
