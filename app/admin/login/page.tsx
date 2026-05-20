"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      router.replace("/admin");
    } else {
      setError("비밀번호가 일치하지 않습니다.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div
            className="font-display mb-2"
            style={{ fontSize: "2rem", fontWeight: 700, letterSpacing: "-0.04em" }}
          >
            고운빛한의원
          </div>
          <div
            className="text-xs text-ink-muted"
            style={{ letterSpacing: "0.2em" }}
          >
            ADMIN PANEL
          </div>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-surface border border-line rounded-lg p-8"
        >
          <label
            className="block text-sm font-semibold mb-2"
            style={{ letterSpacing: "-0.02em" }}
          >
            관리자 비밀번호
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoFocus
            className="w-full px-4 py-3 border border-line bg-bg rounded text-sm outline-none focus:border-accent transition-colors"
            style={{ letterSpacing: "-0.01em" }}
            placeholder="비밀번호를 입력하세요"
          />

          {error && (
            <p className="text-sm text-red-600 mt-3" style={{ letterSpacing: "-0.02em" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full mt-6 bg-ink text-ink-inverse py-3 rounded font-semibold text-sm hover:bg-ink-soft transition-colors"
            style={{ letterSpacing: "-0.02em" }}
          >
            로그인
          </button>

          <p
            className="text-xs text-ink-muted mt-6 text-center"
            style={{ letterSpacing: "-0.01em" }}
          >
            데모 비밀번호:{" "}
            <span className="font-mono bg-bg-alt px-1.5 py-0.5 rounded">
              admin1234
            </span>
          </p>
        </form>

        <p
          className="text-xs text-ink-muted mt-6 text-center"
          style={{ letterSpacing: "-0.01em", lineHeight: 1.6 }}
        >
          ※ 모든 콘텐츠는 Supabase DB에 저장됩니다.
        </p>
      </div>
    </div>
  );
}
