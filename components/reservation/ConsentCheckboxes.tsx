"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PRIVACY_CONSENT, SENSITIVE_CONSENT, type ConsentNotice } from "@/lib/privacy";

type Props = {
  privacyAgreed: boolean;
  sensitiveAgreed: boolean;
  onPrivacyChange: (agreed: boolean) => void;
  onSensitiveChange: (agreed: boolean) => void;
};

/**
 * 상담 신청 동의 체크박스 2개.
 * 민감정보(건강정보)는 「개인정보 보호법」 제23조에 따라 다른 동의와 따로 받아야 해서 분리했다.
 * "보기"를 누르면 고지 내용(항목·목적·보유기간·거부권)이 대화상자로 열린다.
 */
export default function ConsentCheckboxes({
  privacyAgreed,
  sensitiveAgreed,
  onPrivacyChange,
  onSensitiveChange,
}: Props) {
  const [open, setOpen] = useState<ConsentNotice | null>(null);

  return (
    <div className="mb-8 border border-line rounded-lg divide-y divide-line">
      <ConsentRow
        notice={PRIVACY_CONSENT}
        checked={privacyAgreed}
        onChange={onPrivacyChange}
        onOpen={() => setOpen(PRIVACY_CONSENT)}
      />
      <ConsentRow
        notice={SENSITIVE_CONSENT}
        checked={sensitiveAgreed}
        onChange={onSensitiveChange}
        onOpen={() => setOpen(SENSITIVE_CONSENT)}
        hint="‘증상 · 요청사항’을 적으시는 경우 동의가 필요합니다."
      />
      {open && (
        <ConsentDialog
          notice={open}
          onClose={() => setOpen(null)}
          onAgree={() => {
            (open.id === "privacy" ? onPrivacyChange : onSensitiveChange)(true);
            setOpen(null);
          }}
        />
      )}
    </div>
  );
}

function ConsentRow({
  notice,
  checked,
  onChange,
  onOpen,
  hint,
}: {
  notice: ConsentNotice;
  checked: boolean;
  onChange: (agreed: boolean) => void;
  onOpen: () => void;
  hint?: string;
}) {
  const inputId = `consent-${notice.id}`;
  return (
    <div className="px-4 py-3.5 flex items-start gap-3">
      <input
        id={inputId}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 w-5 h-5 shrink-0 accent-accent cursor-pointer"
      />
      <div className="flex-1 min-w-0">
        <label htmlFor={inputId} className="text-sm cursor-pointer" style={{ letterSpacing: "-0.01em" }}>
          <span className={notice.required ? "text-accent font-semibold" : "text-ink-muted font-semibold"}>
            [{notice.required ? "필수" : "선택"}]
          </span>{" "}
          {notice.title}
        </label>
        {hint && <p className="text-xs text-ink-muted mt-1">{hint}</p>}
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="shrink-0 text-xs text-ink-muted underline underline-offset-2 hover:text-ink py-0.5"
      >
        보기
      </button>
    </div>
  );
}

function ConsentDialog({
  notice,
  onClose,
  onAgree,
}: {
  notice: ConsentNotice;
  onClose: () => void;
  onAgree: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const titleId = `consent-dialog-${notice.id}`;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="bg-bg w-full sm:max-w-lg max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl p-6 break-keep"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-5">
          <h2 id={titleId} className="text-lg font-semibold" style={{ letterSpacing: "-0.03em" }}>
            {notice.title}{" "}
            <span className="text-sm font-normal text-ink-muted">({notice.required ? "필수" : "선택"})</span>
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="shrink-0 w-8 h-8 -mr-1 flex items-center justify-center rounded-full text-ink-muted hover:bg-bg-alt hover:text-ink"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <dl className="border border-line rounded-lg divide-y divide-line text-sm">
          {notice.rows.map((row) => (
            <div key={row.label} className="grid grid-cols-[6.5rem_1fr] gap-3 px-4 py-3">
              <dt className="font-semibold text-ink-soft">{row.label}</dt>
              <dd style={{ lineHeight: 1.7 }}>{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="text-sm text-ink-soft mt-4" style={{ lineHeight: 1.7 }}>
          {notice.refusal}
        </p>
        <p className="text-xs text-ink-muted mt-3" style={{ lineHeight: 1.7 }}>
          자세한 내용은{" "}
          <Link href="/privacy" target="_blank" className="underline underline-offset-2 hover:text-ink">
            개인정보 처리방침
          </Link>
          에서 확인하실 수 있습니다.
        </p>

        <button
          type="button"
          onClick={onAgree}
          className="w-full mt-6 py-3.5 rounded-full text-sm font-semibold bg-accent text-ink-inverse hover:bg-accent-soft transition-all"
          style={{ letterSpacing: "-0.02em" }}
        >
          동의합니다
        </button>
      </div>
    </div>
  );
}
