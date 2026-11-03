/**
 * 모든 응답에 붙이는 보안 헤더 (홈페이지 웹 취약점 점검 3.3.5 후속 조치).
 *
 * - X-Frame-Options / CSP frame-ancestors: 다른 사이트가 이 홈페이지를 iframe으로
 *   끼워 넣어 클릭을 가로채는 것(클릭재킹)을 막는다. 사이트 안에서 자기 자신을
 *   iframe으로 쓰는 곳이 없어 SAMEORIGIN으로 충분하다.
 * - X-Content-Type-Options: 브라우저가 파일 형식을 추측해 다른 형식으로 실행하지 않게 한다.
 * - Referrer-Policy: 외부 링크로 나갈 때 전체 주소 대신 도메인만 넘긴다.
 * - Permissions-Policy: 쓰지 않는 카메라·마이크·위치 등 브라우저 기능을 끈다.
 *
 * CSP는 화면 삽입 차단 등 깨질 위험이 없는 지시어만 둔다. script-src 등을 넣으려면
 * 인라인 스크립트·외부 이미지 출처를 모두 정리해야 해서 따로 진행한다.
 * HSTS는 Vercel이 이미 붙인다(max-age=63072000).
 */
const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  images: {
    // Vercel 이미지 최적화(/_next/image)를 쓰지 않고 원본 URL을 그대로 쓴다.
    // Hobby 플랜 변환 한도를 넘으면 402로 이미지가 깨지는데, 업로드 시
    // 이미 sharp로 1920px·WebP 변환을 하므로 추가 최적화 이득이 작다.
    // 아래 캐시/사이즈/포맷 설정은 unoptimized에서는 적용되지 않는다.
    unoptimized: true,
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
