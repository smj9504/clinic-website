/**
 * 서버 시작 시 1회 실행되는 Next.js 훅 (공식 file convention).
 *
 * 이 앱은 Vercel이 아니라 병원 내부 PC에서 `next start`로 상시 구동되므로
 * (README 참고), 서버리스 cron 대신 여기서 setInterval 기반 스케줄러를
 * 띄워 진료시간 중 30분마다 시그마 상태 동기화(lib/reservationSync.ts)를
 * 돌린다. 진료시간 외에는 isWithinClinicHoursNow가 걸러내 실행하지 않는다.
 *
 * register()는 각 런타임(nodejs/edge)마다, 그리고 dev 모드에서는 코드
 * 변경으로 인한 재컴파일 때마다 다시 호출될 수 있다 — 인터벌이 중복
 * 등록되지 않도록 모듈 스코프 플래그로 방어한다.
 */

let schedulerStarted = false;

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (schedulerStarted) return;
  schedulerStarted = true;

  const THIRTY_MINUTES_MS = 30 * 60 * 1000;

  const runIfClinicOpen = async () => {
    try {
      const { getServiceClient } = await import("@/lib/supabase");
      const { isWithinClinicHoursNow } = await import("@/lib/date");
      const { clinicInfoShape } = await import("@/lib/data");

      const supabase = getServiceClient();
      const { data } = await supabase.from("site_data").select("data").eq("locale", "ko").maybeSingle();
      const hours = data?.data?.clinicInfo?.hours ?? clinicInfoShape.hours;

      if (!isWithinClinicHoursNow(hours)) return;

      const { syncReservationsWithSigma } = await import("@/lib/reservationSync");
      const summary = await syncReservationsWithSigma("scheduled");
      if (summary.updatedCount > 0 || summary.errorCount > 0) {
        console.log(
          `[reservationSync] scheduled run: checked=${summary.checkedCount} updated=${summary.updatedCount} errors=${summary.errorCount}`
        );
      }
    } catch (err) {
      console.error("[reservationSync] scheduled run failed:", err);
    }
  };

  setInterval(runIfClinicOpen, THIRTY_MINUTES_MS);
}
