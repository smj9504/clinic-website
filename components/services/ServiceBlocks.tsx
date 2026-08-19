"use client";

import Image from "next/image";
import { useState } from "react";
import { blockText, type ServiceBlock } from "@/lib/services";
import type { Locale } from "@/lib/i18n";

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

function QnaList({ items, blockId }: { items: { q: string; a: string }[]; blockId: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className="border-t border-line">
      {items.map((pair, i) => {
        const open = openIndex === i;
        return (
          <li key={`${blockId}-${i}`} className="border-b border-line">
            <button
              type="button"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
              className="w-full flex items-start gap-4 text-left py-5 min-h-[3rem]"
            >
              <span
                className="text-accent font-bold shrink-0"
                style={{ fontSize: "0.95rem", lineHeight: 1.7 }}
              >
                Q
              </span>
              <span
                className="flex-1 font-medium"
                style={{ letterSpacing: "-0.02em", lineHeight: 1.7 }}
              >
                {pair.q}
              </span>
              <span
                className={`shrink-0 text-ink-muted text-xl leading-none transition-transform duration-300 mt-1 ${
                  open ? "rotate-45" : ""
                }`}
                aria-hidden="true"
              >
                +
              </span>
            </button>
            {open && pair.a && (
              <div className="flex items-start gap-4 pb-6 pr-8">
                <span
                  className="text-ink-muted font-bold shrink-0"
                  style={{ fontSize: "0.95rem", lineHeight: 1.9 }}
                >
                  A
                </span>
                <p
                  className="flex-1 text-ink-soft"
                  style={{ lineHeight: 1.9, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
                >
                  {pair.a}
                </p>
              </div>
            )}
          </li>
        );
      })}
    </ul>
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
        <div className="bg-bg-alt rounded p-6 md:p-8" style={{ borderLeft: "3px solid var(--color-sale)" }}>
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
                    src={image.url}
                    alt={caption || ""}
                    fill
                    className="object-cover"
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
