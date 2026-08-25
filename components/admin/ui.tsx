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
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 pb-6 border-b border-line">
      <div>
        <h1
          className="font-display"
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          {title}
        </h1>
        {description && (
          <p className="text-ink-muted mt-2" style={{ fontSize: "0.875rem" }}>
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex gap-2 shrink-0">{actions}</div>}
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
  size?: "sm" | "md" | "icon";
}) {
  const variantClass =
    variant === "primary"
      ? "bg-ink text-ink-inverse hover:bg-ink-soft"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-700"
      : variant === "ghost"
      ? "text-ink-soft hover:bg-bg-alt"
      : "border border-line bg-surface text-ink hover:bg-bg-alt";

  const sizeClass =
    size === "icon"
      ? "w-11 h-11 justify-center p-0 text-base shrink-0"
      : size === "sm"
      ? "px-3 py-1.5 text-xs"
      : "px-4 py-2 text-sm";

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

const VIDEO_EXT_RE = /\.(mp4|webm|mov)(\?|$)/i;

/** URL 확장자로 동영상 여부를 판별한다 — DataURL(data:video/...)도 함께 잡는다 */
function isVideoUrl(url: string): boolean {
  return url.startsWith("data:video/") || VIDEO_EXT_RE.test(url);
}

/**
 * 이미지/동영상 입력 — URL 입력 OR 파일 업로드
 *
 * allowVideo가 꺼져 있으면(기본값) 기존과 동일하게 이미지만 받는다.
 * 켜면 mp4·webm·mov도 업로드할 수 있고, 미리보기가 URL 확장자를 보고
 * <video>/<img>를 자동으로 분기한다.
 */
export function ImageInput({
  value,
  onChange,
  aspectRatio = "16 / 10",
  allowVideo = false,
}: {
  value: string;
  onChange: (v: string) => void;
  aspectRatio?: string;
  allowVideo?: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const maxSize = allowVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
  const maxSizeLabel = allowVideo ? "이미지 10MB · 동영상 100MB" : "10MB";

  const onFile = async (file: File) => {
    if (file.size > maxSize) {
      alert(`업로드 용량 초과 (최대: ${maxSizeLabel})`);
      return;
    }
    setUploading(true);
    try {
      const password = sessionStorage.getItem("clinic_admin_pw") || "admin1234";
      const formData = new FormData();
      formData.append("file", file);
      formData.append("password", password);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        alert(`업로드 실패: ${json.error || res.statusText}`);
        return;
      }
      onChange(json.url);
    } catch (err) {
      alert("업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const preview = value && isVideoUrl(value);

  return (
    <div className="space-y-3">
      {value && (
        <div
          className="relative w-full max-w-md bg-bg-alt rounded overflow-hidden border border-line"
          style={{ aspectRatio }}
        >
          {preview ? (
            <video
              src={value}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img
              src={value}
              alt="preview"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.opacity = "0.3";
              }}
            />
          )}
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        <input
          ref={fileRef}
          type="file"
          accept={allowVideo ? "image/*,video/mp4,video/webm,video/quicktime" : "image/*"}
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
            {preview ? "동영상 제거" : "이미지 제거"}
          </Button>
        )}
      </div>
      <p className="text-xs text-ink-muted">
        최대 업로드 용량: {maxSizeLabel}
        {allowVideo && " (mp4 · webm · mov)"}
      </p>

      <div>
        <label className="block text-xs text-ink-muted mb-1.5">
          또는 {allowVideo ? "이미지·동영상" : "이미지"} URL 직접 입력
        </label>
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

export function Toast({
  message,
  onClose,
  variant = "default",
}: {
  message: string;
  onClose: () => void;
  variant?: "default" | "error";
}) {
  const bg = variant === "error" ? "bg-red-600" : "bg-ink";
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 ${bg} text-ink-inverse px-5 py-3 rounded shadow-lg flex items-center gap-3 max-w-[min(24rem,calc(100vw-3rem))]`}
      style={{ animation: "fadeUp 300ms ease" }}
    >
      <span className="text-sm" style={{ letterSpacing: "-0.02em" }}>
        {message}
      </span>
      <button onClick={onClose} className="opacity-60 hover:opacity-100 text-lg leading-none shrink-0">
        ✕
      </button>
    </div>
  );
}
