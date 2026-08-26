"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { isVideoUrl } from "@/lib/services";
import type { Equipment } from "@/lib/data";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0VGRTgiLz48L3N2Zz4=";

/**
 * 장비명 탭 — hover 시 미리보기, click 시 선택 고정.
 * 터치 기기는 hover가 없으므로 click만으로도 동일하게 동작해야 한다.
 */
function EquipmentTabs({
  items,
  activeId,
  onHover,
  onSelect,
}: {
  items: Equipment[];
  activeId: string;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:gap-x-12 sm:gap-y-5 md:gap-x-16"
      onMouseLeave={() => onHover(null)}
    >
      {items.map((eq) => {
        const active = eq.id === activeId;
        return (
          <button
            key={eq.id}
            type="button"
            onMouseEnter={() => onHover(eq.id)}
            onFocus={() => onHover(eq.id)}
            onClick={() => onSelect(eq.id)}
            className="relative font-display pb-2 transition-colors duration-200"
            style={{
              fontSize: "clamp(1.1rem, 2vw, 1.5rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: active ? "var(--color-ink)" : "var(--color-ink-muted)",
              opacity: active ? 1 : 0.6,
            }}
            aria-pressed={active}
          >
            {eq.title}
            <span
              className="absolute left-0 right-0 bottom-0 h-0.5 bg-accent transition-transform duration-200 origin-left"
              style={{ transform: active ? "scaleX(1)" : "scaleX(0)" }}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
}

/** 이미지·동영상 겸용 — equipment.image가 어느 쪽이어도 그대로 재생 가능하다 */
function EquipmentMedia({ equipment: eq }: { equipment: Equipment }) {
  if (!eq.image) {
    return (
      <div className="absolute inset-0 flex items-center justify-center text-ink-muted text-sm bg-bg-alt">
        {eq.title}
      </div>
    );
  }

  if (isVideoUrl(eq.image)) {
    return (
      <video
        key={eq.id}
        src={eq.image}
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      />
    );
  }

  return (
    <Image
      key={eq.id}
      src={eq.image}
      alt={eq.title}
      fill
      className="object-cover"
      sizes="100vw"
      quality={80}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
    />
  );
}

/**
 * 피부미용 허브 상단 — 장비 사진 콜라주 + 시그니처 케어 소개, 그 아래
 * 보유 장비 이름을 탭처럼 나열해 hover·click으로 아래 전체폭 미디어를 전환한다.
 * 개별 장비 상세는 /equipment로 유도한다 (이 섹션은 인트로 역할만).
 */
export default function EquipmentShowcase() {
  const { equipment } = useSiteData();
  const t = useT();
  const collageRef = useScrollReveal<HTMLDivElement>();
  const textRef = useScrollReveal<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });

  const items = useMemo(
    () =>
      [...(equipment ?? [])]
        .filter((eq) => !eq.isHidden)
        .sort((a, b) => a.sortOrder - b.sortOrder),
    [equipment]
  );

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) return null;

  const collage = items.slice(0, 6);
  const activeId = hoveredId ?? selectedId ?? items[0].id;
  const active = items.find((eq) => eq.id === activeId) ?? items[0];

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20 overflow-x-hidden">
      <div className="container-default">
        <div className="grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-12 lg:gap-16 items-center">
          <div ref={collageRef} className="reveal-fade-up grid grid-cols-3 gap-3 md:gap-4">
            {collage.map((eq) => (
              <div
                key={eq.id}
                className="relative aspect-square overflow-hidden rounded bg-bg-alt"
              >
                {eq.image && !isVideoUrl(eq.image) && (
                  <Image
                    src={eq.image}
                    alt={eq.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 33vw, 22vw"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                )}
              </div>
            ))}
          </div>

          <div ref={textRef} className="reveal-fade-up">
            <p
              className="text-accent font-semibold mb-4"
              style={{ fontSize: "1.05rem", letterSpacing: "-0.02em" }}
            >
              {t("skinBeauty.showcase.label")}
            </p>
            <h2
              className="font-display mb-8"
              style={{
                fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                fontWeight: 700,
                letterSpacing: "-0.045em",
                lineHeight: 1.25,
              }}
            >
              {t("skinBeauty.showcase.title")}
            </h2>
            <div className="w-10 h-0.5 bg-ink mb-8" />
            <p
              className="text-ink-soft mb-10"
              style={{
                fontSize: "1rem",
                lineHeight: 1.9,
                letterSpacing: "-0.01em",
                whiteSpace: "pre-line",
              }}
            >
              {t("skinBeauty.showcase.body")}
            </p>
            <Link
              href="/equipment"
              className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink rounded-full text-sm font-medium hover:bg-ink hover:text-ink-inverse transition-all duration-200"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t("skinBeauty.showcase.cta")}
              <span aria-hidden="true">↳</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 장비명 탭 — hover·click으로 아래 미디어 전환 */}
      <div className="mt-20 md:mt-28 py-10 md:py-12" style={{ background: "var(--color-bg-alt)" }}>
        <div className="container-default">
          <EquipmentTabs
            items={items}
            activeId={activeId}
            onHover={setHoveredId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* 선택된 장비의 전체폭 이미지·동영상 */}
      <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-bg-alt overflow-hidden">
        <EquipmentMedia equipment={active} />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(0deg, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 30%)",
          }}
        />
        <div className="absolute left-0 right-0 bottom-0 p-6 md:p-10">
          <div className="container-default">
            <p
              className="text-ink-inverse font-display"
              style={{ fontSize: "clamp(1.1rem, 2.5vw, 1.6rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
            >
              {active.title}
            </p>
            {active.subtitle && (
              <p
                className="text-ink-inverse opacity-80 mt-1"
                style={{ fontSize: "0.9rem", letterSpacing: "-0.01em" }}
              >
                {active.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
