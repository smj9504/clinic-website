"use client";

import { useRef, useState } from "react";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between mb-8 pb-6 border-b border-line">
      <div>
        <h1
          className="font-display"
          style={{
            fontSize: "1.875rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-ink-muted mt-2" style={{ fontSize: "0.9rem" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  );
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <label
        className="block text-sm font-semibold mb-2"
        style={{ letterSpacing: "-0.02em" }}
      >
        {label}
      </label>
      {children}
      {hint && (
        <p className="text-xs text-ink-muted mt-1.5" style={{ letterSpacing: "-0.01em" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors ${
        props.className || ""
      }`}
      style={{ letterSpacing: "-0.01em", ...(props.style || {}) }}
    />
  );
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full px-4 py-2.5 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors resize-y ${
        props.className || ""
      }`}
      style={{
        letterSpacing: "-0.01em",
        lineHeight: 1.65,
        minHeight: "100px",
        ...(props.style || {}),
      }}
    />
  );
}

export function Button({
  variant = "primary",
  size = "md",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-ink text-ink-inverse hover:bg-ink-soft"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "ghost"
      ? "text-ink-soft hover:bg-bg-alt"
      : "border border-line bg-surface text-ink hover:bg-bg-alt";

  const sizeClass = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1.5 rounded font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${variantClass} ${sizeClass} ${
        props.className || ""
      }`}
      style={{ letterSpacing: "-0.02em", ...(props.style || {}) }}
    />
  );
}

/**
 * 이미지 입력 — URL 입력 OR 파일 업로드 (DataURL로 LocalStorage 저장)
 * 실제 운영에선 파일 업로드 → R2/S3 URL 반환으로 교체
 */
export function ImageInput({
  value,
  onChange,
  aspectRatio = "16 / 10",
}: {
  value: string;
  onChange: (v: string) => void;
  aspectRatio?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const onFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      alert("10MB 이하 이미지만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") onChange(reader.result);
        setUploading(false);
      };
      reader.onerror = () => {
        setUploading(false);
        alert("파일을 읽지 못했습니다.");
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      {value && (
        <div
          className="relative w-full max-w-md bg-bg-alt rounded overflow-hidden border border-line"
          style={{ aspectRatio }}
        >
          <img
            src={value}
            alt="preview"
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.opacity = "0.3";
            }}
          />
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="secondary"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "업로드 중..." : "파일 선택"}
        </Button>
        {value && (
          <Button type="button" variant="ghost" onClick={() => onChange("")}>
            이미지 제거
          </Button>
        )}
      </div>

      <div>
        <label className="block text-xs text-ink-muted mb-1.5">또는 이미지 URL 직접 입력</label>
        <TextInput
          type="url"
          placeholder="https://images.unsplash.com/..."
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`bg-surface border border-line rounded-lg p-6 ${className || ""}`}>
      {children}
    </div>
  );
}

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  return (
    <div
      className="fixed bottom-6 right-6 z-50 bg-ink text-ink-inverse px-5 py-3 rounded shadow-lg flex items-center gap-3"
      style={{ animation: "fadeUp 300ms ease" }}
    >
      <span className="text-sm" style={{ letterSpacing: "-0.02em" }}>
        {message}
      </span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none">
        ✕
      </button>
    </div>
  );
}
