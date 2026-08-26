"use client";

/**
 * 휴대폰 본인인증 API 클라이언트 — 공개 엔드포인트, 인증 헤더 불필요
 * (lib/reservationsApi.ts의 submitReservationRequest와 동일한 패턴)
 */

export async function sendVerificationCode(phone: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/sms/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json?.error ?? "인증번호 발송에 실패했습니다." };
    }
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `네트워크 오류로 인증번호 발송에 실패했습니다. (${message})` };
  }
}

export async function verifyCode(
  phone: string,
  code: string
): Promise<{ ok: true; verificationToken: string } | { ok: false; error: string }> {
  try {
    const res = await fetch("/api/auth/sms/verify", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone, code }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, error: json?.error ?? "인증번호가 일치하지 않습니다." };
    }
    return { ok: true, verificationToken: json.verificationToken };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `네트워크 오류로 인증에 실패했습니다. (${message})` };
  }
}
