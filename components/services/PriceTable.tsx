"use client";

import { computePrice, formatKRW } from "@/lib/price";
import { priceText, type ServicePrice } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

export type PriceTableProps = {
  prices: ServicePrice[];
  locale: Locale;
  t: (key: TranslationKey) => string;
};

/**
 * 가격 옵션 목록.
 *
 * 표(table) 대신 행 단위 레이아웃을 쓴다 — 좁은 화면에서 표는 가로로 넘치는데,
 * 옵션명과 금액 두 덩어리뿐이라 굳이 열을 맞출 이유가 없다.
 * 옵션이 하나뿐이어도 같은 모양으로 그려진다.
 */
export default function PriceTable({ prices, locale, t }: PriceTableProps) {
  if (prices.length === 0) return null;

  return (
    <ul className="divide-y divide-line">
      {prices.map((price) => {
        const { label, note } = priceText(price, locale);
        const { final, rate, hasDiscount } = computePrice(price);

        return (
          <li key={price.id} className="py-4 first:pt-0 last:pb-0">
            <div className="text-sm text-ink-soft" style={{ letterSpacing: "-0.01em" }}>
              {label || t("services.option")}
            </div>

            <div className="flex items-baseline gap-2 flex-wrap mt-1.5">
              {hasDiscount && (
                <span
                  className="text-sale font-bold"
                  style={{ fontSize: "1.25rem", letterSpacing: "-0.03em" }}
                >
                  {rate}
                  <span className="text-[0.7em]">%</span>
                </span>
              )}
              <span
                className="font-bold"
                style={{
                  fontSize: "1.25rem",
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatKRW(final)}
              </span>
              {hasDiscount && (
                <span
                  className="text-sm text-ink-muted line-through"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatKRW(price.originalPrice)}
                </span>
              )}
            </div>

            {note && (
              <div className="text-xs text-ink-muted mt-1.5" style={{ letterSpacing: "-0.01em" }}>
                {note}
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
