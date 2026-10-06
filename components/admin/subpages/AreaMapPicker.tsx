"use client";

import { useRef, useState } from "react";
import type { SubPageAreaHotspot } from "@/lib/data";

type AreaMapPickerProps = {
  image: string | null;
  kind: "face" | "body";
  areas: SubPageAreaHotspot[];
  onAreasChange: (areas: SubPageAreaHotspot[]) => void;
  activeId: string | null;
  onActiveIdChange: (id: string | null) => void;
};

function clientToPercent(clientX: number, clientY: number, rect: DOMRect) {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

/**
 * 사진 위에서 부위 핫스팟을 직접 드래그해 좌표를 지정하는 어드민 전용
 * 위젯. 공개 페이지(TreatmentAreaMap/BodyAreaMap)와 동일한 x/y% 좌표계를
 * 그대로 쓰므로 여기서 배치한 위치가 실제 페이지에도 동일하게 반영된다.
 * 드래그 중에는 이 컴포넌트 내부 state로만 처리하고 pointerup에만
 * onAreasChange를 호출한다 — 매 pointermove마다 부모(draft) 상태를
 * 갱신하면 전체 편집 폼이 그 빈도로 리렌더되어 저사양 기기에서 버벅일 수
 * 있다(SlideCarousel의 드래그 처리도 동일한 이유로 종료 시 한 번만 커밋).
 */
export default function AreaMapPicker({
  image,
  kind,
  areas,
  onAreasChange,
  activeId,
  onActiveIdChange,
}: AreaMapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const dragRectRef = useRef<DOMRect | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const aspectClass = kind === "face" ? "aspect-[3/2]" : "aspect-[4/3]";

  const onPinPointerDown = (area: SubPageAreaHotspot) => (e: React.PointerEvent) => {
    e.stopPropagation();
    onActiveIdChange(area.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: area.id, pointerId: e.pointerId };
    dragRectRef.current = rect;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPinPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    const rect = dragRectRef.current;
    if (!drag || !rect || drag.pointerId !== e.pointerId) return;
    setDragPos({ id: drag.id, ...clientToPercent(e.clientX, e.clientY, rect) });
  };

  const endDrag = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const finalPos = dragPos && dragPos.id === drag.id ? dragPos : null;
    dragRef.current = null;
    dragRectRef.current = null;
    setDragPos(null);
    if (!finalPos) return;
    onAreasChange(areas.map((a) => (a.id === drag.id ? { ...a, x: finalPos.x, y: finalPos.y } : a)));
  };

  if (!image) {
    return (
      <div
        className={`relative ${aspectClass} rounded-lg border-2 border-dashed border-line flex items-center justify-center bg-bg-alt`}
      >
        <p className="text-ink-muted text-sm text-center px-6" style={{ letterSpacing: "-0.01em" }}>
          맵 이미지를 먼저 업로드해주세요
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${aspectClass} rounded-lg overflow-hidden bg-bg-alt border border-line select-none`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />

      {areas.map((area) => {
        const pos = dragPos && dragPos.id === area.id ? dragPos : area;
        const isActive = area.id === activeId;
        return (
          <button
            key={area.id}
            type="button"
            onPointerDown={onPinPointerDown(area)}
            onPointerMove={onPinPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: isActive ? "1.5rem" : "1.25rem",
              height: isActive ? "1.5rem" : "1.25rem",
              background: isActive ? "var(--color-accent)" : "rgba(26, 23, 21, 0.6)",
              boxShadow: "0 0 0 2px rgba(251, 250, 247, 0.85)",
              transition: dragPos?.id === area.id ? "none" : "width 120ms, height 120ms, background 120ms",
            }}
            aria-label={area.label || "부위"}
            title={area.label || "부위"}
          />
        );
      })}
    </div>
  );
}
