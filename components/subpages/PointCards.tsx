"use client";

import Image from "next/image";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

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
/**
 * 넓은 화면(xl 이상)에서 쓸 열 수 — 카드 개수를 그대로 따라간다.
 *
 * 예전에는 개수와 무관하게 xl:grid-cols-4로 고정돼 있어서, 카드가 3개면
 * 네 번째 열이, 2개면 두 열이 빈 채로 남아 오른쪽이 허전하게 비어 보였다.
 * 개수만큼 열을 잡으면 몇 개든 화면 폭을 꽉 채운다.
 *
 * 5개 이상은 4열로 두고 줄바꿈시킨다 — 그 이상 늘리면 카드 하나의 폭이
 * 너무 좁아져 본문이 읽기 어려워진다.
 *
 * Tailwind는 빌드 시점에 클래스 문자열을 스캔하므로 `xl:grid-cols-${n}`처럼
 * 조합하면 CSS가 생성되지 않는다. 완성된 클래스명을 그대로 적어 둔다.
 */
const XL_COLS: Record<number, string> = {
  1: "xl:grid-cols-1",
  2: "xl:grid-cols-2",
  3: "xl:grid-cols-3",
  4: "xl:grid-cols-4",
};

export default function PointCards({ title, points, fallbackImage, imageAlt = "", note }: PointCardsProps) {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const listRef = useScrollRevealGroup<HTMLDivElement>();
  const noteRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  const xlCols = XL_COLS[points.length] ?? "xl:grid-cols-4";
  // 카드가 1개뿐이면 좁은 화면에서도 2열로 쪼갤 것이 없다
  const baseCols = points.length === 1 ? "grid-cols-1" : "grid-cols-2";

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
      <div ref={listRef} className={`grid ${baseCols} max-[400px]:grid-cols-1 ${xlCols} gap-6`}>
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
                  src={stripImagePosition(image)}
                  alt={imageAlt || point.title}
                  fill
                  className="object-cover"
                  style={{ ...getImageCropStyle(image) }}
                  // 넓은 화면의 열 수가 카드 개수에 따라 달라지므로 실제 표시
                  // 폭도 함께 달라진다. 4열 기준(25vw)으로 고정해 두면 2·3열
                  // 레이아웃에서 필요한 해상도보다 작은 원본을 받아 흐려진다.
                  sizes={`(max-width: 400px) 100vw, (max-width: 1280px) ${points.length === 1 ? "100vw" : "50vw"}, ${Math.round(100 / Math.min(points.length || 1, 4))}vw`}
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
                style={{ fontSize: "0.9rem", lineHeight: 1.75, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
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
