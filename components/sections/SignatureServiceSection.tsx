"use client";

import Link from "next/link";
import Image from "next/image";
import { useServiceCatalog } from "@/lib/useServices";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, type Locale } from "@/lib/i18n";
import { useScrollReveal } from "@/lib/useScrollReveal";
import { computePrice, formatKRW } from "@/lib/price";
import {
  blockText,
  isVideoUrl,
  serviceText,
  sortServicesForDisplay,
  type Service,
  type ServiceBadge,
} from "@/lib/services";
import type { TranslationKey } from "@/lib/translations";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

const BADGE_STYLE: Record<ServiceBadge, string> = {
  NEW: "bg-ink text-ink-inverse",
  HOT: "bg-sale text-white",
  BEST: "bg-accent text-ink-inverse",
};

/**
 * 홈페이지 전용 "시그니처 시술" 쇼케이스.
 *
 * services 카탈로그에서 slug가 "signature"인 카테고리만 뽑아 강조 노출한다.
 * 해당 카테고리가 비어 있으면(아직 시딩 전) 섹션 자체를 그리지 않는다 —
 * EventsSection과 동일하게 빈 섹션으로 레이아웃이 무너지지 않도록.
 */
export default function SignatureServiceSection() {
  const { categories, subcategories, services, loading } = useServiceCatalog();
  const { clinicInfo } = useSiteData();
  const { locale, t } = useLocale();
  const headerRef = useScrollReveal<HTMLDivElement>();

  const signatureCategory = categories.find((c) => c.slug === "signature");

  if (loading || !signatureCategory) return null;

  const subcategoryIds = new Set(
    subcategories.filter((s) => s.categoryId === signatureCategory.id).map((s) => s.id)
  );
  const featured = sortServicesForDisplay({
    categories: [signatureCategory],
    subcategories: subcategories.filter((s) => subcategoryIds.has(s.id)),
    services: services.filter((svc) => subcategoryIds.has(svc.subcategoryId)),
  }).slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="relative py-20 md:py-36 overflow-hidden bg-surface-dark text-ink-inverse">
      {/* 은은한 골드 라디얼 글로우 — 다른 섹션과 확실히 다른 톤임을 알리는 장치 */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(160,120,85,0.35) 0%, transparent 70%)",
        }}
      />

      <div className="container-default relative">
        <div ref={headerRef} className="reveal-fade-up flex flex-col items-center text-center mb-16">
          <span
            className="text-xs font-semibold uppercase text-accent-soft mb-4"
            style={{ letterSpacing: "0.3em" }}
          >
            {t("signature.label")}
          </span>
          <h2
            className="font-display font-semibold leading-tight"
            style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", letterSpacing: "-0.04em" }}
          >
            {t("signature.title")}
          </h2>
          <div className="w-8 h-px bg-accent-soft mt-6 mb-6" />
          <p
            className="text-ink-muted whitespace-pre-line max-w-md"
            style={{ fontSize: "1rem", lineHeight: 1.75, letterSpacing: "-0.01em" }}
          >
            {t("signature.subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-5 items-stretch">
          {featured.map((service, i) => (
            <SignatureCard
              key={service.id}
              service={service}
              locale={locale}
              t={t}
              fallbackImage={clinicInfo.defaultImage || "/lifting-face.jpg"}
              emphasized={featured.length === 3 ? i === 1 : i === 0}
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 mt-14">
          <a
            href={clinicInfo.reservationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            {t("signature.cta")}
          </a>
          <Link
            href="/services"
            className="text-sm text-ink-muted hover:text-ink-inverse transition-colors"
            style={{ letterSpacing: "-0.01em" }}
          >
            {t("section.more")}
          </Link>
        </div>
      </div>
    </section>
  );
}

function SignatureCard({
  service,
  locale,
  t,
  fallbackImage,
  emphasized,
}: {
  service: Service;
  locale: Locale;
  t: (key: TranslationKey) => string;
  fallbackImage: string;
  emphasized: boolean;
}) {
  const { name, summary } = serviceText(service, locale);
  const price = service.prices[0];
  const computed = price ? computePrice(price) : null;

  const pointsBlock = service.blocks?.find((b) => b.type === "points" && !b.isHidden);
  const points = pointsBlock ? blockText(pointsBlock, locale).items ?? [] : [];

  return (
    <Link
      href={`/services/${service.id}`}
      className={`group relative flex flex-col rounded-2xl overflow-hidden border transition-all duration-300 ${
        emphasized
          ? "border-accent-soft bg-[#211C17] md:-translate-y-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
          : "border-white/10 bg-[#1E1A16] hover:border-white/25"
      }`}
    >
      {emphasized && (
        <div
          className="absolute top-4 right-4 z-10 px-2.5 py-1 rounded-full bg-accent-soft text-ink-inverse text-[0.65rem] font-bold"
          style={{ letterSpacing: "0.08em" }}
        >
          BEST
        </div>
      )}

      <div className="relative overflow-hidden bg-black/30" style={{ aspectRatio: "16 / 10" }}>
        <Image
          src={isVideoUrl(service.image) ? fallbackImage : service.image || fallbackImage}
          alt={name}
          fill
          className="object-cover opacity-90 transition-transform duration-700 ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 768px) 100vw, 33vw"
          quality={75}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        {service.tag && (
          <span
            className="absolute left-4 bottom-4 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur text-ink-inverse text-xs font-semibold"
            style={{ letterSpacing: "-0.01em" }}
          >
            {service.tag}
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4 p-6 md:p-7 flex-1">
        <div>
          <h3
            className="font-display font-semibold transition-colors group-hover:text-accent-soft"
            style={{ fontSize: "1.375rem", letterSpacing: "-0.03em", lineHeight: 1.3 }}
          >
            {name}
          </h3>
          {summary && (
            <p
              className="text-ink-muted mt-2"
              style={{ fontSize: "0.875rem", lineHeight: 1.7, letterSpacing: "-0.01em" }}
            >
              {summary}
            </p>
          )}
        </div>

        {points.length > 0 && (
          <ul className="flex flex-col gap-2 py-4 border-y border-white/10">
            {points.map((item, idx) => (
              <li
                key={idx}
                className="flex items-start gap-2 text-sm text-ink-muted"
                style={{ letterSpacing: "-0.01em", lineHeight: 1.6 }}
              >
                <svg
                  width="16" height="16" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="mt-0.5 shrink-0 text-accent-soft"
                >
                  <path d="M20 6 9 17l-5-5" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {price && computed && (
          <div className="mt-auto">
            <div className="text-xs text-ink-muted mb-1.5" style={{ letterSpacing: "-0.01em" }}>
              {t("signature.priceFrom")}
            </div>
            <div className="flex items-baseline gap-2 flex-wrap">
              {computed.hasDiscount && (
                <span
                  className="font-bold"
                  style={{ fontSize: "1.25rem", letterSpacing: "-0.03em", color: "#E08A76" }}
                >
                  {computed.rate}
                  <span className="text-[0.7em]">%</span>
                </span>
              )}
              <span
                className="font-bold text-ink-inverse"
                style={{
                  fontSize: "1.5rem",
                  letterSpacing: "-0.03em",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {formatKRW(computed.final)}
              </span>
            </div>
            {computed.hasDiscount && (
              <div
                className="text-sm text-ink-muted line-through mt-0.5"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {formatKRW(price.originalPrice)}
              </div>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
