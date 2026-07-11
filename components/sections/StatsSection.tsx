"use client";

import { useEffect, useRef, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";

type Stat = {
  label: string;
  value: number;
  suffix: string;
};

function useCountUp(target: number, duration = 2000, start = false) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;
    let raf: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, start]);

  return count;
}

function StatItem({ stat, started }: { stat: Stat; started: boolean }) {
  const count = useCountUp(stat.value, 2200, started);

  return (
    <div className="text-center">
      <div
        className="font-display mb-3"
        style={{
          fontSize: "clamp(2.5rem, 5vw, 3.75rem)",
          fontWeight: 700,
          letterSpacing: "-0.04em",
          lineHeight: 1,
          color: "var(--color-accent)",
        }}
      >
        {count.toLocaleString()}
        <span style={{ fontSize: "0.6em", fontWeight: 400 }}>{stat.suffix}</span>
      </div>
      <div
        className="text-sm font-medium"
        style={{ letterSpacing: "-0.01em", color: "rgba(255,255,255,0.7)" }}
      >
        {stat.label}
      </div>
    </div>
  );
}

const defaultStats: Stat[] = [
  { label: "진료 경력", value: 15, suffix: "년" },
  { label: "누적 환자", value: 30000, suffix: "명+" },
  { label: "환자 만족도", value: 98, suffix: "%" },
  { label: "진료 분야", value: 5, suffix: "개" },
];

export default function StatsSection() {
  const { showStats, stats: savedStats } = useSiteData();

  const ref = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);

  const stats: Stat[] = savedStats && savedStats.length > 0 ? savedStats : defaultStats;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!showStats) return null;

  return (
    <section className="py-20 md:py-28" style={{ background: "var(--color-surface-dark)" }}>
      <div ref={ref} className="container-default">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-6 text-ink-inverse">
          {stats.map((stat) => (
            <StatItem key={stat.label} stat={stat} started={started} />
          ))}
        </div>
      </div>
    </section>
  );
}
