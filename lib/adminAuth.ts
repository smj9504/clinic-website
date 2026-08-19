/**
 * 관리자 비밀번호 검증 (서버 전용)
 *
 * 비밀번호는 site_data 테이블의 "_config" row에 저장된다.
 * 이 검증이 API 라우트마다 복붙되어 있었고, 일부는 기본값을 하드코딩해 두어
 * 비밀번호를 바꾸면 그 라우트만 401이 나는 문제가 있었다. 여기로 모은다.
 */

import { NextResponse } from "next/server";
import { getServiceClient } from "./supabase";

const CONFIG_LOCALE = "_config";
const CONFIG_KEY = "admin_password";
export const DEFAULT_ADMIN_PASSWORD = "admin1234";

/** DB에 저장된 현재 관리자 비밀번호 (없으면 기본값) */
export async function getAdminPassword(): Promise<string> {
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
  return password === (await getAdminPassword());
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
