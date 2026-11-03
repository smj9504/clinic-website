/**
 * 보관기간이 지난 개인정보 자동 파기 (서버 전용)
 *
 * 처리방침(lib/privacy.ts)에 적은 보관기간을 실제로 지키기 위한 코드다.
 * 이 앱은 Vercel 서버리스에서 돌아 상시 스케줄러가 없으므로, 상담 신청 접수·
 * 관리자 목록 조회·인증번호 발송 때마다 지난 기록을 함께 지운다. 신청이나
 * 관리자 접속이 며칠 없어도 다음 요청 때 밀린 만큼 한꺼번에 지워진다.
 *
 * 삭제 실패는 본 요청(상담 신청 등)을 막지 않도록 로그만 남긴다.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { RESERVATION_RETENTION_DAYS, SMS_VERIFICATION_RETENTION_HOURS } from "./privacy";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

function isMissingTable(error: { code?: string | null; message?: string | null } | null): boolean {
  if (!error) return false;
  if (error.code === "42P01" || error.code === "PGRST205") return true;
  return /does not exist|schema cache/i.test(error.message ?? "");
}

async function deleteOlderThan(supabase: SupabaseClient, table: string, cutoff: Date): Promise<void> {
  const { error, count } = await supabase
    .from(table)
    .delete({ count: "exact" })
    .lt("created_at", cutoff.toISOString());
  if (error) {
    if (!isMissingTable(error)) console.error(`[retention] ${table} 파기 실패: ${error.message}`);
    return;
  }
  if (count) console.log(`[retention] ${table}: 보관기간이 지난 ${count}건 파기`);
}

/** 상담 신청(신청일로부터 1년)과 그 이름이 담긴 동기화 이력(1년)을 파기한다 */
export async function purgeExpiredReservations(supabase: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - RESERVATION_RETENTION_DAYS * DAY_MS);
  try {
    await deleteOlderThan(supabase, "reservation_requests", cutoff);
    await deleteOlderThan(supabase, "reservation_sync_log", cutoff);
  } catch (err) {
    console.error("[retention] 상담 신청 파기 중 오류:", err);
  }
}

/** 휴대폰 인증번호 기록(발급 후 24시간)을 파기한다 */
export async function purgeExpiredSmsVerifications(supabase: SupabaseClient): Promise<void> {
  const cutoff = new Date(Date.now() - SMS_VERIFICATION_RETENTION_HOURS * HOUR_MS);
  try {
    await deleteOlderThan(supabase, "sms_verifications", cutoff);
  } catch (err) {
    console.error("[retention] 인증번호 기록 파기 중 오류:", err);
  }
}
