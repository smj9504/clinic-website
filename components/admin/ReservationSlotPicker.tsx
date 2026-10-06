"use client";

import { useEffect, useState } from "react";
import { generateTimeSlots } from "@/lib/date";
import { fetchAvailableSlots } from "@/lib/reservationsApi";
import type { ClinicInfo } from "@/lib/data";

type Props = {
  /** 초기 날짜("YYYY-MM-DD") — 신청자가 남긴 희망 날짜를 기본값으로 받는다 */
  initialDate: string;
  /** 이미 확정된 예약을 다시 여는 경우, 그 시각("HH:MM")도 선택된 것으로 표시한다 */
  initialTime?: string;
  clinicHours: ClinicInfo["hours"];
  /** 날짜+시간이 모두 정해질 때마다 "YYYY-MM-DD HH:MM"으로 알려준다. 아직 시간을 못 고르면 null. */
  onChange: (reservationDt: string | null) => void;
};

/**
 * 관리자가 예약을 확정할 때 쓰는 날짜·시간 선택 UI.
 * 진료 시간(clinicHours)을 30분 슬롯으로 나눠 보여주고, 병원 시스템(시그마)에
 * 이미 잡혀 있는 시간은 조회해서 비활성화한다. 조회 자체가 실패하면(병원
 * 내부망 특성상 언제든 발생 가능) 슬롯을 제한 없이 전부 활성 상태로 두고
 * 안내 문구만 보여준다 — 확정 처리라는 진료 업무를 조회 실패로 막지 않는다.
 */
export default function ReservationSlotPicker({
  initialDate,
  initialTime,
  clinicHours,
  onChange,
}: Props) {
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState<string | null>(initialTime ?? null);
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [upstreamFailed, setUpstreamFailed] = useState(false);

  const slots = generateTimeSlots(date, clinicHours);

  useEffect(() => {
    let stale = false;
    setLoading(true);
    setUpstreamFailed(false);

    fetchAvailableSlots(date).then((res) => {
      if (stale) return;
      setLoading(false);
      if (!res) {
        // request() 헬퍼가 이미 전역 에러 토스트를 띄웠다 — 여기서는 폴백만 적용.
        setUpstreamFailed(true);
        setBookedTimes(new Set());
        return;
      }
      setUpstreamFailed(!!res.upstreamFailed);
      setBookedTimes(new Set(res.bookedTimes));
    });

    return () => {
      stale = true;
    };
  }, [date]);

  // 날짜나 시간이 바뀔 때마다 상위에 조합된 값(또는 아직 미완성이면 null)을 알린다.
  useEffect(() => {
    onChange(time ? `${date} ${time}` : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  const selectTime = (slot: string) => {
    setTime((prev) => (prev === slot ? null : slot));
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value);
            setTime(null);
          }}
          className="px-3 py-2 border border-line bg-surface rounded text-sm outline-none focus:border-accent transition-colors"
          style={{ letterSpacing: "-0.01em" }}
        />
        {loading && <span className="text-xs text-ink-muted">예약 현황 조회 중...</span>}
        {!loading && upstreamFailed && (
          <span className="text-xs text-amber-700">
            병원 시스템 조회에 실패해 예약 현황을 반영하지 못했습니다. 시간을 직접 확인해 주세요.
          </span>
        )}
      </div>

      {slots.length === 0 ? (
        <p className="text-sm text-ink-muted py-3">
          이 날짜는 진료 시간 정보가 없거나 휴진일입니다. 관리자 설정에서 진료 시간을 확인해 주세요.
        </p>
      ) : (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
          {slots.map((slot) => {
            const isBooked = bookedTimes.has(slot);
            const isSelected = time === slot;
            return (
              <button
                key={slot}
                type="button"
                disabled={isBooked}
                onClick={() => selectTime(slot)}
                className="px-2 py-2 text-sm rounded border transition-colors disabled:cursor-not-allowed"
                style={{
                  letterSpacing: "-0.01em",
                  borderColor: isSelected ? "var(--color-accent)" : "var(--color-line)",
                  background: isSelected
                    ? "var(--color-accent)"
                    : isBooked
                      ? "var(--color-bg-alt)"
                      : "var(--color-surface)",
                  color: isSelected ? "white" : isBooked ? "var(--color-ink-muted)" : "var(--color-ink)",
                  opacity: isBooked ? 0.6 : 1,
                  fontWeight: isSelected ? 700 : 400,
                }}
                title={isBooked ? "이미 예약된 시간입니다" : undefined}
              >
                {slot}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
