"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { login, getSiteData } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const clinicName = typeof window !== "undefined" ? getSiteData("ko").clinicInfo.name : "";

  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const ok = await login(password);
    setLoading(false);
    if (ok) {
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
            {clinicName || "관리자"}
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
            disabled={loading}
            className="w-full mt-6 bg-ink text-ink-inverse py-3 rounded font-semibold text-sm hover:bg-ink-soft transition-colors disabled:opacity-50"
            style={{ letterSpacing: "-0.02em" }}
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>

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
