"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { defaultHeroEffect } from "@/lib/data";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const IMAGE_INTERVAL = 8000;
// 동영상 duration을 아직 모를 때(메타데이터 로딩 전) 쓰는 안전장치용 상한 — 무한 대기 방지
const VIDEO_FALLBACK_INTERVAL = 15000;

const EFFECT_CLASS: Record<string, string> = {
  "pan-right": "ken-burns-pan-right",
  "pan-left": "ken-burns-pan-left",
  zoom: "ken-burns-zoom",
  none: "",
};

// 1x1 SVG blur placeholder (로딩 중 표시)
const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function Hero() {
  const { heroSlides, clinicInfo, hydrated } = useSiteData();
  const t = useT();
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  // 활성 슬라이드가 동영상일 때, 재생 길이를 알아낼 때까지의 임시값 → onLoadedMetadata에서 실측치로 갱신
  const [activeVideoDuration, setActiveVideoDuration] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slide = heroSlides.length > 0 ? heroSlides[Math.min(activeIndex, heroSlides.length - 1)] : null;
  const isActiveVideo = slide?.mediaType === "video";

  const goTo = useCallback(
    (index: number) => {
      setActiveIndex(index);
      setAnimKey((k) => k + 1);
      setActiveVideoDuration(null);
    },
    []
  );

  // 자동 전환: 이미지는 고정 8초 타이머. 동영상은 <video onEnded>가 전환을 담당하므로
  // 여기서는 메타데이터 로드 실패 등 onEnded가 영영 안 오는 극단적 상황을 막는 안전망(폴백 상한)만 건다.
  useEffect(() => {
    if (heroSlides.length <= 1) return;
    const duration = isActiveVideo ? VIDEO_FALLBACK_INTERVAL : IMAGE_INTERVAL;

    timerRef.current = setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
      setAnimKey((k) => k + 1);
      setActiveVideoDuration(null);
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [heroSlides.length, activeIndex, isActiveVideo]);

  if (heroSlides.length === 0 || !slide) return null;
  const progressDuration = isActiveVideo ? (activeVideoDuration ?? VIDEO_FALLBACK_INTERVAL) : IMAGE_INTERVAL;

  return (
    <section
      className="relative min-h-[max(calc(100dvh-240px),440px)] overflow-hidden flex items-center transition-opacity duration-500"
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

          const isVideo = s.mediaType === "video";
          const effectClass = i === activeIndex && !isVideo ? EFFECT_CLASS[s.effect ?? defaultHeroEffect(i)] : "";

          return (
            <div
              key={s.id}
              className={`absolute inset-0 overflow-hidden transition-opacity duration-[1200ms] ease-out ${
                i === activeIndex ? "opacity-100" : "opacity-0"
              }`}
            >
              {isVideo ? (
                <video
                  // 동영상 URL이 바뀔 때 이전 재생 상태가 남지 않도록 key로 강제 재마운트
                  key={s.image}
                  src={stripImagePosition(s.image)}
                  muted
                  autoPlay
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{ objectPosition: toObjectPosition(s.image) }}
                  onLoadedMetadata={(e) => {
                    if (i === activeIndex) {
                      setActiveVideoDuration(e.currentTarget.duration * 1000);
                    }
                  }}
                  onEnded={() => {
                    if (i !== activeIndex || heroSlides.length <= 1) return;
                    setActiveIndex((prev) => (prev + 1) % heroSlides.length);
                    setAnimKey((k) => k + 1);
                    setActiveVideoDuration(null);
                  }}
                />
              ) : (
                <div className={effectClass} style={{ width: "100%", height: "100%" }}>
                  <Image
                    src={stripImagePosition(s.image)}
                    alt={s.title}
                    fill
                    priority={i === activeIndex}
                    className="object-cover"
                    style={{ objectPosition: toObjectPosition(s.image) }}
                    sizes="100vw"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                </div>
              )}
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
          {slide.linkUrl && slide.linkLabel && (
            slide.linkUrl.startsWith("http") ? (
              <a href={slide.linkUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary">
                {slide.linkLabel}
              </a>
            ) : (
              <Link href={slide.linkUrl} className="btn-secondary">
                {slide.linkLabel}
              </Link>
            )
          )}
        </div>
      </div>

      {/* Progress bar indicators */}
      {heroSlides.length > 1 && (
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10 flex gap-4">
          {heroSlides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => goTo(i)}
              className="group relative w-12 h-11 shrink-0 flex items-center justify-center"
              aria-label={`${t("slide.label")} ${i + 1}`}
            >
              <span
                className="relative block w-full h-1 rounded-full overflow-hidden"
                style={{ background: "rgba(251, 250, 247, 0.25)" }}
              >
                {i === activeIndex ? (
                  <div
                    key={`prog-${animKey}-${i}-${progressDuration}`}
                    className="hero-progress-bar absolute inset-0 rounded-full"
                    style={{
                      background: "var(--color-ink-inverse)",
                      "--hero-interval": `${progressDuration}ms`,
                    } as React.CSSProperties}
                  />
                ) : (
                  <div
                    className="absolute inset-0 rounded-full transition-colors group-hover:bg-white/50"
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Scroll indicator */}
      <div className="absolute bottom-3 md:bottom-12 right-1/2 translate-x-1/2 md:right-8 md:translate-x-0 z-10 flex flex-col items-center gap-2 text-ink-inverse opacity-70">
        <span className="text-[0.65rem] uppercase hidden md:block" style={{ letterSpacing: "0.15em", writingMode: "vertical-rl" }}>
          Scroll
        </span>
        <div className="w-px h-5 md:h-8 bg-current animate-pulse" />
      </div>
    </section>
  );
}
