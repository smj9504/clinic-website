"use client";

import { useScrollReveal } from "@/lib/useScrollReveal";
import type { SubPageChecklistBlock } from "@/lib/data";

type ChecklistBlocksProps = {
  blocks: SubPageChecklistBlock[];
};

/**
 * "이런 변화가 느껴진다면 / 고운빛의 리프팅 접근 / 이런 분들께 권해드립니다" 류의
 * 소제목 + (선택)본문 + (선택)번호 목록 반복 블록. 번호 목록의 인덱스 스타일
 * (01, 02… + 구분선)은 body richtext의 h3+ul에 적용되는 .prose h3+ul CSS
 * (globals.css)와 동일한 시각 언어를 이 컴포넌트 전용 클래스로 재현한다 —
 * admin 구조화 필드로 옮긴 뒤에도 기존 본문 콘텐츠와 이질감이 없게 하기 위해서다.
 */
export default function ChecklistBlocks({ blocks }: ChecklistBlocksProps) {
  const sectionRef = useScrollReveal<HTMLDivElement>();

  if (blocks.length === 0) return null;

  return (
    <div ref={sectionRef} className="reveal-fade-up my-16 md:my-24 space-y-12 md:space-y-16">
      {blocks.map((block) => (
        <div key={block.id}>
          <h2
            className="font-display mb-5"
            style={{ fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 700, letterSpacing: "-0.03em" }}
          >
            {block.title}
          </h2>

          {block.body && (
            <p
              className="text-ink-soft mb-6"
              style={{ fontSize: "1.05rem", lineHeight: 2, letterSpacing: "-0.01em", whiteSpace: "pre-line" }}
            >
              {block.body}
            </p>
          )}

          {block.items.length > 0 && (
            <ul className="checklist-block-list">
              {block.items.map((item) => (
                <li key={item.id}>{item.text}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
