"use client";

import Image from "next/image";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import type { ChecklistHeroItem } from "@/lib/proseCards";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

type ChecklistHeroProps = {
  /** 작은 라벨 텍스트 — Hero/장비 페이지의 uppercase 라벨 관성을 따름 */
  eyebrow: string;
  title: string;
  subtext?: string;
  items: ChecklistHeroItem[];
  imageSrc: string | null;
  imageAlt: string;
};

/**
 * 데스크톱 방사형 배치에서 각 버블의 위치를 잡는 좌표.
 * 원형 사진(정중앙, 지름 약 42%)을 기준으로 4개 버블을 사방으로 흩어 놓는다.
 * 참고 이미지처럼 정확히 대칭인 상/하/좌/우가 아니라 살짝 어긋난 시계 방향
 * 배치로 "떠 있는" 느낌을 준다 — items는 항상 4개(label 4종 고정 소스)이므로
 * 인덱스별 좌표를 직접 하드코딩해도 데이터 변화에 깨지지 않는다.
 */
const BUBBLE_POSITIONS = [
  { top: "4%", left: "50%", translate: "translate(-50%, 0)" }, // 상단 중앙
  { top: "50%", left: "94%", translate: "translate(-100%, -50%)" }, // 우측 중앙
  { top: "96%", left: "50%", translate: "translate(-50%, -100%)" }, // 하단 중앙
  { top: "50%", left: "6%", translate: "translate(0, -50%)" }, // 좌측 중앙
];

function CheckIcon() {
  return (
    <span
      className="shrink-0 rounded-full flex items-center justify-center"
      style={{ width: "1.5rem", height: "1.5rem", background: "var(--color-accent)" }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 20 20" fill="none" style={{ width: "0.7rem", height: "0.7rem" }}>
        <path
          d="M4 10.5l3.5 3.5L16 6"
          stroke="var(--color-ink-inverse)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function ChecklistBubble({ item }: { item: ChecklistHeroItem }) {
  return (
    <div
      data-reveal-item
      className="checklist-hero-bubble flex items-start gap-2.5 rounded-2xl"
      style={{
        background: "var(--color-bg)",
        boxShadow: "0 12px 32px rgba(26, 23, 21, 0.28), 0 2px 8px rgba(26, 23, 21, 0.16)",
        padding: "0.85rem 1.1rem",
      }}
    >
      <CheckIcon />
      <span style={{ lineHeight: 1.4, letterSpacing: "-0.01em" }}>
        <strong className="font-semibold block" style={{ color: "var(--color-accent)", fontSize: "0.92rem" }}>
          {item.label}
        </strong>
        {item.detail && (
          <span className="block mt-0.5" style={{ fontSize: "0.78rem", color: "var(--color-ink-soft)" }}>
            {item.detail}
          </span>
        )}
      </span>
    </div>
  );
}

/**
 * "레이저로 다가가는 피부 고민" 체크리스트 전용 히어로 섹션.
 * body richtext 안의 h3+ul(그룹 A/B와는 다른, 별도 selector)을
 * lib/proseCards.ts의 extractChecklistHero로 뽑아낸 데이터를 받아
 * 중앙 원형 인물 사진 + 사방에 떠 있는 체크리스트 버블로 렌더링한다.
 * app/subpages/[slug]/page.tsx에서 slug==="laser" && 제목 매칭일 때만 쓰이며,
 * 다른 서브페이지의 체크리스트(.prose h3+ul/.prose h2~ul CSS)는 건드리지 않는다.
 *
 * 레이아웃 히스토리: 처음엔 좌측 사진 풀블리드 + 우측 다크 카드 2x2 그리드였으나,
 * 카드 배경이 rgba(251,250,247,0.08)로 다크 배경과 거의 구분되지 않아 카드
 * 자체의 형태가 흐려지고 그 위 흰 텍스트가 배경에 붕 뜬 것처럼 읽혀
 * "글씨가 안 보인다"는 피드백을 받았다(계산해보면 텍스트 자체의 WCAG 대비는
 * ≈9.3:1로 나쁘지 않았다 — 문제는 명암비가 아니라 카드-배경 경계의 소실이었다).
 * 참고 이미지(중앙 이미지 + 방사형 텍스트 버블)의 구조를 차용하되, 배경은
 * 사이트 다크 섹션 톤(#2C2620→#4A3A2E)을 유지하고 버블은 밝은 solid
 * var(--color-bg)로 채워 "어두운 배경 위 밝은 말풍선"의 대비 원리를 그대로
 * 이 팔레트로 옮겼다 — 결과 대비는 label(accent) 8.1:1, detail(ink-soft) 11.1:1.
 */
export default function ChecklistHero({
  eyebrow,
  title,
  subtext,
  items,
  imageSrc,
  imageAlt,
}: ChecklistHeroProps) {
  const textRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  // 데스크톱/모바일은 서로 다른 DOM 서브트리(하나는 항상 display:none)라
  // 콜백 ref를 공유하면 두 번째로 마운트되는 쪽이 첫 번째 쪽의
  // IntersectionObserver를 disconnect시켜버린다(useScrollReveal의 setRef가
  // "이전 cleanup → 새 el에 옵저버 부착" 구조이기 때문). 두 트리를 위해
  // 훅을 각각 별도로 호출해 완전히 독립된 옵저버 인스턴스를 갖게 한다.
  const gridRefDesktop = useScrollRevealGroup<HTMLDivElement>();
  const photoRefDesktop = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const gridRefMobile = useScrollRevealGroup<HTMLDivElement>();
  const photoRefMobile = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });

  // 방사형 배치는 정확히 4개 항목을 전제로 좌표를 하드코딩했다(BUBBLE_POSITIONS).
  // extractChecklistHero가 4항목이 아닌 다른 개수를 반환하는 원본 데이터로
  // 바뀌는 경우를 대비해, 4개를 넘는 항목은 방사형 자리표가 없으므로 데스크톱
  // 배치에서 잘라내고(모바일 그리드에서는 전부 노출) 방어적으로 렌더링한다.
  const radialItems = items.slice(0, BUBBLE_POSITIONS.length);

  return (
    <section
      className="checklist-hero relative my-16 md:my-24 rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
    >
      <div className="relative px-6 py-14 sm:px-10 md:px-12 md:py-20">
        <div ref={textRef} className="reveal-fade-up text-center max-w-2xl mx-auto">
          <span
            className="text-xs font-semibold uppercase opacity-70 block text-ink-inverse"
            style={{ letterSpacing: "0.2em" }}
          >
            {eyebrow}
          </span>
          <h2
            className="font-display text-ink-inverse mt-4"
            style={{
              fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.3,
              textWrap: "balance",
            }}
          >
            {title}
          </h2>
          {subtext && (
            <p
              className="mt-3 text-sm text-ink-inverse opacity-70"
              style={{ letterSpacing: "-0.01em", lineHeight: 1.7 }}
            >
              {subtext}
            </p>
          )}
        </div>

        {/* 데스크톱: 원형 사진을 중심에 두고 버블 4개를 사방에 방사형으로 배치.
            컨테이너에 정사각형에 가까운 높이를 줘 절대 위치 좌표(%)가 예측
            가능하게 만든다. 모바일에서는 방사형이 비좁아지므로 아예 다른
            트리 구조(사진 상단 + 버블 2열 그리드)로 폴백한다 — 두 레이아웃을
            하나의 absolute 좌표계로 억지로 겸용하지 않는다.
            gridRefDesktop을 이 바깥 컨테이너에 직접 건다 — 예전에는 사진과
            버블들 사이에 `display: contents` 래퍼를 두고 거기에 옵저버를
            달았는데, `display: contents`는 레이아웃 박스를 만들지 않아
            IntersectionObserver가 교차 여부를 계산하지 못해 옵저버가 전혀
            트리거되지 않는 문제가 있었다(버블이 opacity:0에 영구히 멈춤).
            버블과 사진을 형제로 두고 실제 박스를 가진 이 relative 컨테이너를
            관찰 대상으로 삼으면, querySelectorAll('[data-reveal-item]')이
            하위 트리 전체에서 버블만 정확히 골라내므로 사진에는 영향이 없다. */}
        <div
          ref={gridRefDesktop}
          className="hidden md:block relative mx-auto mt-14"
          style={{ maxWidth: "40rem", aspectRatio: "1 / 1" }}
        >
          <div
            ref={photoRefDesktop}
            className="reveal-scale absolute rounded-full overflow-hidden bg-bg-alt"
            style={{
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: "44%",
              aspectRatio: "1 / 1",
              boxShadow: "0 24px 64px rgba(0, 0, 0, 0.35)",
              border: "6px solid rgba(251, 250, 247, 0.1)",
            }}
          >
            {imageSrc && (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="20rem"
                quality={75}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            )}
          </div>

          {radialItems.map((item, i) => {
            const pos = BUBBLE_POSITIONS[i];
            return (
              <div
                key={i}
                className="absolute"
                style={{
                  top: pos.top,
                  left: pos.left,
                  transform: pos.translate,
                  width: "15rem",
                }}
              >
                <ChecklistBubble item={item} />
              </div>
            );
          })}
        </div>

        {/* 모바일: 사진을 상단 중앙에 크게, 버블은 그 아래 2열 그리드로 —
            StepProcess.tsx가 데스크톱 zig-zag를 모바일에서 단순 세로 스택으로
            폴백하는 것과 같은 관성으로, 방사형 좌표를 억지로 축소하지 않고
            아예 다른(더 단순한) 구조를 쓴다. */}
        <div className="md:hidden mt-10">
          <div
            ref={photoRefMobile}
            className="reveal-scale relative mx-auto rounded-full overflow-hidden bg-bg-alt"
            style={{
              width: "min(60vw, 14rem)",
              aspectRatio: "1 / 1",
              boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
              border: "5px solid rgba(251, 250, 247, 0.1)",
            }}
          >
            {imageSrc && (
              <Image
                src={imageSrc}
                alt={imageAlt}
                fill
                className="object-cover"
                sizes="14rem"
                quality={75}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            )}
          </div>

          <div ref={gridRefMobile} className="grid grid-cols-2 gap-2.5 mt-8">
            {items.map((item, i) => (
              <ChecklistBubble key={i} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
