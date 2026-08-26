"use client";

import { useEffect, useRef, useState } from "react";
import { sendVerificationCode, verifyCode } from "@/lib/authApi";

export type PhoneVerificationProps = {
  phone: string;
  onVerified: (token: string) => void;
  /** 이미 인증을 완료한 뒤, 상위 폼에서 연락처를 다시 바꿔 인증이 무효화된 경우 */
  onInvalidate: () => void;
};

const RESEND_COOLDOWN_SEC = 60;

/**
 * 휴대폰 본인인증 — 연락처 필드 바로 아래 삽입한다. 그 번호로 인증번호를
 * 보내야 하므로 연락처 다음 순서가 자연스럽고, 폼 초반에 인증을 끝내야
 * 나머지 입력 후 막히는 이탈을 방지할 수 있다.
 *
 * DatePicker.tsx/TimeSelect.tsx처럼 자체 완결형 컴포넌트로 분리한다 —
 * 상위 app/reservation/page.tsx가 인증 로직까지 인라인으로 품으면 비대해진다.
 */
export default function PhoneVerification({ phone, onVerified, onInvalidate }: PhoneVerificationProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);

  const lastVerifiedPhone = useRef<string | null>(null);

  // 인증 완료 후 연락처를 다시 바꾸면 그 인증은 더 이상 유효하지 않다 —
  // 서버도 phone+token을 함께 재검증하므로, 여기서 즉시 무효화해 사용자가
  // 헷갈리지 않게 한다.
  useEffect(() => {
    if (verified && lastVerifiedPhone.current !== null && lastVerifiedPhone.current !== phone) {
      setVerified(false);
      setSent(false);
      setCode("");
      onInvalidate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSend = async () => {
    setError(null);
    if (!phone.trim()) {
      setError("연락처를 먼저 입력해 주세요.");
      return;
    }
    setSending(true);
    const result = await sendVerificationCode(phone.trim());
    setSending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSent(true);
    setCooldown(RESEND_COOLDOWN_SEC);
  };

  const handleVerify = async () => {
    setError(null);
    if (!code.trim()) {
      setError("인증번호를 입력해 주세요.");
      return;
    }
    setVerifying(true);
    const result = await verifyCode(phone.trim(), code.trim());
    setVerifying(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    lastVerifiedPhone.current = phone;
    setVerified(true);
    onVerified(result.verificationToken);
  };

  if (verified) {
    return (
      <div className="flex items-center gap-2 text-sm text-accent font-semibold" style={{ letterSpacing: "-0.01em" }}>
        <span className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-xs">✓</span>
        휴대폰 본인인증이 완료되었습니다.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleSend}
        disabled={sending || cooldown > 0}
        className="px-4 py-2.5 rounded border border-line text-sm font-semibold hover:border-accent hover:text-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={{ letterSpacing: "-0.01em" }}
      >
        {sending
          ? "발송 중..."
          : cooldown > 0
            ? `재발송 (${cooldown}초)`
            : sent
              ? "인증번호 재발송"
              : "인증번호 발송"}
      </button>

      {sent && (
        <div className="flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="인증번호 6자리"
            className="flex-1 px-4 py-3 border border-line rounded text-base outline-none focus:border-accent transition-colors"
            style={{ letterSpacing: "-0.01em" }}
          />
          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="px-5 py-3 rounded bg-accent text-ink-inverse text-sm font-semibold hover:bg-accent-soft transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            style={{ letterSpacing: "-0.01em" }}
          >
            {verifying ? "확인 중..." : "확인"}
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
