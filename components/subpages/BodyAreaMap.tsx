"use client";

import Image from "next/image";
import { useState } from "react";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

export type BodyArea = {
  id: string;
  /** 핫스팟 위치 — 이미지 기준 백분율 좌표 (0~100) */
  x: number;
  y: number;
  label: string;
  description: string;
};

type BodyAreaMapProps = {
  title: string;
  highlight: string;
  imageSrc: string | null;
  imageAlt: string;
  areas: BodyArea[];
  /** 부위로 표현되지 않는 나머지 고민(예: 부상 회복, 수술 후 재활)을 맵 아래 보조 문구로 나열 */
  footnote?: string[];
};

/**
 * 전신 인물 사진 위에 통증 부위별 핫스팟을 올려 hover(데스크톱)·click(모든
 * 기기)으로 설명을 전환하는 맵. TreatmentAreaMap(얼굴 부위용)과 상호작용
 * 골격은 같지만, 여기서는 애니메이션을 더 명시적으로 요청받아 3가지를
 * 추가한다:
 * 1) 핫스팟 자체가 스크롤 진입 시 부위 순서대로 스태거 등장(useScrollRevealGroup) —
 *    사진이 로드되자마자 6개 점이 동시에 튀어나오면 어디를 먼저 봐야 할지
 *    알기 어렵다.
 * 2) 활성 핫스팟에 은은한 pulse 링을 둬 "지금 이게 선택됐다"를 위치만으로도
 *    알 수 있게 한다(라벨 텍스트에만 의존하지 않음).
 * 3) 설명 패널은 높이가 부위마다 달라 레이아웃이 출렁이지 않도록 opacity+
 *    translateY로만 전환한다.
 */
export default function BodyAreaMap({
  title,
  highlight,
  imageSrc,
  imageAlt,
  areas,
  footnote,
}: BodyAreaMapProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sectionRef = useScrollReveal<HTMLDivElement>();
  const hotspotGroupRef = useScrollRevealGroup<HTMLDivElement>();
  const active = areas.find((a) => a.id === activeId) ?? null;

  return (
    <div ref={sectionRef} className="reveal-fade-up my-16 md:my-24">
      <h2
        className="font-display text-center mb-8 md:mb-10"
        style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
      >
        {title} <span style={{ color: "var(--color-accent)" }}>{highlight}</span>
      </h2>

      <div className="relative aspect-[3/4] sm:aspect-[4/3] rounded-2xl overflow-hidden bg-bg-alt border border-line">
        {imageSrc ? (
          <Image
            src={stripImagePosition(imageSrc)}
            alt={imageAlt}
            fill
            className="object-cover"
            style={{ ...getImageCropStyle(imageSrc) }}
            sizes="(max-width: 768px) 100vw, 768px"
            quality={80}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm">
            {imageAlt}
          </div>
        )}

        <div ref={hotspotGroupRef} className="absolute inset-0">
          {areas.map((area) => {
            const isActive = area.id === activeId;
            // TreatmentAreaMap과 동일한 이유로, 라벨이 이미지 중심 방향으로 자라도록
            // 좌/우 절반에 따라 순서를 뒤집어 overflow-hidden 컨테이너에 잘리지 않게 한다.
            const growsLeft = area.x > 50;
            return (
              <button
                key={area.id}
                type="button"
                data-reveal-item
                onMouseEnter={() => setActiveId(area.id)}
                onFocus={() => setActiveId(area.id)}
                onClick={() => setActiveId(isActive ? null : area.id)}
                className="absolute flex items-center -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${area.x}%`, top: `${area.y}%` }}
                aria-pressed={isActive}
                aria-label={area.label}
              >
                <span
                  className={"relative shrink-0 flex items-center justify-center" + (growsLeft ? " order-2" : " order-1")}
                  style={{ width: "1.75rem", height: "1.75rem" }}
                >
                  {isActive && (
                    <span
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: "var(--color-accent)",
                        animation: "bodyAreaPulse 1.6s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                      }}
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className="relative rounded-full flex items-center justify-center transition-colors duration-200"
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
                </span>
                <span
                  className={
                    "rounded-full px-2.5 py-1 text-xs sm:px-3.5 sm:py-1.5 sm:text-sm font-semibold whitespace-nowrap transition-colors duration-200" +
                    (growsLeft ? " order-1 mr-2" : " order-2 ml-2") +
                    // TreatmentAreaMap과 동일한 이유로 모바일은 활성 라벨만 보인다.
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
      </div>

      <div
        className="mt-6 rounded-2xl bg-bg-alt px-6 py-8 md:px-10 md:py-10 text-center overflow-hidden"
        style={{ minHeight: "8rem" }}
      >
        <div key={active?.id ?? "empty"} className="body-area-panel-enter">
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
                style={{ fontSize: "1rem", lineHeight: 1.8, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
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

      {footnote && footnote.length > 0 && (
        <p
          className="text-ink-muted text-center mt-6"
          style={{ fontSize: "0.9rem", lineHeight: 1.8, letterSpacing: "-0.01em" }}
        >
          {footnote.join(" · ")}
        </p>
      )}
    </div>
  );
}
