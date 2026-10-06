"use client";

import { useRef, useState } from "react";
import type { SubPageChecklistHeroItem } from "@/lib/data";

type ChecklistHeroPickerProps = {
  image: string | null;
  items: SubPageChecklistHeroItem[];
  onItemsChange: (items: SubPageChecklistHeroItem[]) => void;
  activeId: string | null;
  onActiveIdChange: (id: string | null) => void;
};

function clientToPercent(clientX: number, clientY: number, rect: DOMRect) {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

/**
 * 체크리스트 히어로 카드를 사진 위에서 직접 드래그해 x/y% 좌표를 지정하는
 * 어드민 전용 위젯. AreaMapPicker와 같은 좌표계·드래그 커밋 방식(pointerup
 * 에만 onItemsChange 호출)을 쓰되, 대상이 점 핀이 아니라 라벨 텍스트가
 * 보이는 카드라 실제 공개 페이지의 ChecklistCard 반투명 유리 카드와 비슷한
 * 크기로 미리보기해야 배치 결과를 가늠할 수 있다.
 */
export default function ChecklistHeroPicker({
  image,
  items,
  onItemsChange,
  activeId,
  onActiveIdChange,
}: ChecklistHeroPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string; pointerId: number } | null>(null);
  const dragRectRef = useRef<DOMRect | null>(null);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const onCardPointerDown = (item: SubPageChecklistHeroItem) => (e: React.PointerEvent) => {
    e.stopPropagation();
    onActiveIdChange(item.id);
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { id: item.id, pointerId: e.pointerId };
    dragRectRef.current = rect;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onCardPointerMove = (e: React.PointerEvent) => {
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
    onItemsChange(items.map((it) => (it.id === drag.id ? { ...it, x: finalPos.x, y: finalPos.y } : it)));
  };

  if (!image) {
    return (
      <div className="relative aspect-[16/10] rounded-lg border-2 border-dashed border-line flex items-center justify-center bg-bg-alt">
        <p className="text-ink-muted text-sm text-center px-6" style={{ letterSpacing: "-0.01em" }}>
          사진을 먼저 업로드해주세요
        </p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-[16/10] rounded-lg overflow-hidden bg-bg-alt border border-line select-none"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover pointer-events-none" />
      <div className="absolute inset-0" style={{ background: "rgba(20, 16, 13, 0.25)" }} />

      {items.map((item) => {
        const hasPos = typeof item.x === "number" && typeof item.y === "number";
        const pos = dragPos && dragPos.id === item.id ? dragPos : hasPos ? { x: item.x!, y: item.y! } : null;
        const isActive = item.id === activeId;

        if (!pos) {
          return null;
        }

        return (
          <button
            key={item.id}
            type="button"
            onPointerDown={onCardPointerDown(item)}
            onPointerMove={onCardPointerMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg text-left cursor-grab active:cursor-grabbing touch-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: "9rem",
              padding: "0.55rem 0.7rem",
              background: isActive ? "rgba(107, 68, 35, 0.85)" : "rgba(26, 20, 16, 0.7)",
              border: isActive ? "1.5px solid var(--color-accent)" : "1px solid rgba(251, 250, 247, 0.3)",
              boxShadow: "0 4px 14px rgba(0, 0, 0, 0.3)",
              transition: dragPos?.id === item.id ? "none" : "background 120ms, border-color 120ms",
            }}
            title={item.label || "카드"}
          >
            <span
              className="block font-semibold text-ink-inverse truncate"
              style={{ fontSize: "0.75rem", letterSpacing: "-0.01em" }}
            >
              {item.label || "라벨 없음"}
            </span>
          </button>
        );
      })}

      {items.some((it) => !(typeof it.x === "number" && typeof it.y === "number")) && (
        <div className="absolute inset-x-0 bottom-0 px-3 py-2 text-center" style={{ background: "rgba(20,16,13,0.65)" }}>
          <p className="text-xs text-ink-inverse" style={{ letterSpacing: "-0.01em" }}>
            위치가 없는 카드가 있습니다 — 아래 목록에서 항목을 눌러 위치를 지정하세요
          </p>
        </div>
      )}
    </div>
  );
}
