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
    // 실제 사용되는 디바이스 사이즈만 생성 (불필요한 변환 제거)
    deviceSizes: [640, 1080, 1920],
    imageSizes: [256, 384],
    // 이미 WebP로 업로드하므로 추가 변환 부담 감소
    formats: ["image/webp"],
  },
};

export default nextConfig;
