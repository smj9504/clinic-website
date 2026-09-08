"use client";

import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState, useMemo, useRef } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import type { PopupItem } from "@/lib/storage";
import { todayKST } from "@/lib/date";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

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
  // 현재 이미지의 실제 가로/세로 비율. 모달 폭을 이 비율에 맞춰 잡아
  // 이미지가 좌우 여백(레터박스) 없이 팝업을 꽉 채우게 한다.
  const [imageRatio, setImageRatio] = useState<number | null>(null);

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
          mobileImage: ev.mobileImage || undefined,
        };
      });
  }, [popup, events]);

  const eventActive = popup?.isActive && popupItems.length > 0;

  // Preload popup images before the modal opens (both desktop and mobile variants)
  const imageUrls = useMemo(
    () => popupItems.flatMap((item) => [item.image, item.mobileImage]).filter((u): u is string => Boolean(u)),
    [popupItems]
  );
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

  // 모바일 전용 이미지가 있는 이벤트는 화면 폭에 따라 서로 다른 이미지가
  // 보인다(sm 미만: mobileImage / 이상: image). 둘 다 DOM에 있고 CSS로만
  // 감춰지므로 onLoad는 양쪽 다 발생한다 — 지금 실제로 보이는 쪽의 비율만
  // 반영하려면 화면 폭을 알아야 한다. Tailwind의 sm 브레이크포인트(640px)와
  // 동일한 기준을 쓴다.
  const [isNarrow, setIsNarrow] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    const sync = () => setIsNarrow(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  // 슬라이드나 표시 중인 이미지 종류가 바뀌면 비율을 다시 재야 하므로 초기화한다.
  // (초기화하지 않으면 이전 이미지 비율로 모달 크기가 잠시 잘못 잡힌다)
  useEffect(() => {
    setImageRatio(null);
  }, [slideIndex, isNarrow]);

  const hasMultiple = popupItems.length > 1;

  // 이미지 아래에 항상 붙는 UI(닫기 버튼 바, 그리고 이벤트가 여러 개일 때만
  // 나타나는 카테고리 탭 바)의 높이. 모달 폭을 역산할 때 이만큼은 이미지가
  // 쓸 수 없는 높이라 빼줘야 한다.
  const chromeHeight = hasMultiple ? "7rem" : "3.5rem";

  /**
   * 이미지에서 실제 비율을 읽어 모달 크기에 반영한다.
   * onLoad와 ref 양쪽에서 호출하는 이유 — 이 팝업은 열리기 전에 이미지를
   * 미리 받아두는데(usePreloadImages), 캐시에서 즉시 그려지는 이미지는
   * onLoad가 발생하지 않을 수 있다. ref 콜백에서 complete를 확인해 한 번
   * 더 재면 두 경우 모두 안전하다.
   */
  const measure = (el: HTMLImageElement | null) => {
    if (!el || !el.complete) return;
    if (el.naturalWidth && el.naturalHeight) {
      setImageRatio(el.naturalWidth / el.naturalHeight);
    }
  };

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
      {/*
        모달 폭을 이미지의 실제 비율에서 역산한다. 폭을 max-w로 먼저 고정해
        버리면 세로로 긴 이미지는 그 폭에 맞춰 축소되면서 좌우에 빈 여백만
        남는다(=팝업은 그대로인데 이미지만 작아짐). 대신 "쓸 수 있는 높이"를
        기준으로 폭을 정하면 이미지가 팝업을 꽉 채운 채 팝업 자체가 커진다.
        하단 버튼 바(약 3.5rem)와 탭 바가 차지하는 높이를 빼고 계산한다.
      */}
      <div
        className="bg-bg w-full overflow-hidden rounded-lg relative flex flex-col"
        style={{
          animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)",
          maxWidth: imageRatio
            ? `min(64rem, calc((92dvh - ${chromeHeight}) * ${imageRatio}))`
            : "64rem",
        }}
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
        {/*
          이미지 영역은 측정된 실제 비율을 그대로 쓴다. 위 모달 폭이 이미 이
          비율에서 역산된 값이라, 이미지는 잘리지도 좌우 여백을 남기지도 않고
          팝업을 꽉 채운다. 비율을 아직 재지 못한 첫 프레임에서는 기존
          기본값(모바일 4:5 / PC 16:9)으로 자리를 잡아 레이아웃이 튀지 않게 한다.
        */}
        {currentItem && (
          <div
            className={`relative w-full bg-bg-alt overflow-hidden ${
              imageRatio ? "" : "aspect-[4/5] sm:aspect-[16/9]"
            }`}
            style={imageRatio ? { aspectRatio: imageRatio } : undefined}
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
                    quality={90}
                    // 현재 보이는 슬라이드의, 실제로 화면에 나온 이미지만 측정한다.
                    // 좁은 화면에서 mobileImage가 대신 보이는 경우엔 그쪽에 맡긴다.
                    ref={i === slideIndex && !(item.mobileImage && isNarrow) ? measure : undefined}
                    onLoad={(e) => {
                      if (i !== slideIndex) return;
                      if (item.mobileImage && isNarrow) return;
                      measure(e.currentTarget);
                    }}
                    className={`object-cover ${item.mobileImage ? "hidden sm:block" : ""}`}
                    style={{ ...getImageCropStyle(item.image || fallbackImage) }}
                  />
                  {item.mobileImage && (
                    <Image
                      src={stripImagePosition(item.mobileImage)}
                      alt={item.categoryLabel || item.title}
                      fill
                      sizes="1024px"
                      priority={i === slideIndex}
                      quality={90}
                      ref={i === slideIndex && isNarrow ? measure : undefined}
                      onLoad={(e) => {
                        if (i !== slideIndex || !isNarrow) return;
                        measure(e.currentTarget);
                      }}
                      className="object-cover sm:hidden"
                      style={{ ...getImageCropStyle(item.mobileImage) }}
                    />
                  )}
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
