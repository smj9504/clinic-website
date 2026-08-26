"use client";

import { useCart } from "@/lib/cart";
import { computePrice, formatKRW } from "@/lib/price";
import { priceText, type ServicePrice } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";

export type PriceTableProps = {
  serviceId: string;
  serviceName: string;
  prices: ServicePrice[];
  locale: Locale;
  t: (key: TranslationKey) => string;
};

/**
 * 가격 옵션 목록 — 옵션마다 체크박스로 장바구니에 담을 수 있다.
 *
 * 표(table) 대신 행 단위 레이아웃을 쓴다 — 좁은 화면에서 표는 가로로 넘치는데,
 * 옵션명과 금액 두 덩어리뿐이라 굳이 열을 맞출 이유가 없다.
 * 옵션이 하나뿐이어도 같은 모양으로 그려진다.
 *
 * 담을 때 이름·가격을 스냅샷으로 고정해 장바구니에 넣는다(lib/cart.tsx 참고) —
 * 원본 시술 데이터가 나중에 바뀌어도 이미 담긴 항목은 변하지 않아야 한다.
 */
export default function PriceTable({ serviceId, serviceName, prices, locale, t }: PriceTableProps) {
  const { addItem, removeItem, isSelected } = useCart();

  if (prices.length === 0) return null;

  return (
    <ul className="divide-y divide-line">
      {prices.map((price) => {
        const { label, note } = priceText(price, locale);
        const { final, rate, hasDiscount } = computePrice(price);
        const checked = isSelected(serviceId, price.id);

        const handleChange = () => {
          if (checked) {
            removeItem(serviceId, price.id);
          } else {
            addItem({
              serviceId,
              priceId: price.id,
              serviceName,
              priceLabel: label,
              originalPrice: price.originalPrice,
              finalPrice: final,
              hasDiscount,
            });
          }
        };

        return (
          <li key={price.id} className="py-4 first:pt-0 last:pb-0">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={checked}
                onChange={handleChange}
                className="mt-1 shrink-0 w-4 h-4 rounded border-line accent-accent"
              />
              <div className="min-w-0 flex-1">
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
              </div>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
