"use client";

import { useT } from "@/lib/i18n";

/**
 * 종료된 이벤트 카드의 이미지 위에 겹쳐 그리는 오버레이.
 * 이미지 박스(EventImage children) 안에 넣어 이미지를 어둡게 덮고
 * 가운데에 "종료된 이벤트" 스탬프를 띄워, 흐린 카드만으로는 알기 어려운
 * 종료 상태를 한눈에 보이게 한다.
 */
export default function EventEndedOverlay() {
  const t = useT();
  return (
    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/55 pointer-events-none">
      <span
        className="px-5 py-2 border-2 border-white/90 rounded text-white font-semibold text-base md:text-lg"
        style={{ letterSpacing: "0.08em" }}
      >
        {t("events.endedLong")}
      </span>
    </div>
  );
}
