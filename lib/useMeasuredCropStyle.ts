"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getImageCropStyle } from "@/lib/imagePosition";

/**
 * getImageCropStyle의 축소(scale<1) 구간을 연속적으로 그리기 위한 훅.
 *
 * 왜 필요한가 — "얼마나 줄여야 이미지 전체가 보이는가"는 프레임 비율과
 * 이미지 실제 비율의 관계에서만 나오는 값이라, URL 문자열만 보는
 * getImageCropStyle 혼자서는 알 수 없다. 그래서 크기를 아는 쪽(=실제로
 * 그려지는 DOM 요소)이 재서 넘겨준다. 크기를 못 재는 지점(서버 렌더링,
 * HTML 직렬화 등)은 이 훅을 안 쓰면 되고, 그 경우 기존 동작(1.00x 경계에서
 * contain으로 전환)이 그대로 유지된다.
 *
 * 사용법 — 반환된 ref를 실제 <img>/<video>에 걸고, style에 style을 편다.
 * 프레임 크기는 그 요소의 표시 박스(cover/contain이 맞춰지는 대상)를 쓰고,
 * 미디어 원본 크기는 naturalWidth/videoWidth에서 읽는다.
 */
export function useMeasuredCropStyle<T extends HTMLImageElement | HTMLVideoElement>(
  url: string | null | undefined
) {
  const ref = useRef<T | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);

  const readMediaSize = useCallback((el: T | null) => {
    if (!el) return;
    const w = el instanceof HTMLVideoElement ? el.videoWidth : el.naturalWidth;
    const h = el instanceof HTMLVideoElement ? el.videoHeight : el.naturalHeight;
    if (w > 0 && h > 0) {
      setMediaSize((prev) => (prev && prev.width === w && prev.height === h ? prev : { width: w, height: h }));
    }
  }, []);

  // 요소의 표시 박스를 따라간다 — 반응형 레이아웃에서 창을 줄이면 프레임
  // 비율이 달라지고, 그러면 필요한 축소량도 달라지기 때문에 한 번 재고 마는
  // 대신 ResizeObserver로 계속 맞춘다.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setFrameSize((prev) =>
          prev && Math.abs(prev.width - r.width) < 0.5 && Math.abs(prev.height - r.height) < 0.5
            ? prev
            : { width: r.width, height: r.height }
        );
      }
    };

    measure();
    // 캐시된 이미지는 onLoad가 이미 지나갔을 수 있어 여기서도 한 번 읽는다.
    readMediaSize(el);

    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [readMediaSize, url]);

  const onLoad = useCallback(() => readMediaSize(ref.current), [readMediaSize]);

  const metrics =
    frameSize && mediaSize
      ? {
          frameWidth: frameSize.width,
          frameHeight: frameSize.height,
          imageWidth: mediaSize.width,
          imageHeight: mediaSize.height,
        }
      : null;

  const style = getImageCropStyle(url, metrics);

  return { ref, style, onLoad };
}
