/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "plus.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "https", hostname: "fastly.picsum.photos" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
    // 최적화된 이미지 캐시: 1시간 (기본 60초 → 3600초)
    minimumCacheTTL: 3600,
    // Next.js는 deviceSizes/imageSizes에 정확히 없는 폭(w= 쿼리)을 400으로
    // 거부한다. 예전엔 [640, 1080, 1920]/[256, 384]로 좁혀뒀는데, 실제
    // <Image sizes="..."> 계산 결과(예: 50vw 뷰포트에서 나오는 900px, 1200px 등)가
    // 이 목록과 정확히 안 맞으면 이미지 자체가 깨져서 안 보이는 문제가 있었다.
    // Next.js 기본 브레이크포인트 세트로 되돌려 실사용 폭을 폭넓게 커버한다.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // 이미 WebP로 업로드하므로 추가 변환 부담 감소
    formats: ["image/webp"],
  },
};

export default nextConfig;
