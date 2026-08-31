import type { TranslationKey } from "./translations";

/**
 * 이벤트/공지 노출 여부는 방문자의 기기 시간대와 무관하게 항상 한국(KST) 달력 기준으로 판단한다.
 * `new Date().toISOString()`은 UTC 기준이라, 자정~오전 9시(KST) 사이에는 하루 전 날짜로 계산되어
 * "오늘 시작" 이벤트가 노출 시각까지 숨겨지는 버그가 있었다.
 */
export function todayKST(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Seoul" });
}

/** 현재 시각을 KST 기준 "HH:mm"으로 반환. 방문자 기기 시간대와 무관하게 항상 한국 시각. */
export function nowKST(): string {
  return new Date().toLocaleTimeString("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hour12: false });
}

/** "9:00" → "09:00". admin에서 자유 입력한 시각은 한 자리 시("9:00")로 적혔을 수 있는데,
 * zero-pad 없이는 문자열 비교("9:00" >= "20:00")가 실제 시간 순서와 어긋난다. */
function zeroPadHour(time: string): string {
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}

/** "평일 10:30 – 20:00" 같은 자유 텍스트에서 시작/종료 시각("HH:mm", 항상 2자리 시)만 추출. 형식이 안 맞으면 null. */
export function parseHoursRange(text: string): { opens: string; closes: string } | null {
  const matches = text.match(/\d{1,2}:\d{2}/g);
  if (!matches || matches.length < 2) return null;
  return { opens: zeroPadHour(matches[0]), closes: zeroPadHour(matches[1]) };
}

/** "YYYY-MM-DD"의 요일 (0=일 ~ 6=토), UTC 자정 기준 순수 달력 연산 */
function weekdayOf(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * 주어진 날짜의 진료 종료 시각("HH:mm"). 평일(월~금)은 hours.weekday, 토요일은
 * hours.saturday를 파싱해서 쓰고, 일요일은 휴진이라 null(=하루 종일 진료 없음).
 * hours 텍스트 형식이 안 맞으면 판단할 수 없으므로 null(=제한 없음으로 취급).
 */
export function clinicClosingTime(dateStr: string, hours: { weekday: string; saturday: string }): string | null {
  const weekday = weekdayOf(dateStr);
  if (weekday === 0) return null; // 일요일 휴진 — "오늘 진료 종료 시각" 개념 자체가 없음
  const range = weekday === 6 ? parseHoursRange(hours.saturday) : parseHoursRange(hours.weekday);
  return range?.closes ?? null;
}

/**
 * 해당 날짜가 오늘이고, 이미 그날 진료 종료 시각을 지났다면 true.
 * 오늘이 아니면(미래 날짜) 항상 false — 아직 지나지 않은 날의 시간대는 막을 이유가 없다.
 */
export function isPastClinicHoursToday(dateStr: string, hours: { weekday: string; saturday: string }): boolean {
  if (dateStr !== todayKST()) return false;
  const closes = clinicClosingTime(dateStr, hours);
  if (!closes) return false;
  return nowKST() >= closes;
}

/** "YYYY-MM-DD"에 days를 더한 날짜를 "YYYY-MM-DD"로 반환 (UTC 자정 기준 순수 달력 연산, 시간대 영향 없음) */
export function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * 이벤트/공지 카드·배너에 쓰는 기간 라벨. startDate/endDate를 계산해서 보여주고,
 * 종료일 없이 진행중인 경우 등록 시 입력해둔 뒤 갱신되지 않는 date 문구 대신 "진행중"만 표시한다.
 */
export function formatEventPeriod(
  item: { startDate?: string; endDate?: string; date: string },
  t: (key: TranslationKey) => string
): string {
  if (item.startDate && item.endDate) {
    return `${item.startDate.replace(/-/g, ".")} – ${item.endDate.replace(/-/g, ".")}`;
  }
  if (item.startDate && item.startDate <= todayKST()) {
    return t("events.ongoing");
  }
  if (item.startDate) {
    return item.startDate.replace(/-/g, ".");
  }
  return item.date.replace("EVENT · ", "");
}
