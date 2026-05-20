"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";

type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
};

function findAnswer(
  query: string,
  faqs: { question: string; answer: string }[],
  clinicInfo: {
    phone: string;
    address: string;
    hours: { weekday: string; saturday: string; closed: string };
    reservationUrl: string;
  }
): string | null {
  const q = query.toLowerCase().trim();
  if (!q) return null;

  // Keyword-based clinic info matching
  const keywords: { patterns: string[]; answer: string }[] = [
    {
      patterns: ["시간", "몇시", "언제", "hours", "open", "when"],
      answer: `진료 시간 안내입니다.\n\n• ${clinicInfo.hours.weekday}\n• ${clinicInfo.hours.saturday}\n• ${clinicInfo.hours.closed}`,
    },
    {
      patterns: ["전화", "번호", "연락", "phone", "call", "contact"],
      answer: `전화번호: ${clinicInfo.phone}\n\n언제든 편하게 문의해 주세요.`,
    },
    {
      patterns: ["주소", "위치", "어디", "찾아", "address", "location", "where"],
      answer: `주소: ${clinicInfo.address}\n\n네이버 지도에서 '고운빛한의원'을 검색하시면 쉽게 찾으실 수 있습니다.`,
    },
    {
      patterns: ["예약", "접수", "신청", "book", "reservation", "appointment"],
      answer: `네이버를 통해 온라인 예약이 가능합니다.\n\n전화 예약도 가능합니다: ${clinicInfo.phone}`,
    },
    {
      patterns: ["주차", "parking"],
      answer: "건물 지하에 무료 주차 공간이 있습니다. 진료 환자분께는 2시간 무료 주차를 지원합니다.",
    },
    {
      patterns: ["보험", "자동차", "교통사고", "insurance", "auto"],
      answer: "네, 자동차보험 진료가 가능합니다. 교통사고 후 통증·후유증 치료에 대해 자동차보험 적용이 가능하며, 보험사를 통한 진료비 청구를 도와드립니다.",
    },
  ];

  for (const kw of keywords) {
    if (kw.patterns.some((p) => q.includes(p))) {
      return kw.answer;
    }
  }

  // FAQ fuzzy matching: score each FAQ by keyword overlap
  let bestScore = 0;
  let bestAnswer = "";

  for (const faq of faqs) {
    const faqQ = faq.question.toLowerCase();
    const faqWords = faqQ.split(/\s+/).filter((w) => w.length > 1);
    const queryWords = q.split(/\s+/).filter((w) => w.length > 1);

    let score = 0;
    for (const w of queryWords) {
      if (faqQ.includes(w)) score += 2;
      for (const fw of faqWords) {
        if (fw.includes(w) || w.includes(fw)) score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestAnswer = faq.answer;
    }
  }

  if (bestScore >= 2) return bestAnswer;

  return null;
}

export default function FloatingActions() {
  const { clinicInfo, faqs } = useSiteData();
  const t = useT();
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
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

  const addBotReply = (text: string) => {
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: `b${Date.now()}`, role: "bot", text },
      ]);
    }, 400);
  };

  const handleQuestion = (question: string) => {
    const userMsg: Message = {
      id: `u${Date.now()}`,
      role: "user",
      text: question,
    };
    setMessages((prev) => [...prev, userMsg]);

    const answer = findAnswer(question, faqs, clinicInfo);
    addBotReply(
      answer ||
        `죄송합니다. 해당 질문에 대한 답변을 찾지 못했습니다.\n\n자세한 상담은 전화(${clinicInfo.phone})로 문의해 주세요.`
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
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
      <div className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
        <Link
          href={clinicInfo.reservationUrl}
          target="_blank"
          className="bg-accent text-ink-inverse px-6 py-3.5 rounded-full text-sm font-semibold inline-flex items-center gap-2 transition-all hover:-translate-y-0.5 hover:bg-accent-soft"
          style={{
            letterSpacing: "-0.02em",
            boxShadow: "0 8px 32px rgba(107, 68, 35, 0.3)",
          }}
        >
          {t("hero.reservation")}
        </Link>
        <button
          onClick={() => (chatOpen ? setChatOpen(false) : handleOpen())}
          className="w-14 h-14 rounded-full bg-surface-dark text-ink-inverse flex items-center justify-center text-2xl transition-transform hover:scale-110"
          style={{ boxShadow: "0 8px 32px rgba(26, 23, 21, 0.2)" }}
          aria-label={t("chat.open")}
        >
          {chatOpen ? "✕" : "💬"}
        </button>
      </div>

      {chatOpen && (
        <div
          className="fixed bottom-32 right-8 z-40 w-[360px] max-w-[calc(100vw-4rem)] h-[520px] bg-bg rounded-lg shadow-2xl flex flex-col overflow-hidden border border-line"
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
                </div>
              </div>
            ))}

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
              className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shrink-0 hover:brightness-110 transition-all self-center"
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
