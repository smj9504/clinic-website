"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import ImagePositionModal from "@/components/admin/ImagePositionModal";
import { getImageCropStyle, setImagePosition, stripImagePosition } from "@/lib/imagePosition";
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH, imageWidthStyle, parseImageWidth } from "./CropImage";

const WIDTH_PRESETS = [25, 33, 50, 75, 100];

/**
 * 본문에 삽입된 이미지 하나를 감싸는 NodeView. 호버하면 오버레이 툴바가
 * 떠서 크롭 위치 조정, 크기(프리셋 버튼 또는 오른쪽 모서리 드래그),
 * 순서 이동(위/아래), 삭제를
 * 그 자리에서 할 수 있다 — 갤러리 등 다른 블록의 ImageInput과 같은
 * 크롭 UX(ImagePositionModal)를 그대로 재사용한다.
 */
export default function CropImageView({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) {
  const [cropOpen, setCropOpen] = useState(false);
  const src: string = node.attrs.src || "";
  const savedWidth = parseImageWidth(node.attrs.width);
  // 드래그 중에는 트랜잭션을 매 프레임 쌓지 않도록 로컬 값으로만 그리고, 놓을 때 한 번 저장한다
  const [dragWidth, setDragWidth] = useState<number | null>(null);
  const width = dragWidth ?? savedWidth;
  const wrapperRef = useRef<HTMLElement | null>(null);
  const cleanSrc = stripImagePosition(src);

  const startResize = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const wrapper = wrapperRef.current;
    // 퍼센트 기준은 에디터 본문(ProseMirror)의 콘텐츠 폭이다
    const container = wrapper?.closest(".ProseMirror");
    if (!wrapper || !container) return;
    const cs = getComputedStyle(container);
    const containerWidth =
      container.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const left = wrapper.getBoundingClientRect().left;
    let latest = savedWidth;

    const onMove = (ev: PointerEvent) => {
      // 실제 그려지는 폭은 width% - 0.75rem(간격)이므로 그만큼 더해 역산한다
      const raw = ((ev.clientX - left + 12) / containerWidth) * 100;
      // 5% 단위로 스냅해 50+50, 25×4 같은 조합을 맞추기 쉽게 한다
      latest = Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(raw / 5) * 5));
      setDragWidth(latest);
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      setDragWidth(null);
      if (latest !== savedWidth) updateAttributes({ width: latest });
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const moveBy = (dir: -1 | 1) => {
    const pos = typeof getPos === "function" ? getPos() : null;
    if (pos == null) return;
    const { state, dispatch } = editor.view;
    const $pos = state.doc.resolve(pos);
    const index = $pos.index();
    const parent = $pos.parent;
    const targetIndex = index + dir;
    if (targetIndex < 0 || targetIndex >= parent.childCount) return;

    const parentStart = $pos.start();
    const thisNode = parent.child(index);
    const targetNode = parent.child(targetIndex);

    // 두 노드 중 앞쪽 노드가 시작하는 오프셋 — 그 앞 형제들의 크기를 누적해서 구한다
    let offset = parentStart;
    for (let i = 0; i < Math.min(index, targetIndex); i++) offset += parent.child(i).nodeSize;

    const firstIdx = dir === 1 ? index : targetIndex;
    const firstNode = firstIdx === index ? thisNode : targetNode;
    const secondNode = firstIdx === index ? targetNode : thisNode;

    const tr = state.tr.replaceWith(
      offset,
      offset + firstNode.nodeSize + secondNode.nodeSize,
      [secondNode, firstNode]
    );
    dispatch(tr);
  };

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef}
      style={imageWidthStyle(width)}
      data-drag-handle
    >
      <span className="group relative block rounded overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cleanSrc}
          alt={node.attrs.alt || ""}
          className="w-full h-auto block rounded"
          style={{ ...getImageCropStyle(src), objectFit: "cover" }}
        />

        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors pointer-events-none" />

        <span className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setCropOpen(true)}
            title="크롭 위치 조정"
            className="w-7 h-7 rounded bg-white/90 text-ink text-xs flex items-center justify-center hover:bg-white shadow"
          >
            ⤢
          </button>
          <button
            type="button"
            onClick={() => moveBy(-1)}
            title="위로 이동"
            className="w-7 h-7 rounded bg-white/90 text-ink text-xs flex items-center justify-center hover:bg-white shadow"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => moveBy(1)}
            title="아래로 이동"
            className="w-7 h-7 rounded bg-white/90 text-ink text-xs flex items-center justify-center hover:bg-white shadow"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => deleteNode()}
            title="삭제"
            className="w-7 h-7 rounded bg-white/90 text-red-600 text-xs flex items-center justify-center hover:bg-white shadow"
          >
            ✕
          </button>
        </span>

        {/* 크기 프리셋 — 100% 미만 이미지를 연속으로 두면 옆으로 나란히 배치된다 */}
        <span
          className={`absolute bottom-2 left-2 flex gap-1 transition-opacity ${
            dragWidth !== null ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {WIDTH_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => updateAttributes({ width: preset })}
              title={`본문 폭의 ${preset}%`}
              className={`h-7 px-2 rounded text-[0.7rem] font-medium flex items-center justify-center shadow ${
                width === preset ? "bg-accent text-white" : "bg-white/90 text-ink hover:bg-white"
              }`}
            >
              {preset}%
            </button>
          ))}
          {!WIDTH_PRESETS.includes(width) && (
            <span className="h-7 px-2 rounded bg-accent text-white text-[0.7rem] font-medium flex items-center shadow">
              {width}%
            </span>
          )}
        </span>

        {/* 오른쪽 모서리 드래그로 크기 조절 */}
        <span
          onPointerDown={startResize}
          title="드래그해서 크기 조절"
          className={`absolute top-1/2 right-0 -translate-y-1/2 w-3 h-12 rounded-l bg-white/90 shadow cursor-ew-resize flex items-center justify-center transition-opacity ${
            dragWidth !== null ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          <span className="w-0.5 h-6 bg-ink-muted rounded" />
        </span>
      </span>

      {cropOpen && (
        <ImagePositionModal
          url={src}
          aspectRatio="16 / 10"
          isVideo={false}
          onClose={() => setCropOpen(false)}
          onConfirm={(x, y, scale) => {
            updateAttributes({ src: setImagePosition(cleanSrc, x, y, scale) });
            setCropOpen(false);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
