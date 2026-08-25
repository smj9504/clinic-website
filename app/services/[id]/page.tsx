"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PriceTable from "@/components/services/PriceTable";
import ServiceBlocks from "@/components/services/ServiceBlocks";
import ServiceCard from "@/components/services/ServiceCard";
import { useService, useServiceCatalog } from "@/lib/useServices";
import { categoryText, isVideoUrl, serviceText, subcategoryText } from "@/lib/services";
import { useSiteData, getMenuLabel } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";
const FALLBACK_IMAGE = "/gowoonbit.jpg";

export default function ServiceDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { service, subcategory, category, loading, notFound, error } = useService(id);
  const catalog = useServiceCatalog();
  const { menus, clinicInfo } = useSiteData();
  const { locale } = useLocale();
  const t = useT();

  const listLabel = getMenuLabel(menus, "/services", t("services.backToList"));
  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ink-muted">
        {t("services.loading")}
      </div>
    );
  }

  if (notFound || error || !service) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-ink-muted text-lg">
          {error ? t("services.error") : t("services.notFound")}
        </p>
        <Link href="/services" className="text-accent font-semibold text-sm hover:underline">
          &larr; {listLabel}
        </Link>
      </div>
    );
  }

  const { name, summary } = serviceText(service, locale);
  const categoryName = category ? categoryText(category, locale).name : "";
  const subcategoryName = subcategory ? subcategoryText(subcategory, locale).name : "";

  const related = catalog.services
    .filter((s) => s.subcategoryId === service.subcategoryId && s.id !== service.id)
    .slice(0, 4);

  const period = [service.saleStartDate, service.saleEndDate].filter(Boolean).join(" ~ ");

  return (
    <>
      {/*
        상품 상세: 밝은 배경 + 좌(이미지 → 시술 안내 블록) / 우(가격, 폭 고정 sticky).
        오른쪽 가격 컬럼이 왼쪽 콘텐츠 전체 높이 동안 화면에 붙어 있어야 하므로,
        그리드가 ServiceBlocks까지 함께 감싼다 — 별도 섹션으로 나누면 sticky가 걸릴
        스크롤 구간이 이미지 높이만큼밖에 안 된다.
      */}
      <section className="pt-28 pb-16 md:pt-36 md:pb-20">
        <div className="container-default">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink transition-colors mb-6"
          >
            &larr; {listLabel}
          </Link>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-10 lg:gap-14 items-start">
            {/* 이미지 + 시술 안내 블록 */}
            <div className="min-w-0">
              <div
                className="relative bg-bg-alt rounded overflow-hidden"
                style={{ aspectRatio: "16 / 10" }}
              >
                {isVideoUrl(service.image) ? (
                  <video
                    src={service.image}
                    controls
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={service.image || fallbackImage}
                    alt={name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    priority
                    quality={80}
                    placeholder="blur"
                    blurDataURL={BLUR_PLACEHOLDER}
                  />
                )}
                {service.badges.length > 0 && (
                  <div className="absolute right-0 bottom-0 flex">
                    {service.badges.map((badge) => (
                      <span
                        key={badge}
                        className={`px-2.5 py-1.5 text-xs font-bold ${
                          badge === "HOT"
                            ? "bg-sale text-white"
                            : badge === "BEST"
                              ? "bg-accent text-ink-inverse"
                              : "bg-ink text-ink-inverse"
                        }`}
                        style={{ letterSpacing: "0.08em" }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {(categoryName || subcategoryName) && (
                <nav
                  aria-label="분류"
                  className="text-xs font-semibold uppercase text-ink-muted mt-6 mb-3 flex items-center gap-2 flex-wrap"
                  style={{ letterSpacing: "0.15em" }}
                >
                  {categoryName && <span>{categoryName}</span>}
                  {categoryName && subcategoryName && <span aria-hidden="true">&rsaquo;</span>}
                  {subcategoryName && <span>{subcategoryName}</span>}
                </nav>
              )}

              <h1
                className="font-display"
                style={{
                  fontSize: "clamp(1.625rem, 3.5vw, 2.5rem)",
                  fontWeight: 600,
                  letterSpacing: "-0.04em",
                  lineHeight: 1.2,
                }}
              >
                {name}
              </h1>
              {summary && (
                <p className="mt-3 text-ink-muted" style={{ lineHeight: 1.7, letterSpacing: "-0.01em" }}>
                  {summary}
                </p>
              )}

              <div className="mt-12 md:mt-16">
                <ServiceBlocks blocks={service.blocks ?? []} locale={locale} />
              </div>
            </div>

            {/* 가격 — 폭 고정, 스크롤 동안 화면에 고정 */}
            <aside
              className="lg:sticky bg-bg-alt rounded p-6"
              style={{ top: "104px" }}
            >
              <PriceTable prices={service.prices} locale={locale} t={t} />

              {period && (
                <div className="mt-5 pt-4 border-t border-line flex justify-between text-sm gap-3">
                  <span className="text-ink-muted shrink-0">{t("events.period")}</span>
                  <span
                    className="font-medium text-right"
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {period}
                  </span>
                </div>
              )}

              <a
                href={clinicInfo.reservationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full mt-6 py-4 bg-accent text-white text-center text-sm font-semibold rounded transition-all hover:brightness-110"
                style={{ letterSpacing: "0.02em" }}
              >
                {t("services.reserve")}
              </a>
              <a
                href={`tel:${clinicInfo.phone.replace(/-/g, "")}`}
                className="block w-full mt-3 py-4 border border-line bg-surface text-ink text-center text-sm font-semibold rounded transition-all hover:bg-bg"
                style={{ letterSpacing: "0.02em" }}
              >
                {clinicInfo.phone}
              </a>

              <p className="mt-5 text-xs text-ink-muted" style={{ lineHeight: 1.75 }}>
                {t("services.priceNotice")}
              </p>
            </aside>
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
    </>
  );
}
