import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { publicServerError } from "@/lib/apiError";
import { requireAdminRequest } from "@/lib/adminAuth";
import {
  isServiceVisible,
  serviceToRow,
  toCategory,
  toService,
  toSubcategory,
  type CategoryRow,
  type Service,
  type ServiceRow,
  type SubcategoryRow,
} from "@/lib/services";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ id: string }> };

/** Response 본문은 한 번만 읽을 수 있으므로 매 요청마다 새로 만든다 */
const notFound = () => NextResponse.json({ error: "not found" }, { status: 404 });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * GET /api/services/[id]
 * 시술 1건 전체(blocks 포함)와 소속 분류를 반환한다.
 *
 * ?includeHidden=1 → 숨김·기간 밖 항목도 조회 (관리자 미리보기용, 관리자 세션 쿠키 필요)
 */
export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params;
  // id는 UUID다 — 형식이 다르면 DB에 묻지 않고 바로 404 (DB 오류 문장이 새지 않게)
  if (!UUID_RE.test(id)) return notFound();
  const includeHidden = request.nextUrl.searchParams.get("includeHidden") === "1";
  if (includeHidden) {
    const denied = await requireAdminRequest(request);
    if (denied) return denied;
  }

  const supabase = getServiceClient();
  const { data: row, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return publicServerError("services/[id] GET", error);
  if (!row) return notFound();

  const service = toService(row as ServiceRow);

  const { data: subRow } = await supabase
    .from("service_subcategories")
    .select("*")
    .eq("id", service.subcategoryId)
    .maybeSingle();
  const subcategory = subRow ? toSubcategory(subRow as SubcategoryRow) : null;

  const { data: catRow } = subcategory
    ? await supabase
        .from("service_categories")
        .select("*")
        .eq("id", subcategory.categoryId)
        .maybeSingle()
    : { data: null };
  const category = catRow ? toCategory(catRow as CategoryRow) : null;

  // 상위 분류가 숨겨져 있으면 시술도 공개하지 않는다
  if (!includeHidden) {
    const hiddenByParent = subcategory?.isHidden || category?.isHidden;
    if (hiddenByParent || !isServiceVisible(service)) return notFound();
  }

  return NextResponse.json({ service, subcategory, category });
}

/**
 * PUT /api/services/[id] — 시술 수정
 * 관리자 세션 쿠키 필요
 * Body: { service: Partial<Service> }
 */
export async function PUT(request: NextRequest, { params }: Params) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const { id } = await params;
  const body = await request.json().catch(() => null);
  const patch = body?.service as Partial<Service> | undefined;
  if (!patch) {
    return NextResponse.json({ error: "service가 필요합니다" }, { status: 400 });
  }

  const row = serviceToRow(patch);
  if (Object.keys(row).length === 0) {
    return NextResponse.json({ error: "변경할 필드가 없습니다" }, { status: 400 });
  }

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("services")
    .update(row)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return notFound();
  return NextResponse.json({ service: toService(data as ServiceRow) });
}

/**
 * DELETE /api/services/[id]
 * 관리자 세션 쿠키 필요
 */
export async function DELETE(request: NextRequest, { params }: Params) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const { id } = await params;
  const supabase = getServiceClient();
  const { error } = await supabase.from("services").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
