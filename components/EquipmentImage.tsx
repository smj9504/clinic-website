"use client";

import Image from "next/image";
import { hasRealEquipmentImage, isVideoUrl } from "@/lib/services";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNGM0VGRTgiLz48L3N2Zz4=";

type EquipmentImageProps = {
  src: string | null | undefined;
  alt: string;
  sizes: string;
  className?: string;
  quality?: number;
  fill?: boolean;
};

/**
 * 장비 사진·동영상을 그리되, 실사진이 없으면(hasRealEquipmentImage) 임의
 * 사진 대신 클리닉 로고를 축소해 보여준다. "사진이 없으면 fallback을 보여주고,
 * 절대 관계없는 임의 사진을 보여주지 않는다"는 원칙 — 데모 시딩 단계의
 * Unsplash 이미지도 관리자가 실사진으로 교체하기 전까지는 "사진 없음"과
 * 동일하게 취급한다. 로고는 object-cover가 아니라 contain으로 축소해
 * 실사진처럼 화면을 꽉 채우는 대신 브랜드 마크임이 분명하게 보이도록 한다.
 *
 * eq.image가 동영상 URL이면 next/image가 처리할 수 없으므로(400 에러) <video>로
 * 분기한다 — EquipmentShowcase의 EquipmentMedia와 동일한 판별 로직을 이 공용
 * 컴포넌트에 내장해, 이 컴포넌트를 쓰는 모든 곳(장비 그리드·캐러셀 등)이
 * 자동으로 동영상을 지원하게 한다.
 */
export default function EquipmentImage({ src, alt, sizes, className = "", quality = 75, fill = true }: EquipmentImageProps) {
  if (!hasRealEquipmentImage(src)) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-bg-alt">
        <div className="relative w-2/5 h-2/5 opacity-40">
          <Image src="/logo-color.jpg" alt="" fill className="object-contain" sizes="10rem" />
        </div>
      </div>
    );
  }

  if (isVideoUrl(src)) {
    return (
      <video
        key={src}
        src={stripImagePosition(src)}
        muted
        autoPlay
        loop
        playsInline
        // object-cover를 항상 강제 — 호출부가 className을 안 넘기면 fill 모드 기본값(object-fit: fill)이
        // 적용돼 비율이 찌그러진다. 호출부는 추가 효과(hover 확대 등)만 얹는다.
        className={`absolute inset-0 w-full h-full object-cover ${className}`}
        style={{ ...getImageCropStyle(src) }}
      />
    );
  }

  return (
    <Image
      src={stripImagePosition(src)}
      alt={alt}
      fill={fill}
      className={`object-cover ${className}`}
      style={{ ...getImageCropStyle(src) }}
      sizes={sizes}
      quality={quality}
      placeholder="blur"
      blurDataURL={BLUR_PLACEHOLDER}
    />
  );
}
