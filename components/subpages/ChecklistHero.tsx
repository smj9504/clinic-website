"use client";

import Image from "next/image";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import type { ChecklistHeroItem } from "@/lib/proseCards";
import type { SubPageChecklistHeroPosition } from "@/lib/data";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

type HeroCardItem = ChecklistHeroItem & { position?: SubPageChecklistHeroPosition; x?: number; y?: number };

type ChecklistHeroProps = {
  /** 작은 라벨 텍스트 — Hero/장비 페이지의 uppercase 라벨 관성을 따름 */
  eyebrow: string;
  title: string;
  subtext?: string;
  items: HeroCardItem[];
  imageSrc: string | null;
  imageAlt: string;
};

/**
 * 데스크톱에서 카드가 사진 위 사방에 흩어지는 4가지 프리셋 좌표.
 * SubPageChecklistHeroPosition의 값과 키가 정확히 대응하며, admin에서
 * 관리자가 항목마다 이 중 하나를 선택한다. richtext 자동 감지 폴백
 * 경로(position 없음)에서는 인덱스 순서(top-left → right-mid → bottom-left
 * → bottom-right)로 순환 배정해 기존 레이아웃을 그대로 유지한다.
 * 정확히 대칭인 그리드가 아니라 카드마다 폭과 위치를 살짝 어긋나게 해
 * "떠다니는" 느낌을 낸다.
 */
const CARD_POSITION_STYLES: Record<
  SubPageChecklistHeroPosition,
  { top?: string; bottom?: string; left?: string; right?: string; width?: string }
> = {
  "top-left": { top: "6%", left: "4%", width: "16rem" },
  "right-mid": { bottom: "32%", right: "5%", width: "15rem" },
  "bottom-left": { bottom: "8%", left: "5.5%", width: "15.5rem" },
  "bottom-right": { bottom: "6%", right: "5.5%", width: "15.5rem" },
};

const POSITION_CYCLE: SubPageChecklistHeroPosition[] = ["top-left", "right-mid", "bottom-left", "bottom-right"];

/** 프리셋 위치별로 카드가 등장 시 밀려 들어올 방향 — 이름 그대로 그 방향에서 온다 */
const PRESET_REVEAL_DIR: Record<SubPageChecklistHeroPosition, "top" | "bottom" | "left" | "right"> = {
  "top-left": "top",
  "right-mid": "right",
  "bottom-left": "bottom",
  "bottom-right": "bottom",
};

function ChecklistCard({
  item,
  position,
}: {
  item: HeroCardItem;
  position?: SubPageChecklistHeroPosition;
}) {
  // x/y 자유 좌표(admin 드래그 배치)가 있으면 그걸 우선 쓰고, 없는 구버전
  // 데이터만 4개 프리셋 좌표로 폴백한다. 카드는 폭이 고정이라 -translate로
  // 중심을 좌표에 맞추되, 사진 가장자리 쪽으로 잘리지 않도록 gridArea 대신
  // left/top 백분율 + transform 조합을 쓴다.
  const hasFreePosition = typeof item.x === "number" && typeof item.y === "number";
  const presetStyle = !hasFreePosition && position ? CARD_POSITION_STYLES[position] : undefined;
  const freeStyle = hasFreePosition
    ? { left: `${item.x}%`, top: `${item.y}%`, transform: "translate(-50%, -50%)", width: "15.5rem" }
    : undefined;
  const positionStyle = freeStyle ?? presetStyle;

  // 자유 좌표는 화면 중심 기준 가까운 가장자리 방향에서 밀려오게 하고,
  // 프리셋 위치는 이름이 곧 방향이다(좌상단 카드는 위에서, 우하단 카드는
  // 아래에서 등). 사진과 카드가 하나의 장면처럼 조립되는 느낌을 준다.
  const revealDir = hasFreePosition
    ? Math.abs((item.y ?? 50) - 50) >= Math.abs((item.x ?? 50) - 50)
      ? (item.y ?? 50) < 50 ? "top" : "bottom"
      : (item.x ?? 50) < 50 ? "left" : "right"
    : position
    ? PRESET_REVEAL_DIR[position]
    : "bottom";

  return (
    <div
      data-reveal-item
      className={`checklist-hero-card reveal-dir-${revealDir} rounded-xl${positionStyle ? " absolute" : ""}`}
      style={{
        background: "rgba(26, 20, 16, 0.6)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        border: "1px solid rgba(251, 250, 247, 0.16)",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.25)",
        padding: "0.9rem 1.1rem",
        ...positionStyle,
      }}
    >
      <strong
        className="font-semibold block text-ink-inverse"
        style={{ fontSize: "0.92rem", lineHeight: 1.45, letterSpacing: "-0.01em" }}
      >
        {item.label}
      </strong>
      {item.detail && (
        <span
          className="block mt-0.5"
          style={{ fontSize: "0.78rem", color: "rgba(251, 250, 247, 0.72)", lineHeight: 1.55, letterSpacing: "-0.01em" }}
        >
          {item.detail}
        </span>
      )}
    </div>
  );
}

/**
 * "레이저로 다가가는 피부 고민" 체크리스트 전용 히어로 섹션.
 * body richtext 안의 h3+ul(그룹 A/B와는 다른, 별도 selector)을
 * lib/proseCards.ts의 extractChecklistHero로 뽑아낸 데이터를 받아
 * 인물 사진 위에 제목과 체크리스트 카드가 겹쳐 떠 있는 히어로로 렌더링한다.
 * app/subpages/[slug]/page.tsx에서 slug==="laser" && 제목 매칭일 때만 쓰이며,
 * 다른 서브페이지의 체크리스트(.prose h3+ul/.prose h2~ul CSS)는 건드리지 않는다.
 *
 * 레이아웃 히스토리: 처음엔 좌측 사진 풀블리드 + 우측 다크 카드 2x2 그리드였으나,
 * 카드 배경이 rgba(251,250,247,0.08)로 다크 배경과 거의 구분되지 않아 카드
 * 자체의 형태가 흐려지고 그 위 흰 텍스트가 배경에 붕 뜬 것처럼 읽혀
 * "글씨가 안 보인다"는 피드백을 받았다.
 * 레이아웃 히스토리 2: 중앙 원형 사진 + 사방에 흩어진 카드로 바꿨으나, 정사각형
 * 컨테이너 안에 사진을 44%만 채워 상하좌우에 큰 빈 공간이 남고 원형 프레임 +
 * 반투명 테두리가 그 자체로 눈에 띄는 장식이 되어 "생성된 느낌"이라는
 * 피드백을 받았다.
 * 레이아웃 히스토리 3: "인물 사진은 배경을 포함한 이미지이고 그 위에 카드를
 * 띄웠으면 한다"는 요청에 따라, 사진을 원형 크롭 없이 섹션 전체를 채우는
 * 큰 사각형 풀블리드로 두고 체크리스트 카드 4개를 그 위 사방에 절대 위치로
 * 흩어 놓았다. 방사형(히스토리 2)의 실패 원인이었던 "작은 원형 사진 + 빈
 * 여백"을 피하기 위해 사진 자체는 여백 없이 섹션을 꽉 채우고, 카드는
 * 반투명 유리 재질(backdrop-blur)로 사진 표면 위에 자연스럽게 얹히게 해
 * 사진과 별개의 물체로 둥둥 뜨지 않게 했다. 데스크톱만 절대 위치 사방
 * 배치를 쓰고, 카드 4개가 겹치기엔 세로 공간이 부족한 모바일에서는 사진
 * 하단에 2열 그리드로 폴백한다.
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
  const photoRef = useScrollReveal<HTMLDivElement>({ threshold: 0.2 });
  const cardsRefDesktop = useScrollRevealGroup<HTMLDivElement>({ staggerMs: 160 });
  const cardsRefMobile = useScrollRevealGroup<HTMLDivElement>({ staggerMs: 120 });
  // x/y 자유 좌표를 가진 카드는 admin에서 직접 배치한 개수 그대로 모두
  // 보여준다. 좌표가 없는 구버전 데이터(position 프리셋 또는 richtext
  // 자동 감지 폴백)만 프리셋 4자리로 제한한다.
  const freeItems = items.filter((it) => typeof it.x === "number" && typeof it.y === "number");
  const presetItems = items
    .filter((it) => !(typeof it.x === "number" && typeof it.y === "number"))
    .slice(0, POSITION_CYCLE.length);
  const radialItems = freeItems.length > 0 ? freeItems : presetItems;

  return (
    <section className="checklist-hero relative my-16 md:my-24 rounded-2xl overflow-hidden bg-bg-alt">
      <div className="relative aspect-[3/5] sm:aspect-[3/4] md:aspect-[16/10]">
        {imageSrc && (
          <div ref={photoRef} className="checklist-hero-photo absolute inset-0">
            <Image
              src={stripImagePosition(imageSrc)}
              alt={imageAlt}
              fill
              className="object-cover"
              style={{ objectPosition: toObjectPosition(imageSrc) }}
              sizes="100vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        )}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(20,16,13,0.6) 0%, rgba(20,16,13,0.05) 26%, rgba(20,16,13,0.05) 74%, rgba(20,16,13,0.6) 100%)",
          }}
        />

        <div className="absolute inset-x-0 top-0 px-6 pt-8 sm:px-10 sm:pt-10 md:px-12 md:pt-12">
          <div ref={textRef} className="reveal-fade-up text-center max-w-xl mx-auto">
            <span
              className="text-xs font-semibold uppercase opacity-80 block text-ink-inverse"
              style={{ letterSpacing: "0.2em" }}
            >
              {eyebrow}
            </span>
            <h2
              className="font-display text-ink-inverse mt-3"
              style={{
                fontSize: "clamp(1.5rem, 3.2vw, 2.25rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.3,
                textWrap: "balance",
                textShadow: "0 2px 16px rgba(0,0,0,0.35)",
              }}
            >
              {title}
            </h2>
            {subtext && (
              <p
                className="mt-2 text-sm text-ink-inverse opacity-85"
                style={{ letterSpacing: "-0.01em", lineHeight: 1.7 }}
              >
                {subtext}
              </p>
            )}
          </div>
        </div>

        {/* 데스크톱: 카드 4개를 사진 위 사방에 절대 위치로 흩어 배치.
            item.position(admin에서 지정)이 있으면 그걸 쓰고, 없으면(richtext
            자동 감지 폴백) 인덱스 순서로 4개 프리셋을 순환 배정한다. */}
        <div ref={cardsRefDesktop} className="hidden md:block absolute inset-0">
          {radialItems.map((item, i) => (
            <ChecklistCard key={i} item={item} position={item.position ?? POSITION_CYCLE[i]} />
          ))}
        </div>

        {/* 모바일: 사방 배치가 비좁으므로 사진 하단에 세로 스택으로 폴백.
            2열 그리드는 카드 폭이 좁아져 라벨이 부자연스럽게 줄바꿈됐다. */}
        <div
          ref={cardsRefMobile}
          className="md:hidden absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6 sm:pb-6 flex flex-col gap-2"
        >
          {items.map((item, i) => (
            <ChecklistCard key={i} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
