"use client";

import Link from "next/link";
import Image from "next/image";
import { computePrice, formatKRW, maxDiscountRate, primaryPrice } from "@/lib/price";
import { isEventService, isVideoUrl, priceText, serviceText, type Service, type ServiceBadge } from "@/lib/services";
import type { Locale } from "@/lib/i18n";
import type { TranslationKey } from "@/lib/translations";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

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

  // 카드에는 대표 옵션(최저가) 하나만 보여준다. 나머지는 상세 페이지의 가격표에서.
  // 옵션이 여러 개면 이미지에 "옵션 N종" 배지를, 가격 뒤에 "~"를 붙여 최저가임을 알린다.
  const price = primaryPrice(service.prices);
  const computed = price ? computePrice(price) : null;
  const label = price ? priceText(price, locale).label : "";
  const hasMore = service.prices.length > 1;

  // 옵션이 여러 개면 할인율은 옵션 중 최대치를 "최대 N%"로 보여준다.
  // 이때 정가 취소선은 표시 가격의 할인율이 그 최대치와 같을 때만 그린다 —
  // "최대 50%" 옆에 30% 할인된 금액의 정가가 붙으면 숫자가 서로 맞지 않아 보인다.
  const maxRate = hasMore ? maxDiscountRate(service.prices) : computed?.rate ?? 0;
  const showStrike = Boolean(computed?.hasDiscount) && computed?.rate === maxRate;

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
        이벤트 카드처럼 원본 비율을 살리는 대신, 상세 페이지와 같은 16:10으로 잘라
        통일한다 — 대표 미디어 하나로 목록·상세가 똑같이 보이도록.
      */}
      <div className="relative bg-bg-alt overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
        {/*
          대표 미디어가 동영상이면 카드에서도 재생한다. 다만 카드는 목록에 여러 개가
          동시에 깔리므로 조작 UI 없이 소리 없는 반복 재생으로만 쓰고, preload는
          하지 않는다 — 스크롤로 지나치는 카드까지 전부 내려받지 않도록.
        */}
        {isVideoUrl(service.image) ? (
          <video
            key={service.image}
            src={stripImagePosition(service.image)}
            muted
            autoPlay
            loop
            playsInline
            preload="none"
            poster={stripImagePosition(fallbackImage)}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ ...getImageCropStyle(service.image) }}
          />
        ) : (
          <Image
            src={stripImagePosition(service.image || fallbackImage)}
            alt={name}
            fill
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
            style={{ ...getImageCropStyle(service.image || fallbackImage) }}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            quality={75}
            placeholder="blur"
            blurDataURL={BLUR_PLACEHOLDER}
          />
        )}
        {hasMore && (
          <span
            className="absolute left-0 top-0 px-2 py-1 text-[0.65rem] font-semibold bg-ink text-ink-inverse"
            style={{ letterSpacing: "0.02em" }}
          >
            {t("services.optionsBadge").replace("{count}", String(service.prices.length))}
          </span>
        )}
        {(service.badges.length > 0 || isEventService(service)) && (
          <div className="absolute right-0 bottom-0 flex">
            {/* EVENT는 admin이 badges 배열에 직접 넣는 게 아니라 eventIds 연결 여부로만
                자동 계산된다 — 이벤트 화면에서 시술을 연결/해제하면 그대로 반영되고,
                수동으로 껐다 켰다 할 별도 설정을 두지 않는다. */}
            {isEventService(service) && (
              <span
                className="px-2 py-1 text-[0.6rem] font-bold bg-sale text-white"
                style={{ letterSpacing: "0.08em" }}
              >
                EVENT
              </span>
            )}
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
              {maxRate > 0 && (
                <span
                  className="text-sale font-bold"
                  style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em" }}
                >
                  {hasMore && <span className="text-[0.7em] font-semibold">{t("services.maxRatePrefix")}</span>}
                  {maxRate}
                  <span className="text-[0.7em]">%</span>
                </span>
              )}
              <span
                className="font-bold"
                style={{ fontSize: "1.0625rem", letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}
              >
                {hasMore && t("services.priceFromPrefix")}
                {formatKRW(computed.final)}
                {hasMore && t("services.priceFromSuffix")}
              </span>
              {showStrike && (
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
