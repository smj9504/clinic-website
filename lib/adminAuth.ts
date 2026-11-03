/**
 * 관리자 비밀번호 검증 (서버 전용)
 *
 * 비밀번호는 site_data 테이블의 "_config" row에 저장된다.
 * 이 row는 공개 API(/api/site-data)와 anon 키로는 읽을 수 없어야 한다 —
 * app/api/site-data/route.ts의 locale 화이트리스트와 supabase-security-fix.sql의
 * RLS 정책이 그 역할을 한다.
 *
 * 저장값은 scrypt 일방향 해시다(「개인정보의 안전성 확보조치 기준」 제7조:
 * 비밀번호는 복호화되지 않도록 일방향 암호화하여 저장). 예전 버전이 평문으로
 * 저장한 값도 검증은 되도록 남겨 두었고, 비밀번호를 한 번 변경하면 해시로 바뀐다.
 */

import { randomBytes, scrypt as scryptCb, timingSafeEqual, type ScryptOptions } from "crypto";
import { NextResponse } from "next/server";
import { getServiceClient } from "./supabase";

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
async function getStoredAdminPassword(): Promise<string> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", CONFIG_LOCALE)
    .single();
  return data?.data?.[CONFIG_KEY] || DEFAULT_ADMIN_PASSWORD;
}

export async function verifyAdminPassword(password: unknown): Promise<boolean> {
  if (typeof password !== "string" || password.length === 0) return false;
  return matchesStored(password, await getStoredAdminPassword());
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

/**
 * 관리자 인증 게이트.
 * 통과하면 null, 실패하면 그대로 반환할 401 응답을 돌려준다.
 *
 *   const denied = await requireAdmin(password);
 *   if (denied) return denied;
 */
export async function requireAdmin(password: unknown): Promise<NextResponse | null> {
  if (await verifyAdminPassword(password)) return null;
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** 관리자 비밀번호를 헤더로 받는 요청용 게이트 (GET·DELETE처럼 본문이 없는 경우) */
export const ADMIN_PASSWORD_HEADER = "x-admin-password";

export async function requireAdminRequest(request: Request): Promise<NextResponse | null> {
  return requireAdmin(request.headers.get(ADMIN_PASSWORD_HEADER));
}
