/**
 * 관리자 로그인 세션 (서버 전용)
 *
 * 예전에는 로그인한 비밀번호를 브라우저(sessionStorage)에 넣어 두고 관리자 API를 부를 때마다
 * 그대로 보냈다. 비밀번호 원문이 브라우저에 남아, 게시글에 스크립트가 섞이면 비밀번호가
 * 통째로 새어 나갈 수 있었다. 이제는 로그인할 때 한 번만 비밀번호를 확인하고, 서명한 세션
 * 쿠키를 발급한다.
 *
 * 쿠키: HttpOnly(스크립트로 읽을 수 없음) · Secure · SameSite=Strict(다른 사이트에서 온 요청에는
 * 붙지 않음). 값은 {발급 시각, 만료 시각, 비밀번호 버전}을 서버 비밀키로 HMAC 서명한 것이라
 * 위조할 수 없다.
 *
 *   - 30분 동안 관리자 API 호출이 없으면 만료 (호출할 때마다 30분 연장)
 *     — 「개인정보의 안전성 확보조치 기준」 제6조: 일정 시간 업무처리가 없으면 접속 차단
 *   - 로그인 후 최대 12시간이 지나면 다시 로그인
 *   - 비밀번호를 바꾸면 그 전에 발급된 세션은 모두 무효 (비밀번호 버전이 달라짐)
 */

import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";

export const SESSION_COOKIE = "admin_session";
export const SESSION_IDLE_MS = 30 * 60 * 1000;
export const SESSION_MAX_MS = 12 * 60 * 60 * 1000;

type Payload = { iat: number; exp: number; pv: string };

function secret(): string {
  const s = process.env.ADMIN_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("ADMIN_SESSION_SECRET 또는 SUPABASE_SERVICE_ROLE_KEY가 필요합니다");
  return s;
}

function b64(data: string | Buffer): string {
  return Buffer.from(data).toString("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url");
}

/** 저장된 비밀번호 값(해시)에서 만든 짧은 버전 값 — 비밀번호가 바뀌면 달라진다 */
export function passwordVersion(storedPasswordValue: string): string {
  return createHmac("sha256", secret()).update("pv:" + storedPasswordValue).digest("hex").slice(0, 16);
}

export function encodeSession(payload: Payload): string {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function decodeSession(token: string | undefined | null): Payload | null {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as Payload;
    if (typeof p.iat !== "number" || typeof p.exp !== "number" || typeof p.pv !== "string") return null;
    return p;
  } catch {
    return null;
  }
}

async function writeCookie(payload: Payload) {
  (await cookies()).set(SESSION_COOKIE, encodeSession(payload), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: Math.floor(SESSION_IDLE_MS / 1000),
  });
}

/** 로그인 성공·비밀번호 변경 후 새 세션을 발급한다 */
export async function startSession(storedPasswordValue: string): Promise<void> {
  const now = Date.now();
  await writeCookie({ iat: now, exp: now + SESSION_IDLE_MS, pv: passwordVersion(storedPasswordValue) });
}

export async function endSession(): Promise<void> {
  (await cookies()).set(SESSION_COOKIE, "", { httpOnly: true, secure: true, sameSite: "strict", path: "/", maxAge: 0 });
}

/**
 * 요청의 세션 쿠키가 유효한지 확인하고, 유효하면 만료 시각을 30분 뒤로 늘린다.
 * @param storedPasswordValue 지금 저장된 비밀번호 값 — 바뀌었으면 예전 세션은 무효
 */
export async function verifySession(storedPasswordValue: string): Promise<boolean> {
  const payload = decodeSession((await cookies()).get(SESSION_COOKIE)?.value);
  const now = Date.now();
  if (!payload) return false;
  if (payload.exp <= now) return false;
  if (now - payload.iat >= SESSION_MAX_MS) return false;
  if (payload.pv !== passwordVersion(storedPasswordValue)) return false;
  await writeCookie({ ...payload, exp: Math.min(now + SESSION_IDLE_MS, payload.iat + SESSION_MAX_MS) });
  return true;
}

/**
 * 값을 바꾸는 요청(POST·PUT·PATCH·DELETE)이 다른 사이트에서 왔으면 막는다.
 * SameSite=Strict 쿠키가 이미 막지만, 한 겹 더 둔다(CSRF 방지).
 */
export async function isCrossSiteWrite(): Promise<boolean> {
  try {
    const h = await headers();
    const origin = h.get("origin");
    if (!origin) return false; // 같은 사이트의 fetch는 GET에서 Origin을 생략하기도 한다
    const host = h.get("x-forwarded-host") || h.get("host");
    return !host || new URL(origin).host !== host;
  } catch {
    return false;
  }
}
