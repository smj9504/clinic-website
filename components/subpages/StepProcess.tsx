"use client";

import Image from "next/image";
import { useScrollReveal } from "@/lib/useScrollReveal";
import type { ProseStepGroup } from "@/lib/proseCards";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

type StepProcessProps = {
  group: ProseStepGroup;
};

/**
 * 진행 순서를 나타내는 h2>img>p>ol 구간(lib/proseCards.ts의 splitProseIntoSegments,
 * "steps" 세그먼트) 전용 좌우 교차(zig-zag) 레이아웃. 약침치료/추나치료처럼
 * "이렇게 진행됩니다" 류의 순서 안내에 쓰이며, 같은 패턴이 나타나는 어떤
 * 서브페이지에도 화이트리스트 없이 자동 적용된다(ChecklistHero와 달리 slug로
 * 좁히지 않음 — lib/proseCards.ts 주석 참고).
 *
 * 참고 이미지는 스텝마다 다른 사진을 쓰지만, 실제 body richtext에는 h2 섹션당
 * 이미지가 한 장뿐이라 그 한 장을 모든 스텝에서 재사용한다. 나중에 스텝별
 * 사진을 admin에서 따로 넣고 싶다면 이 컴포넌트의 props를 image: string[]로
 * 바꾸는 정도로 확장 가능하지만, 지금은 콘텐츠 소스 자체가 이미지 1장뿐이라
 * subPages 스키마는 건드리지 않았다.
 */
export default function StepProcess({ group }: StepProcessProps) {
  const headingRef = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });

  return (
    <div className="my-12 md:my-16">
      <div ref={headingRef} className="reveal-fade-up mb-10 md:mb-14">
        <h2
          className="font-display"
          style={{ fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
        >
          {group.title}
        </h2>
        {group.intro && (
          <p
            className="mt-3 text-ink-soft"
            style={{ fontSize: "1rem", lineHeight: 1.8, letterSpacing: "-0.01em" }}
          >
            {group.intro}
          </p>
        )}
      </div>

      <div>
        {group.steps.map((step, i) => (
          <StepRow key={i} index={i} text={step} image={group.image} imageAlt={group.imageAlt} />
        ))}
      </div>
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
              src={image}
              alt={imageAlt}
              fill
              className="object-cover"
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
          style={{ fontSize: "1.3rem", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.5 }}
        >
          {text}
        </p>
      </div>
    </div>
  );
}
