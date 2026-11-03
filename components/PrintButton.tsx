"use client";

/** 현재 페이지를 인쇄한다. 인쇄물에는 이 버튼이 나오지 않는다. */
export default function PrintButton({ label = "인쇄하기" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border border-line hover:border-ink transition-colors"
      style={{ letterSpacing: "-0.02em" }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 9V2h12v7" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
      </svg>
      {label}
    </button>
  );
}
