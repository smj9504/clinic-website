"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal, useScrollRevealGroup } from "@/lib/useScrollReveal";
import {
  splitProseIntoSegments,
  extractChecklistHero,
  extractH2Checklist,
  type ProseCardGroup,
  type ProseTabGroup,
} from "@/lib/proseCards";
import ChecklistHero from "@/components/subpages/ChecklistHero";
import TreatmentAreaMap, { type TreatmentArea } from "@/components/subpages/TreatmentAreaMap";
import BodyAreaMap, { type BodyArea } from "@/components/subpages/BodyAreaMap";
import StepProcess from "@/components/subpages/StepProcess";
import SequentialChecklist from "@/components/subpages/SequentialChecklist";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

/**
 * "레이저로 다가가는 피부 고민" 체크리스트만 좌측사진+우측카드그리드 히어로로
 * 승격한다. slug와 h3 제목 텍스트(ko/en) 둘 다 정확히 일치해야 매칭되므로
 * 다른 서브페이지(리프팅, 통증치료 등)의 체크리스트는 지금처럼
 * .prose h3+ul / .prose h2~ul CSS 스타일 그대로 유지된다. splitProseIntoSegments와
 * 달리 모든 h3+ul을 자동 승격시키지 않는, 의도적으로 좁은 화이트리스트다 —
 * 다른 페이지에도 이 스타일을 쓰고 싶다면 이 객체에 슬러그를 추가하면 된다.
 */
const CHECKLIST_HERO_HEADINGS: Record<string, string> = {
  "레이저로 다가가는 피부 고민": "laser",
  "Skin concerns we address with laser": "laser",
};

/**
 * BodyAreaMap이 체크리스트를 완전히 대체하는 페이지만 여기 등록한다.
 * 매칭되면 원본 h2+ul을 body에서 제거해(extractH2Checklist) 맵과 텍스트가
 * 중복 노출되지 않게 한다 — CHECKLIST_HERO_HEADINGS와 동일한 화이트리스트
 * 원칙: slug+제목이 정확히 일치할 때만 제거하므로 다른 페이지의 h2+ul은
 * 지금처럼 .prose h2+ul CSS로 그대로 남는다.
 */
const BODY_MAP_CHECKLIST_HEADINGS: Record<string, string> = {
  "이런 통증으로 고민하고 계신가요": "pain-treatment",
  "Are You Struggling With Pain Like This?": "pain-treatment",
};

/**
 * SequentialChecklist(자동 순차 강조 + 우측 사진 전환)가 체크리스트를
 * 대체하는 페이지. BODY_MAP_CHECKLIST_HEADINGS와 같은 화이트리스트
 * 원칙 — herbal-clinic의 "이런 분들께 추천합니다"만 대상이고 다른
 * 페이지의 h2+ul은 지금처럼 .prose h2+ul CSS로 유지된다.
 */
const SEQUENTIAL_CHECKLIST_HEADINGS: Record<string, string> = {
  "이런 분들께 추천합니다": "herbal-clinic",
  "Recommended For": "herbal-clinic",
};

/**
 * 리프팅 페이지 전용 시술 가능 부위 맵. body richtext 안에는 부위별 좌표를
 * 표현할 수 없어(자유 텍스트일 뿐 이미지 위 좌표 데이터가 아님) prose 파싱
 * 파이프라인 밖에 별도 데이터로 둔다. 좌표는 public/lifting-face.jpg(1400x933,
 * 3:2)의 실제 얼굴 위치를 격자 오버레이로 측정해 얻었다 — TreatmentAreaMap의
 * 컨테이너도 같은 3:2 비율(aspect-[3/2])이라 object-cover로 잘리는 부분 없이
 * 원본 그대로 표시되므로 이 퍼센트 값이 화면에 그대로 대응한다. 사진을
 * 교체하면 이 좌표도 함께 다시 측정해야 한다.
 */
const TREATMENT_AREA_IMAGE = "/lifting-face.jpg";

const LIFTING_TREATMENT_AREAS: TreatmentArea[] = [
  {
    id: "forehead",
    x: 50,
    y: 21,
    label: "이마",
    description: "가로 주름과 처짐으로 인상이 무거워 보이는 부위입니다. 탄력을 끌어올려 이마 라인을 매끄럽게 정리합니다.",
  },
  {
    id: "eye",
    x: 60,
    y: 40,
    label: "눈가",
    description: "피부가 얇아 탄력 저하가 가장 먼저 드러나는 부위입니다. 잔주름과 처짐을 함께 개선합니다.",
  },
  {
    id: "cheek",
    x: 39,
    y: 49,
    label: "볼",
    description: "볼륨이 아래로 이동하며 얼굴 라인이 흐려지는 부위입니다. 처진 볼륨을 끌어올려 갸름한 인상을 만듭니다.",
  },
  {
    id: "nasolabial",
    x: 61,
    y: 57,
    label: "팔자주름",
    description: "볼 처짐과 함께 깊어지는 팔자 라인입니다. 주변 조직을 탄탄하게 잡아주어 주름을 완화합니다.",
  },
  {
    id: "jawline",
    x: 40,
    y: 65,
    label: "턱",
    description: "턱선이 무너지며 얼굴형이 흐트러지는 부위입니다. 턱 라인을 선명하게 잡아 윤곽을 살립니다.",
  },
  {
    id: "double-chin",
    x: 56,
    y: 71,
    label: "이중턱",
    description: "지방과 처짐이 함께 작용해 이중턱으로 이어지는 부위입니다. 턱 아래 라인을 정리해 옆모습을 매끈하게 만듭니다.",
  },
];

/**
 * 통증치료 페이지 전용 통증 부위 맵. body richtext의 "이런 통증으로 고민하고
 * 계신가요" 체크리스트(h2+ul, 7개 항목) 중 특정 신체 부위로 지목되는 4개만
 * 핫스팟으로 옮기고, 부위가 아닌 나머지 3개(운동·부상 회복, 수술 후 재활,
 * 골절 후 회복 — 상황이지 위치가 아님)는 맵 아래 footnote로 내린다. 원본
 * 체크리스트는 .prose h2+ul로 계속 렌더링되므로 내용이 사라지지 않고
 * 두 번 보이는 형태다: 위에서 시각적으로 훑고, 아래에서 다시 텍스트로 확인.
 * PAIN_AREA_IMAGE는 리프팅 페이지와 같은 이유로 실제 전신 사진이 등록되기
 * 전까지 비워 둔다.
 */
const PAIN_AREA_IMAGE: string | null = null;

const PAIN_TREATMENT_AREAS: BodyArea[] = [
  {
    id: "neck-shoulder",
    x: 50,
    y: 18,
    label: "목·어깨",
    description: "목과 어깨가 자주 결리고 뻣뻣한 느낌이 지속되거나, 일자목·거북목 등 체형 불균형이 신경 쓰이는 부위입니다.",
  },
  {
    id: "lower-back",
    x: 50,
    y: 45,
    label: "허리",
    description: "앉아있거나 움직일 때 통증과 불편함이 느껴지는 부위입니다. 정렬 불균형이나 근육 긴장이 원인일 수 있습니다.",
  },
  {
    id: "knee",
    x: 38,
    y: 72,
    label: "무릎",
    description: "무릎 관절 부위에 통증이 있거나, 운동·활동 중 부상 이후 회복이 필요한 부위입니다.",
  },
  {
    id: "ankle",
    x: 55,
    y: 93,
    label: "발목",
    description: "발목 관절 부위의 통증이나 부상 후 회복 관리가 필요한 부위입니다.",
  },
];

const PAIN_TREATMENT_FOOTNOTE = [
  "운동·활동 중 부상 회복",
  "척추·관절 수술 후 재활 관리",
  "골절 후 회복 과정 관리",
];

/**
 * "이런 분들께 추천합니다" 체크리스트와 달리, h2 섹션 안에 h3+p가 3개 이상
 * 연속되는 구간은 그 자체가 "포인트 여러 개를 나란히 비교하는" 콘텐츠라
 * 세로 목록보다 카드 3열이 스캔하기 쉽다. 카드용 이미지가 콘텐츠에 없어
 * 같은 h2 섹션의 공용 이미지를 그대로 재사용한다(splitProseIntoSegments 참고).
 */
function PointCards({ group }: { group: ProseCardGroup }) {
  const listRef = useScrollRevealGroup<HTMLDivElement>();

  return (
    <div ref={listRef} className="grid grid-cols-2 max-[400px]:grid-cols-1 xl:grid-cols-4 gap-6 my-10">
      {group.points.map((point, i) => (
        <div
          key={i}
          data-reveal-item
          className="rounded-2xl border border-line overflow-hidden bg-surface"
        >
          {group.image && (
            <div className="relative aspect-[4/3]">
              <Image
                src={group.image}
                alt={group.imageAlt || point.title}
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
      ))}
    </div>
  );
}

/**
 * PointCards와 같은 h2>img>(h3+p) 뭉치지만, 각 항목 뒤에 ul이 두 개
 * (해시태그, 장점) 더 붙어 있을 때만 만들어지는 더 풍부한 변형 — 여러 치료법을
 * 나란히 비교하기보다 "하나씩 골라 깊이 읽는" 콘텐츠라 그리드 대신 탭으로
 * 전환한다. 탭은 클릭으로만 전환한다: hover 미리보기를 쓰는 장비소개 탭과
 * 달리, 본문을 정독하는 흐름에서 마우스가 스치기만 해도 내용이 바뀌면
 * 오히려 읽던 자리를 잃게 만든다.
 */
function TabbedPoints({ group }: { group: ProseTabGroup }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useScrollReveal<HTMLDivElement>();
  const active = group.points[activeIndex];

  return (
    <div className="my-10">
      <div className="flex flex-wrap items-center gap-3 mb-10">
        {group.points.map((point, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setActiveIndex(i)}
              className={
                isActive
                  ? "px-7 py-3.5 rounded-full bg-accent text-ink-inverse font-semibold transition-colors"
                  : "px-7 py-3.5 rounded-full border border-line font-medium text-ink-soft hover:border-line-strong hover:text-ink transition-colors"
              }
              style={{ fontSize: "1.05rem", letterSpacing: "-0.01em" }}
              aria-pressed={isActive}
            >
              {point.title}
            </button>
          );
        })}
      </div>

      <div
        key={activeIndex}
        ref={panelRef}
        className="reveal-fade-up grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10 md:gap-14 items-start"
      >
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line">
          {group.image && (
            <Image
              src={group.image}
              alt={group.imageAlt || active.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 40vw"
              quality={75}
            />
          )}
        </div>

        <div>
          {active.tags.length > 0 && (
            <p
              className="text-accent font-medium mb-2"
              style={{ fontSize: "0.95rem", letterSpacing: "-0.01em" }}
            >
              {active.tags.map((tag) => `#${tag}`).join(" ")}
            </p>
          )}
          <h3
            className="font-display mb-6"
            style={{ fontSize: "1.75rem", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            {active.title}
          </h3>
          <p
            className="text-ink-soft mb-8"
            style={{ fontSize: "1rem", lineHeight: 1.85, letterSpacing: "-0.01em" }}
          >
            {active.body}
          </p>

          {active.benefits.length > 0 && (
            <>
              <h4
                className="font-display mb-4"
                style={{ fontSize: "1.05rem", fontWeight: 700, letterSpacing: "-0.02em" }}
              >
                장점
              </h4>
              <ul className="space-y-3">
                {active.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span
                      className="shrink-0 bg-accent"
                      style={{ width: "5px", height: "5px", marginTop: "0.55em" }}
                      aria-hidden="true"
                    />
                    <span
                      className="flex-1 text-ink-soft"
                      style={{ fontSize: "0.95rem", lineHeight: 1.7, letterSpacing: "-0.01em" }}
                    >
                      {benefit}
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubPageDetail() {
  const { slug } = useParams();
  const { subPages, menus, clinicInfo } = useSiteData();
  const t = useT();
  const fallbackImage = clinicInfo.defaultImage || "/gowoonbit.jpg";
  // 본문 전체(.prose)는 richtext 길이에 따라 수백~수천 px까지 늘어날 수 있어,
  // 기본 threshold(0.15)로는 컨테이너의 15%가 뷰포트에 들어올 때까지 기다리다가
  // 실질적으로 절대 발동하지 않는 경우가 생긴다(예: pain-treatment 본문 3100px+).
  // 이 래퍼의 목적은 스크롤 안무가 아니라 "hydrate 전 미스타일 콘텐츠 깜빡임 방지"이므로
  // threshold를 낮춰 컨테이너 상단 일부만 보여도 즉시 반응하게 한다.
  const bodyRef = useScrollReveal<HTMLDivElement>({ threshold: 0.01, rootMargin: "0px 0px -10% 0px" });

  const page = (subPages ?? []).find((sp) => sp.slug === slug && !sp.isHidden);

  // CHECKLIST_HERO_HEADINGS에 등록된 slug+제목 조합일 때만 매칭 시도 — 다른
  // 페이지는 extractChecklistHero를 아예 호출하지 않아 회귀 위험이 없다.
  const checklistHero = useMemo(() => {
    if (!page?.body?.startsWith("<")) return null;
    const targetHeading = Object.keys(CHECKLIST_HERO_HEADINGS).find(
      (heading) => CHECKLIST_HERO_HEADINGS[heading] === page.slug
    );
    if (!targetHeading) return null;
    return extractChecklistHero(page.body, targetHeading);
  }, [page?.body, page?.slug]);

  // BODY_MAP_CHECKLIST_HEADINGS에 등록된 slug+제목 조합일 때만 원본 h2+ul을
  // body에서 제거한다 — BodyAreaMap이 같은 정보를 시각적으로 대체하므로
  // 텍스트 체크리스트가 맵과 함께 중복 노출되지 않게 한다.
  const bodyMapChecklist = useMemo(() => {
    if (!page?.body?.startsWith("<")) return null;
    const targetHeading = Object.keys(BODY_MAP_CHECKLIST_HEADINGS).find(
      (heading) => BODY_MAP_CHECKLIST_HEADINGS[heading] === page.slug
    );
    if (!targetHeading) return null;
    return extractH2Checklist(page.body, targetHeading);
  }, [page?.body, page?.slug]);

  // SEQUENTIAL_CHECKLIST_HEADINGS에 등록된 slug+제목 조합일 때만 원본 h2+ul을
  // body에서 제거한다 — SequentialChecklist가 같은 목록을 자동 순차 강조 +
  // 우측 사진 전환으로 대체하므로 텍스트 체크리스트가 중복 노출되지 않게 한다.
  const sequentialChecklist = useMemo(() => {
    if (!page?.body?.startsWith("<")) return null;
    const targetHeading = Object.keys(SEQUENTIAL_CHECKLIST_HEADINGS).find(
      (heading) => SEQUENTIAL_CHECKLIST_HEADINGS[heading] === page.slug
    );
    if (!targetHeading) return null;
    return extractH2Checklist(page.body, targetHeading);
  }, [page?.body, page?.slug]);

  // SequentialChecklist용 회전 이미지 소스. herbal-clinic 콘텐츠에는 항목별
  // 전용 사진이 없어(체크리스트당 이미지 6장을 요구하지 않음), 이미 페이지에
  // 존재하는 두 장(히어로 대표 이미지 + 본문 첫 이미지)만 재사용한다. 본문
  // 첫 img는 구조화된 필드가 아니라 richtext 안에 있어 정규식으로 src만 뽑는다.
  const sequentialChecklistImages = useMemo(() => {
    if (!sequentialChecklist || !page) return [];
    const bodyImgSrc = page.body?.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
    return [
      page.image && { src: page.image, alt: page.title },
      bodyImgSrc && { src: bodyImgSrc, alt: page.title },
    ].filter((v): v is { src: string; alt: string } => Boolean(v));
  }, [sequentialChecklist, page]);

  const bodyForSegments = checklistHero
    ? checklistHero.remainingHtml
    : bodyMapChecklist
    ? bodyMapChecklist.remainingHtml
    : sequentialChecklist
    ? sequentialChecklist.remainingHtml
    : page?.body;

  const segments = useMemo(
    () => (bodyForSegments?.startsWith("<") ? splitProseIntoSegments(bodyForSegments) : null),
    [bodyForSegments]
  );

  if (!page) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 pt-20">
        <p className="text-ink-muted text-lg">{t("subpage.notFound")}</p>
        <Link href="/" className="text-accent font-semibold text-sm hover:underline">
          &larr; {t("subpage.back")}
        </Link>
      </div>
    );
  }

  const parent = menus.find((m) => m.id === page.parentMenuId);
  const parentHref = parent?.href ?? "/";
  const parentLabel = parent?.label ?? t("subpage.back");

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {page.image && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={page.image}
              alt={page.title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        )}
        <div className="container-default relative text-ink-inverse">
          <div className="max-w-5xl mx-auto">
            <Link
              href={parentHref}
              className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-10"
            >
              &larr; {parentLabel}
            </Link>

            <h1
              className="font-display"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                fontWeight: 600,
                letterSpacing: "-0.04em",
                lineHeight: 1.15,
                textWrap: "balance",
              }}
            >
              {page.title}
            </h1>
            {page.intro && (
              <p
                className="mt-4 text-lg opacity-80"
                style={{ letterSpacing: "-0.01em", textWrap: "pretty", whiteSpace: "pre-line" }}
              >
                {page.intro}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="py-20 md:py-32">
        <div className="container-default">
          <div className="max-w-5xl mx-auto">
            {page.image && (
              <div className="relative aspect-[16/9] rounded overflow-hidden mb-12 bg-bg-alt">
                <Image
                  src={page.image || fallbackImage}
                  alt={page.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 768px"
                  quality={75}
                  placeholder="blur"
                  blurDataURL={BLUR_PLACEHOLDER}
                />
              </div>
            )}

            {checklistHero && (
              <ChecklistHero
                eyebrow="Check List"
                title={checklistHero.title}
                items={checklistHero.items}
                imageSrc={page.fullBleedImage ?? page.image ?? null}
                imageAlt={page.title}
              />
            )}

            {page.slug === "lifting" && (
              <TreatmentAreaMap
                title="리프팅"
                highlight="시술 가능 부위"
                imageSrc={TREATMENT_AREA_IMAGE}
                imageAlt="리프팅 시술 가능 부위를 표시한 얼굴 정면 사진"
                areas={LIFTING_TREATMENT_AREAS}
              />
            )}

            {page.slug === "pain-treatment" && (
              <BodyAreaMap
                title="통증이 자주 느껴지는"
                highlight="부위"
                imageSrc={PAIN_AREA_IMAGE}
                imageAlt="통증 부위를 표시한 전신 정면 사진"
                areas={PAIN_TREATMENT_AREAS}
                footnote={PAIN_TREATMENT_FOOTNOTE}
              />
            )}

            {sequentialChecklist && (
              <SequentialChecklist
                title={sequentialChecklist.title}
                items={sequentialChecklist.items}
                images={sequentialChecklistImages}
              />
            )}

            {page.body ? (
              segments ? (
                <div
                  ref={bodyRef}
                  className="prose prose-neutral reveal-fade-up max-w-none text-ink-soft"
                  style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em" }}
                >
                  {segments.map((segment, i) => {
                    if (segment.type === "tabs") return <TabbedPoints key={i} group={segment.group} />;
                    if (segment.type === "cards") return <PointCards key={i} group={segment.group} />;
                    if (segment.type === "steps") return <StepProcess key={i} group={segment.group} />;
                    return <div key={i} dangerouslySetInnerHTML={{ __html: segment.html }} />;
                  })}
                </div>
              ) : (
                <p
                  className="text-ink-soft"
                  style={{
                    fontSize: "1.05rem",
                    lineHeight: 2,
                    letterSpacing: "-0.01em",
                    whiteSpace: "pre-line",
                  }}
                >
                  {page.body}
                </p>
              )
            ) : (
              <p className="text-ink-muted text-center py-12">{t("subpage.comingSoon")}</p>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
