"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { isVideoUrl, hasRealEquipmentImage } from "@/lib/services";
import type { Equipment } from "@/lib/data";
import EquipmentImage from "@/components/EquipmentImage";

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

/** 이미지·동영상 겸용 — equipment.image가 어느 쪽이어도 그대로 재생 가능하다.
 * 사진이 없거나 아직 실사진으로 교체되지 않은 데모 placeholder면 임의 사진
 * 대신 클리닉 로고를 보여준다(EquipmentImage 참고). */
function EquipmentMedia({ equipment: eq }: { equipment: Equipment }) {
  if (eq.image && isVideoUrl(eq.image)) {
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

  return <EquipmentImage key={eq.id} src={eq.image} alt={eq.title} sizes="100vw" quality={80} />;
}

/**
 * 피부미용 허브 상단 — 장비 사진 콜라주 + 시그니처 케어 소개, 그 아래
 * 보유 장비 이름을 탭처럼 나열해 hover·click으로 아래 전체폭 미디어를 전환한다.
 * 개별 장비 상세는 /equipment로 유도한다 (이 섹션은 인트로 역할만).
 */
export default function EquipmentShowcase() {
  const { equipment, skinBeautyEquipmentSections } = useSiteData();
  const collageRef = useScrollReveal<HTMLDivElement>();
  const textRef = useScrollReveal<HTMLDivElement>({ rootMargin: "0px 0px -80px 0px" });

  // 장비소개(admin)가 관리하는 마스터 목록 전체를 표시 순서 그대로 보여준다 —
  // 이 섹션 전용 하위 선택은 두지 않는다(장비소개와 중복 관리되는 문제).
  const items = useMemo(() => {
    const all = equipment ?? [];
    return [...all].filter((eq) => !eq.isHidden).sort((a, b) => a.sortOrder - b.sortOrder);
  }, [equipment]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  if (items.length === 0) return null;

  // 콜라주 6칸은 admin에서 칸별로 지정한 이미지(collageImages)를 우선 쓰고,
  // 그 칸이 비어 있으면 showcase 장비 목록의 같은 순번 이미지로 폴백한다.
  // 어느 쪽도 실사진이 아니면(비어있거나 데모 placeholder) 칸을 숨기지 않고
  // 로고로 채운다 — 6칸 그리드라 일부 칸만 사라지면 레이아웃이 깨진다.
  const collageOverrides = skinBeautyEquipmentSections?.collageImages ?? [];
  const collage = Array.from({ length: 6 }, (_, i) => {
    const override = collageOverrides[i];
    const image = hasRealEquipmentImage(override) ? override : hasRealEquipmentImage(items[i]?.image) ? items[i]!.image! : null;
    return {
      key: items[i]?.id ?? `collage-${i}`,
      image,
      alt: items[i]?.title ?? "",
    };
  }).filter((_, i) => i < items.length || collageOverrides[i]);

  const activeId = hoveredId ?? selectedId ?? items[0].id;
  const active = items.find((eq) => eq.id === activeId) ?? items[0];

  const introLabel = skinBeautyEquipmentSections?.introLabel ?? "";
  const introTitle = skinBeautyEquipmentSections?.introTitle ?? "";
  const introBody = skinBeautyEquipmentSections?.introBody ?? "";
  const introCta = skinBeautyEquipmentSections?.introCta ?? "";
  const hasIntroText = Boolean(introLabel || introTitle || introBody || introCta);

  return (
    <section className="pt-20 pb-16 md:pt-28 md:pb-20 overflow-x-hidden">
      <div className="container-default">
        <div
          className={
            hasIntroText
              ? "grid grid-cols-1 lg:grid-cols-[7fr_5fr] gap-12 lg:gap-16 items-center"
              : "flex justify-center"
          }
        >
          <div
            ref={collageRef}
            className={hasIntroText ? "reveal-fade-up grid grid-cols-3 gap-3 md:gap-4" : "reveal-fade-up grid grid-cols-3 gap-3 md:gap-4 max-w-2xl w-full"}
          >
            {collage.map((slot) => (
              <div
                key={slot.key}
                className="relative aspect-square overflow-hidden rounded bg-bg-alt"
              >
                {slot.image && isVideoUrl(slot.image) ? (
                  <video src={slot.image} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <EquipmentImage src={slot.image} alt={slot.alt} sizes="(max-width: 768px) 33vw, 22vw" />
                )}
              </div>
            ))}
          </div>

          {hasIntroText && (
            <div ref={textRef} className="reveal-fade-up">
              {introLabel && (
                <p
                  className="text-accent font-semibold mb-4"
                  style={{ fontSize: "1.05rem", letterSpacing: "-0.02em" }}
                >
                  {introLabel}
                </p>
              )}
              {introTitle && (
                <h2
                  className="font-display mb-8"
                  style={{
                    fontSize: "clamp(1.75rem, 3.5vw, 2.5rem)",
                    fontWeight: 700,
                    letterSpacing: "-0.045em",
                    lineHeight: 1.25,
                  }}
                >
                  {introTitle}
                </h2>
              )}
              {(introTitle || introBody) && <div className="w-10 h-0.5 bg-ink mb-8" />}
              {introBody && (
                <p
                  className="text-ink-soft mb-10"
                  style={{
                    fontSize: "1rem",
                    lineHeight: 1.9,
                    letterSpacing: "-0.01em",
                    whiteSpace: "pre-line",
                  }}
                >
                  {introBody}
                </p>
              )}
              {introCta && (
                <Link
                  href="/equipment"
                  className="inline-flex items-center gap-2 px-7 py-3.5 border border-ink rounded-full text-sm font-medium hover:bg-ink hover:text-ink-inverse transition-all duration-200"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {introCta}
                  <span aria-hidden="true">↳</span>
                </Link>
              )}
            </div>
          )}
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
