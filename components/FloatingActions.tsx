"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useCart } from "@/lib/cart";
import { useSiteData } from "@/lib/useSiteData";
import { useLocale, useT } from "@/lib/i18n";
import type { ChatAnswer, ChatLink } from "@/lib/chatbot";

/** CartSummaryBar가 화면 하단에 뜨는 페이지 — 이 경로에서만 FAB 스택을 그만큼 밀어올린다 */
function showsCartSummaryBar(pathname: string): boolean {
  return pathname === "/services" || pathname.startsWith("/services/");
}

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  links?: ChatLink[];
};

export default function FloatingActions() {
  const { clinicInfo } = useSiteData();
  const t = useT();
  const { locale } = useLocale();
  const pathname = usePathname() || "/";
  const { count: cartCount } = useCart();
  // CartSummaryBar(높이 80px)가 화면 하단에 떠 있는 동안은 FAB 스택이 그 위에 겹치므로,
  // 바 높이 + 여백만큼 밀어올린다.
  const pushedUp = cartCount > 0 && showsCartSummaryBar(pathname);
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const faqQuestions = [
    t("chat.q1"),
    t("chat.q2"),
    t("chat.q3"),
    t("chat.q4"),
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (chatOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [chatOpen]);

  const handleQuestion = async (question: string) => {
    if (pending) return;
    setMessages((prev) => [...prev, { id: `u${Date.now()}`, role: "user", text: question }]);
    setPending(true);

    let reply: Message;
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, locale }),
      });
      if (!res.ok) throw new Error(`chat ${res.status}`);
      const answer = (await res.json()) as ChatAnswer;
      reply = { id: `b${Date.now()}`, role: "bot", text: answer.text, links: answer.links };
    } catch {
      reply = {
        id: `b${Date.now()}`,
        role: "bot",
        text: t("chat.error").replace("{phone}", clinicInfo.phone),
      };
    }
    setMessages((prev) => [...prev, reply]);
    setPending(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || pending) return;
    handleQuestion(input.trim());
    setInput("");
  };

  const handleOpen = () => {
    setChatOpen(true);
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "bot",
          text: t("chat.greeting"),
        },
      ]);
    }
  };

  return (
    <>
      <div
        className={`fixed right-5 sm:right-8 z-40 flex flex-col items-end gap-2.5 sm:gap-3 transition-[bottom] duration-200 ${
          pushedUp ? "bottom-[6.5rem] sm:bottom-28" : "bottom-5 sm:bottom-8"
        }`}
      >
        {/*
          좁은 화면에서는 라벨 버튼 3개가 세로로 쌓이며 본문 텍스트를 오래 가리므로,
          예약 링크는 아이콘 전용 원형 버튼으로 축소하고 "상담 신청"은 숨긴다
          (채팅 버튼이 같은 문의 동선을 대신한다). sm 이상에서는 기존 라벨 버튼 유지.
        */}
        <a
          href={clinicInfo.reservationUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("hero.reservation")}
          className="hidden sm:inline-flex bg-accent text-ink-inverse px-6 py-3.5 rounded-full text-sm font-semibold items-center gap-2 transition-all hover:-translate-y-0.5 hover:bg-accent-soft"
          style={{
            letterSpacing: "-0.02em",
            boxShadow: "0 8px 32px rgba(107, 68, 35, 0.3)",
          }}
        >
          {t("hero.reservation")}
        </a>
        <a
          href={clinicInfo.reservationUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={t("hero.reservation")}
          className="sm:hidden w-12 h-12 rounded-full bg-accent text-ink-inverse flex items-center justify-center transition-transform hover:scale-110"
          style={{ boxShadow: "0 8px 32px rgba(107, 68, 35, 0.3)" }}
        >
          {/* 이모지(📅)는 색이 고정돼 있어 text-ink-inverse가 안 먹힌다 — currentColor를 따르는 outline 아이콘으로 흰색 계열이 되게 한다 */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M8 3v4" />
            <path d="M16 3v4" />
          </svg>
        </a>
        <Link
          href="/reservation"
          className="hidden sm:inline-flex bg-bg text-ink px-6 py-3 rounded-full text-sm font-semibold items-center gap-2 border border-line transition-all hover:-translate-y-0.5 hover:border-accent"
          style={{ letterSpacing: "-0.02em", boxShadow: "0 8px 32px rgba(26, 23, 21, 0.12)" }}
        >
          {t("nav.reservationRequest")}
        </Link>
        <button
          onClick={() => (chatOpen ? setChatOpen(false) : handleOpen())}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-surface-dark text-ink-inverse flex items-center justify-center text-xl sm:text-2xl transition-transform hover:scale-110"
          style={{ boxShadow: "0 8px 32px rgba(26, 23, 21, 0.2)" }}
          aria-label={t("chat.open")}
        >
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>

      {chatOpen && (
        <div
          className={`fixed right-5 sm:right-8 z-40 w-[360px] max-w-[calc(100vw-2.5rem)] h-[520px] max-h-[calc(100dvh-8rem)] sm:max-h-[calc(100dvh-14rem)] bg-bg rounded-lg shadow-2xl flex flex-col overflow-hidden border border-line ${
            pushedUp ? "bottom-[10.25rem] sm:bottom-52" : "bottom-[4.75rem] sm:bottom-32"
          }`}
          style={{ animation: "scaleIn 300ms cubic-bezier(0.16, 1, 0.3, 1)" }}
        >
          {/* Header */}
          <div className="bg-surface-dark text-ink-inverse p-5 flex items-center justify-between shrink-0">
            <div>
              <div
                className="font-semibold"
                style={{ letterSpacing: "-0.02em" }}
              >
                {t("chat.title")}
              </div>
              <div className="text-xs opacity-60 mt-1">
                {t("chat.disclaimer")}
              </div>
            </div>
            <button
              onClick={() => setChatOpen(false)}
              className="text-2xl leading-none"
              aria-label={t("chat.close")}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            className="flex-1 p-5 overflow-y-auto bg-bg-alt space-y-3"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`rounded-lg px-4 py-3 max-w-[85%] ${
                    msg.role === "user"
                      ? "bg-accent text-white"
                      : "bg-bg border border-line"
                  }`}
                  style={{
                    fontSize: "0.9rem",
                    lineHeight: 1.6,
                    whiteSpace: "pre-line",
                  }}
                >
                  {msg.text}
                  {msg.links && msg.links.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {msg.links.map((link) =>
                        link.external ? (
                          <a
                            key={link.href}
                            href={link.href}
                            target={link.href.startsWith("tel:") ? undefined : "_blank"}
                            rel="noopener noreferrer"
                            className="inline-flex px-3 py-1.5 rounded-full border border-accent text-accent text-xs font-semibold hover:bg-accent hover:text-white transition-colors"
                          >
                            {link.label}
                          </a>
                        ) : (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setChatOpen(false)}
                            className="inline-flex px-3 py-1.5 rounded-full border border-accent text-accent text-xs font-semibold hover:bg-accent hover:text-white transition-colors"
                          >
                            {link.label}
                          </Link>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {pending && (
              <div className="flex justify-start">
                <div
                  className="rounded-lg px-4 py-3 bg-bg border border-line text-ink-muted"
                  style={{ fontSize: "0.9rem" }}
                  aria-label={t("chat.typing")}
                >
                  …
                </div>
              </div>
            )}

            {/* FAQ quick buttons — show only at start */}
            {messages.length <= 1 && (
              <div className="space-y-2 mt-2">
                {faqQuestions.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleQuestion(q)}
                    className="block w-full text-left px-4 py-3 rounded-lg bg-bg border border-line hover:border-accent transition-colors text-sm"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            className="p-4 border-t border-line bg-bg shrink-0 flex gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("chat.placeholder")}
              className="flex-1 px-4 py-3 rounded-full border border-line text-sm outline-none focus:border-accent"
              style={{ letterSpacing: "-0.02em" }}
            />
            <button
              type="submit"
              className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:brightness-110 transition-all self-center"
              aria-label="전송"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}
