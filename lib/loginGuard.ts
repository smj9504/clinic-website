/**
 * 관리자 비밀번호 시도 횟수 제한 (서버 전용)
 *
 * 「개인정보의 안전성 확보조치 기준」: 비밀번호를 일정 횟수 이상 잘못 입력하면
 * 접근을 제한해야 한다. 관리자 비밀번호는 로그인 화면뿐 아니라 모든 관리자 API가
 * 매번 확인하므로, 비밀번호를 검사하는 lib/adminAuth.ts가 이 모듈을 거친다.
 *
 * 규칙 (최근 15분 기준)
 *   - 같은 접속 IP에서 서로 다른 틀린 비밀번호 5개 → 그 IP 차단
 *   - 모든 IP를 합쳐 서로 다른 틀린 비밀번호 30개 → 관리자 로그인 전체 차단
 *     (여러 IP로 나눠 시도하는 공격 대비)
 *   차단은 틀린 시도가 15분 창 밖으로 밀려나면 자동으로 풀린다.
 *
 * "서로 다른" 비밀번호만 세는 이유: 다른 PC에서 비밀번호를 바꾸면, 기존에 로그인해 둔
 * 브라우저가 예전 비밀번호로 API를 계속 호출한다. 같은 틀린 값을 여러 번 세면 병원
 * 직원끼리 서로를 잠그게 된다. 무작위 대입은 매번 다른 값을 넣으므로 이 방식으로 막힌다.
 *
 * 저장: admin_login_failures 테이블(supabase-admin-login-guard.sql). 틀린 비밀번호는
 * 그대로 저장하지 않고 서버 비밀키로 만든 HMAC 앞 16자리만 남긴다. 기록은 24시간 뒤 지운다.
 * 테이블이 아직 없거나 DB에 닿지 않으면 서버 메모리로 같은 규칙을 적용한다 — 서버리스
 * 인스턴스마다 따로 세므로 약하지만, 관리자 로그인이 막히지는 않는다.
 */

import { createHmac } from "crypto";
import { headers } from "next/headers";
import { getServiceClient } from "./supabase";

const TABLE = "admin_login_failures";
const WINDOW_MS = 15 * 60 * 1000;
const RECORD_RETENTION_MS = 24 * 60 * 60 * 1000;
export const IP_LIMIT = 5;
export const GLOBAL_LIMIT = 30;

type Failure = { ip: string; fingerprint: string; createdAt: number };

export type GuardState = {
  ip: string;
  /** 차단 중이면 풀리는 시각(ms), 아니면 null */
  lockedUntil: number | null;
  /** 이 IP의 창 안 실패 기록이 있는지 — 로그인 성공 시 지울지 판단 */
  ipHasFailures: boolean;
  /** DB 대신 메모리를 쓰는 중인지 */
  memory: boolean;
};

/* ─── 접속 IP ──────────────────────────────────────────────── */

/**
 * Vercel은 x-forwarded-for를 실제 접속 IP로 덮어써서 보내므로 위조할 수 없다.
 * 병원 PC에서 직접 띄우는 경우처럼 프록시가 없으면 값이 비거나 위조될 수 있는데,
 * 그때는 전체 차단 규칙이 무작위 대입을 막는다.
 */
async function clientIp(): Promise<string> {
  try {
    const h = await headers();
    const first = (v: string | null) => v?.split(",")[0]?.trim() || "";
    return first(h.get("x-vercel-forwarded-for")) || first(h.get("x-real-ip")) || first(h.get("x-forwarded-for")) || "unknown";
  } catch {
    return "unknown";
  }
}

function fingerprint(password: string): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "clinic-admin-login-guard";
  return createHmac("sha256", key).update(password).digest("hex").slice(0, 16);
}

/* ─── 판정 ─────────────────────────────────────────────────── */

/**
 * 창 안의 실패 기록으로 차단 여부를 계산한다.
 * 서로 다른 fingerprint마다 처음 나온 시각을 모아, 그 수가 한도 이상이면 차단이다.
 * 풀리는 시각 = (가장 오래된 것부터 지워서 한도 아래로 내려가는 시점) + 15분.
 */
function lockFrom(failures: Failure[], limit: number): number | null {
  const firstSeen = new Map<string, number>();
  for (const f of failures) {
    const prev = firstSeen.get(f.fingerprint);
    if (prev === undefined || f.createdAt < prev) firstSeen.set(f.fingerprint, f.createdAt);
  }
  const times = [...firstSeen.values()].sort((a, b) => a - b);
  if (times.length < limit) return null;
  return times[times.length - limit] + WINDOW_MS;
}

export function evaluate(failures: Failure[], ip: string, now: number): Omit<GuardState, "memory"> {
  const recent = failures.filter((f) => now - f.createdAt < WINDOW_MS);
  const mine = recent.filter((f) => f.ip === ip);
  const ipLock = lockFrom(mine, IP_LIMIT);
  const globalLock = lockFrom(recent, GLOBAL_LIMIT);
  const lockedUntil = [ipLock, globalLock].filter((t): t is number => t !== null && t > now).sort((a, b) => b - a)[0] ?? null;
  return { ip, lockedUntil, ipHasFailures: mine.length > 0 };
}

/* ─── 저장소 (DB, 없으면 메모리) ───────────────────────────── */

const memoryFailures: Failure[] = [];
let warnedMemory = false;

function useMemory(reason: string) {
  if (!warnedMemory) {
    console.warn(`[loginGuard] ${reason} — 서버 메모리로 시도 횟수를 셉니다. supabase-admin-login-guard.sql을 실행하세요.`);
    warnedMemory = true;
  }
}

function pruneMemory(now: number) {
  for (let i = memoryFailures.length - 1; i >= 0; i--) {
    if (now - memoryFailures[i].createdAt >= WINDOW_MS) memoryFailures.splice(i, 1);
  }
}

/** 지금 이 요청의 IP가 차단 중인지 확인한다. 비밀번호를 검사하기 전에 부른다. */
export async function checkLoginGuard(): Promise<GuardState> {
  const ip = await clientIp();
  const now = Date.now();
  try {
    const { data, error } = await getServiceClient()
      .from(TABLE)
      .select("ip, fingerprint, created_at")
      .gt("created_at", new Date(now - WINDOW_MS).toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);
    if (error) throw error;
    const failures = (data ?? []).map((r) => ({
      ip: r.ip as string,
      fingerprint: r.fingerprint as string,
      createdAt: Date.parse(r.created_at as string),
    }));
    return { ...evaluate(failures, ip, now), memory: false };
  } catch (err) {
    useMemory(`실패 기록 조회 불가 (${err instanceof Error ? err.message : (err as { message?: string })?.message ?? err})`);
    pruneMemory(now);
    return { ...evaluate(memoryFailures, ip, now), memory: true };
  }
}

/** 틀린 비밀번호 1회를 기록한다 */
export async function recordLoginFailure(state: GuardState, password: string): Promise<void> {
  const failure: Failure = { ip: state.ip, fingerprint: fingerprint(password), createdAt: Date.now() };
  if (state.memory) {
    memoryFailures.push(failure);
    return;
  }
  const supabase = getServiceClient();
  const { error } = await supabase.from(TABLE).insert({ ip: failure.ip, fingerprint: failure.fingerprint });
  if (error) {
    useMemory(`실패 기록 저장 불가 (${error.message})`);
    memoryFailures.push(failure);
    return;
  }
  // 24시간이 지난 기록은 지운다 (접속 IP도 개인정보라 오래 두지 않는다)
  await supabase.from(TABLE).delete().lt("created_at", new Date(Date.now() - RECORD_RETENTION_MS).toISOString());
}

/** 비밀번호가 맞으면 그 IP의 실패 기록을 지운다 */
export async function clearLoginFailures(state: GuardState): Promise<void> {
  if (!state.ipHasFailures) return;
  if (state.memory) {
    for (let i = memoryFailures.length - 1; i >= 0; i--) {
      if (memoryFailures[i].ip === state.ip) memoryFailures.splice(i, 1);
    }
    return;
  }
  await getServiceClient().from(TABLE).delete().eq("ip", state.ip);
}

export function lockMessage(lockedUntil: number): { message: string; retryAfterSec: number } {
  const retryAfterSec = Math.max(1, Math.ceil((lockedUntil - Date.now()) / 1000));
  const minutes = Math.ceil(retryAfterSec / 60);
  return {
    message: `비밀번호를 여러 번 잘못 입력해 관리자 로그인이 잠시 제한되었습니다. ${minutes}분 후 다시 시도해 주세요.`,
    retryAfterSec,
  };
}
