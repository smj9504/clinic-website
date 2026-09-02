"use client";

import Image, { type ImageProps } from "next/image";
import { useCallback, useState, type ReactNode } from "react";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

type EventImageProps = Omit<ImageProps, "onLoad" | "className" | "fill" | "style"> & {
  /** 디자인된 박스 비율(가로/세로). 가로형 이미지는 이 비율로 꽉 채워진다(cover). */
  ratio: number;
  /** 바깥 박스(크기, 배경, 모서리 등)에 적용할 클래스 */
  wrapperClassName?: string;
  /** <img> 자체에 적용할 클래스 (호버 확대 트랜지션 등) */
  className?: string;
  /** 이미지 박스 위에 겹쳐 그릴 오버레이(그라디언트, 화살표 등) */
  children?: ReactNode;
  /**
   * 좁은 화면(768px 미만)에서 src 대신 쓸 이미지 (선택 사항). 가로로 넓은
   * 배너 안에 글씨가 있어 세로 비율(4:5 팝업, 모바일 카드)로 자르면 잘려나갈
   * 때, 미리 세로형으로 준비된 이미지로 대체하기 위한 용도다. 지정되면 이
   * 박스 비율 자동 보정(portrait 측정)은 건너뛰고 지정된 ratio를 그대로
   * 쓴다 — 모바일 이미지는 이미 그 비율에 맞게 준비됐다고 가정한다.
   */
  mobileSrc?: string;
};

/**
 * 이벤트 이미지 전용 컴포넌트.
 * 가로형 이미지는 기존처럼 지정된 비율 박스를 꽉 채우고(cover),
 * A4 등 지정 비율보다 좁고 긴 세로형 이미지는 가로 폭을 유지한 채
 * 박스 높이가 이미지의 실제 비율만큼 늘어나 잘리지 않게 전체가 보인다.
 *
 * mobileSrc가 있으면 768px 미만에서 그 이미지로 완전히 교체한다(CSS로
 * 두 <Image>를 전환 — <picture>가 아니라 별도 엘리먼트인 이유는 Next
 * Image의 srcset·lazy loading 최적화를 두 소스 모두에 유지하기 위해서다).
 */
export default function EventImage({
  ratio,
  wrapperClassName = "",
  className = "",
  children,
  alt,
  src,
  mobileSrc,
  ...props
}: EventImageProps) {
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  const measure = useCallback((img: HTMLImageElement | null) => {
    if (!img || !img.naturalWidth || !img.naturalHeight) return;
    setImageRatio(img.naturalWidth / img.naturalHeight);
  }, []);

  // mobileSrc가 있으면 데스크톱 쪽만 자동 보정한다 — 모바일은 이미 세로형으로
  // 준비된 전용 이미지라 별도 측정 없이 지정 ratio를 그대로 믿는다.
  const isPortrait = !mobileSrc && imageRatio !== null && imageRatio < ratio;
  const boxRatio = isPortrait ? imageRatio : ratio;

  // src는 크롭 위치 프래그먼트(#pos=x,y)가 붙은 문자열 URL일 수 있다 — StaticImport는
  // 그런 프래그먼트를 가질 수 없으므로 문자열일 때만 유틸을 거친다.
  const rawSrc = typeof src === "string" ? src : null;
  const cleanSrc = rawSrc !== null ? stripImagePosition(rawSrc) : src;
  const cropStyle = rawSrc !== null ? getImageCropStyle(rawSrc) : undefined;

  const cleanMobileSrc = mobileSrc ? stripImagePosition(mobileSrc) : null;
  const mobileCropStyle = mobileSrc ? getImageCropStyle(mobileSrc) : undefined;
  // 모바일 전용 이미지는 항상 4:5(어드민 "모바일용 이미지" 입력 필드와 동일 비율)로
  // 준비된다고 가정한다.
  const MOBILE_RATIO = 4 / 5;

  // mobileSrc가 없으면 기존과 동일하게 박스 하나(ratio 고정)만 렌더링한다.
  if (!cleanMobileSrc) {
    return (
      <div className={`relative w-full ${wrapperClassName}`} style={{ aspectRatio: boxRatio }}>
        <Image
          {...props}
          src={cleanSrc}
          alt={alt}
          ref={measure}
          onLoad={(e) => measure(e.currentTarget)}
          fill
          className={`object-cover ${className}`}
          style={cropStyle}
        />
        {children}
      </div>
    );
  }

  // mobileSrc가 있으면 박스 비율도 화면 폭에 따라 함께 바뀌어야 한다 — 안 그러면
  // 세로형 모바일 이미지가 여전히 데스크톱용 가로 박스(ratio)에 cover로 욱여넣어져
  // 위아래가 잘린다. 인라인 style의 aspectRatio는 매체 쿼리를 못 받으므로, 각자
  // 고정 비율을 가진 래퍼 두 개를 만들어 Tailwind 반응형 클래스로 통째로 전환한다.
  return (
    <>
      <div className={`relative w-full block md:hidden ${wrapperClassName}`} style={{ aspectRatio: MOBILE_RATIO }}>
        <Image
          {...props}
          src={cleanMobileSrc}
          alt={alt}
          fill
          className={`object-cover ${className}`}
          style={mobileCropStyle}
        />
        {children}
      </div>
      <div className={`relative w-full hidden md:block ${wrapperClassName}`} style={{ aspectRatio: boxRatio }}>
        <Image
          {...props}
          src={cleanSrc}
          alt={alt}
          fill
          className={`object-cover ${className}`}
          style={cropStyle}
        />
        {children}
      </div>
    </>
  );
}
