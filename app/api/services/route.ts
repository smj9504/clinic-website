import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import { todayKST } from "@/lib/date";
import {
  isMissingTableError,
  isServiceVisible,
  serviceToRow,
  toCategory,
  toService,
  toSubcategory,
  type CategoryRow,
  type Service,
  type ServiceCatalog,
  type ServiceRow,
  type SubcategoryRow,
} from "@/lib/services";

export const dynamic = "force-dynamic";

/** 목록 조회에서는 blocks(상세)를 가져오지 않는다 — 카탈로그에서 제일 무거운 컬럼이다 */
const LIST_COLUMNS =
  "id,subcategory_id,image,tag,badges,sale_start_date,sale_end_date,sort_order,is_hidden,i18n,prices,event_ids";

const EMPTY_CATALOG: ServiceCatalog = { categories: [], subcategories: [], services: [] };

/**
 * GET /api/services
 * 카테고리 + 서브카테고리 + 시술 카드를 한 번에 반환한다. blocks는 제외.
 *
 * ?includeHidden=1 → 숨김·기간 밖 항목까지 포함 (관리자 전용, x-admin-password 헤더 필요)
 */
export async function GET(request: NextRequest) {
  const includeHidden = request.nextUrl.searchParams.get("includeHidden") === "1";
  if (includeHidden) {
    const denied = await requireAdminRequest(request);
    if (denied) return denied;
  }

  const supabase = getServiceClient();
  const [catRes, subRes, svcRes] = await Promise.all([
    supabase.from("service_categories").select("*").order("sort_order").order("created_at"),
    supabase.from("service_subcategories").select("*").order("sort_order").order("created_at"),
    supabase.from("services").select(LIST_COLUMNS).order("sort_order").order("created_at"),
  ]);

  const firstError = catRes.error || subRes.error || svcRes.error;
  if (firstError) {
    // supabase-schema.sql을 아직 실행하지 않은 상태. 공개 사이트를 깨뜨리는 대신
    // 빈 카탈로그를 돌려주고, 관리자 화면이 안내를 띄울 수 있도록 플래그를 준다.
    if (isMissingTableError(firstError)) {
      return NextResponse.json({ ...EMPTY_CATALOG, setupRequired: true });
    }
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  let categories = ((catRes.data ?? []) as CategoryRow[]).map(toCategory);
  let subcategories = ((subRes.data ?? []) as SubcategoryRow[]).map(toSubcategory);
  let services = ((svcRes.data ?? []) as unknown as ServiceRow[]).map(toService);

  if (!includeHidden) {
    // 상위가 숨겨져 있으면 하위도 노출하지 않는다
    categories = categories.filter((c) => !c.isHidden);
    const visibleCategoryIds = new Set(categories.map((c) => c.id));
    subcategories = subcategories.filter(
      (s) => !s.isHidden && visibleCategoryIds.has(s.categoryId)
    );
    const visibleSubcategoryIds = new Set(subcategories.map((s) => s.id));
    const today = todayKST();
    services = services.filter(
      (s) => visibleSubcategoryIds.has(s.subcategoryId) && isServiceVisible(s, today)
    );
  }

  return NextResponse.json({ categories, subcategories, services });
}

/**
 * POST /api/services — 시술 생성
 * Header: x-admin-password
 * Body: { service: Partial<Service> }  (subcategoryId 필수)
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const draft = body?.service as Partial<Service> | undefined;
  if (!draft?.subcategoryId) {
    return NextResponse.json({ error: "subcategoryId가 필요합니다" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 같은 서브카테고리 안에서 맨 뒤에 붙인다
  if (draft.sortOrder === undefined) {
    const { data: last } = await supabase
      .from("services")
      .select("sort_order")
      .eq("subcategory_id", draft.subcategoryId)
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    draft.sortOrder = ((last?.sort_order as number | undefined) ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("services")
    .insert(serviceToRow(draft))
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ service: toService(data as ServiceRow) }, { status: 201 });
}

/**
 * PATCH /api/services — 여러 시술의 일부 필드를 한 번에 수정 (순서 변경·숨김 토글용)
 * Header: x-admin-password
 * Body: { updates: [{ id, ...변경할 필드 }] }
 */
export async function PATCH(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const updates = body?.updates as (Partial<Service> & { id?: string })[] | undefined;
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates 배열이 필요합니다" }, { status: 400 });
  }
  if (updates.some((u) => !u.id)) {
    return NextResponse.json({ error: "각 update에 id가 필요합니다" }, { status: 400 });
  }

  const supabase = getServiceClient();
  for (const { id, ...fields } of updates) {
    const row = serviceToRow(fields);
    if (Object.keys(row).length === 0) continue;
    const { error } = await supabase.from("services").update(row).eq("id", id!);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, updated: updates.length });
}
