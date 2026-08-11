/**
 * 이벤트/공지 노출 여부는 방문자의 기기 시간대와 무관하게 항상 한국(KST) 달력 기준으로 판단한다.
 * `new Date().toISOString()`은 UTC 기준이라, 자정~오전 9시(KST) 사이에는 하루 전 날짜로 계산되어
 * "오늘 시작" 이벤트가 노출 시각까지 숨겨지는 버그가 있었다.
 */
export function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** "YYYY-MM-DD"에 days를 더한 날짜를 "YYYY-MM-DD"로 반환 (UTC 자정 기준 순수 달력 연산, 시간대 영향 없음) */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
