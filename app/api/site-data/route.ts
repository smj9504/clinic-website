import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdmin } from "@/lib/adminAuth";

/**
 * 이 라우트로 읽고 쓸 수 있는 row는 공개 콘텐츠(ko·en)뿐이다.
 * site_data 테이블에는 관리자 비밀번호를 담은 "_config" row도 있어서,
 * locale을 그대로 받으면 ?locale=_config 한 번으로 비밀번호가 공개된다.
 */
const CONTENT_LOCALES = ["ko", "en"];

function isContentLocale(locale: unknown): locale is string {
  return typeof locale === "string" && CONTENT_LOCALES.includes(locale);
}

/**
 * GET /api/site-data?locale=ko
 * 사이트 데이터 조회 (공개)
 */
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "ko";
  if (!isContentLocale(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", locale)
    .single();

  if (error && error.code !== "PGRST116") {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // PGRST116 = no rows found → return null so client uses defaults
  return NextResponse.json({ data: data?.data ?? null });
}

/**
 * PUT /api/site-data
 * 사이트 데이터 저장 (어드민 전용)
 * Body: { locale: "ko"|"en", data: SiteData, password: string }
 */
export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { locale, data, password } = body;

  if (!locale || !data) {
    return NextResponse.json({ error: "locale and data required" }, { status: 400 });
  }
  if (!isContentLocale(locale)) {
    return NextResponse.json({ error: "invalid locale" }, { status: 400 });
  }

  const denied = await requireAdmin(password);
  if (denied) return denied;

  const supabase = getServiceClient();

  const { error } = await supabase
    .from("site_data")
    .upsert(
      { locale, data, updated_at: new Date().toISOString() },
      { onConflict: "locale" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
