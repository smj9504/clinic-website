"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

const ADVANCE_MS = 2200;

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0VGRTgiLz48L3N2Zz4=";

type SequentialChecklistProps = {
  title: string;
  items: string[];
  /** 항목보다 적어도 무방 — 활성 항목 index를 이미지 개수로 wrap해서 매칭한다 */
  images: { src: string; alt: string }[];
};

/**
 * "이런 분들께 추천합니다" 류의 h2+ul 체크리스트를, 목록이 시간차를 두고
 * 한 줄씩 스스로 강조되고 우측 사진이 함께 전환되는 형태로 승격한다.
 * 이미지가 항목 수(6개)보다 적을 수 있어(herbal-clinic은 실제 콘텐츠에 사진이
 * 2장뿐) 1:1 매칭을 강제하지 않고 활성 항목 index를 이미지 개수로 순환시켜
 * 매칭한다 — "이 문장 = 이 사진"이라는 인과관계를 주장하지 않고, 자동으로
 * 살아있는 느낌만 준다.
 * hover/focus로 특정 줄 위에 머무르면 그 줄에서 고정되고, 벗어나면 자동
 * 진행을 재개한다 — EquipmentCarousel의 "사용자가 손대면 타이머 리셋" 원칙과
 * 같은 이유: 방금 읽던 줄이 답 없이 넘어가면 자동 재생이 방해로 느껴진다.
 */
export default function SequentialChecklist({ title, items, images }: SequentialChecklistProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length < 2 || paused) return;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    timerRef.current = setInterval(() => {
      setActiveIndex((i) => (i + 1) % items.length);
    }, ADVANCE_MS);
  }, [items.length, paused]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restartTimer]);

  if (items.length === 0) return null;

  const activeImage = images.length > 0 ? images[activeIndex % images.length] : null;

  return (
    <div ref={sectionRef} className="reveal-fade-up my-16 md:my-24">
      <h2
        className="font-display mb-8 md:mb-10"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        {title}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-8 md:gap-14 items-center">
        <ul
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          className="space-y-1"
        >
          {items.map((item, i) => {
            const isActive = i === activeIndex;
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  onFocus={() => setActiveIndex(i)}
                  className="w-full text-left flex items-start gap-4 rounded-xl px-4 py-3.5 transition-colors duration-300"
                  style={{ background: isActive ? "var(--color-bg-alt)" : "transparent" }}
                >
                  <span
                    className="shrink-0 rounded-full flex items-center justify-center transition-all duration-300"
                    style={{
                      width: "1.75rem",
                      height: "1.75rem",
                      marginTop: "0.1em",
                      background: isActive ? "var(--color-accent)" : "var(--color-line)",
                    }}
                    aria-hidden="true"
                  >
                    <svg viewBox="0 0 20 20" fill="none" style={{ width: "0.8rem", height: "0.8rem" }}>
                      <path
                        d="M4 10.5l3.5 3.5L16 6"
                        stroke={isActive ? "var(--color-ink-inverse)" : "var(--color-ink-muted)"}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span
                    className="transition-colors duration-300"
                    style={{
                      fontSize: "1.05rem",
                      lineHeight: 1.6,
                      letterSpacing: "-0.01em",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "var(--color-ink)" : "var(--color-ink-muted)",
                    }}
                  >
                    {item}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-bg-alt">
          {images.map((img, i) => (
            <div
              key={i}
              className="absolute inset-0 transition-opacity duration-700 ease-out"
              style={{ opacity: i === activeIndex % images.length ? 1 : 0 }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={80}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </div>
          ))}
          {activeImage === null && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
              {title}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
