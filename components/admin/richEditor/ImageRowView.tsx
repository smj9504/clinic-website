"use client";

import { useRef, useState } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import ImagePositionModal from "@/components/admin/ImagePositionModal";
import { getImageCropStyle, setImagePosition, stripImagePosition } from "@/lib/imagePosition";
import {
  MAX_REQUEST_BYTES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  shrinkForUpload,
} from "@/lib/imageUpload";
import type { ImageRowSlot } from "./ImageRow";

const MIN_SLOTS = 2;
const MAX_SLOTS = 3;

async function uploadFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`${MAX_UPLOAD_LABEL} 이하 이미지만 업로드 가능합니다.`);
  }
  const upload = await shrinkForUpload(file);
  if (upload.size > MAX_REQUEST_BYTES) {
    throw new Error("이미지를 압축하지 못했습니다. JPG 또는 PNG로 변환한 뒤 다시 시도해주세요.");
  }
  const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
  const formData = new FormData();
  formData.append("file", upload);
  formData.append("password", password);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || res.statusText);
  return json.url as string;
}

/**
 * 이미지 2~3개를 가로로 나란히 묶는 블록의 NodeView. 슬롯별 업로드·크롭·
 * 삭제, 슬롯 개수(2/3) 전환, 블록 전체 순서 이동(위/아래)을 지원한다.
 */
export default function ImageRowView({ node, updateAttributes, deleteNode, editor, getPos }: NodeViewProps) {
  const slots: ImageRowSlot[] = node.attrs.slots?.length ? node.attrs.slots : [{ src: "" }, { src: "" }];
  const [cropIndex, setCropIndex] = useState<number | null>(null);
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setSlot = (index: number, patch: Partial<ImageRowSlot>) => {
    const next = slots.map((s, i) => (i === index ? { ...s, ...patch } : s));
    updateAttributes({ slots: next });
  };

  const setSlotCount = (count: number) => {
    const next = slots.slice(0, count);
    while (next.length < count) next.push({ src: "" });
    updateAttributes({ slots: next });
  };

  const onFile = async (index: number, file: File) => {
    setUploadingIndex(index);
    try {
      const url = await uploadFile(file);
      setSlot(index, { src: url });
    } catch (err) {
      alert(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploadingIndex(null);
    }
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

    let offset = parentStart;
    for (let i = 0; i < Math.min(index, targetIndex); i++) offset += parent.child(i).nodeSize;

    const [firstIdx] = dir === 1 ? [index] : [targetIndex];
    const firstNode = firstIdx === index ? thisNode : targetNode;
    const secondNode = firstIdx === index ? targetNode : thisNode;

    const tr = state.tr.replaceWith(offset, offset + firstNode.nodeSize + secondNode.nodeSize, [
      secondNode,
      firstNode,
    ]);
    dispatch(tr);
  };

  return (
    <NodeViewWrapper className="my-4" data-drag-handle>
      <div className="border border-dashed border-line rounded p-3 bg-bg-alt/40">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-muted" style={{ letterSpacing: "-0.01em" }}>
            가로 배치 ({slots.length}장)
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setSlotCount(Math.max(MIN_SLOTS, slots.length - 1))}
              disabled={slots.length <= MIN_SLOTS}
              className="w-7 h-7 rounded bg-surface border border-line text-xs disabled:opacity-40 hover:bg-bg-alt"
              title="이미지 슬롯 줄이기"
            >
              −
            </button>
            <button
              type="button"
              onClick={() => setSlotCount(Math.min(MAX_SLOTS, slots.length + 1))}
              disabled={slots.length >= MAX_SLOTS}
              className="w-7 h-7 rounded bg-surface border border-line text-xs disabled:opacity-40 hover:bg-bg-alt"
              title="이미지 슬롯 늘리기"
            >
              +
            </button>
            <span className="w-px h-5 bg-line mx-1 self-center" />
            <button
              type="button"
              onClick={() => moveBy(-1)}
              className="w-7 h-7 rounded bg-surface border border-line text-xs hover:bg-bg-alt"
              title="위로 이동"
            >
              ↑
            </button>
            <button
              type="button"
              onClick={() => moveBy(1)}
              className="w-7 h-7 rounded bg-surface border border-line text-xs hover:bg-bg-alt"
              title="아래로 이동"
            >
              ↓
            </button>
            <button
              type="button"
              onClick={() => deleteNode()}
              className="w-7 h-7 rounded bg-surface border border-line text-xs text-red-600 hover:bg-bg-alt"
              title="블록 삭제"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex gap-3">
          {slots.map((slot, i) => {
            const cleanSrc = slot.src ? stripImagePosition(slot.src) : "";
            return (
              <div key={i} className="flex-1 min-w-0">
                <input
                  ref={(el) => {
                    fileRefs.current[i] = el;
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) onFile(i, f);
                    e.target.value = "";
                  }}
                />
                <div
                  className="relative w-full bg-bg-alt rounded overflow-hidden border border-line group"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  {cleanSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cleanSrc}
                      alt=""
                      className="w-full h-full object-cover"
                      style={{ ...getImageCropStyle(slot.src) }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileRefs.current[i]?.click()}
                      disabled={uploadingIndex === i}
                      className="absolute inset-0 flex items-center justify-center text-xs text-ink-muted hover:text-ink"
                    >
                      {uploadingIndex === i ? "업로드 중..." : "+ 이미지 선택"}
                    </button>
                  )}

                  {cleanSrc && (
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors pointer-events-none" />
                  )}
                  {cleanSrc && (
                    <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setCropIndex(i)}
                        title="크롭 위치 조정"
                        className="w-6 h-6 rounded bg-white/90 text-ink text-[0.65rem] flex items-center justify-center hover:bg-white shadow"
                      >
                        ⤢
                      </button>
                      <button
                        type="button"
                        onClick={() => fileRefs.current[i]?.click()}
                        title="이미지 교체"
                        className="w-6 h-6 rounded bg-white/90 text-ink text-[0.65rem] flex items-center justify-center hover:bg-white shadow"
                      >
                        ⟳
                      </button>
                      <button
                        type="button"
                        onClick={() => setSlot(i, { src: "" })}
                        title="이미지 제거"
                        className="w-6 h-6 rounded bg-white/90 text-red-600 text-[0.65rem] flex items-center justify-center hover:bg-white shadow"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {cropIndex !== null && slots[cropIndex]?.src && (
        <ImagePositionModal
          url={slots[cropIndex].src}
          aspectRatio="4 / 3"
          isVideo={false}
          onClose={() => setCropIndex(null)}
          onConfirm={(x, y, scale) => {
            const clean = stripImagePosition(slots[cropIndex].src);
            setSlot(cropIndex, { src: setImagePosition(clean, x, y, scale) });
            setCropIndex(null);
          }}
        />
      )}
    </NodeViewWrapper>
  );
}
