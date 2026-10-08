"use client";

import { useState, type ReactNode } from "react";
import { stripImagePosition, getImageCropStyle } from "@/lib/imagePosition";

/**
 * 이벤트 편집 화면에서 "어떤 이미지가 사이트 어디에 보이는지"를 한눈에 확인하는
 * 미리보기. 실제 페이지와 같은 우선순위 규칙(모바일용 → 이벤트 이미지,
 * 개별 배너 → 기본 배너 → 이벤트 이미지 등)을 적용해, 지금 입력된 이미지가
 * 각 화면의 해당 자리에 들어간 모습을 축소된 화면 틀 안에 그려준다.
 * 각 이미지 위에는 어느 입력칸에서 온 이미지인지 이름표를 붙인다.
 */

type Source = "image" | "mobileImage" | "detailImage" | "bannerImage" | "defaultBanner" | "fallback";

const SOURCE_META: Record<Source, { label: string; color: string }> = {
  image: { label: "이벤트 이미지", color: "#2563EB" },
  mobileImage: { label: "모바일용 이미지", color: "#059669" },
  detailImage: { label: "상세페이지 전용 이미지", color: "#D97706" },
  bannerImage: { label: "상단 배너", color: "#7C3AED" },
  defaultBanner: { label: "기본 배너", color: "#9333EA" },
  fallback: { label: "사이트 기본 이미지", color: "#6B7280" },
};

type Picked = { src: string; source: Source };

export default function EventImagePreview({
  image,
  mobileImage,
  detailImage,
  bannerImage,
  defaultBanner,
  fallbackImage,
  title,
}: {
  image?: string;
  mobileImage?: string;
  detailImage?: string;
  bannerImage?: string;
  defaultBanner?: string;
  fallbackImage: string;
  title: string;
}) {
  const [device, setDevice] = useState<"pc" | "mobile">("pc");
  const isMobile = device === "mobile";

  const main: Picked = image ? { src: image, source: "image" } : { src: fallbackImage, source: "fallback" };
  // 모바일 화면에서 모바일용 이미지가 있으면 그걸 4:5로, 없으면 이벤트 이미지를 그대로 쓴다
  const card: Picked & { ratio: string } =
    isMobile && mobileImage ? { src: mobileImage, source: "mobileImage", ratio: "4 / 5" } : { ...main, ratio: "16 / 10" };
  const popup: Picked & { ratio: string } =
    isMobile && mobileImage ? { src: mobileImage, source: "mobileImage", ratio: "4 / 5" } : { ...main, ratio: isMobile ? "4 / 5" : "16 / 9" };
  const body: (Picked & { ratio: string }) =
    detailImage ? { src: detailImage, source: "detailImage", ratio: "auto" } : card;
  // 상단 배너: 개별 배너 → 기본 배너 → (상세 전용 이미지가 없을 때만) 이벤트 이미지를 어둡게
  const banner: (Picked & { dim: boolean }) | null = bannerImage
    ? { src: bannerImage, source: "bannerImage", dim: false }
    : defaultBanner
      ? { src: defaultBanner, source: "defaultBanner", dim: false }
      : detailImage
        ? null
        : { ...main, dim: true };

  const frameWidth = isMobile ? 150 : 300;

  return (
    <div className="mb-6 rounded border border-line bg-bg-alt p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-semibold" style={{ letterSpacing: "-0.02em" }}>
            이미지 위치 미리보기
          </h4>
          <p className="text-xs text-ink-muted mt-0.5">
            지금 넣은 이미지가 사이트 어디에 보이는지 보여줍니다. 이름표는 어느 입력칸의 이미지인지를 뜻합니다.
          </p>
        </div>
        <div className="flex gap-1 rounded-full bg-surface p-1 border border-line">
          {(["pc", "mobile"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDevice(d)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                device === d ? "bg-accent text-white" : "text-ink-muted hover:text-ink"
              }`}
            >
              {d === "pc" ? "PC" : "모바일"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-5 items-start">
        <Screen title="홈 · 이벤트 목록 카드" width={frameWidth}>
          <div className="p-2">
            <div className="rounded overflow-hidden border border-line bg-surface">
              <Shot picked={card} ratio={card.ratio} />
              <div className="p-1.5 space-y-1">
                <Line w="40%" />
                <div className="text-[9px] font-semibold truncate">{title || "이벤트 제목"}</div>
                <Line w="80%" />
              </div>
            </div>
          </div>
        </Screen>

        <Screen title="이벤트 상세페이지" width={frameWidth}>
          <div className="relative" style={{ aspectRatio: isMobile ? "1 / 1" : "16 / 5" }}>
            {banner ? (
              <Shot picked={banner} fill dim={banner.dim} />
            ) : (
              <div className="absolute inset-0" style={{ background: "linear-gradient(#3A322A, #2C2620)" }} />
            )}
            <div className="absolute left-2 bottom-2 text-white text-[9px] font-semibold drop-shadow">
              {title || "이벤트 제목"}
            </div>
            {!banner && <Tag source={null} note="단색 배경 (상단 배너·기본 배너 없음)" />}
          </div>
          <div className="p-2 space-y-1.5">
            <div className={isMobile ? "" : "w-2/3"}>
              <div className="rounded overflow-hidden">
                <Shot picked={body} ratio={body.ratio} />
              </div>
            </div>
            <Line w="50%" />
            <Line w="70%" />
          </div>
        </Screen>

        <Screen title="메인 팝업" width={frameWidth}>
          <div className="relative bg-black/40 p-3 flex justify-center" style={{ minHeight: isMobile ? 220 : 160 }}>
            <div className="w-full rounded overflow-hidden bg-surface shadow" style={{ maxWidth: isMobile ? "85%" : "75%" }}>
              <Shot picked={popup} ratio={popup.ratio} />
            </div>
          </div>
        </Screen>
      </div>

      <p className="text-[11px] text-ink-muted mt-4 leading-relaxed">
        * 이벤트 이미지는 상세페이지 아래 &lsquo;다른 이벤트&rsquo; 카드에도 쓰입니다. 팝업은 [팝업 관리]에서 이 이벤트를 연결했을 때만 표시됩니다.
        모바일은 화면 폭 768px 미만(팝업은 640px 미만) 기준입니다.
      </p>
    </div>
  );
}

function Screen({ title, width, children }: { title: string; width: number; children: ReactNode }) {
  return (
    <div style={{ width }}>
      <div className="text-xs font-medium text-ink-soft mb-1.5">{title}</div>
      <div className="rounded-md overflow-hidden border border-line-strong bg-bg shadow-sm">
        <div className="h-3 bg-surface border-b border-line flex items-center gap-0.5 px-1.5">
          <span className="w-1 h-1 rounded-full bg-line-strong" />
          <span className="w-1 h-1 rounded-full bg-line-strong" />
          <span className="w-1 h-1 rounded-full bg-line-strong" />
        </div>
        {children}
      </div>
    </div>
  );
}

function Shot({
  picked,
  ratio,
  fill,
  dim,
}: {
  picked: Picked;
  ratio?: string;
  fill?: boolean;
  dim?: boolean;
}) {
  const auto = ratio === "auto";
  return (
    <div
      className={fill ? "absolute inset-0" : "relative w-full bg-line"}
      style={fill || auto ? undefined : { aspectRatio: ratio }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={stripImagePosition(picked.src)}
        alt=""
        className={auto ? "block w-full h-auto" : "absolute inset-0 w-full h-full object-cover"}
        style={auto ? undefined : getImageCropStyle(picked.src)}
      />
      {dim && <div className="absolute inset-0" style={{ background: "rgba(44,38,32,0.8)" }} />}
      <Tag source={picked.source} note={dim ? "어둡게 깔림" : undefined} />
    </div>
  );
}

function Tag({ source, note }: { source: Source | null; note?: string }) {
  const meta = source ? SOURCE_META[source] : { label: "", color: "#4B5563" };
  return (
    <span
      className="absolute top-1 right-1 max-w-[95%] truncate rounded px-1.5 py-0.5 text-[9px] font-semibold text-white shadow"
      style={{ background: meta.color }}
    >
      {[meta.label, note].filter(Boolean).join(" · ")}
    </span>
  );
}

function Line({ w }: { w: string }) {
  return <div className="h-1 rounded-full bg-line" style={{ width: w }} />;
}
