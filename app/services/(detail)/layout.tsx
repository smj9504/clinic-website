"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import CartSummaryBar from "@/components/services/CartSummaryBar";
import CategoryFilter, { ALL } from "@/components/services/CategoryFilter";
import ServiceCard from "@/components/services/ServiceCard";
import { useServiceCatalog } from "@/lib/useServices";
import { categoryText, isVideoUrl, serviceText } from "@/lib/services";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const FALLBACK_IMAGE = "/gowoonbit.jpg";

/**
 * 시술 상세 페이지의 뼈대(뒤로가기 · 좌측 카테고리 필터 · 상단 "다른 시술" 캐러셀 ·
 * 3단 그리드 · 하단 "같은 분류의 다른 시술" · 카트 요약 바)를 담당한다.
 *
 * (detail) 라우트 그룹으로 [id]의 부모 레벨에 둔 이유: Next.js App Router는
 * 동적 세그먼트([id]) 값이 바뀌면 그 세그먼트와 "같은 레벨 이하"의 layout·page를
 * 전부 새 세그먼트 키로 취급해 리마운트한다. 이 layout을
 * app/services/[id]/layout.tsx(= [id]와 형제)에 두면 layout 자체도 id가 바뀔
 * 때마다 다시 마운트돼 — 안의 useServiceCatalog·useSiteData가 매번 초기 상태로
 * 리셋되고 API가 재요청되며, 화면도 한 번 그려졌다 다시 스켈레톤으로 되돌아가는
 * 문제가 있었다. app/services/(detail)/layout.tsx로 [id]보다 한 단계 위(부모)에
 * 두면 [id] 세그먼트 전환에도 이 layout은 유지된다.
 *
 * 캐러셀·related 둘 다 상세 API 응답(어느 카테고리인지)을 기다리지 않고
 * 카탈로그(useServiceCatalog)만으로 계산한다 — 카탈로그엔 이미 각 시술의
 * subcategoryId가 들어 있어 상세를 fetch하지 않고도 즉시 그릴 수 있다.
 */
export default function ServiceDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const catalog = useServiceCatalog();
  const { clinicInfo } = useSiteData();
  const { locale } = useLocale();
  const t = useT();

  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;

  const currentService = catalog.services.find((s) => s.id === id);
  const currentSubcategory = currentService
    ? catalog.subcategories.find((sub) => sub.id === currentService.subcategoryId)
    : undefined;
  const category = currentSubcategory
    ? catalog.categories.find((c) => c.id === currentSubcategory.categoryId)
    : undefined;
  const categoryName = category ? categoryText(category, locale).name : "";

  // 캐러셀 — 같은 대분류(카테고리)의 다른 시술 전체를 바로 넘나들 수 있게 한다.
  // related(하단 그리드)는 소분류 기준이라 더 좁다.
  const categorySubIds = new Set(
    catalog.subcategories.filter((s) => s.categoryId === category?.id).map((s) => s.id)
  );
  const sameCategoryServices = category
    ? catalog.services.filter((s) => categorySubIds.has(s.subcategoryId))
    : [];

  const related = currentService
    ? catalog.services
        .filter((s) => s.subcategoryId === currentService.subcategoryId && s.id !== currentService.id)
        .slice(0, 4)
    : [];

  return (
    <>
      {/*
        상품 상세: 밝은 배경 + 좌(카테고리, 데스크톱만) / 중(이미지 → 시술 안내 블록) / 우(가격, 폭 고정 sticky).
        오른쪽 가격 컬럼이 왼쪽 콘텐츠 전체 높이 동안 화면에 붙어 있어야 하므로,
        그리드가 ServiceBlocks까지 함께 감싼다 — 별도 섹션으로 나누면 sticky가 걸릴
        스크롤 구간이 이미지 높이만큼밖에 안 된다.

        children(page.tsx)은 이 grid의 직계 자식으로 형제 엘리먼트 두 개
        (중앙 콘텐츠 · 가격 aside)를 반환하며, 각자 lg:[grid-column:2]/[grid-column:3]로
        자기 자리를 명시한다 — 래퍼로 감싸면(예: display:contents) 자식이 실제 grid
        item이 아니게 되어 배치가 깨지므로 감싸지 않고 그대로 흘려보낸다.
      */}
      <section className="pt-24 pb-16 md:pt-28 md:pb-20">
        <div className="container-default">
          <div
            className="grid grid-cols-1 lg:grid-cols-[220px_1fr_300px] gap-x-8 lg:gap-x-12 gap-y-0 items-start"
            style={{ gridTemplateRows: "auto auto" }}
          >
            {/*
              카테고리 필터 — 데스크톱에서만, 목록 페이지와 동일한 구성.
              캐러셀(row 1, 컬럼2)과 children(row 2, 컬럼2/3)이 auto-flow로 서로 다른
              grid row에 배치되므로, 필터를 두 row 모두에 걸치게 하지 않으면
              필터가 row 1에만 놓여 그 row 높이가 필터 전체 높이로 늘어나
              캐러셀 아래에 빈 공간이 생긴다. row-span-full은 grid-template-rows가
              명시되지 않은 암묵적(implicit) grid에서는 몇 개 row를 span할지
              정의되지 않아 동작하지 않으므로, row를 2개로 명시하고
              grid-row: 1 / 3으로 정확히 지정한다.
            */}
            <div
              className="hidden lg:block lg:sticky lg:[grid-column:1]"
              style={{ top: "104px", gridRow: "1 / 3" }}
            >
              <CategoryFilter
                categories={catalog.categories}
                activeCategory={category?.id ?? ALL}
                onCategoryChange={(categoryId) => {
                  router.push(categoryId === ALL ? "/services" : `/services?category=${categoryId}`);
                }}
                locale={locale}
                t={t}
              />
            </div>

            {sameCategoryServices.length > 1 && (
              <div className="min-w-0 mb-6 lg:[grid-column:2]" style={{ gridRow: "1" }}>
                <p
                  className="text-xs font-semibold text-ink-muted mb-2.5"
                  style={{ letterSpacing: "0.05em" }}
                >
                  {categoryName}
                  {t("services.otherInCategorySuffix")}
                </p>
                <div className="flex gap-2.5 overflow-x-auto pb-1 -mb-1 snap-x snap-mandatory">
                  {sameCategoryServices.map((s) => {
                    const isActive = s.id === id;
                    const label = serviceText(s, locale).name;
                    return (
                      <Link
                        key={s.id}
                        href={`/services/${s.id}`}
                        className={`shrink-0 snap-start flex items-center gap-2 pl-1.5 pr-3.5 py-1.5 rounded-full border transition-colors ${
                          isActive
                            ? "border-accent bg-accent/10"
                            : "border-line bg-surface hover:border-line-strong"
                        }`}
                      >
                        <span className="relative w-7 h-7 rounded-full overflow-hidden bg-bg-alt shrink-0">
                          <Image
                            src={stripImagePosition(isVideoUrl(s.image) ? fallbackImage : s.image || fallbackImage)}
                            alt=""
                            fill
                            className="object-cover"
                            style={{ objectPosition: toObjectPosition(isVideoUrl(s.image) ? fallbackImage : s.image || fallbackImage) }}
                            sizes="28px"
                            quality={60}
                          />
                        </span>
                        <span
                          className="text-sm whitespace-nowrap"
                          style={{
                            letterSpacing: "-0.01em",
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? "var(--color-accent)" : "var(--color-ink)",
                          }}
                        >
                          {label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {children}
          </div>
        </div>
      </section>

      {/* 같은 분류의 다른 시술 */}
      {related.length > 0 && (
        <section className="py-16 md:py-24 border-t border-line">
          <div className="container-default">
            <div className="mb-10">
              <span className="section-label block mb-4">More</span>
              <h2 className="section-title">{t("services.related")}</h2>
              <div className="section-divider" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((other) => (
                <ServiceCard
                  key={other.id}
                  service={other}
                  locale={locale}
                  fallbackImage={fallbackImage}
                  t={t}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 카트 요약 바가 화면 하단에 고정되므로, 마지막 콘텐츠가 그 아래 가려지지 않도록 여백을 둔다 */}
      <div className="h-20" aria-hidden="true" />

      <CartSummaryBar t={t} />
    </>
  );
}
