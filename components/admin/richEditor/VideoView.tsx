"use client";

import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";

/**
 * 본문에 삽입된 동영상 하나를 감싸는 NodeView.
 * 이미지(CropImageView)와 같은 호버 툴바 UX를 쓴다 — 순서 이동(위/아래)과 삭제.
 * 크롭·너비 전환은 넣지 않는다: 동영상은 원본 비율 그대로 보여주는 편이
 * 자연스럽고, 잘라내면 촬영해 둔 화면 구도가 망가진다.
 */
export default function VideoView({ node, deleteNode, editor, getPos }: NodeViewProps) {
  const src: string = node.attrs.src || "";

  // CropImageView.moveBy와 같은 방식 — 형제 노드와 자리를 맞바꾼다
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

    let offset = parentStart;
    for (let i = 0; i < Math.min(index, targetIndex); i++) offset += parent.child(i).nodeSize;

    const firstIdx = dir === 1 ? index : targetIndex;
    const firstNode = firstIdx === index ? thisNode : targetNode;
    const secondNode = firstIdx === index ? targetNode : thisNode;

    dispatch(
      state.tr.replaceWith(
        offset,
        offset + firstNode.nodeSize + secondNode.nodeSize,
        [secondNode, firstNode]
      )
    );
  };

  return (
    <NodeViewWrapper as="div" style={{ display: "block", width: "100%" }} data-drag-handle>
      <span className="group relative block rounded overflow-hidden my-4">
        <video
          src={src}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          className="w-full h-auto block rounded bg-bg-alt"
        />

        <span className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors pointer-events-none" />

        <span className="absolute top-2 left-2 px-2 py-1 rounded bg-black/60 text-white text-[0.65rem] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
          동영상 · 소리 없이 자동 반복
        </span>

        <span className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
    </NodeViewWrapper>
  );
}
