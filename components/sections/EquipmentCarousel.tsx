"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import type { Equipment } from "@/lib/data";
import EquipmentImage from "@/components/EquipmentImage";

const AUTO_ADVANCE_MS = 3000;

function EquipmentCircle({
  eq,
  role,
  onClick,
}: {
  eq: Equipment;
  role: "center" | "side" | "hidden";
  onClick?: () => void;
}) {
  if (role === "hidden") return <div className="hidden sm:block" style={{ width: "11rem" }} aria-hidden="true" />;

  const isCenter = role === "center";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isCenter}
      className={
        "relative shrink-0 rounded-full transition-all duration-500 ease-out " +
        (isCenter ? "" : "hidden min-[420px]:block")
      }
      style={{
        width: isCenter ? "min(40vw, 22rem)" : "min(11vw, 11rem)",
        height: isCenter ? "min(40vw, 22rem)" : "min(11vw, 11rem)",
        opacity: isCenter ? 1 : 0.55,
        cursor: isCenter ? "default" : "pointer",
      }}
      aria-label={eq.title}
      aria-current={isCenter}
    >
      {isCenter && (
        <span
          className="absolute rounded-full pointer-events-none"
          style={{
            inset: "-14%",
            background:
              "radial-gradient(circle, rgba(107, 68, 35, 0.22) 0%, rgba(107, 68, 35, 0.08) 55%, rgba(107, 68, 35, 0) 75%)",
          }}
          aria-hidden="true"
        />
      )}
      <span
        className="absolute inset-0 rounded-full overflow-hidden bg-surface"
        style={{
          boxShadow: isCenter ? "0 20px 48px -16px rgba(26, 23, 21, 0.28)" : "none",
        }}
      >
        <EquipmentImage src={eq.image} alt={eq.title} sizes="(max-width: 640px) 60vw, 22rem" quality={80} />
      </span>
    </button>
  );
}

/**
 * "리움의 리프팅 장비"류 3D 서클 캐러셀 참고 디자인의 고운빛 버전.
 * 중앙 원(활성) 좌우로 다음/이전 장비를 반투명 작은 원으로 미리 보여주고,
 * 3초마다 자동으로 다음 장비로 넘어간다. 사용자가 화살표/점/사이드 원을
 * 조작하면 그 시점부터 타이머를 리셋해, 방금 고른 항목이 바로 다음
 * 틱에 밀려나는 답답함을 없앤다. prefers-reduced-motion에서는 자동 진행을
 * 끄고 수동 탐색만 남긴다 — 진행 방향을 계속 스스로 결정하지 못하는 캐러셀은
 * 그 자체로 모션 민감 사용자에게 불편하기 때문이다.
 */
export default function EquipmentCarousel() {
  const { equipment, skinBeautyEquipmentSections } = useSiteData();
  const t = useT();
  const sectionRef = useScrollReveal<HTMLDivElement>();

  // 장비소개(admin)가 관리하는 마스터 목록 전체를 표시 순서 그대로 보여준다 —
  // 이 섹션 전용 하위 선택은 두지 않는다(장비소개와 중복 관리되는 문제).
  const items = useMemo(() => {
    const all = equipment ?? [];
    return [...all].filter((eq) => !eq.isHidden).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [equipment]);

  const [index, setIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const restartTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (items.length < 2) return;
    const reduceMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    timerRef.current = setInterval(() => {
      setIndex((i) => (i + 1) % items.length);
    }, AUTO_ADVANCE_MS);
  }, [items.length]);

  useEffect(() => {
    restartTimer();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [restartTimer]);

  if (items.length === 0) return null;

  const goTo = (next: number) => {
    setIndex(((next % items.length) + items.length) % items.length);
    restartTimer();
  };

  const prevIdx = (index - 1 + items.length) % items.length;
  const nextIdx = (index + 1) % items.length;
  const active = items[index];

  const carouselTitle = skinBeautyEquipmentSections?.carouselTitle ?? "";
  const carouselTitleHighlight = skinBeautyEquipmentSections?.carouselTitleHighlight ?? "";
  const carouselSubtitle = skinBeautyEquipmentSections?.carouselSubtitle ?? "";
  const hasHeading = Boolean(carouselTitle || carouselTitleHighlight || carouselSubtitle);

  return (
    <section ref={sectionRef} className="reveal-fade-up py-20 md:py-28" style={{ background: "var(--color-bg-alt)" }}>
      <div className="container-default">
        {hasHeading && (
          <>
            {(carouselTitle || carouselTitleHighlight) && (
              <h2
                className="font-display text-center mb-4"
                style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
              >
                {carouselTitle}
                {carouselTitle && carouselTitleHighlight && " "}
                <span style={{ color: "var(--color-accent)" }}>{carouselTitleHighlight}</span>
              </h2>
            )}
            {carouselSubtitle && (
              <p
                className="text-ink-soft text-center mb-14 md:mb-16"
                style={{ fontSize: "1rem", lineHeight: 1.85, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
              >
                {carouselSubtitle}
              </p>
            )}
          </>
        )}

        <div
          className="flex items-center justify-center"
          style={{ gap: "clamp(0.375rem, 2vw, 3rem)" }}
        >
          <button
            type="button"
            onClick={() => goTo(prevIdx)}
            className="shrink-0 z-10 flex items-center justify-center rounded-full bg-surface hover:bg-accent hover:text-ink-inverse transition-colors duration-200 w-10 h-10 sm:w-11 sm:h-11"
            style={{ boxShadow: "0 4px 16px rgba(26, 23, 21, 0.12)" }}
            aria-label={t("skinBeauty.carousel.prev")}
          >
            <svg viewBox="0 0 20 20" fill="none" style={{ width: "1rem", height: "1rem" }}>
              <path d="M12.5 5l-5 5 5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <EquipmentCircle eq={items[prevIdx]} role={items.length > 2 ? "side" : "hidden"} onClick={() => goTo(prevIdx)} />
          <EquipmentCircle eq={active} role="center" />
          <EquipmentCircle eq={items[nextIdx]} role={items.length > 2 ? "side" : "hidden"} onClick={() => goTo(nextIdx)} />

          <button
            type="button"
            onClick={() => goTo(nextIdx)}
            className="shrink-0 z-10 flex items-center justify-center rounded-full bg-surface hover:bg-accent hover:text-ink-inverse transition-colors duration-200 w-10 h-10 sm:w-11 sm:h-11"
            style={{ boxShadow: "0 4px 16px rgba(26, 23, 21, 0.12)" }}
            aria-label={t("skinBeauty.carousel.next")}
          >
            <svg viewBox="0 0 20 20" fill="none" style={{ width: "1rem", height: "1rem" }}>
              <path d="M7.5 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="text-center mt-10 md:mt-12">
          <p
            className="font-display"
            style={{ fontSize: "0.85rem", fontWeight: 700, letterSpacing: "0.08em", color: "var(--color-accent)" }}
          >
            {String(index + 1).padStart(2, "0")}
          </p>
          <h3
            className="font-display mt-2"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            {active.title}
          </h3>
          {active.subtitle && (
            <p
              className="text-ink-muted mt-2 uppercase"
              style={{ fontSize: "0.85rem", letterSpacing: "0.05em" }}
            >
              {active.subtitle}
            </p>
          )}
          {active.tags.length > 0 && (
            <p
              className="mt-4"
              style={{ fontSize: "0.9rem", letterSpacing: "-0.01em", color: "var(--color-accent-soft)" }}
            >
              {active.tags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-8">
            {items.map((eq, i) => (
              <button
                key={eq.id}
                type="button"
                onClick={() => goTo(i)}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === index ? "1.5rem" : "0.5rem",
                  height: "0.5rem",
                  background: i === index ? "var(--color-accent)" : "var(--color-line-strong)",
                }}
                aria-label={eq.title}
                aria-current={i === index}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
