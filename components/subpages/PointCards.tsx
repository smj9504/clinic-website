"use client";

import Image from "next/image";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";

type PointCardsProps = {
  /** 카드 그리드 위에 표시되는 섹션 제목 (선택 사항 — 없으면 카드만 표시) */
  title?: string;
  points: { title: string; body: string; image?: string | null }[];
  /** 개별 image가 없는 카드에 쓰는 공용 폴백(리치에디터 자동 감지 경로) */
  fallbackImage?: string | null;
  imageAlt?: string;
  /** 카드 그리드 아래에 표시되는 자유 서식 보충 설명 (richtext HTML, 선택 사항) */
  note?: string;
};

/**
 * "POINT 01/02/03" 3열 카드. h2 섹션 안에 h3+p가 3개 이상 연속되는 구간은
 * "포인트 여러 개를 나란히 비교하는" 콘텐츠라 세로 목록보다 카드 3열이
 * 스캔하기 쉽다(lib/proseCards.ts splitProseIntoSegments 참고).
 *
 * 두 가지 소스에서 렌더링된다: (1) admin의 구조화 필드(subPages.pointCards) —
 * 카드마다 개별 사진 지정 가능, (2) 리치에디터 본문의 h2>img>(h3+p)×3+ 자동
 * 감지 — 폴백 경로로, 이 경우 h2 섹션 공용 이미지 1장을 fallbackImage로
 * 모든 카드가 공유한다.
 */
export default function PointCards({ title, points, fallbackImage, imageAlt = "", note }: PointCardsProps) {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const listRef = useScrollRevealGroup<HTMLDivElement>();
  const noteRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="my-10">
      {title && (
        <h2
          ref={headingRef}
          className="reveal-fade-up font-display mb-8"
          style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          {title}
        </h2>
      )}
      <div ref={listRef} className="grid grid-cols-2 max-[400px]:grid-cols-1 xl:grid-cols-4 gap-6">
      {points.map((point, i) => {
        const image = point.image ?? fallbackImage ?? null;
        return (
          <div
            key={i}
            data-reveal-item
            className="rounded-2xl border border-line overflow-hidden bg-surface"
          >
            {image && (
              <div className="relative aspect-[4/3]">
                <Image
                  src={image}
                  alt={imageAlt || point.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 400px) 100vw, (max-width: 1280px) 50vw, 25vw"
                  quality={75}
                />
              </div>
            )}
            <div className="p-6">
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase bg-accent text-ink-inverse mb-1"
                style={{ letterSpacing: "0.1em" }}
              >
                Point {String(i + 1).padStart(2, "0")}
              </span>
              <h3
                className="font-display mb-4"
                style={{ fontSize: "1.15rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.4 }}
              >
                {point.title}
              </h3>
              <p
                className="text-ink-soft"
                style={{ fontSize: "0.9rem", lineHeight: 1.75, letterSpacing: "-0.01em" }}
              >
                {point.body}
              </p>
            </div>
          </div>
        );
      })}
      </div>

      {note && (
        <div
          ref={noteRef}
          className="reveal-fade-up prose prose-neutral max-w-none text-ink-soft mt-10 pt-8"
          style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em", borderTop: "1px solid var(--color-line)" }}
          dangerouslySetInnerHTML={{ __html: note }}
        />
      )}
    </div>
  );
}
