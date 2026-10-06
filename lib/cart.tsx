"use client";

/**
 * 장바구니 — 시술 가격표에서 체크박스로 선택한 항목을 담아 예약폼까지 유지한다.
 *
 * lib/i18n.tsx(LocaleProvider)와 동일한 패턴: Context + localStorage 영속화.
 * useSiteData.ts의 커스텀 이벤트 방식은 쓰지 않는다 — 그 패턴은 Provider 없이
 * 여러 독립된 훅 인스턴스가 각자 localStorage를 읽는 구조에서 "한 곳의 저장을
 * 다른 곳에 알려야" 해서 필요했던 것이다. 장바구니는 서버 저장이 없는 순수
 * 클라이언트 상태이고 단일 Context 트리 안에서만 공유되면 충분하므로, Context
 * 자체의 리렌더 전파로 충분하다.
 *
 * 담을 때 시술명·가격을 스냅샷으로 고정 저장한다 — 시술 원본(lib/services.ts)이
 * 나중에 바뀌어도 이미 장바구니에 담긴 내용은 변하지 않아야 하기 때문이다.
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";

const CART_STORAGE_KEY = "clinic_cart";

export type CartItem = {
  serviceId: string;
  priceId: string;
  serviceName: string;
  priceLabel: string;
  originalPrice: number;
  finalPrice: number;
  hasDiscount: boolean;
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (serviceId: string, priceId: string) => void;
  isSelected: (serviceId: string, priceId: string) => boolean;
  clear: () => void;
  totalFinal: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(CART_STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // 손상된 값이면 빈 장바구니로 시작한다
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    // hydrate 완료 전에 저장하면 아직 읽지 못한 상태(빈 배열)로 기존 값을 덮어쓴다
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      // 저장 공간 부족 등은 조용히 무시한다 — 장바구니는 부가 기능이다
    }
  }, [items, hydrated]);

  const addItem = useCallback((item: CartItem) => {
    setItems((prev) => {
      const exists = prev.some((i) => i.serviceId === item.serviceId && i.priceId === item.priceId);
      return exists ? prev : [...prev, item];
    });
  }, []);

  const removeItem = useCallback((serviceId: string, priceId: string) => {
    setItems((prev) => prev.filter((i) => !(i.serviceId === serviceId && i.priceId === priceId)));
  }, []);

  const isSelected = useCallback(
    (serviceId: string, priceId: string) =>
      items.some((i) => i.serviceId === serviceId && i.priceId === priceId),
    [items]
  );

  const clear = useCallback(() => setItems([]), []);

  const totalFinal = useMemo(() => items.reduce((sum, i) => sum + i.finalPrice, 0), [items]);

  const value = useMemo<CartContextType>(
    () => ({ items, addItem, removeItem, isSelected, clear, totalFinal, count: items.length }),
    [items, addItem, removeItem, isSelected, clear, totalFinal]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart는 CartProvider 내부에서만 사용할 수 있습니다.");
  return ctx;
}
