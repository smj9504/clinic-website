"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { formatKRW } from "@/lib/price";
import type { TranslationKey } from "@/lib/translations";

export type CartSummaryBarProps = {
  t: (key: TranslationKey) => string;
};

/**
 * 장바구니 합계 + "선택한 시술 예약하기" 고정 하단 바.
 *
 * 항목이 없으면 렌더링하지 않는다 — 스크린샷처럼 늘 떠 있는 바가 아니라,
 * 하나라도 선택했을 때만 나타나 "선택 중"이라는 상태를 알려준다.
 *
 * FloatingActions.tsx(fixed bottom-5 right-5 z-40, 예약·상담·챗봇 FAB 스택)와
 * 같은 화면에 공존해야 하는데, FloatingActions가 이 바의 존재(useCart의
 * count > 0)를 직접 구독해 자기 bottom 오프셋을 바 높이만큼 올려 피하므로
 * (FloatingActions.tsx의 pushedUp 참고) 이쪽에서 FAB 폭만큼 별도 여백을 둘
 * 필요가 없다 — container-default의 기본 좌우 패딩만 쓴다.
 * 바의 흰 배경(루트 div)은 화면 가장자리까지 꽉 차야 하므로, 좌우 패딩은
 * 배경이 아니라 내부 콘텐츠 wrapper에만 적용한다.
 *
 * 금액 영역을 누르면 지금까지 선택한 시술 목록이 이 바로 바로 위에 뜬다 —
 * 예약 페이지까지 가지 않아도 무엇을 담았는지 바로 확인·삭제할 수 있게 한다.
 * 바와 같은 전체 폭 카드로 띄워, 목록을 펼치고 접는 동작이 바로 아래
 * 금액 바와 한 덩어리처럼 보이게 한다(패널이 화면 우측 FAB 쪽으로 따로
 * 떨어져 있으면 두 요소가 별개로 느껴진다).
 */
export default function CartSummaryBar({ t }: CartSummaryBarProps) {
  const { items, count, totalFinal, removeItem } = useCart();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  // 목록이 비어 바가 사라지면 펼친 상태도 함께 접는다
  useEffect(() => {
    if (count === 0) setOpen(false);
  }, [count]);

  if (count === 0) return null;

  return (
    <div ref={rootRef} className="fixed bottom-0 left-0 right-0 z-40">
      {open && (
        <div className="container-default">
          <div
            className="bg-surface border border-line-strong border-b-0 rounded-t-lg overflow-hidden max-h-[45vh] flex flex-col"
            style={{ boxShadow: "0 -8px 32px rgba(26, 23, 21, 0.12)" }}
          >
            <div className="px-5 py-3 border-b border-line flex items-center justify-between gap-3 shrink-0">
              <span className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>
                {t("services.reserveSelected").replace(/예약하기$/, "").trim() || "선택한 시술"}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-ink-muted hover:bg-bg-alt hover:text-ink transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <ul className="divide-y divide-line overflow-y-auto">
              {items.map((item) => (
                <li
                  key={`${item.serviceId}_${item.priceId}`}
                  className="px-5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate" style={{ letterSpacing: "-0.01em" }}>
                      {item.serviceName}
                      {item.priceLabel && (
                        <span className="text-ink-muted font-normal"> · {item.priceLabel}</span>
                      )}
                    </p>
                    <p
                      className="text-sm font-bold mt-0.5"
                      style={{ fontVariantNumeric: "tabular-nums", letterSpacing: "-0.02em" }}
                    >
                      {formatKRW(item.finalPrice)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.serviceId, item.priceId)}
                    aria-label={`${item.serviceName} 삭제`}
                    className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-ink-muted hover:bg-bg-alt hover:text-ink transition-colors"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="bg-surface border-t border-line-strong" style={{ boxShadow: "0 -8px 32px rgba(26, 23, 21, 0.12)" }}>
        <div className="container-default py-3.5 flex items-center justify-between gap-4 flex-wrap">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="min-w-0 text-left rounded transition-opacity hover:opacity-75"
          >
            <p className="text-xs text-ink-muted mb-0.5 flex items-center gap-1" style={{ letterSpacing: "-0.01em" }}>
              {t("services.estimatedAmount")} · {count}
              {t("services.selectedCount")}
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${open ? "rotate-180" : ""}`}
                aria-hidden="true"
              >
                <path d="m18 15-6-6-6 6" />
              </svg>
            </p>
            <p
              className="font-bold"
              style={{ fontSize: "1.25rem", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}
            >
              {formatKRW(totalFinal)}
            </p>
          </button>
          <Link
            href="/reservation"
            className="shrink-0 px-6 py-3 rounded-full text-sm font-semibold bg-accent text-ink-inverse hover:bg-accent-soft transition-all"
            style={{ letterSpacing: "-0.02em" }}
          >
            {t("services.reserveSelected")}
          </Link>
        </div>
      </div>
    </div>
  );
}
