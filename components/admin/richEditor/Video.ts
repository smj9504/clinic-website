"use client";

import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import VideoView from "./VideoView";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    video: {
      setVideo: (options: { src: string }) => ReturnType;
    };
  }
}

/**
 * 본문 인라인 동영상 노드.
 *
 * 이미지(CropImage)와 같은 자리에서 쓰이지만 별도 노드로 둔다 — Image 노드를
 * 확장해 <video>를 그리면 붙여넣기·파싱 규칙이 서로 얽힌다.
 *
 * 저장되는 HTML은 <video>로, 공개 화면(subpages는 body를 그대로
 * dangerouslySetInnerHTML로 출력한다)에서 별도 렌더러 없이 바로 재생된다.
 * autoplay·muted·loop·playsinline을 항상 함께 넣는 이유:
 *   · muted 없이는 브라우저가 자동재생을 막는다(정책상 소리 있는 자동재생 불가)
 *   · playsinline이 없으면 iOS에서 전체화면으로 튀어나온다
 * controls는 넣지 않는다 — 시술 분위기 영상이라 재생 UI가 없는 편이 자연스럽고,
 * 소리가 없으므로 사용자가 조작할 것도 없다.
 */
export default Node.create({
  name: "video",
  group: "block",
  atom: true, // 내부에 편집 가능한 내용이 없는 단일 블록

  addAttributes() {
    return {
      src: {
        default: null,
        parseHTML: (element) => element.getAttribute("src"),
        renderHTML: (attributes) => (attributes.src ? { src: attributes.src } : {}),
      },
    };
  },

  parseHTML() {
    return [{ tag: "video[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "video",
      mergeAttributes(HTMLAttributes, {
        autoplay: "",
        muted: "",
        loop: "",
        playsinline: "",
        preload: "metadata",
        // 인라인 style로 박아둔다 — 공개 화면의 .prose에는 video 규칙이 없어
        // 클래스에만 기대면 원본 크기 그대로 삐져나올 수 있다.
        style: "width:100%;height:auto;border-radius:0.375rem;margin:1em 0;display:block;",
      }),
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VideoView);
  },

  addCommands() {
    return {
      setVideo:
        (options) =>
        ({ commands }) =>
          commands.insertContent({ type: this.name, attrs: options }),
    };
  },
});
