/**
 * 관리자 비밀번호 검증 (서버 전용)
 *
 * 비밀번호는 site_data 테이블의 "_config" row에 저장된다.
 * 이 row는 공개 API(/api/site-data)와 anon 키로는 읽을 수 없어야 한다 —
 * app/api/site-data/route.ts의 locale 화이트리스트와 supabase-security-fix.sql의
 * RLS 정책이 그 역할을 한다.
 *
 * 비밀번호를 여러 번 틀리면 접속 IP(또는 전체)를 잠시 차단한다 — lib/loginGuard.ts.
 * 비밀번호는 로그인·비밀번호 변경 때만 확인하고, 그 밖의 관리자 API는 로그인 때 발급한
 * 세션 쿠키로 확인한다 — lib/adminSession.ts.
 *
 * 저장값은 scrypt 일방향 해시다(「개인정보의 안전성 확보조치 기준」 제7조:
 * 비밀번호는 복호화되지 않도록 일방향 암호화하여 저장). 예전 버전이 평문으로
 * 저장한 값도 검증은 되도록 남겨 두었고, 비밀번호를 한 번 변경하면 해시로 바뀐다.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "crypto";
import { NextResponse } from "next/server";
import { getServiceClient } from "./supabase";
import { checkLoginGuard, clearLoginFailures, lockMessage, recordLoginFailure } from "./loginGuard";
import { endSession, isCrossSiteWrite, startSession, verifySession } from "./adminSession";

const CONFIG_LOCALE = "_config";
const CONFIG_KEY = "admin_password";
export const DEFAULT_ADMIN_PASSWORD = "admin1234";

const HASH_PREFIX = "scrypt";
const KEY_LEN = 64;
const SCRYPT_PARAMS: ScryptOptions = { N: 16384, r: 8, p: 1 };

function scrypt(password: string, salt: Buffer): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, KEY_LEN, SCRYPT_PARAMS, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

/** "scrypt$<salt hex>$<hash hex>" 형식으로 만든다 */
export async function hashAdminPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt);
  return `${HASH_PREFIX}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

/** 길이가 달라도 시간 차이로 정보가 새지 않도록 비교한다 */
function safeEqual(a: Buffer, b: Buffer): boolean {
  return a.length === b.length && timingSafeEqual(a, b);
}

async function matchesStored(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length === 3 && parts[0] === HASH_PREFIX) {
    const hash = await scrypt(password, Buffer.from(parts[1], "hex"));
    return safeEqual(hash, Buffer.from(parts[2], "hex"));
  }
  // 예전 평문 저장값 — 비밀번호를 변경하면 해시로 바뀐다
  return safeEqual(Buffer.from(password), Buffer.from(stored));
}

/** DB에 저장된 현재 관리자 비밀번호 값(해시 또는 예전 평문). 없으면 기본값 */
export async function getStoredAdminPassword(): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", CONFIG_LOCALE)
    .single();
  return data?.data?.[CONFIG_KEY] || DEFAULT_ADMIN_PASSWORD;
}

export type AdminCheck =
  | { ok: true }
  | { ok: false; status: 401; error: string }
  | { ok: false; status: 429; error: string; retryAfterSec: number };

/**
 * 관리자 비밀번호 확인 + 시도 횟수 제한.
 * 차단 중이면 비밀번호가 맞아도 429를 돌려준다 — 차단 중에 맞는지 알려 주면
 * 차단이 무작위 대입을 막지 못한다.
 */
export async function checkAdminPassword(password: unknown): Promise<AdminCheck> {
  // 비밀번호 없이 온 요청은 대입 시도가 아니므로 세지 않는다
  if (typeof password !== "string" || password.length === 0) {
    return { ok: false, status: 401, error: "unauthorized" };
  }
  const guard = await checkLoginGuard();
  if (guard.lockedUntil) {
    const { message, retryAfterSec } = lockMessage(guard.lockedUntil);
    return { ok: false, status: 429, error: message, retryAfterSec };
  }
  if (await matchesStored(password, await getStoredAdminPassword())) {
    await clearLoginFailures(guard);
    return { ok: true };
  }
  await recordLoginFailure(guard, password);
  return { ok: false, status: 401, error: "unauthorized" };
}

/** 401·429 응답으로 바꾼다. 429에는 Retry-After를 붙인다 */
export function adminCheckResponse(check: Exclude<AdminCheck, { ok: true }>, body?: Record<string, unknown>): NextResponse {
  const res = NextResponse.json(body ?? { error: check.error }, { status: check.status });
  if (check.status === 429) res.headers.set("Retry-After", String(check.retryAfterSec));
  return res;
}

/** 새 비밀번호를 해시해서 저장한다. 규칙 검사는 호출하는 쪽에서 한다 */
export async function setAdminPassword(newPassword: string): Promise<{ error: string | null }> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from("site_data")
    .upsert(
      {
        locale: CONFIG_LOCALE,
        data: { [CONFIG_KEY]: await hashAdminPassword(newPassword) },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "locale" }
    );
  return { error: error?.message ?? null };
}

/** 로그인: 비밀번호를 확인하고 맞으면 세션 쿠키를 발급한다 */
export async function loginAdmin(password: unknown): Promise<AdminCheck> {
  const check = await checkAdminPassword(password);
  if (check.ok) await startSession(await getStoredAdminPassword());
  return check;
}

export async function logoutAdmin(): Promise<void> {
  await endSession();
}

/** 지금 요청이 유효한 관리자 세션인지 (쿠키 확인 + 30분 연장) */
export async function hasAdminSession(): Promise<boolean> {
  return verifySession(await getStoredAdminPassword());
}

/**
 * 관리자 인증 게이트 — 세션 쿠키로 확인한다.
 * 통과하면 null, 실패하면 그대로 반환할 401(만료·미로그인)·403(다른 사이트에서 온 요청) 응답.
 *
 *   const denied = await requireAdmin();
 *   if (denied) return denied;
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  if (await isCrossSiteWrite()) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  if (await hasAdminSession()) return null;
  return NextResponse.json({ error: "로그인이 만료되었습니다. 다시 로그인해 주세요.", sessionExpired: true }, { status: 401 });
}

/** 예전 이름 — 요청 객체를 받던 라우트용. 세션 쿠키로 확인한다 */
export async function requireAdminRequest(_request?: Request): Promise<NextResponse | null> {
  return requireAdmin();
}
