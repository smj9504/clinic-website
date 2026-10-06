"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import ImageRowView from "./ImageRowView";
import { getImageCropStyle, stripImagePosition } from "@/lib/imagePosition";

export type ImageRowSlot = { src: string; alt?: string };

/**
 * 이미지 2~3개를 가로로 나란히 묶는 블록 노드. 개별 이미지 노드에
 * width:half를 주는 방식과 달리, 슬롯 개수(2/3)와 순서가 명시적으로
 * 하나의 단위로 저장돼 편집 중 다른 노드가 끼어들 걱정이 없다.
 *
 * HTML은 data-slots(JSON)에 원본 데이터를 실어 파싱 가능하게 하고,
 * 화면에는 각 슬롯을 <img>로 펼쳐 그린다 — 저장된 HTML을 그대로
 * dangerouslySetInnerHTML로 출력하는 프론트에서도 추가 처리 없이
 * 동일하게 보인다.
 */
export default Node.create({
  name: "imageRow",
  group: "block",
  atom: true,
  draggable: true,

  addAttributes() {
    return {
      slots: {
        default: [] as ImageRowSlot[],
        parseHTML: (element) => {
          const raw = element.getAttribute("data-slots");
          if (!raw) return [];
          try {
            return JSON.parse(raw) as ImageRowSlot[];
          } catch {
            return [];
          }
        },
        renderHTML: (attributes) => ({
          "data-slots": JSON.stringify(attributes.slots ?? []),
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: "div[data-image-row]" }];
  },

  renderHTML({ HTMLAttributes, node }) {
    const slots: ImageRowSlot[] = node.attrs.slots ?? [];
    const visible = slots.filter((s) => s.src);
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-image-row": "",
        class: "service-image-row",
        style: `--image-row-count:${visible.length || 1}`,
      }),
      ...visible.map((s) => {
        const crop = getImageCropStyle(s.src);
        const style = `object-position:${crop.objectPosition};${
          crop.transform ? `transform:${crop.transform};transform-origin:${crop.transformOrigin};` : ""
        }`;
        return [
          "img",
          {
            src: stripImagePosition(s.src),
            alt: s.alt || "",
            class: "service-image-row__img",
            style,
          },
        ];
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageRowView);
  },
});
