"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSiteData, getBannerImage } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function NoticeDetailPage() {
  const { id } = useParams();
  const { notices, menus, heroSlides } = useSiteData();
  const t = useT();
  const banner = getBannerImage(menus, "/community/notice", heroSlides[0]?.image);

  const notice = notices.find((n) => String(n.id) === id);

  if (!notice) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6">
        <p className="text-ink-muted text-lg">공지를 찾을 수 없습니다.</p>
        <Link
          href="/community/notice"
          className="text-accent font-semibold text-sm hover:underline"
        >
          &larr; {t("notice.title")}
        </Link>
      </div>
    );
  }

  const currentIndex = notices.findIndex((n) => n.id === notice.id);
  const prevNotice = currentIndex < notices.length - 1 ? notices[currentIndex + 1] : null;
  const nextNotice = currentIndex > 0 ? notices[currentIndex - 1] : null;

  return (
    <>
      {/* Header */}
      <section
        className="relative pt-32 pb-16 md:pt-44 md:pb-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        {banner && (
          <div className="absolute inset-0 opacity-30">
            <Image
              src={banner}
              alt=""
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
          <Link
            href="/community/notice"
            className="inline-flex items-center gap-2 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity mb-8"
          >
            &larr; {t("notice.title")}
          </Link>
          <div className="flex items-center gap-3 mb-5">
            <span
              className={`text-[0.7rem] font-semibold uppercase px-2.5 py-1 rounded-sm ${
                notice.type === "event"
                  ? "bg-accent text-white"
                  : "bg-white/20 text-white"
              }`}
              style={{ letterSpacing: "0.1em" }}
            >
              {notice.type === "event" ? t("badge.event") : t("badge.notice")}
            </span>
            <span className="text-sm opacity-60">{notice.date}</span>
          </div>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(1.5rem, 4vw, 2.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.3,
            }}
          >
            {notice.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="py-16 md:py-24">
        <div className="container-default max-w-3xl">
          {notice.content ? (
            notice.content.startsWith("<") ? (
              <div
                className="prose prose-neutral max-w-none text-ink-soft"
                style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em" }}
                dangerouslySetInnerHTML={{ __html: notice.content }}
              />
            ) : (
              <div
                className="text-ink-soft"
                style={{
                  fontSize: "1.05rem",
                  lineHeight: 2,
                  letterSpacing: "-0.01em",
                  whiteSpace: "pre-line",
                }}
              >
                {notice.content}
              </div>
            )
          ) : (
            <p className="text-ink-muted text-center py-12">
              등록된 상세 내용이 없습니다.
            </p>
          )}
        </div>
      </section>

      {/* Prev / Next navigation */}
      <section className="border-t border-line">
        <div className="container-default max-w-3xl">
          <div className="divide-y divide-line">
            {nextNotice && (
              <Link
                href={`/community/notice/${nextNotice.id}`}
                className="flex items-center gap-4 py-5 hover:pl-2 transition-all group"
              >
                <span className="text-xs text-ink-muted w-16 shrink-0">다음글</span>
                <span
                  className="font-medium truncate group-hover:text-accent transition-colors"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {nextNotice.title}
                </span>
              </Link>
            )}
            {prevNotice && (
              <Link
                href={`/community/notice/${prevNotice.id}`}
                className="flex items-center gap-4 py-5 hover:pl-2 transition-all group"
              >
                <span className="text-xs text-ink-muted w-16 shrink-0">이전글</span>
                <span
                  className="font-medium truncate group-hover:text-accent transition-colors"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {prevNotice.title}
                </span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
