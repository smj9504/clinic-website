"use client";

import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CropImageView from "./CropImageView";

export const MIN_IMAGE_WIDTH = 20;
export const MAX_IMAGE_WIDTH = 100;

/**
 * 저장된 data-width 값을 퍼센트 너비(20~100)로 해석한다. 예전 버전은
 * "half" | "full"만 저장했으므로 각각 50, 100으로 읽어 하위 호환을 지킨다.
 */
export function parseImageWidth(raw: unknown): number {
  if (raw === "half") return 50;
  if (raw === "full" || raw == null || raw === "") return MAX_IMAGE_WIDTH;
  const n = Number(raw);
  if (!Number.isFinite(n)) return MAX_IMAGE_WIDTH;
  return Math.min(MAX_IMAGE_WIDTH, Math.max(MIN_IMAGE_WIDTH, Math.round(n)));
}

/**
 * 100% 미만 이미지는 inline-block으로 두어 연속 배치하면 옆으로 나란히
 * 붙게 한다. 오른쪽 간격(0.75rem)만큼 너비에서 빼 두어, 50+50·25×4처럼
 * 합이 100%인 조합이 한 줄에 정확히 들어간다.
 */
export function imageWidthStyle(width: number): Record<string, string> {
  if (width >= MAX_IMAGE_WIDTH) return { width: "100%", display: "block" };
  return {
    width: `calc(${width}% - 0.75rem)`,
    display: "inline-block",
    verticalAlign: "top",
    marginRight: "0.75rem",
  };
}

/**
 * 본문 인라인 이미지 확장 — 기본 Image 노드에 크롭(위치·확대)과 너비(%)
 * 속성을 얹는다. 크롭은 lib/imagePosition.ts와 동일한 URL 프래그먼트
 * (#pos=x,y,scale) 방식을 그대로 재사용해, src 하나에 위치 정보가 함께
 * 실려 다니게 한다 — HTML을 그대로 dangerouslySetInnerHTML로 출력하는
 * 프론트 렌더러(ServiceBlocks)도 별도 처리 없이 크롭·크기가 반영된다.
 *
 * width는 본문 폭 대비 퍼센트(20~100)다. 100 미만이면 연속 배치 시
 * 자동으로 옆으로 나란히 붙는다.
 */
export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: MAX_IMAGE_WIDTH,
        parseHTML: (element) => parseImageWidth(element.getAttribute("data-width")),
        renderHTML: (attributes) => {
          const width = parseImageWidth(attributes.width);
          const style = Object.entries(imageWidthStyle(width))
            .map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v};`)
            .join("");
          return { "data-width": String(width), style };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CropImageView);
  },
});
