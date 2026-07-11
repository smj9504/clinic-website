"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

const INTERVAL = 7000;

// 1x1 SVG blur placeholder (로딩 중 표시)
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function Hero() {
  const { heroSlides, clinicInfo, hydrated } = useSiteData();
  const t = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setAnimKey((k) => k + 1);
    },
    []
  );

  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % heroSlides.length;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, INTERVAL);
    return () => clearInterval(id);
  }, [heroSlides.length]);

  if (heroSlides.length === 0) return null;
  const slide = heroSlides[Math.min(activeIndex, heroSlides.length - 1)];

  return (
    <section
      className="relative h-screen min-h-[600px] overflow-hidden flex items-center transition-opacity duration-500"
      style={{ opacity: hydrated ? 1 : 0 }}
    >
      {/* Background images with Ken Burns — 활성 슬라이드 + 인접 슬라이드만 렌더링 */}
      <div className="absolute inset-0">
        {heroSlides.map((s, i) => {
          // 현재/이전/다음 슬라이드만 렌더링 (나머지는 skip → 불필요한 이미지 다운로드 방지)
          const nextIdx = (activeIndex + 1) % heroSlides.length;
          const prevIdx = (activeIndex - 1 + heroSlides.length) % heroSlides.length;
          const shouldRender = i === activeIndex || i === nextIdx || i === prevIdx;
          if (!shouldRender) return null;

          return (
            <div
              key={s.id}
              className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
                i === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className={i === activeIndex ? "ken-burns" : ""} style={{ width: "100%", height: "100%" }}>
                <Image
                  src={s.image}
                  alt={s.title}
                  fill
                  priority={i === activeIndex}
                  className="object-cover"
                  sizes="100vw"
                  quality={75}
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.5) 100%)",
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Content with slide-up text */}
      <div className="relative z-10 container-default w-full text-ink-inverse">
        <span
          key={`label-${animKey}`}
          className="hero-text-up inline-block text-xs font-semibold uppercase border-b pb-3 mb-8"
          style={{
            letterSpacing: "0.2em",
            borderColor: "rgba(251, 250, 247, 0.4)",
            animationDelay: "200ms",
          }}
        >
          {slide.label}
        </span>

        <h1
          key={`title-${animKey}`}
          className="hero-text-up font-display mb-8"
          style={{
            fontSize: "clamp(2.25rem, 6.5vw, 4.75rem)",
            fontWeight: 600,
            lineHeight: 1.2,
            letterSpacing: "-0.045em",
            whiteSpace: "pre-line",
            animationDelay: "400ms",
          }}
        >
          {slide.title}
        </h1>

        <p
          key={`subtitle-${animKey}`}
          className="hero-text-up max-w-md"
          style={{
            fontSize: "clamp(0.95rem, 1.3vw, 1.1rem)",
            lineHeight: 1.85,
            letterSpacing: "-0.01em",
            color: "rgba(251, 250, 247, 0.88)",
            whiteSpace: "pre-line",
            animationDelay: "600ms",
          }}
        >
          {slide.subtitle}
        </p>

        <div
          key={`actions-${animKey}`}
          className="hero-text-up flex flex-wrap gap-4 mt-12"
          style={{ animationDelay: "800ms" }}
        >
          <a href={clinicInfo.reservationUrl} target="_blank" rel="noopener noreferrer" className="btn-primary">
            {t("hero.reservation")}
          </a>
          <Link href="/treatments" className="btn-secondary">
            {t("hero.treatments")}
          </Link>
        </div>
      </div>

      {/* Progress bar indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-4">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="group relative w-12 h-1 rounded-full overflow-hidden"
              style={{ background: "rgba(251, 250, 247, 0.25)" }}
              aria-label={`${t("slide.label")} ${i + 1}`}
            >
              {i === activeIndex ? (
                <div
                  key={`prog-${animKey}-${i}`}
                  className="hero-progress-bar absolute inset-0 rounded-full"
                  style={{
                    background: "var(--color-ink-inverse)",
                    "--hero-interval": `${INTERVAL}ms`,
                  } as React.CSSProperties}
                />
              ) : (
                <div
                  className="absolute inset-0 rounded-full transition-colors group-hover:bg-white/50"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-12 right-8 z-10 hidden md:flex flex-col items-center gap-2 text-ink-inverse opacity-50">
        <span className="text-[0.65rem] uppercase" style={{ letterSpacing: "0.15em", writingMode: "vertical-rl" }}>
          Scroll
        </span>
        <div className="w-px h-8 bg-current animate-pulse" />
      </div>
    </section>
  );
}
