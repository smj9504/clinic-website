"use client";

import Image from "next/image";
import SlideCarousel from "./SlideCarousel";

const BLUR_PLACEHOLDER =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMSIgaGVpZ2h0PSIxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMyQzI2MjAiLz48L3N2Zz4=";

export default function FacilityCarousel({
  images,
  altBase,
}: {
  images: string[];
  altBase: string;
}) {
  return (
    <SlideCarousel
      count={images.length}
      interval={4500}
      ariaLabelBase={altBase}
      slideWidthClassName="w-[78%] sm:w-[55%] md:w-[42%] lg:w-[32%]"
      renderItem={(i, isActive) => {
        const src = images[i];
        return (
          <div className="aspect-[4/3] relative rounded overflow-hidden bg-bg">
            {src && (
              <Image
                src={src}
                alt={`${altBase} ${i + 1}`}
                fill
                className={`object-cover transition-transform duration-[6000ms] ease-out ${
                  isActive ? "scale-[1.06]" : "scale-100"
                }`}
                sizes="(max-width: 768px) 78vw, (max-width: 1024px) 42vw, 32vw"
                quality={75}
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
                draggable={false}
              />
            )}
            <div
              className="absolute inset-0 transition-opacity duration-500"
              style={{ background: "rgba(26, 23, 21, 0.12)", opacity: isActive ? 0 : 1 }}
            />
          </div>
        );
      }}
    />
  );
}
