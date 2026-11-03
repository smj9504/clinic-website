/**
 * 인증번호 문자 발송 한도 (서버 전용)
 *
 * 인증번호 발송은 로그인 없이 누구나 부를 수 있어서, 번호만 바꿔 가며 계속 부르면
 * 문자 비용이 나가고 모르는 사람들에게 문자가 쏟아진다(자동화 공격). 같은 번호 60초
 * 재발송 제한(lib/smsAuth.ts)에 더해 아래 한도를 둔다. 모두 sms_verifications의 최근
 * 24시간 발송 기록으로 센다(24시간이 지난 기록은 lib/retention.ts가 지운다).
 *
 *   번호 하나   하루 5회
 *   접속 IP    10분 5회, 하루 20회
 *   사이트 전체 10분 50회, 하루 300회 — 여러 IP로 나눠 보내는 공격 대비
 *
 * 접속 IP는 sms_verifications.ip 컬럼(supabase-sms-guard.sql)에 남긴다. 컬럼이 아직
 * 없으면 IP 한도만 서버 메모리로 센다(인스턴스마다 따로 세서 약하다).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { clientIp } from "./loginGuard";
import { CLINIC } from "./privacy";

const MIN = 60 * 1000;
const DAY = 24 * 60 * MIN;

export const SMS_LIMITS = {
  phonePerDay: 5,
  ipPer10Min: 5,
  ipPerDay: 20,
  globalPer10Min: 50,
  globalPerDay: 300,
} as const;

type SendRecord = { phone: string; ip: string | null; createdAt: number };

export type SmsRefusal = { ok: false; error: string; retryAfterSec: number; reason: "phone" | "ip" | "global" };
export type SmsGuardResult = { ok: true; ip: string; ipColumn: boolean } | SmsRefusal;

type Row = { phone: string; ip?: string | null; created_at: string };
type Fetched = { data: Row[] | null; error: { code?: string; message: string } | null };

const memorySends: SendRecord[] = [];

function isMissingColumn(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  return error.code === "42703" || error.code === "PGRST204" || /column .* does not exist|Could not find the .* column/i.test(error.message ?? "");
}

/** 한도를 넘으면 가장 오래된 기록이 창 밖으로 나갈 때까지의 초를 돌려준다 */
function retryAfter(times: number[], limit: number, windowMs: number, now: number): number | null {
  const inWindow = times.filter((t) => now - t < windowMs).sort((a, b) => a - b);
  if (inWindow.length < limit) return null;
  return Math.max(1, Math.ceil((inWindow[inWindow.length - limit] + windowMs - now) / 1000));
}

/**
 * @param records 최근 24시간 DB 발송 기록 (사이트 전체·번호 한도에 쓴다)
 * @param ipTimes 이 IP의 발송 시각들 (DB의 ip 컬럼, 없으면 메모리 기록)
 */
export function evaluateSmsLimits(records: SendRecord[], ipTimes: number[], phone: string, now: number): SmsRefusal | null {
  const all = records.map((r) => r.createdAt);
  const byPhone = records.filter((r) => r.phone === phone).map((r) => r.createdAt);
  const byIp = ipTimes;
  const tel = CLINIC.phone;

  const global = retryAfter(all, SMS_LIMITS.globalPer10Min, 10 * MIN, now) ?? retryAfter(all, SMS_LIMITS.globalPerDay, DAY, now);
  if (global) {
    return {
      ok: false,
      reason: "global",
      retryAfterSec: global,
      error: `지금은 인증번호 요청이 많아 발송을 잠시 멈췄습니다. 전화(${tel})로 상담을 신청해 주세요.`,
    };
  }
  const phoneWait = retryAfter(byPhone, SMS_LIMITS.phonePerDay, DAY, now);
  if (phoneWait) {
    return {
      ok: false,
      reason: "phone",
      retryAfterSec: phoneWait,
      error: `이 번호로 하루에 받을 수 있는 인증번호 횟수(${SMS_LIMITS.phonePerDay}회)를 넘었습니다. 내일 다시 시도하시거나 전화(${tel})로 문의해 주세요.`,
    };
  }
  const ipWait = retryAfter(byIp, SMS_LIMITS.ipPer10Min, 10 * MIN, now) ?? retryAfter(byIp, SMS_LIMITS.ipPerDay, DAY, now);
  if (ipWait) {
    return {
      ok: false,
      reason: "ip",
      retryAfterSec: ipWait,
      error: "인증번호 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.",
    };
  }
  return null;
}

/** 발송 전에 부른다. 통과하면 ok와 함께 기록에 쓸 IP를 돌려준다 */
export async function checkSmsSendLimits(supabase: SupabaseClient, phone: string): Promise<SmsGuardResult> {
  const ip = await clientIp();
  const now = Date.now();
  const since = new Date(now - DAY).toISOString();

  const fetchSince = async (columns: string): Promise<Fetched> =>
    (await supabase
      .from("sms_verifications")
      .select(columns)
      .gt("created_at", since)
      .order("created_at", { ascending: false })
      .limit(2000)) as unknown as Fetched;

  let ipColumn = true;
  let res = await fetchSince("phone, ip, created_at");
  if (res.error && isMissingColumn(res.error)) {
    ipColumn = false;
    res = await fetchSince("phone, created_at");
  }
  if (res.error) {
    // 기록을 못 읽으면 막지 않는다 — 본인인증 자체가 멈추면 상담 신청을 받을 수 없다.
    // 같은 번호 60초 제한과 메모리 IP 한도는 그대로 적용된다.
    console.error("[smsGuard] 발송 기록 조회 실패:", res.error.message);
  }

  const dbRecords: SendRecord[] = (res.data ?? []).map(
    (r) => ({ phone: r.phone, ip: r.ip ?? null, createdAt: Date.parse(r.created_at) })
  );

  // IP 컬럼이 없거나 DB를 못 읽으면 IP 한도는 메모리 기록으로 센다
  for (let i = memorySends.length - 1; i >= 0; i--) if (now - memorySends[i].createdAt >= DAY) memorySends.splice(i, 1);
  const useDbIp = ipColumn && !res.error;
  const ipTimes = (useDbIp ? dbRecords : memorySends).filter((r) => r.ip === ip).map((r) => r.createdAt);

  const refused = evaluateSmsLimits(dbRecords, ipTimes, phone, now);
  if (refused) {
    console.warn(`[smsGuard] 발송 거부(${refused.reason}) ip=${ip}`);
    return refused;
  }
  if (!useDbIp) memorySends.push({ phone, ip, createdAt: now });
  return { ok: true, ip, ipColumn: useDbIp };
}
