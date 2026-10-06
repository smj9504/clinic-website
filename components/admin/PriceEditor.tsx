"use client";

import { computePrice, formatKRW } from "@/lib/price";
import {
  createPrice,
  rawText,
  withLocalized,
  type DiscountType,
  type ServicePrice,
  type ServicePriceText,
} from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import { Button, TextInput } from "@/components/admin/ui";

const DISCOUNT_LABEL: Record<DiscountType, string> = {
  percent: "% 할인",
  amount: "원 할인",
  final: "최종가 직접 입력",
};

const VALUE_HINT: Record<DiscountType, string> = {
  percent: "예: 40 (40% 할인)",
  amount: "예: 50000 (5만원 할인)",
  final: "예: 290000 (판매가)",
};

function numberValue(raw: string): number {
  const digits = raw.replace(/[^\d]/g, "");
  return digits === "" ? 0 : Number(digits);
}

export type PriceEditorProps = {
  prices: ServicePrice[];
  locale: Locale;
  onChange: (next: ServicePrice[]) => void;
};

/**
 * 가격 옵션 편집.
 * 옵션이 하나뿐이어도, 여러 개여도 같은 모양이다 — 공개 화면도 마찬가지다.
 */
export default function PriceEditor({ prices, locale, onChange }: PriceEditorProps) {
  const update = (id: string, patch: Partial<ServicePrice>) =>
    onChange(prices.map((p) => (p.id === id ? { ...p, ...patch } : p)));

  const updateText = (price: ServicePrice, patch: Partial<ServicePriceText>) =>
    update(price.id, { i18n: withLocalized(price.i18n, locale, patch) });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= prices.length) return;
    const next = [...prices];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {prices.length === 0 && (
        <p className="text-sm text-ink-muted py-4">
          가격 옵션이 없습니다. 옵션을 추가하지 않으면 카드와 상세에 금액이 표시되지 않습니다.
        </p>
      )}

      {prices.map((price, index) => {
        const text = rawText<ServicePriceText>(price.i18n, locale);
        const computed = computePrice(price);

        return (
          <div key={price.id} className="border border-line rounded p-4 bg-bg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-semibold text-ink-muted" style={{ letterSpacing: "0.08em" }}>
                옵션 {index + 1}
              </span>
              <div className="flex gap-1">
                <Button type="button" size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>↑</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === prices.length - 1}>↓</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => onChange(prices.filter((p) => p.id !== price.id))}
                >
                  삭제
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">옵션명</label>
                <TextInput
                  placeholder="예: 1회 체험가 · 3회 패키지"
                  value={text.label ?? ""}
                  onChange={(e) => updateText(price, { label: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5">비고 (선택)</label>
                <TextInput
                  placeholder="예: 부가세 별도 · 1부위 기준"
                  value={text.note ?? ""}
                  onChange={(e) => updateText(price, { note: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5">정가 (원)</label>
                <TextInput
                  inputMode="numeric"
                  placeholder="550000"
                  value={price.originalPrice === 0 ? "" : String(price.originalPrice)}
                  onChange={(e) => update(price.id, { originalPrice: numberValue(e.target.value) })}
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-xs font-semibold mb-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={price.discountEnabled}
                    onChange={(e) => update(price.id, { discountEnabled: e.target.checked })}
                    className="w-4 h-4"
                  />
                  할인 적용
                </label>
                {price.discountEnabled ? (
                  <div className="flex gap-2">
                    <select
                      value={price.discountType}
                      onChange={(e) => update(price.id, { discountType: e.target.value as DiscountType })}
                      className="px-3 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent shrink-0"
                    >
                      {(Object.keys(DISCOUNT_LABEL) as DiscountType[]).map((type) => (
                        <option key={type} value={type}>
                          {DISCOUNT_LABEL[type]}
                        </option>
                      ))}
                    </select>
                    <TextInput
                      inputMode="numeric"
                      placeholder={VALUE_HINT[price.discountType]}
                      value={price.discountValue === 0 ? "" : String(price.discountValue)}
                      onChange={(e) => update(price.id, { discountValue: numberValue(e.target.value) })}
                    />
                  </div>
                ) : (
                  <p className="text-xs text-ink-muted py-2.5">정가만 표시됩니다.</p>
                )}
              </div>
            </div>

            {/* 관리자가 입력하는 즉시 공개 화면과 같은 계산으로 보여준다 */}
            <div className="mt-3 pt-3 border-t border-line flex items-baseline gap-2 flex-wrap">
              <span className="text-xs text-ink-muted shrink-0">표시 결과</span>
              {computed.hasDiscount && (
                <span className="text-sale font-bold" style={{ letterSpacing: "-0.02em" }}>
                  {computed.rate}%
                </span>
              )}
              <span className="font-bold" style={{ fontVariantNumeric: "tabular-nums" }}>
                {formatKRW(computed.final)}
              </span>
              {computed.hasDiscount && (
                <span
                  className="text-xs text-ink-muted line-through"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatKRW(price.originalPrice)}
                </span>
              )}
              {price.discountEnabled && !computed.hasDiscount && price.originalPrice > 0 && (
                <span className="text-xs text-sale">
                  할인가가 정가보다 낮지 않아 정가로 표시됩니다.
                </span>
              )}
            </div>
          </div>
        );
      })}

      <Button type="button" variant="secondary" onClick={() => onChange([...prices, createPrice()])}>
        + 가격 옵션 추가
      </Button>
    </div>
  );
}
