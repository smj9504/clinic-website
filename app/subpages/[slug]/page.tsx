"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Fragment, useMemo, useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { normalizeSectionOrder, type SubPageSectionId } from "@/lib/data";
import {
  splitProseIntoSegments,
  extractChecklistHero,
  extractH2Checklist,
  type ProseTabGroup,
} from "@/lib/proseCards";
import ChecklistHero from "@/components/subpages/ChecklistHero";
import TreatmentAreaMap from "@/components/subpages/TreatmentAreaMap";
import BodyAreaMap from "@/components/subpages/BodyAreaMap";
import StepProcess from "@/components/subpages/StepProcess";
import SequentialChecklist from "@/components/subpages/SequentialChecklist";
import PointCards from "@/components/subpages/PointCards";
import ChecklistBlocks from "@/components/subpages/ChecklistBlocks";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

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
 * PointCards와 같은 h2>img>(h3+p) 뭉치지만, 각 항목 뒤에 ul이 두 개
 * (해시태그, 장점) 더 붙어 있을 때만 만들어지는 더 풍부한 변형 — 여러 치료법을
 * 나란히 비교하기보다 "하나씩 골라 깊이 읽는" 콘텐츠라 그리드 대신 탭으로
 * 전환한다. 탭은 클릭으로만 전환한다: hover 미리보기를 쓰는 장비소개 탭과
 * 달리, 본문을 정독하는 흐름에서 마우스가 스치기만 해도 내용이 바뀌면
 * 오히려 읽던 자리를 잃게 만든다.
 */
function TabbedPoints({ group }: { group: ProseTabGroup }) {
  const [activeIndex, setActiveIndex] = useState(0);
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
        className="anim-tab-panel grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-10 md:gap-14 items-start"
      >
        <div className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-line">
          {group.image && (
            <Image
              src={stripImagePosition(group.image)}
              alt={group.imageAlt || active.title}
              fill
              className="object-cover"
              style={{ ...getImageCropStyle(group.image) }}
              sizes="(max-width: 768px) 100vw, 40vw"
              quality={75}
            />
          )}
        </div>

        <div>
          {active.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {active.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-accent/10 text-accent font-semibold"
                  style={{
                    fontSize: "0.8rem",
                    letterSpacing: "-0.01em",
                    padding: "0.3rem 0.85rem",
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
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
            <ul className="space-y-3.5 border-t border-line pt-7">
              {active.benefits.map((benefit, i) => (
                <li key={i} className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 text-accent"
                    style={{ width: "1.15rem", height: "1.15rem", marginTop: "0.05em" }}
                    aria-hidden="true"
                  >
                    <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.3" opacity="0.35" />
                    <path
                      d="M6.5 10.3l2.3 2.3 4.7-5.2"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    className="flex-1 text-ink-soft"
                    style={{ fontSize: "0.95rem", lineHeight: 1.7, letterSpacing: "-0.01em" }}
                  >
                    {benefit}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SubPageDetail() {
  const { slug } = useParams();
  const { subPages, menus } = useSiteData();
  const t = useT();
  // 본문 전체(.prose)는 richtext 길이에 따라 수백~수천 px까지 늘어날 수 있어,
  // 기본 threshold(0.15)로는 컨테이너의 15%가 뷰포트에 들어올 때까지 기다리다가
  // 실질적으로 절대 발동하지 않는 경우가 생긴다(예: pain-treatment 본문 3100px+).
  // 이 래퍼의 목적은 스크롤 안무가 아니라 "hydrate 전 미스타일 콘텐츠 깜빡임 방지"이므로
  // threshold를 낮춰 컨테이너 상단 일부만 보여도 즉시 반응하게 한다.
  const bodyRef = useScrollReveal<HTMLDivElement>({ threshold: 0.01, rootMargin: "0px 0px -10% 0px" });

  const page = (subPages ?? []).find((sp) => sp.slug === slug && !sp.isHidden);

  // CHECKLIST_HERO_HEADINGS에 등록된 slug+제목 조합일 때만 매칭 시도 — 다른
  // 페이지는 extractChecklistHero를 아예 호출하지 않아 회귀 위험이 없다.
  // admin 구조화 필드(page.checklistHero)가 있으면 그걸 최우선으로 쓴다 —
  // 카드 라벨·설명·사방 위치를 admin에서 직접 지정할 수 있는 경로다. 없을
  // 때만 CHECKLIST_HERO_HEADINGS 화이트리스트로 richtext에서 h3+ul을
  // 파싱해 원본 body에서 제거한다.
  const parsedChecklistHero = useMemo(() => {
    if (page?.checklistHero) return null; // 구조화 필드가 있으면 richtext 파싱 자체를 건너뛴다
    if (!page?.body?.startsWith("<")) return null;
    const targetHeading = Object.keys(CHECKLIST_HERO_HEADINGS).find(
      (heading) => CHECKLIST_HERO_HEADINGS[heading] === page.slug
    );
    if (!targetHeading) return null;
    return extractChecklistHero(page.body, targetHeading);
  }, [page?.body, page?.slug, page?.checklistHero]);

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

  // admin 구조화 필드(page.sequentialChecklist)가 있으면 그걸 최우선으로
  // 쓴다 — 항목별 개별 사진을 admin에서 직접 지정할 수 있는 경로다. 없을
  // 때만 SEQUENTIAL_CHECKLIST_HEADINGS 화이트리스트로 richtext에서 h2+ul을
  // 파싱해 원본 body에서 제거한다 — SequentialChecklist가 같은 목록을 자동
  // 순차 강조 + 우측 사진 전환으로 대체하므로 텍스트 체크리스트가 중복
  // 노출되지 않게 한다.
  const parsedSequentialChecklist = useMemo(() => {
    if (page?.sequentialChecklist) return null; // 구조화 필드가 있으면 richtext 파싱 자체를 건너뛴다
    if (!page?.body?.startsWith("<")) return null;
    const targetHeading = Object.keys(SEQUENTIAL_CHECKLIST_HEADINGS).find(
      (heading) => SEQUENTIAL_CHECKLIST_HEADINGS[heading] === page.slug
    );
    if (!targetHeading) return null;
    return extractH2Checklist(page.body, targetHeading);
  }, [page?.body, page?.slug, page?.sequentialChecklist]);

  // SequentialChecklist용 회전 이미지 소스(richtext 폴백 경로 전용). herbal-clinic
  // 콘텐츠에는 항목별 전용 사진이 없어(체크리스트당 이미지 6장을 요구하지
  // 않음), 이미 페이지에 존재하는 두 장(히어로 대표 이미지 + 본문 첫 이미지)만
  // 재사용한다. 본문 첫 img는 구조화된 필드가 아니라 richtext 안에 있어
  // 정규식으로 src만 뽑는다.
  const sequentialChecklistFallbackImages = useMemo(() => {
    if (!parsedSequentialChecklist || !page) return [];
    const bodyImgSrc = page.body?.match(/<img[^>]+src="([^"]+)"/)?.[1] ?? null;
    return [
      page.image && { src: page.image, alt: page.title },
      bodyImgSrc && { src: bodyImgSrc, alt: page.title },
    ].filter((v): v is { src: string; alt: string } => Boolean(v));
  }, [parsedSequentialChecklist, page]);

  const bodyForSegments = parsedChecklistHero
    ? parsedChecklistHero.remainingHtml
    : bodyMapChecklist
    ? bodyMapChecklist.remainingHtml
    : parsedSequentialChecklist
    ? parsedSequentialChecklist.remainingHtml
    : page?.body;

  const segments = useMemo(
    () => (bodyForSegments?.startsWith("<") ? splitProseIntoSegments(bodyForSegments) : null),
    [bodyForSegments]
  );

  // 구조화 섹션 6개를 id별로 미리 만들어 두고, page.sectionOrder(관리자가 admin에서
  // 조정한 순서)를 따라 순서대로 렌더링한다. 순서가 없거나 불완전해도
  // normalizeSectionOrder가 항상 완전한 6개 순열로 보정해 준다.
  const sectionNodes: Record<SubPageSectionId, React.ReactNode> = {
    checklistHero: page?.checklistHero ? (
      <ChecklistHero
        eyebrow={page.checklistHero.eyebrow}
        title={page.checklistHero.title}
        items={page.checklistHero.items}
        imageSrc={page.checklistHero.image ?? page.fullBleedImage ?? page.image ?? null}
        imageAlt={page.checklistHero.imageAlt || page.title}
      />
    ) : (
      parsedChecklistHero && (
        <ChecklistHero
          eyebrow="Check List"
          title={parsedChecklistHero.title}
          items={parsedChecklistHero.items}
          imageSrc={page?.fullBleedImage ?? page?.image ?? null}
          imageAlt={page?.title ?? ""}
        />
      )
    ),
    areaMap:
      page?.areaMap?.enabled && page.areaMap.kind === "face" ? (
        <TreatmentAreaMap
          title={page.areaMap.title}
          highlight={page.areaMap.highlight}
          imageSrc={page.areaMap.image}
          imageAlt={page.areaMap.imageAlt}
          areas={page.areaMap.areas}
        />
      ) : page?.areaMap?.enabled && page.areaMap.kind === "body" ? (
        <BodyAreaMap
          title={page.areaMap.title}
          highlight={page.areaMap.highlight}
          imageSrc={page.areaMap.image}
          imageAlt={page.areaMap.imageAlt}
          areas={page.areaMap.areas}
          footnote={page.areaMap.footnote}
        />
      ) : null,
    checklist: page?.sequentialChecklist ? (
      <SequentialChecklist
        title={page.sequentialChecklist.title}
        items={page.sequentialChecklist.items.map((it) => it.text)}
        itemImages={page.sequentialChecklist.items.map((it) => it.image)}
        images={[]}
        note={page.sequentialChecklist.note}
      />
    ) : (
      parsedSequentialChecklist && (
        <SequentialChecklist
          title={parsedSequentialChecklist.title}
          items={parsedSequentialChecklist.items}
          images={sequentialChecklistFallbackImages}
        />
      )
    ),
    checklistBlocks:
      page?.checklistBlocks && page.checklistBlocks.length > 0 ? (
        <ChecklistBlocks blocks={page.checklistBlocks} />
      ) : null,
    pointCards: page?.pointCards ? (
      <PointCards
        title={page.pointCards.title}
        points={page.pointCards.items.map((it) => ({ title: it.title, body: it.body, image: it.image }))}
        note={page.pointCards.note}
      />
    ) : null,
    stepProcess: page?.stepProcess ? (
      <StepProcess
        title={page.stepProcess.title}
        intro={page.stepProcess.intro}
        steps={page.stepProcess.items.map((it) => ({ text: it.text, image: it.image }))}
        note={page.stepProcess.note}
      />
    ) : null,
  };
  const orderedSectionIds = normalizeSectionOrder(page?.sectionOrder);

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
        className="relative pt-32 pb-10 md:pt-44 md:pb-14 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {(page.titleBgImage || page.image) && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={stripImagePosition(page.titleBgImage || page.image || "")}
              alt={page.title}
              fill
              className="object-cover"
              style={{ ...getImageCropStyle(page.titleBgImage || page.image || "") }}
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

      <section className="pt-10 pb-20 md:pt-16 md:pb-32">
        <div className="container-default">
          <div className="max-w-5xl mx-auto">
            {orderedSectionIds.map((sectionId) => (
              <Fragment key={sectionId}>{sectionNodes[sectionId]}</Fragment>
            ))}

            {page.body ? (
              segments ? (
                <div
                  ref={bodyRef}
                  className="prose prose-neutral reveal-fade-up max-w-none text-ink-soft"
                  style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em" }}
                >
                  {segments.map((segment, i) => {
                    if (segment.type === "tabs") return <TabbedPoints key={i} group={segment.group} />;
                    // page.pointCards/stepProcess가 있으면 위에서 이미 구조화 데이터로
                    // 렌더링했으므로, 같은 body 안에 남아있는 richtext 자동 감지 결과는
                    // (아직 마이그레이션되지 않았거나 편집 중인 과도기 상태가 아닌 한)
                    // 중복 렌더링을 피하기 위해 건너뛴다.
                    if (segment.type === "cards") {
                      if (page.pointCards) return null;
                      return (
                        <PointCards
                          key={i}
                          points={segment.group.points}
                          fallbackImage={segment.group.image}
                          imageAlt={segment.group.imageAlt}
                        />
                      );
                    }
                    if (segment.type === "steps") {
                      if (page.stepProcess) return null;
                      return (
                        <StepProcess
                          key={i}
                          title={segment.group.title}
                          intro={segment.group.intro}
                          steps={segment.group.steps.map((text) => ({ text, image: null }))}
                          fallbackImage={segment.group.image}
                          imageAlt={segment.group.imageAlt}
                        />
                      );
                    }
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
