"use client";

import Link from "next/link";
import Image from "next/image";
import { computePrice, formatKRW } from "@/lib/price";
import { isVideoUrl, priceText, serviceText, type Service, type ServiceBadge } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

const BADGE_STYLE: Record<ServiceBadge, string> = {
  NEW: "bg-ink text-ink-inverse",
  HOT: "bg-sale text-white",
  BEST: "bg-accent text-ink-inverse",
};

export type ServiceCardProps = {
  service: Service;
  locale: Locale;
  fallbackImage: string;
  t: (key: TranslationKey) => string;
};

export default function ServiceCard({ service, locale, fallbackImage, t }: ServiceCardProps) {
  const { name, summary } = serviceText(service, locale);

  // 카드에는 대표 옵션(첫 번째)만 보여준다. 나머지는 상세 페이지의 가격표에서.
  const price = service.prices[0];
  const computed = price ? computePrice(price) : null;
  const label = price ? priceText(price, locale).label : "";

  const until = service.saleEndDate
    ? `${t("services.untilPrefix")}${service.saleEndDate}${t("services.untilSuffix")}`
    : "";

  return (
    <Link
      href={`/services/${service.id}`}
      className="group flex flex-col bg-surface border border-line rounded overflow-hidden transition-colors hover:border-line-strong focus-visible:border-accent"
    >
      {/*
        카탈로그는 카드 높이가 고르게 맞아야 한 줄 안에서 제목·가격이 나란히 읽힌다.
        이벤트 카드처럼 원본 비율을 살리는 대신, 4:3으로 잘라 통일한다.
      */}
      <div className="relative bg-bg-alt overflow-hidden" style={{ aspectRatio: "4 / 3" }}>
        {/* 대표 미디어가 동영상이면 카드에서는 재생하지 않고 폴백 이미지를 보여준다 — 재생은 상세 페이지에서만 */}
        <Image
          src={stripImagePosition(isVideoUrl(service.image) ? fallbackImage : service.image || fallbackImage)}
          alt={name}
          fill
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
          style={{ objectPosition: toObjectPosition(isVideoUrl(service.image) ? fallbackImage : service.image || fallbackImage) }}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          quality={75}
          placeholder="blur"
          blurDataURL={BLUR_PLACEHOLDER}
        />
        {service.badges.length > 0 && (
          <div className="absolute right-0 bottom-0 flex">
            {service.badges.map((badge) => (
              <span
                key={badge}
                className={`px-2 py-1 text-[0.6rem] font-bold ${BADGE_STYLE[badge]}`}
                style={{ letterSpacing: "0.08em" }}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-4 flex-1">
        {/* 내용이 없어도 자리를 비워 둔다 — 한 줄 안의 카드끼리 제목 높이를 맞추기 위해 */}
        <div className="flex items-center justify-between gap-2 text-[0.7rem] text-ink-muted h-6 shrink-0">
          {service.tag ? (
            <span className="border border-line-strong px-1.5 py-0.5 rounded-sm shrink-0">
              {service.tag}
            </span>
          ) : (
            <span />
          )}
          {until && (
            <span className="truncate" style={{ letterSpacing: "0.01em" }}>
              {until}
            </span>
          )}
        </div>

        <h3
          className="font-semibold transition-colors group-hover:text-accent"
          style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em", lineHeight: 1.35 }}
        >
          {name}
        </h3>

        {summary && (
          <p className="text-sm text-ink-muted line-clamp-2" style={{ lineHeight: 1.6 }}>
            {summary}
          </p>
        )}

        {price && computed && (
          <div className="mt-auto pt-3 border-t border-line">
            {label && (
              <div className="text-xs text-ink-soft truncate mb-1" style={{ letterSpacing: "-0.01em" }}>
                {label}
              </div>
            )}
            <div className="flex items-baseline gap-1.5 flex-wrap">
              {computed.hasDiscount && (
                <span
                  className="text-sale font-bold"
                  style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em" }}
                >
                  {computed.rate}
                  <span className="text-[0.7em]">%</span>
                </span>
              )}
              <span
                className="font-bold"
                style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}
              >
                {formatKRW(computed.final)}
              </span>
              {computed.hasDiscount && (
                <span
                  className="text-xs text-ink-muted line-through"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {formatKRW(price.originalPrice)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}
