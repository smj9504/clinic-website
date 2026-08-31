"use client";

import { useRef, useState } from "react";

/**
 * 목록 항목을 드래그해 순서를 바꾸는 범용 훅. HTML5 네이티브 드래그앤드롭
 * (draggable + dragstart/dragover/drop)만 쓰고 라이브러리는 추가하지 않는다 —
 * 이 저장소가 이미 AreaMapPicker/ChecklistHeroPicker에서 순수 Pointer
 * Events로 드래그를 구현해 온 관례와 맞춘 선택이다. 드래그 대상은 항목
 * 전체가 아니라 핸들(getHandleProps)에서만 시작되게 해, 텍스트 입력창을
 * 클릭·드래그해 선택하는 일반적인 조작과 충돌하지 않는다.
 *
 * onReorder는 각 dragover마다 아니라 drop 순간에만 한 번 호출한다 —
 * 매 hover마다 부모 상태(draft)를 갱신하면 입력 중인 텍스트 필드가 매번
 * 리마운트되어 포커스를 잃는 문제가 있어, 커밋은 항상 drop에서만 한다.
 */
export function useReorderDrag<T>(items: T[], onReorder: (next: T[]) => void) {
  const dragIndexRef = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const getItemProps = (index: number) => ({
    onDragOver: (e: React.DragEvent) => {
      if (dragIndexRef.current === null) return;
      e.preventDefault();
      if (dragOverIndex !== index) setDragOverIndex(index);
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      const from = dragIndexRef.current;
      dragIndexRef.current = null;
      setDraggingIndex(null);
      setDragOverIndex(null);
      if (from === null || from === index) return;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      onReorder(next);
    },
  });

  const getHandleProps = (index: number) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      dragIndexRef.current = index;
      setDraggingIndex(index);
      e.dataTransfer.effectAllowed = "move";
      // Firefox는 dataTransfer에 데이터가 없으면 드래그 자체를 시작하지 않는다
      e.dataTransfer.setData("text/plain", String(index));
    },
    onDragEnd: () => {
      dragIndexRef.current = null;
      setDraggingIndex(null);
      setDragOverIndex(null);
    },
  });

  return { getItemProps, getHandleProps, dragOverIndex, draggingIndex };
}

/** 목록 항목 앞에 붙이는 6-점(그립) 드래그 핸들 아이콘. 버튼이 아니라
 * span이다 — draggable 속성은 button에서도 동작하지만, 클릭 가능한
 * 포커스 대상이 늘어나는 걸 피하려고 순수 드래그 전용 핸들로 둔다. */
export function DragHandleIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <circle cx="9" cy="6" r="1.5" />
      <circle cx="15" cy="6" r="1.5" />
      <circle cx="9" cy="12" r="1.5" />
      <circle cx="15" cy="12" r="1.5" />
      <circle cx="9" cy="18" r="1.5" />
      <circle cx="15" cy="18" r="1.5" />
    </svg>
  );
}
