"use client";

/**
 * 관리자 확인 다이얼로그
 *
 * window.confirm()을 대체한다. 브라우저 기본 confirm은 메인 스레드를 통째로
 * 멈추기 때문에, 사용자가 버튼을 누르기까지 걸린 시간이 전부 "이벤트 핸들러
 * 실행 시간"으로 집계되어 INP 경고가 뜬다(실제로 느린 것은 아니다).
 *
 * 호출부 모양을 그대로 유지하려고 Promise<boolean>을 돌려준다:
 *   const confirm = useConfirm();
 *   if (!(await confirm("삭제하시겠습니까?"))) return;
 *
 * prompt()를 대신하는 입력 확인(requireText)도 함께 지원한다 —
 * 초기화처럼 되돌릴 수 없는 작업에서 특정 문구를 받아야 하는 경우에 쓴다.
 */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Button, TextInput } from "@/components/admin/ui";

export type ConfirmOptions = {
  /** 제목 — 생략하면 "확인" */
  title?: string;
  /** 본문. \n으로 줄을 나누면 문단으로 그려진다 */
  message: string;
  /** 확인 버튼 문구 — 기본 "확인" */
  confirmText?: string;
  /** 취소 버튼 문구 — 기본 "취소" */
  cancelText?: string;
  /** 되돌릴 수 없는 작업이면 true — 확인 버튼이 빨간색이 된다 */
  danger?: boolean;
  /**
   * 지정하면 이 문구를 정확히 입력해야 확인 버튼이 활성화된다.
   * (기존 prompt() 기반 2단계 확인을 대체)
   */
  requireText?: string;
};

type Resolver = (value: boolean) => void;

const ConfirmContext = createContext<((opts: string | ConfirmOptions) => Promise<boolean>) | null>(
  null
);

/**
 * 확인 다이얼로그를 띄운다. 사용자가 확인을 누르면 true, 취소·ESC·배경 클릭이면 false.
 * 문자열을 넘기면 그대로 본문이 된다.
 */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm은 ConfirmProvider 안에서만 사용할 수 있습니다");
  return ctx;
}

export default function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ConfirmOptions | null>(null);
  const [input, setInput] = useState("");
  const resolverRef = useRef<Resolver | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  // 다이얼로그가 열리기 직전에 포커스를 갖고 있던 요소 — 닫을 때 되돌려 준다
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  const confirm = useCallback((opts: string | ConfirmOptions) => {
    const options = typeof opts === "string" ? { message: opts } : opts;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    setInput("");
    setState(options);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState(null);
    setInput("");
    // resolve를 먼저 비워 중복 호출(빠른 연타 등)에 두 번 응답하지 않도록 한다
    const resolve = resolverRef.current;
    resolverRef.current = null;
    resolve?.(result);
    restoreFocusRef.current?.focus?.();
    restoreFocusRef.current = null;
  }, []);

  // 열려 있는 동안 ESC로 취소 + 배경 스크롤 잠금
  useEffect(() => {
    if (!state) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(false);
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // 확인 버튼에 포커스를 주어 Enter로 바로 진행할 수 있게 한다.
    // 단 requireText가 있으면 입력이 먼저이므로 포커스를 옮기지 않는다.
    if (!state.requireText) confirmButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [state, close]);

  // 컴포넌트가 사라질 때 대기 중인 Promise를 매달아 두지 않는다
  useEffect(() => {
    return () => {
      resolverRef.current?.(false);
      resolverRef.current = null;
    };
  }, []);

  const canConfirm = !state?.requireText || input === state.requireText;

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {state && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md"
          style={{ background: "rgba(0,0,0,0.4)", animation: "fadeIn 200ms ease" }}
          onClick={() => close(false)}
          role="presentation"
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            aria-describedby="confirm-message"
            className="bg-bg w-full max-w-md rounded-lg p-6 shadow-lg"
            style={{ animation: "scaleIn 250ms cubic-bezier(0.16, 1, 0.3, 1)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="confirm-title"
              className="font-display mb-3"
              style={{ fontSize: "1.15rem", fontWeight: 600, letterSpacing: "-0.03em" }}
            >
              {state.title ?? "확인"}
            </h2>

            <div id="confirm-message" className="mb-5 space-y-2">
              {state.message.split("\n").map((line, i) =>
                line.trim() === "" ? (
                  <div key={i} className="h-1" />
                ) : (
                  <p
                    key={i}
                    className="text-sm text-ink-soft"
                    style={{ lineHeight: 1.75, letterSpacing: "-0.01em" }}
                  >
                    {line}
                  </p>
                )
              )}
            </div>

            {state.requireText && (
              <div className="mb-5">
                <label className="block text-xs font-semibold mb-1.5">
                  계속하려면 &quot;{state.requireText}&quot;를 입력하세요
                </label>
                <TextInput
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && canConfirm) close(true);
                  }}
                  placeholder={state.requireText}
                />
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => close(false)}>
                {state.cancelText ?? "취소"}
              </Button>
              <Button
                ref={confirmButtonRef}
                variant={state.danger ? "danger" : "primary"}
                disabled={!canConfirm}
                onClick={() => close(true)}
              >
                {state.confirmText ?? "확인"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
