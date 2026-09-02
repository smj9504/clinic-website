"use client";

import { useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import ImagePositionModal from "@/components/admin/ImagePositionModal";
import { getImageCropStyle, setImagePosition, stripImagePosition } from "@/lib/imagePosition";

/**
 * 본문에 삽입된 이미지 하나를 감싸는 NodeView. 호버하면 오버레이 툴바가
 * 떠서 크롭 위치 조정, 너비(전체/절반) 전환, 순서 이동(위/아래), 삭제를
 * 그 자리에서 할 수 있다 — 갤러리 등 다른 블록의 ImageInput과 같은
 * 크롭 UX(ImagePositionModal)를 그대로 재사용한다.
 */
export default function CropImageView({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) {
  const [cropOpen, setCropOpen] = useState(false);
  const src: string = node.attrs.src || "";
  const width: "half" | "full" = node.attrs.width === "half" ? "half" : "full";
  const cleanSrc = stripImagePosition(src);

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
      style={{
        display: width === "half" ? "inline-block" : "block",
        width: width === "half" ? "calc(50% - 0.375rem)" : "100%",
        verticalAlign: "top",
        marginRight: width === "half" ? "0.75rem" : undefined,
      }}
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
            onClick={() => updateAttributes({ width: width === "half" ? "full" : "half" })}
            title={width === "half" ? "전체 너비로" : "절반 너비로 (나란히 배치)"}
            className="w-7 h-7 rounded bg-white/90 text-ink text-xs flex items-center justify-center hover:bg-white shadow"
          >
            {width === "half" ? "⬜" : "◫"}
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
