"use client";

import Image from "next/image";
import { blockText, type ServiceBlock } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

/** 두 자리 번호 — POINT 01 · 01. 형태로 쓴다 */
const pad2 = (n: number) => String(n + 1).padStart(2, "0");

/**
 * 관리자가 블록만 추가하고 내용을 비워 둔 경우, 제목만 덩그러니 남지 않도록
 * 내용이 있는 블록만 그린다.
 */
function hasContent(block: ServiceBlock, locale: Locale): boolean {
  const text = blockText(block, locale);
  switch (block.type) {
    case "richtext":
      return !!text.html && text.html.replace(/<[^>]*>/g, "").trim() !== "";
    case "points":
    case "steps":
    case "notice":
      return (text.items ?? []).some((item) => item.trim() !== "");
    case "checklist":
      return (text.items ?? []).some((item) => item.trim() !== "");
    case "qna":
      return (text.qna ?? []).some((pair) => pair.q?.trim() || pair.a?.trim());
    case "gallery":
      return (block.images ?? []).length > 0;
    default:
      return false;
  }
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h2
        className="font-display"
        style={{
          fontSize: "clamp(1.25rem, 2.5vw, 1.6rem)",
          fontWeight: 600,
          letterSpacing: "-0.035em",
          lineHeight: 1.3,
        }}
      >
        {children}
      </h2>
      <div className="w-12 h-0.5 bg-accent mt-4 mb-8" />
    </>
  );
}

/**
 * 채팅 말풍선 스타일 — 질문은 왼쪽 정렬 연한 말풍선, 답변은 오른쪽 정렬 진한 말풍선.
 * 아코디언이 아니라 항상 펼쳐 보여준다: 시술 Q&A는 3~5개 안팎이라 접어 둘 필요가 적고,
 * 말풍선 자체가 이미 질문/답변을 시각적으로 분리해 주므로 클릭해서 열어야 하는
 * 추가 상호작용을 넣지 않는 편이 자연스럽게 읽힌다.
 */
function QnaList({ items, blockId }: { items: { q: string; a: string }[]; blockId: string }) {
  const listRef = useScrollRevealGroup<HTMLDivElement>();

  return (
    <div ref={listRef} className="space-y-6">
      {items.map((pair, i) => (
        <div key={`${blockId}-${i}`} className="space-y-2">
          {pair.q && (
            <div data-reveal-item className="reveal-from-left flex">
              <div
                className="max-w-[85%] sm:max-w-[75%] bg-bg-alt rounded-2xl rounded-tl-sm px-5 py-3.5"
              >
                <span
                  className="text-accent font-bold mr-2"
                  style={{ fontSize: "0.85rem" }}
                  aria-hidden="true"
                >
                  Q.
                </span>
                <span
                  className="font-semibold text-ink"
                  style={{ letterSpacing: "-0.02em", lineHeight: 1.6 }}
                >
                  {pair.q}
                </span>
              </div>
            </div>
          )}
          {pair.a && (
            <div data-reveal-item className="reveal-from-right flex justify-end">
              <div className="max-w-[85%] sm:max-w-[75%] bg-ink rounded-2xl rounded-tr-sm px-5 py-4">
                <p
                  className="text-ink-inverse"
                  style={{ lineHeight: 1.85, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
                >
                  {pair.a}
                </p>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function BlockBody({ block, locale }: { block: ServiceBlock; locale: Locale }) {
  const text = blockText(block, locale);

  switch (block.type) {
    case "richtext":
      return (
        <div
          className="prose prose-neutral max-w-none text-ink-soft"
          style={{ fontSize: "1.02rem", lineHeight: 1.95, letterSpacing: "-0.01em" }}
          dangerouslySetInnerHTML={{ __html: text.html ?? "" }}
        />
      );

    case "points":
      return (
        <ul className="border-t border-line">
          {(text.items ?? [])
            .filter((item) => item.trim() !== "")
            .map((item, i) => (
              <li
                key={i}
                className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-6 py-5 border-b border-line"
              >
                <span
                  className="text-xs font-semibold text-ink-muted shrink-0 sm:w-24"
                  style={{ letterSpacing: "0.12em" }}
                >
                  POINT {pad2(i)}
                </span>
                <span
                  className="flex-1 text-ink-soft"
                  style={{ lineHeight: 1.8, letterSpacing: "-0.01em" }}
                >
                  {item}
                </span>
              </li>
            ))}
        </ul>
      );

    case "steps":
      return (
        <ol className="border-t border-line">
          {(text.items ?? [])
            .filter((item) => item.trim() !== "")
            .map((item, i) => (
              <li key={i} className="flex items-baseline gap-5 py-5 border-b border-line">
                <span
                  className="text-sm font-semibold text-line-strong shrink-0"
                  style={{ letterSpacing: "0.05em", fontVariantNumeric: "tabular-nums" }}
                >
                  {pad2(i)}
                </span>
                <span
                  className="flex-1 text-ink-soft"
                  style={{ lineHeight: 1.85, letterSpacing: "-0.01em" }}
                >
                  {item}
                </span>
              </li>
            ))}
        </ol>
      );

    case "notice":
      return (
        <div className="bg-bg-alt rounded p-6 md:p-8">
          <ul className="space-y-3">
            {(text.items ?? [])
              .filter((item) => item.trim() !== "")
              .map((item, i) => (
                <li key={i} className="flex items-baseline gap-3">
                  <span className="text-sale shrink-0" aria-hidden="true">
                    ·
                  </span>
                  <span
                    className="flex-1 text-ink-soft"
                    style={{ lineHeight: 1.8, letterSpacing: "-0.01em", fontSize: "0.95rem" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      );

    case "qna":
      return (
        <QnaList
          blockId={block.id}
          items={(text.qna ?? []).filter((pair) => pair.q?.trim() || pair.a?.trim())}
        />
      );

    case "gallery":
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {(block.images ?? []).map((image) => {
            const caption = text.captions?.[image.id];
            return (
              <figure key={image.id}>
                <div
                  className="relative bg-bg-alt rounded overflow-hidden"
                  style={{ aspectRatio: "4 / 3" }}
                >
                  <Image
                    src={stripImagePosition(image.url)}
                    alt={caption || ""}
                    fill
                    className="object-cover"
                    style={{ ...getImageCropStyle(image.url) }}
                    sizes="(max-width: 640px) 100vw, 50vw"
                    quality={75}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                </div>
                {caption && (
                  <figcaption className="text-xs text-ink-muted mt-2.5" style={{ lineHeight: 1.7 }}>
                    {caption}
                  </figcaption>
                )}
              </figure>
            );
          })}
        </div>
      );

    default:
      return null;
  }
}

/**
 * 사진 + 체크마크 목록 2단 레이아웃 — 다른 블록과 달리 이미지가 섹션 제목과
 * 나란히 배치되므로 SectionTitle을 재사용하지 않고 자체 레이아웃을 그린다.
 */
function ChecklistBlock({ block, locale }: { block: ServiceBlock; locale: Locale }) {
  const text = blockText(block, locale);
  const items = (text.items ?? []).filter((item) => item.trim() !== "");
  const image = (block.images ?? [])[0];
  const imageRef = useScrollReveal<HTMLDivElement>();
  const listRef = useScrollRevealGroup<HTMLUListElement>();

  return (
    <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10 md:gap-16 items-center">
      <div
        ref={imageRef}
        className="reveal-slide-left relative aspect-[4/5] md:aspect-[3/4] overflow-hidden rounded bg-bg-alt"
      >
        {image?.url && (
          <Image
            src={stripImagePosition(image.url)}
            alt={text.title || ""}
            fill
            className="object-cover"
            style={{ ...getImageCropStyle(image.url) }}
            sizes="(max-width: 768px) 100vw, 40vw"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
        )}
      </div>

      <div>
        <span className="section-label block mb-4">Check</span>
        {text.title && (
          <h2
            className="font-display mb-8"
            style={{
              fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.35,
            }}
          >
            {text.title}
          </h2>
        )}
        <ul ref={listRef} className="space-y-4">
          {items.map((item, i) => (
            <li key={i} data-reveal-item className="flex items-start gap-3">
              <svg
                className="shrink-0 text-accent"
                style={{ width: "1.25rem", height: "1.25rem", marginTop: "0.15em" }}
                viewBox="0 0 20 20"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5" />
                <path
                  d="M6 10.5l2.5 2.5L14 7.5"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="flex-1 text-ink-soft"
                style={{ lineHeight: 1.7, letterSpacing: "-0.01em" }}
              >
                {item}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export type ServiceBlocksProps = {
  blocks: ServiceBlock[];
  locale: Locale;
};

export default function ServiceBlocks({ blocks, locale }: ServiceBlocksProps) {
  const visible = blocks.filter((block) => !block.isHidden && hasContent(block, locale));
  if (visible.length === 0) return null;

  return (
    <div className="space-y-16 md:space-y-20">
      {visible.map((block) => {
        if (block.type === "checklist") {
          return <ChecklistBlock key={block.id} block={block} locale={locale} />;
        }
        const { title } = blockText(block, locale);
        return (
          <section key={block.id}>
            {title && <SectionTitle>{title}</SectionTitle>}
            <BlockBody block={block} locale={locale} />
          </section>
        );
      })}
    </div>
  );
}
