"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import PriceTable from "@/components/services/PriceTable";
import ServiceBlocks from "@/components/services/ServiceBlocks";
import { useService } from "@/lib/useServices";
import { isVideoUrl, serviceText } from "@/lib/services";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";
const FALLBACK_IMAGE = "/gowoonbit.jpg";

/**
 * 시술 상세 콘텐츠(이미지 · 본문 · 가격)만 담당한다.
 * 뒤로가기 링크, 좌측 카테고리 필터, 상단 "다른 시술" 캐러셀, 3단 그리드,
 * 하단 related, 카트 요약 바는 app/services/(detail)/layout.tsx가 그린다 —
 * 그쪽은 id가 바뀌어도 리마운트되지 않아야 하는 페이지 뼈대이기 때문이다.
 *
 * 이 컴포넌트는 layout.tsx의 grid 안에 형제 엘리먼트 두 개(중앙 콘텐츠 · 가격
 * aside)를 직접 반환한다 — 각자 lg:[grid-column:2]/[grid-column:3]로 자기
 * 자리를 명시하므로 감싸는 래퍼를 두면 안 된다(grid item이 아니게 되어 배치가 깨짐).
 */
export default function ServiceDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : undefined;

  const { service, loading, notFound, error } = useService(id);
  const { clinicInfo } = useSiteData();
  const { locale } = useLocale();
  const t = useT();

  const fallbackImage = clinicInfo.defaultImage || FALLBACK_IMAGE;

  // 최초 진입(아직 어떤 시술 데이터도 없는 상태)에서만 콘텐츠 영역 전체를 스켈레톤으로 대체한다.
  // id만 바뀌어 재조회하는 동안에는 이전 시술 데이터가 useService에 남아 있으므로
  // 아래에서 부분 스켈레톤(이미지·본문·가격)만 씌운다.
  if (loading && !service) {
    return <ServiceDetailSkeleton />;
  }

  if (!loading && (notFound || error || !service)) {
    return (
      <div className="min-w-0 lg:[grid-column:2] min-h-[40vh] flex flex-col items-center justify-center gap-6 px-6 text-center">
        <p className="text-ink-muted text-lg">
          {error ? t("services.error") : t("services.notFound")}
        </p>
        <Link href="/services" className="text-accent font-semibold text-sm hover:underline">
          &larr; {t("services.backToList")}
        </Link>
      </div>
    );
  }

  if (!service) return null;

  const { name, summary } = serviceText(service, locale);
  const period = [service.saleStartDate, service.saleEndDate].filter(Boolean).join(" ~ ");

  return (
    <>
      <div className="min-w-0 lg:[grid-column:2]">
        <div
          aria-busy={loading}
          className={`transition-opacity duration-200 ${loading ? "opacity-40 pointer-events-none" : ""}`}
        >
          <div
            className="relative bg-bg-alt rounded overflow-hidden"
            style={{ aspectRatio: "16 / 10" }}
          >
            {loading && (
              <div className="absolute inset-0 animate-pulse bg-bg-alt" aria-hidden="true" />
            )}
            {isVideoUrl(service.image) ? (
              <video
                src={stripImagePosition(service.image)}
                controls
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                style={{ objectPosition: toObjectPosition(service.image) }}
              />
            ) : (
              <Image
                src={stripImagePosition(service.image || fallbackImage)}
                alt={name}
                fill
                className="object-cover"
                style={{ objectPosition: toObjectPosition(service.image || fallbackImage) }}
                sizes="(max-width: 1024px) 100vw, 45vw"
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

          <h1
            className="font-display mt-6"
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
      </div>

      {/* 가격 — 폭 고정, 스크롤 동안 화면에 고정 */}
      <aside
        aria-busy={loading}
        className="lg:[grid-column:3] lg:sticky bg-bg-alt rounded p-6"
        style={{ top: "104px" }}
      >
        <div className={`transition-opacity duration-200 ${loading ? "opacity-40 pointer-events-none" : ""}`}>
          <PriceTable
            serviceId={service.id}
            serviceName={name}
            prices={service.prices}
            locale={locale}
            t={t}
          />

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

          <p className="mt-5 text-xs text-ink-muted" style={{ lineHeight: 1.75 }}>
            {t("services.priceNotice")}
          </p>
        </div>
      </aside>
    </>
  );
}

/**
 * 최초 진입(아직 표시할 시술 데이터가 전혀 없는 상태) 전용 콘텐츠 스켈레톤.
 * layout.tsx의 grid 안에 형제 두 개로 들어가므로 실제 콘텐츠와 동일하게
 * lg:[grid-column:2]/[grid-column:3]을 지정해 전환 시 레이아웃이 튀지 않게 한다.
 */
function ServiceDetailSkeleton() {
  return (
    <>
      <div className="min-w-0 lg:[grid-column:2]">
        <div className="bg-bg-alt rounded animate-pulse" style={{ aspectRatio: "16 / 10" }} />
        <div className="h-8 w-2/3 rounded bg-bg-alt animate-pulse mt-6" />
        <div className="h-4 w-full rounded bg-bg-alt animate-pulse mt-4" />
        <div className="h-4 w-4/5 rounded bg-bg-alt animate-pulse mt-2" />
      </div>
      <div className="lg:[grid-column:3] bg-bg-alt rounded p-6 space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-16 rounded bg-surface animate-pulse" />
        ))}
      </div>
    </>
  );
}
