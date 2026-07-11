import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "고운빛한의원 - 전통 한의학의 지혜로 건강한 일상을 처방합니다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FAF6F0 0%, #F0E8DC 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`${process.env.NEXT_PUBLIC_SITE_URL || "https://www.gowoonbit.com"}/logo-color.jpg`}
          alt="고운빛한의원 로고"
          width={280}
          height={280}
          style={{ objectFit: "contain" }}
        />
        <div
          style={{
            display: "flex",
            fontSize: 28,
            color: "#6B5B4E",
            marginTop: 20,
            letterSpacing: "0.05em",
          }}
        >
          여의도 · 통증치료 · 추나요법 · 다이어트 · 점빼기 · 리프팅
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 20,
            color: "#9B8B7E",
            marginTop: 12,
          }}
        >
          02-783-7525
        </div>
      </div>
    ),
    { ...size }
  );
}
