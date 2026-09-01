"use client";

import Image from "next/image";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

type StepProcessProps = {
  title: string;
  intro?: string;
  /** 스텝마다 다른 사진을 줄 수 있다 — 개별 image가 없는 스텝은 fallbackImage(공용 1장)로 대체 */
  steps: { text: string; image: string | null }[];
  fallbackImage?: string | null;
  imageAlt?: string;
  /** 스텝 목록 아래에 표시되는 자유 서식 보충 설명 (richtext HTML, 선택 사항) */
  note?: string;
};

/**
 * 진행 순서를 좌우 교차(zig-zag) 레이아웃으로 보여준다. 약침치료/추나치료처럼
 * "이렇게 진행됩니다" 류의 순서 안내에 쓰인다.
 *
 * 두 가지 소스에서 렌더링된다: (1) admin의 구조화 필드(subPages.stepProcess) —
 * 스텝마다 개별 사진 지정 가능, (2) 리치에디터 본문의 h2>img>p>ol 자동 감지
 * (lib/proseCards.ts) — 폴백 경로로, 이 경우 h2 섹션 공용 이미지 1장을
 * fallbackImage로 모든 스텝이 공유한다. 두 경로 모두 이 컴포넌트로 수렴하도록
 * props를 group 객체 대신 평면화했다.
 */
export default function StepProcess({ title, intro, steps, fallbackImage, imageAlt = "", note }: StepProcessProps) {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const noteRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  return (
    <div className="my-12 md:my-16">
      <div ref={headingRef} className="reveal-fade-up mb-10 md:mb-14">
        <h2
          className="font-display"
          style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          {title}
        </h2>
        {intro && (
          <p
            className="mt-3 text-ink-soft"
            style={{ fontSize: "1rem", lineHeight: 1.8, letterSpacing: "-0.01em" }}
          >
            {intro}
          </p>
        )}
      </div>

      <div>
        {steps.map((step, i) => (
          <StepRow
            key={i}
            index={i}
            text={step.text}
            image={step.image ?? fallbackImage ?? null}
            imageAlt={imageAlt}
          />
        ))}
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

function StepRow({
  index,
  text,
  image,
  imageAlt,
}: {
  index: number;
  text: string;
  image: string | null;
  imageAlt: string;
}) {
  const isEven = index % 2 === 0;
  const rowRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const stepLabel = `STEP ${String(index + 1).padStart(2, "0")}`;

  return (
    <div
      ref={rowRef}
      className={
        (isEven ? "reveal-slide-left" : "reveal-slide-right") +
        " grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 items-center py-10 md:py-14"
      }
      style={index > 0 ? { borderTop: "1px solid var(--color-line)" } : undefined}
    >
      <div className={isEven ? "md:order-1" : "md:order-2"}>
        <div className="relative aspect-square md:aspect-[4/3] rounded-2xl overflow-hidden bg-bg-alt">
          {image && (
            <Image
              src={stripImagePosition(image)}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ objectPosition: toObjectPosition(image) }}
              sizes="(max-width: 768px) 100vw, 50vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          )}
          <span
            aria-hidden="true"
            className={
              "absolute font-display select-none pointer-events-none" +
              (isEven ? " -left-2 -top-4 md:-left-4 md:-top-6" : " -right-2 -top-4 md:-right-4 md:-top-6")
            }
            style={{
              fontSize: "clamp(4.5rem, 12vw, 8rem)",
              fontWeight: 800,
              fontStyle: "italic",
              letterSpacing: "0.02em",
              lineHeight: 1,
              color: "var(--color-accent-soft)",
              opacity: 0.22,
            }}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>
      </div>

      <div className={(isEven ? "md:order-2" : "md:order-1") + " text-center md:text-left"}>
        <span
          className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold uppercase bg-accent text-ink-inverse"
          style={{ letterSpacing: "0.15em" }}
        >
          {stepLabel}
        </span>
        <p
          className="font-display mt-5"
          style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.5, whiteSpace: "pre-line" }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
