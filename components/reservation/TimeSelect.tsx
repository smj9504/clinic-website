"use client";

import { useEffect, useRef, useState } from "react";
import { isPastClinicHoursToday } from "@/lib/date";

const OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "상관없음" },
  { value: "오전", label: "오전" },
  { value: "오후", label: "오후" },
];

export type TimeSelectProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  /** 시간대 선택을 판단할 기준 날짜("YYYY-MM-DD"). 오늘 날짜이고 진료 종료 시각을 지났으면 오전·오후를 모두 막는다. */
  desiredDate?: string;
  /** 오전/오후 활성화 여부를 판단할 진료 시간. 없으면 항상 전체 옵션을 보여준다(제한 없음). */
  clinicHours?: { weekday: string; saturday: string };
};

/**
 * 네이티브 <select>를 대체하는 커스텀 리스트박스.
 * value/onChange 계약은 기존과 동일("" | "오전" | "오후")해서 상위 상태·제출
 * 로직은 그대로 둔다 — 시각적 UI만 사이트 테마(warm brown accent)에 맞춘다.
 *
 * 오늘 날짜를 골랐는데 이미 그날 진료가 끝났다면(예: 저녁 9시에 신청) "오전"은
 * 물론 "오후"도 더는 상담 전화를 받을 수 있는 시간대가 아니므로 둘 다 비활성화하고
 * "상관없음"만 남긴다 — 이미 지난 시간대를 골라 문자에 그대로 찍히는 걸 막는다.
 */
export default function TimeSelect({ id, value, onChange, desiredDate, clinicHours }: TimeSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pastToday = Boolean(desiredDate && clinicHours && isPastClinicHoursToday(desiredDate, clinicHours));

  // 진료 시간이 지나 오전·오후가 막힌 상태에서, 이미 그중 하나가 선택되어 있었다면
  // "상관없음"으로 되돌린다 — 예를 들어 날짜를 오늘로 바꾸는 순간 무효해진 선택을 그대로 두지 않는다.
  useEffect(() => {
    if (pastToday && value !== "") onChange("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pastToday]);

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
            // "상관없음"(value === "")은 항상 선택 가능 — 오전·오후만 진료 시간이 지나면 막힌다.
            const isDisabled = pastToday && option.value !== "";
            return (
              <li key={option.value} role="option" aria-selected={isSelected} aria-disabled={isDisabled}>
                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-sm transition-colors disabled:cursor-not-allowed"
                  style={{
                    letterSpacing: "-0.01em",
                    color: isDisabled ? "var(--color-ink-muted)" : isSelected ? "var(--color-accent)" : "var(--color-ink)",
                    fontWeight: isSelected ? 700 : 400,
                    background: isSelected ? "var(--color-bg-alt)" : "transparent",
                    opacity: isDisabled ? 0.5 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isDisabled) e.currentTarget.style.background = "var(--color-bg-alt)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isDisabled) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {pastToday && (
        <p className="text-xs text-ink-muted mt-1.5" style={{ letterSpacing: "-0.01em" }}>
          오늘은 진료 시간이 종료되어 오전·오후 선택이 어려워요. 상담 전화는 진료 시간 중에만 가능합니다.
        </p>
      )}
    </div>
  );
}
