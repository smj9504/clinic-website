"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PriceTable from "@/components/services/PriceTable";
import ServiceBlocks from "@/components/services/ServiceBlocks";
import ServiceCard from "@/components/services/ServiceCard";
import { useService, useServiceCatalog } from "@/lib/useServices";
import { categoryText, serviceText, subcategoryText } from "@/lib/services";
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
      {/* Hero */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-28 overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={service.image || fallbackImage}
            alt={name}
            fill
            className="object-cover"
            sizes="100vw"
            priority
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, rgba(44,38,32,0.75) 0%, rgba(44,38,32,0.92) 100%)",
            }}
          />
        </div>

        <div className="container-default relative text-ink-inverse">
          <Link
            href="/services"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-10"
          >
            &larr; {listLabel}
          </Link>

          {(categoryName || subcategoryName) && (
            <nav
              aria-label="분류"
              className="text-xs font-semibold uppercase opacity-60 mb-5 flex items-center gap-2 flex-wrap"
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
              fontSize: "clamp(1.875rem, 4.5vw, 3.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            {name}
          </h1>
          {summary && (
            <p className="mt-4 text-lg opacity-80" style={{ letterSpacing: "-0.01em" }}>
              {summary}
            </p>
          )}
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container-default">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 lg:gap-20">
            {/*
              좁은 화면에서는 가격이 먼저 보이도록 DOM에서 앞에 두고,
              넓은 화면에서만 오른쪽 열로 보낸다.
            */}
            <aside className="lg:order-2">
              <div className="bg-bg-alt rounded p-6 md:p-8 lg:sticky" style={{ top: "120px" }}>
                <h2
                  className="font-display mb-5"
                  style={{ fontSize: "1.1rem", fontWeight: 600, letterSpacing: "-0.03em" }}
                >
                  {t("services.priceTitle")}
                </h2>

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
              </div>
            </aside>

            <div className="lg:order-1 min-w-0">
              <ServiceBlocks blocks={service.blocks ?? []} locale={locale} />
            </div>
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
