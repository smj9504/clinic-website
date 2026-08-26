"use client";

import { useEffect, useRef, useState } from "react";
import { todayKST } from "@/lib/date";

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export type DatePickerProps = {
  id?: string;
  /** "YYYY-MM-DD" 형식, 아직 선택 안 했으면 "" */
  value: string;
  onChange: (value: string) => void;
  /** 필수 표시 등 상위에서 label과 함께 붙이는 용도. 여기서는 그대로 통과만 시킨다. */
  required?: boolean;
};

/** "YYYY-MM-DD" → { y, m, d } (1-indexed month) */
function parseDate(dateStr: string): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function toDateStr(y: number, m: number, d: number): string {
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

/** 해당 월의 일수 (m: 1-indexed) */
function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 해당 월 1일의 요일 (0=일 ~ 6=토), UTC 기준 순수 달력 연산 */
function firstWeekday(y: number, m: number): number {
  return new Date(Date.UTC(y, m - 1, 1)).getUTCDay();
}

function formatDisplay(dateStr: string): string {
  const parsed = parseDate(dateStr);
  if (!parsed) return "";
  return `${parsed.y}.${pad2(parsed.m)}.${pad2(parsed.d)}`;
}

/**
 * 사이트 테마(warm brown accent)에 맞춘 인라인 캘린더 날짜 선택기.
 * 네이티브 <input type="date">를 대체하지만, value/onChange는 동일하게
 * "YYYY-MM-DD" 문자열을 주고받아 상위(app/reservation/page.tsx)의 상태·제출 로직은
 * 그대로 재사용할 수 있게 한다.
 */
export default function DatePicker({ id, value, onChange, required }: DatePickerProps) {
  const today = todayKST();
  const todayParsed = parseDate(today)!;

  const [open, setOpen] = useState(false);
  const selected = parseDate(value);
  const [viewYear, setViewYear] = useState(selected?.y ?? todayParsed.y);
  const [viewMonth, setViewMonth] = useState(selected?.m ?? todayParsed.m);

  const containerRef = useRef<HTMLDivElement>(null);

  // 팝업이 열릴 때, 선택된 날짜(없으면 오늘)가 보이는 달로 뷰를 맞춘다.
  useEffect(() => {
    if (!open) return;
    const base = selected ?? todayParsed;
    setViewYear(base.y);
    setViewMonth(base.m);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // 바깥 클릭 시 닫기
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

  // Escape로 닫기
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function goPrevMonth() {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function goNextMonth() {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  function selectDay(d: number) {
    const dateStr = toDateStr(viewYear, viewMonth, d);
    if (dateStr < today) return; // 과거 날짜는 선택 불가
    onChange(dateStr);
    setOpen(false);
  }

  const totalDays = daysInMonth(viewYear, viewMonth);
  const leadingBlanks = firstWeekday(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(leadingBlanks).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div className="relative" ref={containerRef}>
      <button
        id={id}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors bg-bg text-left flex items-center justify-between gap-2"
        style={{ letterSpacing: "-0.01em" }}
      >
        <span className={value ? "text-ink" : "text-ink-muted"}>
          {value ? formatDisplay(value) : "날짜 선택"}
        </span>
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="flex-shrink-0 text-ink-muted"
          aria-hidden="true"
        >
          <rect x="3" y="4.5" width="18" height="16" rx="2" />
          <path d="M16 2.5v4M8 2.5v4M3 9.5h18" />
        </svg>
      </button>

      {/* required가 걸려있는 경우, 브라우저 네이티브 검증 메시지를 위한 hidden input은
          만들지 않는다 — 상위 폼이 handleSubmit에서 desiredDate 빈 값 체크를 직접 하므로
          별도 검증 트리거가 필요 없다. */}
      {required && !value && <span className="sr-only">필수 항목</span>}

      {open && (
        <div
          role="dialog"
          aria-label="날짜 선택"
          className="absolute z-20 mt-2 left-0 w-[300px] max-w-[calc(100vw-2rem)] bg-bg border border-line rounded-lg shadow-lg p-4"
          style={{ animation: "scaleIn 200ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* 월 이동 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={goPrevMonth}
              aria-label="이전 달"
              className="w-8 h-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-bg-alt transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <span className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>
              {viewYear}년 {viewMonth}월
            </span>
            <button
              type="button"
              onClick={goNextMonth}
              aria-label="다음 달"
              className="w-8 h-8 flex items-center justify-center rounded-full text-ink-soft hover:bg-bg-alt transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="h-8 flex items-center justify-center text-xs font-medium text-ink-muted"
              >
                {label}
              </div>
            ))}
          </div>

          {/* 날짜 셀 */}
          <div className="grid grid-cols-7 gap-y-1">
            {cells.map((d, i) => {
              if (d === null) return <div key={`blank-${i}`} className="h-9" />;

              const dateStr = toDateStr(viewYear, viewMonth, d);
              const isPast = dateStr < today;
              const isToday = dateStr === today;
              const isSelected = dateStr === value;

              return (
                <div key={dateStr} className="h-9 flex items-center justify-center">
                  <button
                    type="button"
                    disabled={isPast}
                    onClick={() => selectDay(d)}
                    aria-current={isToday ? "date" : undefined}
                    aria-selected={isSelected}
                    className="w-9 h-9 flex items-center justify-center rounded-full text-sm transition-colors relative disabled:cursor-not-allowed"
                    style={{
                      color: isPast
                        ? "var(--color-ink-muted)"
                        : isSelected
                          ? "var(--color-ink-inverse)"
                          : "var(--color-ink)",
                      background: isSelected ? "var(--color-accent)" : "transparent",
                      opacity: isPast ? 0.4 : 1,
                      fontWeight: isSelected || isToday ? 700 : 400,
                    }}
                    onMouseEnter={(e) => {
                      if (!isPast && !isSelected) {
                        e.currentTarget.style.background = "var(--color-bg-alt)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isPast && !isSelected) {
                        e.currentTarget.style.background = "transparent";
                      }
                    }}
                  >
                    {d}
                    {isToday && !isSelected && (
                      <span
                        className="absolute bottom-0.5 w-1 h-1 rounded-full"
                        style={{ background: "var(--color-accent)" }}
                        aria-hidden="true"
                      />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
