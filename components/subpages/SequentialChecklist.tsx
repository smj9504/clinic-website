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
  /**
   * 항목보다 적어도 무방 — 활성 항목 index를 이미지 개수로 wrap해서 매칭한다.
   * itemImages가 주어지면(admin 구조화 편집 경로) 그 항목의 사진을 우선
   * 쓰고, 없는 항목만 이 공용 목록을 순환 폴백으로 쓴다.
   */
  images: { src: string; alt: string }[];
  /** 항목별 개별 사진(admin에서 지정) — 인덱스가 items와 1:1 대응, 비어있는 항목은 null */
  itemImages?: (string | null)[];
  /** 체크리스트 아래에 표시되는 자유 서식 보충 설명 (richtext HTML, 선택 사항) */
  note?: string;
};

/**
 * "이런 분들께 추천합니다" 류의 체크리스트를, 목록이 시간차를 두고
 * 한 줄씩 스스로 강조되고 우측 사진이 함께 전환되는 형태로 승격한다.
 *
 * 두 가지 소스에서 렌더링된다: (1) admin의 구조화 필드
 * (subPages.sequentialChecklist) — 항목마다 개별 사진 지정 가능(itemImages),
 * (2) 리치에디터 본문의 h2+ul 자동 감지(slug 화이트리스트) — 폴백 경로로,
 * 이 경우 페이지 대표 이미지 + 본문 첫 이미지 2장을 images로 순환시킨다.
 * itemImages 없이 사진이 항목 수보다 적을 수 있어(폴백 경로는 사진이 2장뿐)
 * 1:1 매칭을 강제하지 않고 활성 항목 index를 이미지 개수로 순환시켜
 * 매칭한다 — "이 문장 = 이 사진"이라는 인과관계를 주장하지 않고, 자동으로
 * 살아있는 느낌만 준다.
 * hover/focus로 특정 줄 위에 머무르면 그 줄에서 고정되고, 벗어나면 자동
 * 진행을 재개한다 — EquipmentCarousel의 "사용자가 손대면 타이머 리셋" 원칙과
 * 같은 이유: 방금 읽던 줄이 답 없이 넘어가면 자동 재생이 방해로 느껴진다.
 */
export default function SequentialChecklist({ title, items, images, itemImages, note }: SequentialChecklistProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const noteRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
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

  // 항목별 지정 사진(itemImages)이 있으면 그 항목 1:1로, 없는 항목은
  // 공용 images 목록을 순환시켜 채운다. 최종적으로 items와 동일한 길이의
  // 배열 하나로 정규화해 아래 렌더링을 단순하게 유지한다.
  const resolvedImages: { src: string; alt: string }[] = items.map((item, i) => {
    const own = itemImages?.[i];
    if (own) return { src: own, alt: item };
    if (images.length > 0) return images[i % images.length];
    return { src: "", alt: item };
  });
  const hasAnyImage = resolvedImages.some((img) => img.src);
  const activeImage = hasAnyImage ? resolvedImages[activeIndex] : null;

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
          {hasAnyImage &&
            resolvedImages.map(
              (img, i) =>
                img.src && (
                  <div
                    key={i}
                    className="absolute inset-0 transition-opacity duration-700 ease-out"
                    style={{ opacity: i === activeIndex ? 1 : 0 }}
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
                )
            )}
          {!activeImage?.src && (
            <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
              {title}
            </div>
          )}
        </div>
      </div>

      {note && (
        <div
          ref={noteRef}
          className="reveal-fade-up prose prose-neutral max-w-none text-ink-soft mt-10 pt-8"
          style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em", borderTop: "1px solid var(--color-line)" }}
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}
    </div>
  );
}
