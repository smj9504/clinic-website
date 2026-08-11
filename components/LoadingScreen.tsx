"use client";

import { useT } from "@/lib/i18n";

/**
 * 최초 로드 시 DB 데이터를 기다리는 동안 표시하는 전체화면 로딩 스크린.
 * 기본값(더미 데이터)이 실제 DB 데이터로 바뀌며 화면이 깜빡이는 현상을 막기 위해
 * 데이터 로드가 끝날 때까지 실제 콘텐츠 대신 이 화면을 보여준다.
 */
export default function LoadingScreen() {
  const t = useT();

  return (
    <div
      className="loading-screen-enter fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: "var(--color-bg)" }}
      role="status"
      aria-live="polite"
    >
      <img
        src="/apple-touch-icon.png"
        alt=""
        width={64}
        height={64}
        className="brand-pulse rounded-2xl"
      />
      <span className="sr-only">{t("loading.status")}</span>
    </div>
  );
}
