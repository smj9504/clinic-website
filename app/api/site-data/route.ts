import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";

/**
 * GET /api/site-data?locale=ko
 * 사이트 데이터 조회 (공개)
 */
export async function GET(request: NextRequest) {
  const locale = request.nextUrl.searchParams.get("locale") || "ko";
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

  // DB에서 비밀번호 조회 후 검증
  const supabase = getServiceClient();
  const { data: configRow } = await supabase
    .from("site_data")
    .select("data")
    .eq("locale", "_config")
    .single();
  const storedPassword = configRow?.data?.admin_password || "admin1234";
  if (password !== storedPassword) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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
