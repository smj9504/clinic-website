/**
 * 가격 · 할인 계산
 *
 * 카드, 상세 페이지, 관리자 미리보기가 모두 이 함수를 쓴다.
 * 표시 형식을 직접 구현하지 말고 여기를 거칠 것 — 세 곳의 숫자가 어긋나면
 * 어느 쪽이 맞는지 알 수 없다.
 */

import type { ServicePrice } from "./services";

export type PriceResult = {
  /** 실제 판매가 */
  final: number;
  /** 할인율(%) — 내림한 값. 실제 할인율보다 크게 표기하지 않는다 */
  rate: number;
  /** false면 정가만 표시하고 할인율·취소선은 그리지 않는다 */
  hasDiscount: boolean;
};

/**
 * 10원 단위 내림 — 퍼센트 할인에서 1원 단위 금액이 나오지 않도록.
 *
 * 올림이 아니라 내림인 이유: 내림하면 실제 할인율이 입력한 값 이상이 되므로,
 * 아래에서 할인율을 다시 내림해 구해도 관리자가 입력한 퍼센트와 항상 일치한다.
 * (반올림하면 "50% 입력 → 49% 표시"가 나올 수 있다.)
 */
function floor10(n: number): number {
  return Math.floor(n / 10) * 10;
}

function toInt(n: unknown): number {
  const v = Math.round(Number(n));
  return Number.isFinite(v) ? v : 0;
}

export function computePrice(price: ServicePrice): PriceResult {
  const original = Math.max(0, toInt(price.originalPrice));

  if (!price.discountEnabled) {
    return { final: original, rate: 0, hasDiscount: false };
  }

  const value = toInt(price.discountValue);
  let final: number;
  switch (price.discountType) {
    case "percent":
      final = floor10((original * (100 - value)) / 100);
      break;
    case "amount":
      final = original - value;
      break;
    case "final":
      final = value;
      break;
    default:
      final = original;
  }

  final = Math.max(0, final);

  // 할인가가 정가 이상이면 할인이 아니다 (입력 실수 방어)
  if (final >= original) {
    return { final: original, rate: 0, hasDiscount: false };
  }

  // 내림. 참고 사이트들도 내림으로 표기하며(실측 8건 전부 일치),
  // 실제 할인율보다 크게 광고하지 않는 쪽이 안전하다.
  const rate = original > 0 ? Math.floor((1 - final / original) * 100) : 0;
  return { final, rate, hasDiscount: true };
}

/**
 * 690000 → "690,000원"
 *
 * toLocaleString은 실행 환경의 ICU에 따라 결과가 달라질 수 있어
 * 서버·클라이언트 렌더 결과가 어긋날 수 있다. 직접 찍는다.
 */
export function formatKRW(n: number): string {
  return `${formatNumber(n)}원`;
}

export function formatNumber(n: number): string {
  const v = toInt(n);
  const sign = v < 0 ? "-" : "";
  return sign + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

/** 카드에 노출할 대표 옵션 — 첫 번째 옵션 */
export function primaryPrice(prices: ServicePrice[]): ServicePrice | undefined {
  return prices[0];
}
