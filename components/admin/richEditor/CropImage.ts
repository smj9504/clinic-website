"use client";

import Image from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import CropImageView from "./CropImageView";

/**
 * 본문 인라인 이미지 확장 — 기본 Image 노드에 크롭(위치·확대)과 너비(전체/절반)
 * 속성을 얹는다. 크롭은 lib/imagePosition.ts와 동일한 URL 프래그먼트
 * (#pos=x,y,scale) 방식을 그대로 재사용해, src 하나에 위치 정보가 함께
 * 실려 다니게 한다 — HTML을 그대로 dangerouslySetInnerHTML로 출력하는
 * 프론트 렌더러(ServiceBlocks)도 별도 처리 없이 크롭이 반영된다.
 *
 * width는 절반 너비 이미지를 연속 배치하면 자동으로 옆으로 나란히 붙게
 * 하기 위한 값이다("half" | "full").
 */
export default Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "full",
        parseHTML: (element) => (element.getAttribute("data-width") === "half" ? "half" : "full"),
        renderHTML: (attributes) => ({
          "data-width": attributes.width,
          style:
            attributes.width === "half"
              ? "width:calc(50% - 0.375rem);display:inline-block;vertical-align:top;"
              : "width:100%;display:block;",
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(CropImageView);
  },
});
