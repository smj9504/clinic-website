"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect, useCallback } from "react";
import {
  MAX_REQUEST_BYTES,
  MAX_UPLOAD_BYTES,
  MAX_UPLOAD_LABEL,
  shrinkForUpload,
} from "@/lib/imageUpload";
import CropImage from "@/components/admin/richEditor/CropImage";
import ImageRow from "@/components/admin/richEditor/ImageRow";
import { insertTrailingParagraph } from "@/components/admin/richEditor/insertTrailingParagraph";

function ToolbarButton({
  onClick,
  active,
  children,
  title,
}: {
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`min-h-[2.25rem] px-2.5 py-2 text-xs font-medium rounded transition-colors ${
        active
          ? "bg-accent text-white"
          : "bg-bg-alt text-ink-muted hover:text-ink hover:bg-bg-alt/80"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      CropImage.configure({
        inline: false,
        allowBase64: false,
      }),
      ImageRow,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-4 py-3 min-h-[200px] outline-none",
      },
    },
  });

  // Sync external value changes (e.g. when switching between items)
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const insertImage = useCallback(() => {
    if (!editor) return;

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (file.size > MAX_UPLOAD_BYTES) {
        alert(`${MAX_UPLOAD_LABEL} 이하 이미지만 업로드 가능합니다.`);
        return;
      }

      const upload = await shrinkForUpload(file);
      if (upload.size > MAX_REQUEST_BYTES) {
        alert("이미지를 압축하지 못했습니다. JPG 또는 PNG로 변환한 뒤 다시 시도해주세요.");
        return;
      }

      const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
      const formData = new FormData();
      formData.append("file", upload);
      formData.append("password", password);

      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        const json = await res.json();
        if (!res.ok) {
          alert(`업로드 실패: ${json.error || res.statusText}`);
          return;
        }
        editor.chain().focus().setImage({ src: json.url }).command(insertTrailingParagraph).run();
      } catch {
        alert("이미지 업로드에 실패했습니다.");
      }
    };
    input.click();
  }, [editor]);

  const insertImageRow = useCallback(() => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .insertContent({ type: "imageRow", attrs: { slots: [{ src: "" }, { src: "" }] } })
      .command(insertTrailingParagraph)
      .run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div className="border border-line rounded overflow-hidden bg-surface">
      {/* Toolbar */}
      <div className="flex gap-1.5 flex-wrap px-3 py-2 border-b border-line bg-bg-alt/50">
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive("bold")}
          title="굵게"
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive("italic")}
          title="기울임"
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          active={editor.isActive("strike")}
          title="취소선"
        >
          <s>S</s>
        </ToolbarButton>

        <span className="w-px h-5 bg-line mx-1 self-center" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive("heading", { level: 2 })}
          title="큰 제목"
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor.isActive("heading", { level: 3 })}
          title="작은 제목"
        >
          H3
        </ToolbarButton>

        <span className="w-px h-5 bg-line mx-1 self-center" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive("bulletList")}
          title="목록"
        >
          • 목록
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive("orderedList")}
          title="번호 목록"
        >
          1. 목록
        </ToolbarButton>

        <span className="w-px h-5 bg-line mx-1 self-center" />

        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive("blockquote")}
          title="인용"
        >
          " 인용
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="구분선">
          ─ 구분선
        </ToolbarButton>

        <span className="w-px h-5 bg-line mx-1 self-center" />

        <ToolbarButton onClick={insertImage} title={`이미지 삽입 (최대 ${MAX_UPLOAD_LABEL})`}>
          🖼 이미지
        </ToolbarButton>
        <ToolbarButton onClick={insertImageRow} title="이미지 2~3장을 가로로 나란히 배치">
          🖼🖼 가로 배치
        </ToolbarButton>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />

      <style jsx global>{`
        .ProseMirror {
          min-height: 200px;
          overflow-wrap: anywhere;
        }
        .ProseMirror p {
          margin: 0.5em 0;
        }
        .ProseMirror h2 {
          font-size: 1.4rem;
          font-weight: 700;
          margin: 1em 0 0.5em;
          letter-spacing: -0.03em;
        }
        .ProseMirror h3 {
          font-size: 1.15rem;
          font-weight: 600;
          margin: 0.8em 0 0.4em;
          letter-spacing: -0.02em;
        }
        .ProseMirror strong {
          font-weight: 700;
        }
        .ProseMirror ul,
        .ProseMirror ol {
          padding-left: 1.5em;
          margin: 0.5em 0;
        }
        .ProseMirror li {
          margin: 0.2em 0;
        }
        .ProseMirror blockquote {
          border-left: 3px solid var(--color-accent, #6b4423);
          padding-left: 1em;
          margin: 0.8em 0;
          color: var(--color-ink-soft, #666);
        }
        .ProseMirror hr {
          border: none;
          border-top: 1px solid var(--color-line, #e5e5e5);
          margin: 1em 0;
        }
        .ProseMirror img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.8em 0;
        }
        .ProseMirror:focus {
          outline: none;
        }
        .service-image-row {
          display: grid;
          grid-template-columns: repeat(var(--image-row-count, 2), 1fr);
          gap: 0.75rem;
          margin: 0.8em 0;
        }
        .service-image-row__img {
          width: 100%;
          aspect-ratio: 4 / 3;
          object-fit: cover;
          border-radius: 0.375rem;
          display: block;
        }
      `}</style>
    </div>
  );
}
