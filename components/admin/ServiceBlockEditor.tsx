"use client";

import { useState } from "react";
import RichEditor from "@/components/admin/RichEditor";
import { Button, ImageInput, TextArea, TextInput } from "@/components/admin/ui";
import {
  BLOCK_PRESETS,
  createBlock,
  newId,
  rawText,
  withLocalized,
  type QnaPair,
  type ServiceBlock,
  type ServiceBlockText,
  type ServiceBlockType,
} from "@/lib/services";
import type { Locale } from "@/lib/i18n";

const TYPE_LABEL: Record<ServiceBlockType, string> = {
  richtext: "서식글 (이미지 삽입 가능)",
  points: "포인트 목록 (POINT 01·02·03)",
  steps: "번호 목록 (01·02)",
  notice: "주의 사항",
  qna: "Q&A",
  gallery: "사진",
};

const BLOCK_ORDER: ServiceBlockType[] = ["richtext", "points", "steps", "notice", "qna", "gallery"];

/** points · steps · notice 공용 — 한 줄씩 추가·삭제·이동 */
function StringListEditor({
  items,
  placeholder,
  onChange,
}: {
  items: string[];
  placeholder: string;
  onChange: (next: string[]) => void;
}) {
  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-start">
          <span className="text-xs text-ink-muted pt-3 w-6 shrink-0 text-right">{index + 1}</span>
          <TextArea
            placeholder={placeholder}
            value={item}
            onChange={(e) => onChange(items.map((v, i) => (i === index ? e.target.value : v)))}
            style={{ minHeight: "3.5rem" }}
          />
          <div className="flex flex-col gap-1 shrink-0">
            <Button type="button" size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>↑</Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</Button>
            <Button type="button" size="sm" variant="danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>✕</Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, ""])}>
        + 줄 추가
      </Button>
    </div>
  );
}

function QnaEditor({ items, onChange }: { items: QnaPair[]; onChange: (next: QnaPair[]) => void }) {
  const update = (index: number, patch: Partial<QnaPair>) =>
    onChange(items.map((pair, i) => (i === index ? { ...pair, ...patch } : pair)));

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {items.map((pair, index) => (
        <div key={index} className="border border-line rounded p-3 bg-bg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">Q{index + 1}</span>
            <div className="flex gap-1">
              <Button type="button" size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>↑</Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === items.length - 1}>↓</Button>
              <Button type="button" size="sm" variant="danger" onClick={() => onChange(items.filter((_, i) => i !== index))}>삭제</Button>
            </div>
          </div>
          <TextInput
            placeholder="질문을 입력하세요"
            value={pair.q}
            onChange={(e) => update(index, { q: e.target.value })}
            className="mb-2"
          />
          <TextArea
            placeholder="답변을 입력하세요"
            value={pair.a}
            onChange={(e) => update(index, { a: e.target.value })}
          />
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={() => onChange([...items, { q: "", a: "" }])}>
        + 질문 추가
      </Button>
    </div>
  );
}

function GalleryEditor({
  block,
  text,
  onBlockChange,
  onTextChange,
}: {
  block: ServiceBlock;
  text: Partial<ServiceBlockText>;
  onBlockChange: (patch: Partial<ServiceBlock>) => void;
  onTextChange: (patch: Partial<ServiceBlockText>) => void;
}) {
  const images = block.images ?? [];
  const captions = text.captions ?? {};

  return (
    <div className="space-y-3">
      {images.map((image, index) => (
        <div key={image.id} className="border border-line rounded p-3 bg-bg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-ink-muted">사진 {index + 1}</span>
            <Button
              type="button"
              size="sm"
              variant="danger"
              onClick={() => {
                // 캡션은 이미지 id로 매핑되어 있으므로 함께 지운다
                const { [image.id]: _removed, ...rest } = captions;
                onBlockChange({ images: images.filter((img) => img.id !== image.id) });
                onTextChange({ captions: rest });
              }}
            >
              삭제
            </Button>
          </div>
          <ImageInput
            value={image.url}
            onChange={(url) =>
              onBlockChange({
                images: images.map((img) => (img.id === image.id ? { ...img, url } : img)),
              })
            }
            aspectRatio="4 / 3"
          />
          <div className="mt-3">
            <label className="block text-xs font-semibold mb-1.5">캡션 (선택)</label>
            <TextInput
              placeholder="사진 아래에 표시할 설명"
              value={captions[image.id] ?? ""}
              onChange={(e) => onTextChange({ captions: { ...captions, [image.id]: e.target.value } })}
            />
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => onBlockChange({ images: [...images, { id: newId("img"), url: "" }] })}
      >
        + 사진 추가
      </Button>
    </div>
  );
}

export type ServiceBlockEditorProps = {
  blocks: ServiceBlock[];
  locale: Locale;
  onChange: (next: ServiceBlock[]) => void;
};

export default function ServiceBlockEditor({ blocks, locale, onChange }: ServiceBlockEditorProps) {
  const [newType, setNewType] = useState<ServiceBlockType>("richtext");

  const updateBlock = (id: string, patch: Partial<ServiceBlock>) =>
    onChange(blocks.map((b) => (b.id === id ? { ...b, ...patch } : b)));

  const updateText = (block: ServiceBlock, patch: Partial<ServiceBlockText>) =>
    updateBlock(block.id, { i18n: withLocalized(block.i18n, locale, patch) });

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {blocks.map((block, index) => {
        const text = rawText<ServiceBlockText>(block.i18n, locale);

        return (
          <div
            key={block.id}
            className={`border rounded-lg ${block.isHidden ? "border-line opacity-60" : "border-line"}`}
          >
            <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-line bg-bg-alt rounded-t-lg">
              <span className="text-[0.7rem] font-semibold text-ink-muted shrink-0" style={{ letterSpacing: "0.05em" }}>
                {TYPE_LABEL[block.type]}
              </span>
              <div className="flex gap-1 ml-auto shrink-0">
                <Button type="button" size="sm" variant="ghost" onClick={() => move(index, -1)} disabled={index === 0}>↑</Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => move(index, 1)} disabled={index === blocks.length - 1}>↓</Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => updateBlock(block.id, { isHidden: !block.isHidden })}
                >
                  {block.isHidden ? "노출" : "숨김"}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    if (!confirm("이 블록을 삭제하시겠습니까?")) return;
                    onChange(blocks.filter((b) => b.id !== block.id));
                  }}
                >
                  삭제
                </Button>
              </div>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-xs font-semibold mb-1.5">섹션 제목</label>
                <TextInput
                  placeholder={BLOCK_PRESETS[block.type][locale === "en" ? "en" : "ko"]}
                  value={text.title ?? ""}
                  onChange={(e) => updateText(block, { title: e.target.value })}
                />
              </div>

              {block.type === "richtext" && (
                <RichEditor
                  value={text.html ?? ""}
                  onChange={(html) => updateText(block, { html })}
                />
              )}

              {(block.type === "points" || block.type === "steps" || block.type === "notice") && (
                <StringListEditor
                  items={text.items ?? []}
                  placeholder={
                    block.type === "points"
                      ? "예: 비수술적 방법으로 간편하게 받고 싶은 분"
                      : block.type === "steps"
                      ? "예: 시술 직후부터 탄력 개선이 느껴집니다."
                      : "예: 시술 후 1주일간 사우나는 피해 주세요."
                  }
                  onChange={(items) => updateText(block, { items })}
                />
              )}

              {block.type === "qna" && (
                <QnaEditor items={text.qna ?? []} onChange={(qna) => updateText(block, { qna })} />
              )}

              {block.type === "gallery" && (
                <GalleryEditor
                  block={block}
                  text={text}
                  onBlockChange={(patch) => updateBlock(block.id, patch)}
                  onTextChange={(patch) => updateText(block, patch)}
                />
              )}
            </div>
          </div>
        );
      })}

      <div className="flex gap-2 flex-wrap items-center pt-2">
        <select
          value={newType}
          onChange={(e) => setNewType(e.target.value as ServiceBlockType)}
          className="px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent"
        >
          {BLOCK_ORDER.map((type) => (
            <option key={type} value={type}>
              {BLOCK_PRESETS[type].ko} — {TYPE_LABEL[type]}
            </option>
          ))}
        </select>
        <Button type="button" variant="secondary" onClick={() => onChange([...blocks, createBlock(newType)])}>
          + 블록 추가
        </Button>
      </div>
    </div>
  );
}
