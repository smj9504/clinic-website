"use client";

import { useEffect, useRef, useState } from "react";
import {
  MIN_SCALE,
  getImageCropStyle,
  parseImagePosition,
  setImagePosition,
  stripImagePosition,
} from "@/lib/imagePosition";

const MAX_SCALE = 3;
const SCALE_STEP = 0.05;

type Props = {
  /** 위치 프래그먼트가 섞여 있어도, 없어도 상관없다 — 내부에서 파싱한다 */
  url: string;
  aspectRatio: string;
  isVideo: boolean;
  onConfirm: (x: number, y: number, scale: number) => void;
  onClose: () => void;
  /**
   * 같은 이미지가 이 비율 외에 다른 화면에도 그대로(동일 초점 좌표로) 노출될 때,
   * 그 목적지들을 여기 나열한다. 크롭 위치는 이미지당 좌표 하나뿐이라(imagePosition.ts)
   * 주 비율만 보고 위치를 잡으면 다른 비율에서 원치 않는 부분이 잘릴 수 있어,
   * 조정하는 동안 모든 목적지를 동시에 보여줘 하나의 초점으로 다 같이 잘 보이는
   * 지점을 고르게 한다.
   */
  extraRatios?: { label: string; ratio: string }[];
};

function clientToPercent(clientX: number, clientY: number, rect: DOMRect) {
  const x = ((clientX - rect.left) / rect.width) * 100;
  const y = ((clientY - rect.top) / rect.height) * 100;
  return { x: Math.min(100, Math.max(0, x)), y: Math.min(100, Math.max(0, y)) };
}

/**
 * 크롭 위치(object-position) 조정 모달 — 실제 표시될 비율(aspectRatio) 프레임
 * 안에서 미디어를 드래그해 보여줄 지점을 고른다. 드래그 중엔 로컬 state만
 * 갱신하고 pointerup에서만 커밋한다(AreaMapPicker와 동일한 이유 — 매
 * pointermove마다 부모를 리렌더하면 저사양 기기에서 버벅인다).
 */
export default function ImagePositionModal({ url, aspectRatio, isVideo, onConfirm, onClose, extraRatios = [] }: Props) {
  const cleanUrl = stripImagePosition(url);
  const initial = parseImagePosition(url) ?? { x: 50, y: 50, scale: 1 };

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState({ x: initial.x, y: initial.y });
  const [scale, setScale] = useState(initial.scale);
  const [isDragging, setIsDragging] = useState(false);
  /**
   * 축소(scale<1)를 연속적으로 그리려면 프레임과 미디어의 실제 크기가 필요하다
   * (getImageCropStyle 주석 참고). 로드 시점에 한 번 재고, 창 크기가 바뀌면
   * 프레임 폭이 달라지므로 다시 잰다.
   */
  const [mediaSize, setMediaSize] = useState<{ width: number; height: number } | null>(null);
  const [frameSize, setFrameSize] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // 프레임 실제 픽셀 크기 — aspectRatio 문자열만으론 알 수 없고, 창 크기에
  // 따라 달라지므로 ResizeObserver로 따라간다.
  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setFrameSize({ width: r.width, height: r.height });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    dragRef.current = { pointerId: e.pointerId };
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setPos(clientToPercent(e.clientX, e.clientY, rect));
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    const rect = frameRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos(clientToPercent(e.clientX, e.clientY, rect));
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragRef.current || dragRef.current.pointerId !== e.pointerId) return;
    dragRef.current = null;
    setIsDragging(false);
  };

  const reset = () => {
    setPos({ x: 50, y: 50 });
    setScale(1);
  };

  // 드래그 중인 pos/scale을 실제 렌더링 지점(getImageCropStyle)과 동일한
  // 스타일로 변환해 미리보기가 저장 후 결과와 정확히 일치하게 한다 —
  // scale<1이면 object-fit이 contain으로 바뀌어야 "전체 보이기"가 실제로 보인다.
  // 프레임·미디어 크기를 함께 넘겨야 축소가 1.00x에서 끊기지 않고 연속적으로
  // 줄어든다(안 넘기면 예전처럼 경계에서 한 번에 전환된다).
  const positionedUrl = setImagePosition(cleanUrl, pos.x, pos.y, scale);
  const metrics =
    frameSize && mediaSize
      ? {
          frameWidth: frameSize.width,
          frameHeight: frameSize.height,
          imageWidth: mediaSize.width,
          imageHeight: mediaSize.height,
        }
      : null;
  const previewStyle = getImageCropStyle(positionedUrl, metrics);
  const previewObjectFit = previewStyle.objectFit ?? "cover";

  const onMediaLoad = (w: number, h: number) => {
    if (w > 0 && h > 0) setMediaSize({ width: w, height: h });
  };

  // extraRatios 썸네일용 — metrics 없이(=주 프레임의 확대율을 물려받지 않게)
  // 계산해, 다른 비율 프레임에 엉뚱한 배율이 적용되는 걸 막는다.
  const thumbStyle = getImageCropStyle(positionedUrl);
  const thumbObjectFit = thumbStyle.objectFit ?? "cover";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md"
      style={{ background: "rgba(0,0,0,0.4)", animation: "fadeIn 300ms ease" }}
      onClick={onClose}
    >
      <div
        className="bg-bg w-full max-w-2xl rounded-lg relative p-6 md:p-8"
        style={{ animation: "scaleIn 400ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-bg-alt text-ink flex items-center justify-center hover:bg-line transition-colors"
          aria-label="닫기"
        >
          ✕
        </button>

        <h2
          className="font-display mb-2 pr-10"
          style={{ fontSize: "1.25rem", fontWeight: 600, letterSpacing: "-0.03em" }}
        >
          크롭 위치 조정
        </h2>
        <p className="text-xs text-ink-muted mb-5" style={{ letterSpacing: "-0.01em" }}>
          사진을 마우스로 드래그해서 실제 화면에 보여질 위치를 정하세요. 비율은 그대로 유지됩니다.
          아래 슬라이더로 확대/축소도 조절할 수 있습니다.
          {extraRatios.length > 0 &&
            " 같은 사진이 아래 비율로도 함께 노출되니, 모든 미리보기가 괜찮은 지점을 찾으세요."}
        </p>

        <div
          ref={frameRef}
          className="relative w-full rounded overflow-hidden bg-bg-alt border border-line select-none cursor-move touch-none"
          style={{ aspectRatio }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {isVideo ? (
            <video
              src={cleanUrl}
              muted
              autoPlay
              loop
              playsInline
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ ...previewStyle, objectFit: previewObjectFit }}
              onLoadedMetadata={(e) => {
                const v = e.currentTarget;
                onMediaLoad(v.videoWidth, v.videoHeight);
              }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cleanUrl}
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ ...previewStyle, objectFit: previewObjectFit }}
              onLoad={(e) => {
                const img = e.currentTarget;
                onMediaLoad(img.naturalWidth, img.naturalHeight);
              }}
            />
          )}

          {/* 십자선 — 현재 초점 위치를 시각적으로 표시 */}
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              width: "1.5rem",
              height: "1.5rem",
              border: "2px solid white",
              boxShadow: "0 0 0 2px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3)",
              transition: isDragging ? "none" : "left 120ms, top 120ms",
            }}
            aria-hidden="true"
          />
        </div>

        <div className="flex items-center gap-3 mt-4">
          <label className="text-xs text-ink-muted shrink-0" style={{ letterSpacing: "-0.01em" }}>
            확대/축소
          </label>
          <input
            type="range"
            min={MIN_SCALE}
            max={MAX_SCALE}
            step={SCALE_STEP}
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-ink"
          />
          <span className="text-xs text-ink-muted w-10 text-right font-mono">{scale.toFixed(2)}x</span>
        </div>
        {scale < 1 && (
          <p className="text-xs text-ink-muted mt-1.5" style={{ letterSpacing: "-0.01em" }}>
            1.00x 미만으로 줄이면 사진 전체가 잘리지 않고 다 보이는 대신, 남는 자리에 여백이 생깁니다.
          </p>
        )}

        {extraRatios.length > 0 && (
          <div className="flex gap-3 mt-4 flex-wrap">
            {extraRatios.map((extra) => (
              <div key={extra.label} className="flex-1 min-w-[7rem]">
                {/*
                  이 썸네일들은 주 프레임과 비율·크기가 다르므로 주 프레임의
                  metrics를 그대로 쓰면 축소량이 틀어진다. 각자 재게 하려면
                  프레임마다 관측이 필요한데, 여기 목적은 "이 초점이 다른
                  비율에서도 괜찮은가"를 보는 것이라 축소 구간은 기존
                  동작(contain 전환)으로 둔다.
                */}
                <div
                  className="relative w-full rounded overflow-hidden bg-bg-alt border border-line"
                  style={{ aspectRatio: extra.ratio }}
                >
                  {isVideo ? (
                    <video
                      src={cleanUrl}
                      muted
                      autoPlay
                      loop
                      playsInline
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ ...thumbStyle, objectFit: thumbObjectFit }}
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={cleanUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full pointer-events-none"
                      style={{ ...thumbStyle, objectFit: thumbObjectFit }}
                    />
                  )}
                </div>
                <p className="text-[0.7rem] text-ink-muted mt-1 text-center" style={{ letterSpacing: "-0.01em" }}>
                  {extra.label}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-5">
          <button
            type="button"
            onClick={reset}
            className="text-xs text-ink-muted hover:text-ink transition-colors underline"
            style={{ letterSpacing: "-0.01em" }}
          >
            중앙으로 초기화
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm border border-line rounded hover:bg-bg-alt transition-colors"
              style={{ letterSpacing: "-0.02em" }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onConfirm(pos.x, pos.y, scale)}
              className="px-4 py-2 text-sm bg-ink text-ink-inverse rounded hover:bg-ink-soft transition-colors font-semibold"
              style={{ letterSpacing: "-0.02em" }}
            >
              적용
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
