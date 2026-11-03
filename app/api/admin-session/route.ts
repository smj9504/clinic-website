import { NextResponse } from "next/server";
import { hasAdminSession, logoutAdmin } from "@/lib/adminAuth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin-session — 로그인 상태 확인 (관리자 화면이 주기적으로 부른다)
 * 유효하면 세션을 30분 연장하고 200, 아니면 401.
 */
export async function GET() {
  if (await hasAdminSession()) return NextResponse.json({ ok: true });
  return NextResponse.json({ ok: false, sessionExpired: true }, { status: 401 });
}

/** DELETE /api/admin-session — 로그아웃 (세션 쿠키 삭제) */
export async function DELETE() {
  await logoutAdmin();
  return NextResponse.json({ ok: true });
}
