"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export default function SlideCarousel({
  count,
  interval = 4500,
  slideWidthClassName,
  gapClassName = "gap-6",
  ariaLabelBase,
  renderItem,
}: {
  count: number;
  interval?: number;
  /** Tailwind width classes applied to each slide, e.g. "w-[78%] md:w-[42%] xl:w-1/4" */
  slideWidthClassName: string;
  gapClassName?: string;
  ariaLabelBase: string;
  renderItem: (index: number, isActive: boolean) => React.ReactNode;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [animKey, setAnimKey] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; scrollLeft: number; dragging: boolean }>({
    startX: 0,
    scrollLeft: 0,
    dragging: false,
  });

  const goTo = useCallback((index: number) => {
    setActiveIndex(index);
    setAnimKey((k) => k + 1);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const track = trackRef.current;
    // +1: 첫 번째 실제 슬라이드 앞에 정렬용 spacer가 있음
    const slide = track?.children[index + 1] as HTMLElement | undefined;
    if (!track || !slide) return;
    track.scrollTo({ left: slide.offsetLeft, behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToIndex(activeIndex);
  }, [activeIndex, scrollToIndex]);

  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const id = setInterval(() => {
      setActiveIndex((prev) => {
        const next = (prev + 1) % count;
        setAnimKey((k) => k + 1);
        return next;
      });
    }, interval);
    return () => clearInterval(id);
  }, [count, interval, isPaused]);

  // Drag-to-scroll (마우스로도 슬라이드 넘기기)
  const onPointerDown = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { startX: e.clientX, scrollLeft: track.scrollLeft, dragging: true };
    setIsPaused(true);
    track.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const track = trackRef.current;
    if (!track || !dragRef.current.dragging) return;
    const delta = e.clientX - dragRef.current.startX;
    track.scrollLeft = dragRef.current.scrollLeft - delta;
  };

  const endDrag = () => {
    dragRef.current.dragging = false;
    const track = trackRef.current;
    if (!track) return;
    // 가장 가까운 슬라이드로 스냅 + activeIndex 동기화 (0: leading spacer)
    let closest = 0;
    let minDist = Infinity;
    for (let i = 0; i < count; i++) {
      const el = track.children[i + 1] as HTMLElement | undefined;
      if (!el) continue;
      const dist = Math.abs(el.offsetLeft - track.scrollLeft);
      if (dist < minDist) {
        minDist = dist;
        closest = i;
      }
    }
    setActiveIndex(closest);
    setAnimKey((k) => k + 1);
    setTimeout(() => setIsPaused(false), 3000);
  };

  if (count === 0) return null;

  const edgeSpacer = (
    <div
      className="shrink-0"
      style={{ width: "max(calc((100vw - min(100vw, 1360px)) / 2), clamp(1.5rem, 3vw, 2rem))" }}
      aria-hidden
    />
  );

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        className={`flex ${gapClassName} overflow-x-auto cursor-grab active:cursor-grabbing select-none`}
        style={{
          scrollSnapType: "x mandatory",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style jsx>{`
          div::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {edgeSpacer}
        {Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className={`shrink-0 ${slideWidthClassName}`}
            style={{ scrollSnapAlign: "center" }}
          >
            {renderItem(i, i === activeIndex)}
          </div>
        ))}
        {edgeSpacer}
      </div>

      {/* Progress bar indicators — Hero 슬라이드와 동일한 시각 언어 */}
      {count > 1 && (
        <div className="flex justify-center gap-3 mt-10">
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              className="group relative w-10 h-8 shrink-0 flex items-center justify-center"
              aria-label={`${ariaLabelBase} ${i + 1}`}
            >
              <span
                className="relative block w-full h-1 rounded-full overflow-hidden"
                style={{ background: "var(--color-line)" }}
              >
                {i === activeIndex ? (
                  <div
                    key={`prog-${animKey}-${i}`}
                    className="hero-progress-bar absolute inset-0 rounded-full"
                    style={{
                      background: "var(--color-accent)",
                      animationPlayState: isPaused ? "paused" : "running",
                      "--hero-interval": `${interval}ms`,
                    } as React.CSSProperties}
                  />
                ) : (
                  <div className="absolute inset-0 rounded-full transition-colors group-hover:bg-line-strong" />
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
