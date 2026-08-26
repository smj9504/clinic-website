"use client";

import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import CategoryFilter, { ALL } from "@/components/services/CategoryFilter";
import ServiceCard from "@/components/services/ServiceCard";
import CartSummaryBar from "@/components/services/CartSummaryBar";
import { useServiceCatalog } from "@/lib/useServices";
import { sortServicesForDisplay } from "@/lib/services";
import { useSiteData, getBannerImage, getMenuLabel } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";
const FALLBACK_IMAGE = "/gowoonbit.jpg";

const GRID = "grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5";

function SkeletonGrid() {
  return (
    <div className={GRID} aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-surface border border-line rounded overflow-hidden">
          <div className="bg-bg-alt animate-pulse" style={{ aspectRatio: "4 / 3" }} />
          <div className="p-4 space-y-2">
            <div className="h-4 bg-bg-alt rounded animate-pulse w-3/4" />
            <div className="h-3 bg-bg-alt rounded animate-pulse w-full" />
            <div className="h-5 bg-bg-alt rounded animate-pulse w-1/2 mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesPage() {
  return (
    <Suspense fallback={null}>
      <ServicesPageInner />
    </Suspense>
  );
}

function ServicesPageInner() {
  const { menus, heroSlides, clinicInfo } = useSiteData();
  const { categories, subcategories, services, loading, error, reload } = useServiceCatalog();
  const { locale } = useLocale();
  const t = useT();
  const searchParams = useSearchParams();

  const [activeCategory, setActiveCategory] = useState<string>(ALL);

  // 시술 상세 페이지의 "다른 카테고리 보기" 링크(/services?category=xxx)로
  // 들어왔을 때 해당 카테고리를 자동으로 선택한다.
  useEffect(() => {
    const category = searchParams.get("category");
    if (category) setActiveCategory(category);
  }, [searchParams]);

  const banner = getBannerImage(menus, "/services", heroSlides[0]?.image);
  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;

  const visible = useMemo(() => {
    const ordered = sortServicesForDisplay({ categories, subcategories, services });
    if (activeCategory === ALL) return ordered;

    const childIds = new Set(
      subcategories.filter((s) => s.categoryId === activeCategory).map((s) => s.id)
    );
    return ordered.filter((s) => childIds.has(s.subcategoryId));
  }, [categories, subcategories, services, activeCategory]);

  return (
    <>
      <section
        className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {banner && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={banner}
              alt="고운빛한의원 시술 안내"
              fill
              className="object-cover"
              sizes="100vw"
              quality={75}
              placeholder="blur"
              blurDataURL={BLUR_PLACEHOLDER}
            />
          </div>
        )}
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Treatments &amp; Pricing
          </span>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            {getMenuLabel(menus, "/services", t("services.title"))}
          </h1>
        </div>
      </section>

      <section className="py-16 md:py-24 pb-28">
        <div className="container-default grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 lg:gap-12 items-start">
          <div className="md:sticky md:top-28">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              locale={locale}
              t={t}
            />
          </div>

          <div>
            {loading ? (
              <>
                <p className="sr-only">{t("services.loading")}</p>
                <SkeletonGrid />
              </>
            ) : error ? (
              <div className="text-center py-20">
                <p className="text-ink-muted mb-5">{t("services.error")}</p>
                <button
                  type="button"
                  onClick={reload}
                  className="px-5 min-h-[2.75rem] rounded-full border border-line text-sm font-medium hover:border-accent hover:text-accent transition-colors"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {t("services.retry")}
                </button>
              </div>
            ) : visible.length === 0 ? (
              <div className="text-center py-20 text-ink-muted">
                {services.length === 0 ? t("services.empty") : t("services.emptyFiltered")}
              </div>
            ) : (
              <div className={GRID}>
                {visible.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    locale={locale}
                    fallbackImage={fallbackImage}
                    t={t}
                  />
                ))}
              </div>
            )}

            {!loading && !error && visible.length > 0 && (
              <p
                className="mt-8 pt-6 border-t border-line text-xs text-ink-muted"
                style={{ lineHeight: 1.8, letterSpacing: "-0.01em" }}
              >
                {t("services.priceNotice")}
              </p>
            )}
          </div>
        </div>
      </section>

      <CartSummaryBar t={t} />
    </>
  );
}
