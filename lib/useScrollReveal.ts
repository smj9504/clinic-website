"use client";

import { useCallback, useEffect, useRef } from "react";

type RevealOptions = {
  threshold?: number;
  rootMargin?: string;
  once?: boolean;
};

/**
 * 콜백 ref를 사용한다: 이벤트/공지 섹션처럼 DB 로드 전에는 `return null`로
 * 아무것도 렌더링하지 않다가 데이터가 도착한 뒤에야 실제 DOM이 붙는 경우,
 * 기존의 useRef + useEffect(mount 시 1회) 방식은 마운트 시점에 ref.current가
 * null이라 옵저버가 아예 생성되지 않아 opacity:0(.reveal-fade-up)에서
 * 영원히 멈춰 내용이 안 보이는(그러나 클릭은 되는) 버그가 있었다.
 * 콜백 ref는 DOM 노드가 null → 엘리먼트로 바뀌는 시점마다 다시 호출되므로
 * 지연 마운트에도 항상 옵저버가 붙는다.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = "0px 0px -60px 0px", once = true } = options;
  const cleanupRef = useRef<() => void>(() => {});

  const setRef = useCallback(
    (el: T | null) => {
      cleanupRef.current();
      cleanupRef.current = () => {};
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            el.classList.add("revealed");
            if (once) observer.unobserve(el);
          } else if (!once) {
            el.classList.remove("revealed");
          }
        },
        { threshold, rootMargin }
      );
      observer.observe(el);
      cleanupRef.current = () => observer.disconnect();
    },
    [threshold, rootMargin, once]
  );

  useEffect(() => () => cleanupRef.current(), []);

  return setRef;
}

// For staggered children reveals
export function useScrollRevealGroup<T extends HTMLElement = HTMLDivElement>(
  options: RevealOptions = {}
) {
  const { threshold = 0.1, rootMargin = "0px 0px -40px 0px", once = true } = options;
  const cleanupRef = useRef<() => void>(() => {});

  const setRef = useCallback(
    (container: T | null) => {
      cleanupRef.current();
      cleanupRef.current = () => {};
      if (!container) return;

      let revealedOnce = false;

      const revealChildren = () => {
        const children = container.querySelectorAll<HTMLElement>("[data-reveal-item]");
        children.forEach((child, i) => {
          if (child.classList.contains("revealed")) return;
          child.style.transitionDelay = `${i * 100}ms`;
          child.classList.add("revealed");
        });
      };

      const io = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            revealedOnce = true;
            revealChildren();
            if (once) io.unobserve(container);
          } else if (!once) {
            revealedOnce = false;
            container.querySelectorAll<HTMLElement>("[data-reveal-item]").forEach((child) => {
              child.classList.remove("revealed");
              child.style.transitionDelay = "0ms";
            });
          }
        },
        { threshold, rootMargin }
      );
      io.observe(container);

      // 이미 화면에 노출된 뒤 admin에서 항목을 추가하는 등, 나중에 새 자식이 붙는 경우도 즉시 반영
      const mo = new MutationObserver(() => {
        if (revealedOnce) revealChildren();
      });
      mo.observe(container, { childList: true });

      cleanupRef.current = () => {
        io.disconnect();
        mo.disconnect();
      };
    },
    [threshold, rootMargin, once]
  );

  useEffect(() => () => cleanupRef.current(), []);

  return setRef;
}
