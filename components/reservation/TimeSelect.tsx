"use client";

import { useEffect, useRef, useState } from "react";

const OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "상관없음" },
  { value: "오전", label: "오전" },
  { value: "오후", label: "오후" },
];

export type TimeSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
};

/**
 * 네이티브 <select>를 대체하는 커스텀 리스트박스.
 * value/onChange 계약은 기존과 동일("" | "오전" | "오후")해서 상위 상태·제출
 * 로직은 그대로 둔다 — 시각적 UI만 사이트 테마(warm brown accent)에 맞춘다.
 */
export default function TimeSelect({ id, value, onChange }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointerDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors bg-bg text-left flex items-center justify-between gap-2"
        style={{ letterSpacing: "-0.01em" }}
      >
        <span>{current.label}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-ink-muted transition-transform duration-200"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label="희망 시간대"
          className="absolute z-20 mt-2 left-0 right-0 bg-bg border border-line rounded-lg shadow-lg py-1.5 overflow-hidden"
          style={{ animation: "scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {OPTIONS.map((option) => {
            const isSelected = option.value === value;
            return (
              <li key={option.value} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors"
                  style={{
                    letterSpacing: "-0.01em",
                    color: isSelected ? "var(--color-accent)" : "var(--color-ink)",
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? "var(--color-bg-alt)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "var(--color-bg-alt)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
