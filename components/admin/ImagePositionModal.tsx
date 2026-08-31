"use client";

import { useEffect, useRef, useState } from "react";
import { parseImagePosition, stripImagePosition } from "@/lib/imagePosition";

type Props = {
  /** 위치 프래그먼트가 섞여 있어도, 없어도 상관없다 — 내부에서 파싱한다 */
  url: string;
  aspectRatio: string;
  isVideo: boolean;
  onConfirm: (x: number, y: number) => void;
  onClose: () => void;
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
export default function ImagePositionModal({ url, aspectRatio, isVideo, onConfirm, onClose }: Props) {
  const cleanUrl = stripImagePosition(url);
  const initial = parseImagePosition(url) ?? { x: 50, y: 50 };

  const frameRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ pointerId: number } | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState(initial);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    closeButtonRef.current?.focus();
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

  const reset = () => setPos({ x: 50, y: 50 });

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
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cleanUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover pointer-events-none"
              style={{ objectPosition: `${pos.x}% ${pos.y}%` }}
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
              onClick={() => onConfirm(pos.x, pos.y)}
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
