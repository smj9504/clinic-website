"use client";

import { useState } from "react";
import { useSiteData } from "@/lib/useSiteData";
import { useT } from "@/lib/i18n";
import { submitReservationRequest } from "@/lib/reservationsApi";
import { todayKST } from "@/lib/date";

export default function ReservationPage() {
  const { clinicInfo } = useSiteData();
  const t = useT();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [desiredTime, setDesiredTime] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !phone.trim() || !desiredDate) {
      setError("이름, 연락처, 희망 날짜는 필수 입력입니다.");
      return;
    }

    setSubmitting(true);
    const result = await submitReservationRequest({
      name,
      phone,
      desiredDate,
      desiredTime,
      memo,
    });
    setSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <section className="pt-32 pb-24 md:pt-44 md:pb-32">
        <div className="container-default max-w-xl text-center">
          <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-3xl mx-auto mb-8">
            ✓
          </div>
          <h1
            className="font-display mb-4"
            style={{
              fontSize: "clamp(1.75rem, 3.5vw, 2.25rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
            }}
          >
            예약 신청이 접수되었습니다
          </h1>
          <p className="text-ink-soft text-lg mb-2" style={{ lineHeight: 1.8, letterSpacing: "-0.015em" }}>
            신청하신 내용을 확인한 뒤, 담당자가 입력해주신 연락처로 안내드립니다.
          </p>
          <p className="text-ink-muted text-sm mb-10">
            급하신 경우 전화({clinicInfo.phone})로 문의해 주세요.
          </p>
          <a
            href="/"
            className="inline-flex px-6 py-3.5 rounded-full text-sm font-semibold border border-ink hover:bg-ink hover:text-ink-inverse transition-all"
            style={{ letterSpacing: "-0.02em" }}
          >
            홈으로 돌아가기
          </a>
        </div>
      </section>
    );
  }

  return (
    <>
      <section
        className="relative pt-32 pb-16 md:pt-44 md:pb-20 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #2C2620 0%, #4A3A2E 100%)" }}
      >
        <div className="container-default relative text-ink-inverse">
          <span
            className="text-xs font-semibold uppercase opacity-70 mb-4 block"
            style={{ letterSpacing: "0.2em" }}
          >
            Reservation
          </span>
          <h1
            className="font-display"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              fontWeight: 600,
              letterSpacing: "-0.04em",
              lineHeight: 1.15,
            }}
          >
            예약 신청
          </h1>
          <p className="mt-5 opacity-80 max-w-xl" style={{ lineHeight: 1.8, letterSpacing: "-0.01em" }}>
            원하시는 날짜와 연락처를 남겨주시면, 확인 후 담당자가 연락드립니다.
            <br />
            빠른 확정 예약은{" "}
            <a
              href={clinicInfo.reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:opacity-80"
            >
              {t("nav.reservation")}
            </a>
            를 이용해 주세요.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="container-default max-w-xl">
          <form onSubmit={handleSubmit} noValidate>
            <div className="mb-6">
              <label
                htmlFor="name"
                className="block text-sm font-semibold mb-2"
                style={{ letterSpacing: "-0.02em" }}
              >
                이름 <span className="text-accent">*</span>
              </label>
              <input
                id="name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors"
                style={{ letterSpacing: "-0.01em" }}
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="phone"
                className="block text-sm font-semibold mb-2"
                style={{ letterSpacing: "-0.02em" }}
              >
                연락처 <span className="text-accent">*</span>
              </label>
              <input
                id="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="010-1234-5678"
                className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors"
                style={{ letterSpacing: "-0.01em" }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <label
                  htmlFor="desiredDate"
                  className="block text-sm font-semibold mb-2"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  희망 날짜 <span className="text-accent">*</span>
                </label>
                <input
                  id="desiredDate"
                  type="date"
                  required
                  min={todayKST()}
                  value={desiredDate}
                  onChange={(e) => setDesiredDate(e.target.value)}
                  className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors"
                />
              </div>
              <div>
                <label
                  htmlFor="desiredTime"
                  className="block text-sm font-semibold mb-2"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  희망 시간대
                </label>
                <select
                  id="desiredTime"
                  value={desiredTime}
                  onChange={(e) => setDesiredTime(e.target.value)}
                  className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors bg-bg"
                  style={{ letterSpacing: "-0.01em" }}
                >
                  <option value="">상관없음</option>
                  <option value="오전">오전</option>
                  <option value="오후">오후</option>
                </select>
              </div>
            </div>

            <div className="mb-8">
              <label
                htmlFor="memo"
                className="block text-sm font-semibold mb-2"
                style={{ letterSpacing: "-0.02em" }}
              >
                증상 · 요청사항
              </label>
              <textarea
                id="memo"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={4}
                placeholder="불편하신 부분이나 요청사항을 남겨주세요. (선택)"
                className="w-full px-4 py-3.5 border border-line rounded text-base outline-none focus:border-accent transition-colors resize-y"
                style={{ letterSpacing: "-0.01em", lineHeight: 1.7 }}
              />
            </div>

            {error && (
              <p className="mb-6 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-full text-base font-semibold bg-accent text-ink-inverse hover:bg-accent-soft transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ letterSpacing: "-0.02em" }}
            >
              {submitting ? "신청 중..." : "예약 신청하기"}
            </button>

            <p className="text-xs text-ink-muted mt-4 text-center" style={{ lineHeight: 1.7 }}>
              신청 즉시 예약이 확정되지 않으며, 담당자 확인 후 안내 연락을 드립니다.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
