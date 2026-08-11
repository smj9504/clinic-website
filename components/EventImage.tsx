"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState, type ReactNode } from "react";

type EventImageProps = Omit<ImageProps, "onLoad" | "className" | "fill" | "style"> & {
  /** 디자인된 박스 비율(가로/세로). 가로형 이미지는 이 비율로 꽉 채워진다(cover). */
  ratio: number;
  /** 바깥 박스(크기, 배경, 모서리 등)에 적용할 클래스 */
  wrapperClassName?: string;
  /** <img> 자체에 적용할 클래스 (호버 확대 트랜지션 등) */
  className?: string;
  /** 이미지 박스 위에 겹쳐 그릴 오버레이(그라디언트, 화살표 등) */
  children?: ReactNode;
};

/**
 * 이벤트 이미지 전용 컴포넌트.
 * 가로형 이미지는 기존처럼 지정된 비율 박스를 꽉 채우고(cover),
 * A4 등 지정 비율보다 좁고 긴 세로형 이미지는 가로 폭을 유지한 채
 * 박스 높이가 이미지의 실제 비율만큼 늘어나 잘리지 않게 전체가 보인다.
 */
export default function EventImage({
  ratio,
  wrapperClassName = "",
  className = "",
  children,
  alt,
  ...props
}: EventImageProps) {
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  const measure = useCallback((img: HTMLImageElement | null) => {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    setImageRatio(img.naturalWidth / img.naturalHeight);
  }, []);

  const isPortrait = imageRatio !== null && imageRatio < ratio;
  const boxRatio = isPortrait ? imageRatio : ratio;

  return (
    <div className={`relative w-full ${wrapperClassName}`} style={{ aspectRatio: boxRatio }}>
      <Image
        {...props}
        alt={alt}
        ref={measure}
        onLoad={(e) => measure(e.currentTarget)}
        fill
        className={`object-cover ${className}`}
      />
      {children}
    </div>
  );
}
