/**
 * 시그마(한의원 내부 예약 시스템) 상태 동기화
 *
 * 확정 처리된 예약도 병원 직원이 시그마에서 직접 취소하거나 시간을 바꿀 수
 * 있는데, 그 변경은 홈페이지 DB에 자동으로 반영되지 않는다. 이 모듈은
 * "confirmed" 상태이면서 sigma_reservation_dt가 있는 신청들을 시그마의
 * 해당 날짜 예약 목록과 대조해, 더 이상 그 시각에 예약이 없으면(=병원
 * 시스템에서 취소/변경됨) 로컬 상태도 "cancelled"로 맞춘다.
 *
 * listSigmaReservations는 예약중·예약변경 건만 돌려준다(취소 건은 서버가
 * 이미 걸러서 뺀다 — lib/sigma.ts 주석 참고). 그래서 "그 정확한 일시가
 * 목록에 없다"는 곧 "시그마 기준으로 더 이상 그 시각에 예약이 없다"는
 * 뜻이고, 별도로 reservation_status 값을 해석할 필요가 없다.
 *
 * 시간 변경(같은 신청이 다른 시각으로 재조정된 경우)은 시그마 API가
 * uuid로 개별 조회하는 기능을 제공하지 않아 자동으로 구분할 수 없다 —
 * 일단은 "그 시각에 더 이상 예약이 없음 = 취소"로 단순화하고, 실제로는
 * 시간만 바뀐 경우도 관리자가 admin_note/로그를 보고 수동으로 재확정하게
 * 한다.
 */

import { getServiceClient } from "@/lib/supabase";
import { listSigmaReservations } from "@/lib/sigma";
import { sendReservationCancelledSms } from "@/lib/sms";
import { toReservation, type ReservationRow } from "@/lib/reservations";

export type ReservationSyncTrigger = "scheduled" | "manual";

export type ReservationSyncDetail = {
  reservationId: string;
  name: string;
  sigmaReservationDt: string;
  reason: "cancelled_in_sigma" | "sigma_lookup_failed";
};

export type ReservationSyncSummary = {
  triggeredAt: string;
  trigger: ReservationSyncTrigger;
  checkedCount: number;
  updatedCount: number;
  errorCount: number;
  details: ReservationSyncDetail[];
};

/**
 * confirmed 상태인 예약들을 시그마와 대조해 어긋난 상태를 바로잡고,
 * 실행 결과를 reservation_sync_log에 기록한다.
 */
export async function syncReservationsWithSigma(
  trigger: ReservationSyncTrigger
): Promise<ReservationSyncSummary> {
  const supabase = getServiceClient();

  const { data: confirmedRows } = await supabase
    .from("reservation_requests")
    .select("*")
    .eq("status", "confirmed")
    .not("sigma_reservation_dt", "is", null);

  const confirmed = (confirmedRows ?? []) as ReservationRow[];

  // 시그마 조회는 날짜 단위이므로, 날짜별로 한 번씩만 호출한다.
  const byDate = new Map<string, ReservationRow[]>();
  for (const row of confirmed) {
    const dt = row.sigma_reservation_dt;
    if (!dt) continue;
    const date = dt.slice(0, 10);
    if (!byDate.has(date)) byDate.set(date, []);
    byDate.get(date)!.push(row);
  }

  const details: ReservationSyncDetail[] = [];
  let checkedCount = 0;
  let updatedCount = 0;
  let errorCount = 0;

  for (const [date, rows] of byDate) {
    const result = await listSigmaReservations(date);
    checkedCount += rows.length;

    if (!result.ok) {
      errorCount += rows.length;
      for (const row of rows) {
        details.push({
          reservationId: row.id,
          name: row.name,
          sigmaReservationDt: row.sigma_reservation_dt ?? "",
          reason: "sigma_lookup_failed",
        });
      }
      continue;
    }

    const bookedDts = new Set(result.reservations.map((r) => r.reservationDt));

    for (const row of rows) {
      if (bookedDts.has(row.sigma_reservation_dt ?? "")) continue;

      // 시그마 기준으로 더 이상 그 시각에 예약이 없다 — 병원 시스템에서
      // 취소되었다고 보고 로컬 상태를 맞춘다.
      const { data: updated } = await supabase
        .from("reservation_requests")
        .update({ status: "cancelled", updated_at: new Date().toISOString() })
        .eq("id", row.id)
        .eq("status", "confirmed") // 그 사이 관리자가 이미 다른 상태로 바꿨다면 덮어쓰지 않는다
        .select("*")
        .maybeSingle();

      if (updated) {
        updatedCount += 1;
        details.push({
          reservationId: row.id,
          name: row.name,
          sigmaReservationDt: row.sigma_reservation_dt ?? "",
          reason: "cancelled_in_sigma",
        });
        try {
          await sendReservationCancelledSms(toReservation(updated as ReservationRow));
        } catch (smsError) {
          console.error("동기화 취소 알림 SMS 발송 실패:", smsError);
        }
      }
    }
  }

  const summary: ReservationSyncSummary = {
    triggeredAt: new Date().toISOString(),
    trigger,
    checkedCount,
    updatedCount,
    errorCount,
    details,
  };

  await supabase.from("reservation_sync_log").insert({
    trigger,
    checked_count: checkedCount,
    updated_count: updatedCount,
    error_count: errorCount,
    details,
  });

  return summary;
}
