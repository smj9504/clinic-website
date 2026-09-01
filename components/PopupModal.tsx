"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import type { PopupItem } from "@/lib/storage";
import { todayKST } from "@/lib/date";
import { stripImagePosition, toObjectPosition } from "@/lib/imagePosition";

const DISMISS_EVENT = "popup_dismissed_event";
const AUTO_ADVANCE_MS = 6000;

/** HTML 태그를 제거하고 순수 텍스트만 반환 */
function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').trim();
}

function usePreloadImages(urls: string[]) {
  useEffect(() => {
    urls.forEach((url) => {
      if (!url) return;
      const img = new window.Image();
      img.src = url;
    });
  }, [urls]);
}

function isEventActive(ev: { startDate?: string; endDate?: string }) {
  const today = todayKST();
  if (ev.startDate && ev.startDate > today) return false;
  if (ev.endDate && ev.endDate < today) return false;
  return true;
}

export default function PopupModal() {
  const pathname = usePathname();
  const isHome = pathname === "/" || pathname === "";
  const { popup, events, loaded, clinicInfo } = useSiteData();
  const fallbackImage = clinicInfo.defaultImage || "/gowoonbit.jpg";
  const t = useT();
  const [open, setOpen] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // 삭제된 이벤트와 종료/예정 이벤트는 제외, 이벤트 데이터와 동기화
  const popupItems: PopupItem[] = useMemo(() => {
    const items = popup?.items ?? [];
    return items
      .filter((item) => {
        const ev = events.find((e) => e.id === item.eventId);
        return ev && isEventActive(ev);
      })
      .map((item) => {
        const ev = events.find((e) => e.id === item.eventId)!;
        return {
          ...item,
          title: stripHtml(`${ev.title}\n${ev.subtitle}`),
          body: stripHtml(ev.description),
          image: ev.image || item.image,
        };
      });
  }, [popup, events]);

  const eventActive = popup?.isActive && popupItems.length > 0;

  // Preload popup images before the modal opens
  const imageUrls = useMemo(() => popupItems.map((item) => item.image).filter(Boolean), [popupItems]);
  usePreloadImages(imageUrls);

  // 이미 한 번 열렸으면 재트리거 방지 (DB fetch 후 데이터 갱신 시 다시 열리는 버그 수정)
  const hasOpenedRef = useRef(false);

  useEffect(() => {
    if (!loaded) return; // DB 로드 완료 전에는 실행하지 않음
    if (!isHome) return; // 메인 화면에서만 팝업 표시
    if (hasOpenedRef.current) return;
    if (!eventActive) return;

    const today = todayKST();
    const eventDismissed =
      typeof window !== "undefined"
        ? localStorage.getItem(DISMISS_EVENT) === today
        : true;

    if (eventDismissed) return;

    hasOpenedRef.current = true;
    const timer = setTimeout(() => setOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [loaded, isHome, eventActive, popupItems.length]);

  const close = (dismiss = false) => {
    if (dismiss) {
      localStorage.setItem(DISMISS_EVENT, todayKST());
    }
    setOpen(false);
    setSlideIndex(0);
  };

  // 열린 상태에서 표시할 내용이 없으면 자동 닫기
  useEffect(() => {
    if (open && !eventActive) {
      setOpen(false);
    }
  }, [open, eventActive]);

  // 배경 페이지에 가로 스크롤이 남아있으면 fixed 팝업도 함께 밀려 잘려 보이는
  // 모바일 브라우저가 있어, 팝업이 열린 동안은 body의 가로 스크롤을 막는다.
  useEffect(() => {
    if (!open) return;
    const prevOverflowX = document.body.style.overflowX;
    document.body.style.overflowX = "hidden";
    return () => {
      document.body.style.overflowX = prevOverflowX;
    };
  }, [open]);

  const hasMultiple = popupItems.length > 1;

  // 5~7초마다 다음 카테고리로 자동 전환. 사용자가 직접 탭을 클릭하면 타이머가 리셋된다.
  useEffect(() => {
    if (!open || !hasMultiple) return;
    const timer = setTimeout(() => {
      setSlideIndex((i) => (i + 1) % popupItems.length);
    }, AUTO_ADVANCE_MS);
    return () => clearTimeout(timer);
  }, [open, hasMultiple, slideIndex, popupItems.length]);

  if (!open) return null;

  const currentItem = popupItems[slideIndex] ?? popupItems[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.4)", animation: "fadeIn 300ms ease" }}
      onClick={() => close()}
    >
      <div
        className="bg-bg w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-lg relative flex flex-col"
        style={{ animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => close()}
          className="absolute top-4 right-4 z-10 w-11 h-11 rounded-full bg-black/30 text-white text-base flex items-center justify-center backdrop-blur-sm hover:bg-black/50 transition-colors"
          aria-label={t("popup.close")}
        >
          ✕
        </button>

        {/* Image — no text, slides left/right between events */}
        {currentItem && (
          <div
            className="relative w-full bg-accent overflow-hidden aspect-[4/5] sm:aspect-[16/9]"
          >
            {popupItems.map((item, i) => {
              // 다음 카테고리로 넘어갈 때 항상 왼쪽으로 미끄러지도록, 순환을 고려한 최단 상대 위치를 구한다.
              const count = popupItems.length;
              let offset = i - slideIndex;
              if (offset > count / 2) offset -= count;
              if (offset < -count / 2) offset += count;

              return (
                <div
                  key={item.eventId}
                  className="absolute inset-0 transition-transform ease-in-out"
                  style={{
                    transform: `translateX(${offset * 100}%)`,
                    transitionDuration: "600ms",
                    pointerEvents: i === slideIndex ? "auto" : "none",
                  }}
                >
                  <Image
                    src={stripImagePosition(item.image || fallbackImage)}
                    alt={item.categoryLabel || item.title}
                    fill
                    sizes="1024px"
                    priority={i === slideIndex}
                    quality={75}
                    className="object-cover"
                    style={{ objectPosition: toObjectPosition(item.image || fallbackImage) }}
                  />
                  {(item.imageOverlay ?? true) && (
                    <div
                      className="absolute inset-0"
                      style={{ background: "rgba(107, 68, 35, 0.15)" }}
                    />
                  )}
                </div>
              );
            })}

            {/* Whole image is a link to event detail */}
            <a
              href={currentItem.linkUrl}
              onClick={() => setOpen(false)}
              className="absolute inset-0"
              aria-label={currentItem.categoryLabel || currentItem.title}
            />
          </div>
        )}

        {/* Bottom category tabs — column count always matches event count, so each tab evenly splits the width */}
        {hasMultiple && (
          <div
            className="grid w-full flex-shrink-0"
            style={{ gridTemplateColumns: `repeat(${popupItems.length}, minmax(0, 1fr))` }}
          >
            {popupItems.map((item, i) => (
              <button
                key={item.eventId}
                onClick={() => setSlideIndex(i)}
                className="min-w-0 py-3.5 px-2 text-xs sm:text-sm font-semibold text-center transition-colors line-clamp-2 sm:truncate"
                style={{
                  letterSpacing: "-0.01em",
                  background: i === slideIndex ? "var(--color-accent)" : "var(--color-bg)",
                  color: i === slideIndex ? "#fff" : "var(--color-ink-muted)",
                }}
              >
                {item.categoryLabel || item.title.split("\n")[0]}
              </button>
            ))}
          </div>
        )}

        {/* Bottom close bar */}
        <div className="flex w-full flex-shrink-0 border-t border-line">
          <button
            onClick={() => close(true)}
            className="flex-1 py-4 text-sm font-medium bg-ink text-white hover:opacity-90 transition-opacity"
            style={{ letterSpacing: "-0.01em" }}
          >
            {t("popup.dismissTodayShort")}
          </button>
          <button
            onClick={() => close()}
            className="flex-1 py-4 text-sm font-medium bg-bg-alt text-ink hover:bg-line/40 transition-colors"
            style={{ letterSpacing: "-0.01em" }}
          >
            {t("popup.closeShort")}
          </button>
        </div>
      </div>
    </div>
  );
}
