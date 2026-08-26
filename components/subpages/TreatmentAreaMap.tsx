"use client";

import Image from "next/image";
import { useState } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

export type TreatmentArea = {
  id: string;
  /** 핫스팟 라벨 위치 — 이미지 기준 백분율 좌표 (0~100) */
  x: number;
  y: number;
  label: string;
  description: string;
};

type TreatmentAreaMapProps = {
  title: string;
  highlight: string;
  imageSrc: string | null;
  imageAlt: string;
  areas: TreatmentArea[];
};

/**
 * 얼굴 사진 위에 부위별 핫스팟을 올려 hover(데스크톱)·click(모든 기기)으로
 * 부위 설명을 전환하는 인터랙티브 맵. 라벨이 늘 사진 위(hover 확대 카드)에
 * 뜨는 방식 대신, 아래 고정된 설명 패널 하나에 선택된 부위 내용을 채우는
 * 방식을 택했다 — 라벨마다 카드 크기가 다르면 hover 때 다른 핫스팟과
 * 겹치기 쉽고, 모바일에는 hover 자체가 없어 tap 후 사진 밖 텍스트를 봐야
 * 하는 지금 구조가 두 기기 모두에서 하나의 상호작용으로 통일된다.
 */
export default function TreatmentAreaMap({
  title,
  highlight,
  imageSrc,
  imageAlt,
  areas,
}: TreatmentAreaMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const active = areas.find((a) => a.id === activeId) ?? null;

  return (
    <div ref={sectionRef} className="reveal-fade-up my-16 md:my-24">
      <h2
        className="font-display text-center mb-8 md:mb-10"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        {title} <span style={{ color: "var(--color-accent)" }}>{highlight}</span>
      </h2>

      <div className="relative aspect-[3/2] rounded-2xl overflow-hidden bg-bg-alt border border-line">
        {imageSrc ? (
          <Image
            src={imageSrc}
            alt={imageAlt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            quality={80}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
            {imageAlt}
          </div>
        )}

        {areas.map((area) => {
          const isActive = area.id === activeId;
          // 라벨이 이미지 가장자리 쪽으로 자라면 overflow-hidden 컨테이너에 잘릴 수 있어
          // 항상 이미지 중심 방향으로 자라도록 좌/우 절반에 따라 라벨 위치를 뒤집는다.
          // 아이콘은 항상 (x%, y%)에 정확히 고정하고, 라벨만 아이콘 기준 좌/우로 붙인다.
          const growsLeft = area.x > 50;
          return (
            <button
              key={area.id}
              type="button"
              onMouseEnter={() => setActiveId(area.id)}
              onFocus={() => setActiveId(area.id)}
              onClick={() => setActiveId(isActive ? null : area.id)}
              className="absolute flex items-center -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${area.x}%`, top: `${area.y}%` }}
              aria-pressed={isActive}
              aria-label={area.label}
            >
              <span
                className={"shrink-0 rounded-full flex items-center justify-center transition-colors duration-200" + (growsLeft ? " order-2" : " order-1")}
                style={{
                  width: "1.75rem",
                  height: "1.75rem",
                  background: isActive ? "var(--color-accent)" : "rgba(26, 23, 21, 0.55)",
                  boxShadow: "0 0 0 3px rgba(251, 250, 247, 0.7)",
                }}
              >
                <svg viewBox="0 0 20 20" fill="none" style={{ width: "0.7rem", height: "0.7rem" }}>
                  <path
                    d="M10 4v12M4 10h12"
                    stroke="var(--color-ink-inverse)"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              <span
                className={
                  "rounded-full px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200" +
                  (growsLeft ? " order-1 mr-2" : " order-2 ml-2") +
                  // 모바일은 핫스팟 6개가 좁은 얼굴 사진 위에 조밀하게 몰려 있어, 라벨을
                  // 항상 노출하면 서로 겹친다. 활성 상태일 때만 보이게 하고 나머지는
                  // 아이콘 점만 남긴다 — sm 이상(더 넓은 이미지)에서는 기존처럼 항상 노출.
                  (isActive ? "" : " hidden sm:inline-block")
                }
                style={{
                  background: isActive ? "var(--color-accent)" : "var(--color-surface)",
                  color: isActive ? "var(--color-ink-inverse)" : "var(--color-ink)",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 2px 8px rgba(26, 23, 21, 0.12)",
                }}
              >
                {area.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        className="mt-6 rounded-2xl bg-bg-alt px-6 py-8 md:px-10 md:py-10 text-center transition-opacity duration-200"
        style={{ minHeight: "8rem" }}
      >
        {active ? (
          <>
            <p
              className="font-display mb-3"
              style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--color-accent)" }}
            >
              {active.label}
            </p>
            <p
              className="text-ink-soft max-w-xl mx-auto"
              style={{ fontSize: "1rem", lineHeight: 1.8, letterSpacing: "-0.01em" }}
            >
              {active.description}
            </p>
          </>
        ) : (
          <p className="text-ink-muted" style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}>
            부위를 선택하면 자세한 설명을 확인하실 수 있습니다.
          </p>
        )}
      </div>
    </div>
  );
}
