import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import {
  categoryToRow,
  slugify,
  subcategoryToRow,
  toCategory,
  toSubcategory,
  type CategoryRow,
  type ServiceCategory,
  type ServiceSubcategory,
  type SubcategoryRow,
} from "@/lib/services";

export const dynamic = "force-dynamic";

/**
 * 카테고리 · 서브카테고리 CRUD (조회는 GET /api/services 에 함께 들어 있다)
 * 모든 요청에 x-admin-password 헤더가 필요하다.
 */

type Kind = "category" | "subcategory";

const TABLE: Record<Kind, string> = {
  category: "service_categories",
  subcategory: "service_subcategories",
};

function parseKind(value: unknown): Kind | null {
  return value === "category" || value === "subcategory" ? value : null;
}

/** slug 중복은 사용자가 고칠 수 있는 입력 오류이므로 500이 아니라 409로 알린다 */
function respondForError(error: { code?: string | null; message: string }) {
  if (error.code === "23505") {
    return NextResponse.json(
      { error: "같은 slug가 이미 있습니다. 다른 값을 입력해 주세요." },
      { status: 409 }
    );
  }
  return NextResponse.json({ error: error.message }, { status: 500 });
}

/** 새 항목은 같은 부모 안에서 맨 뒤에 붙인다 */
async function nextSortOrder(
  supabase: ReturnType<typeof getServiceClient>,
  kind: Kind,
  categoryId?: string
): Promise<number> {
  let query = supabase.from(TABLE[kind]).select("sort_order");
  if (kind === "subcategory" && categoryId) query = query.eq("category_id", categoryId);
  const { data } = await query.order("sort_order", { ascending: false }).limit(1).maybeSingle();
  return ((data?.sort_order as number | undefined) ?? -1) + 1;
}

/**
 * POST — 카테고리 / 서브카테고리 생성
 * Body: { kind, data: Partial<ServiceCategory | ServiceSubcategory> }
 */
export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const kind = parseKind(body?.kind);
  if (!kind) {
    return NextResponse.json({ error: "kind는 category 또는 subcategory여야 합니다" }, { status: 400 });
  }

  const draft = (body?.data ?? {}) as Partial<ServiceCategory & ServiceSubcategory>;
  if (kind === "subcategory" && !draft.categoryId) {
    return NextResponse.json({ error: "categoryId가 필요합니다" }, { status: 400 });
  }

  const supabase = getServiceClient();

  // 이름이 한글이면 slug로 남는 글자가 없으므로 임의 문자열이 된다. 관리자가 나중에 고칠 수 있다.
  draft.slug = draft.slug?.trim() || slugify(draft.i18n?.ko?.name ?? "", kind === "category" ? "cat" : "sub");
  if (draft.sortOrder === undefined) {
    draft.sortOrder = await nextSortOrder(supabase, kind, draft.categoryId);
  }

  const row = kind === "category" ? categoryToRow(draft) : subcategoryToRow(draft);
  const { data, error } = await supabase.from(TABLE[kind]).insert(row).select("*").single();

  if (error) return respondForError(error);
  return NextResponse.json(
    kind === "category"
      ? { category: toCategory(data as CategoryRow) }
      : { subcategory: toSubcategory(data as SubcategoryRow) },
    { status: 201 }
  );
}

/**
 * PATCH — 여러 항목의 일부 필드를 한 번에 수정 (이름 변경·순서 변경·숨김 토글 공용)
 * Body: { kind, updates: [{ id, ...변경할 필드 }] }
 */
export async function PATCH(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => null);
  const kind = parseKind(body?.kind);
  if (!kind) {
    return NextResponse.json({ error: "kind는 category 또는 subcategory여야 합니다" }, { status: 400 });
  }

  const updates = body?.updates as (Partial<ServiceCategory & ServiceSubcategory> & {
    id?: string;
  })[] | undefined;
  if (!Array.isArray(updates) || updates.length === 0) {
    return NextResponse.json({ error: "updates 배열이 필요합니다" }, { status: 400 });
  }
  if (updates.some((u) => !u.id)) {
    return NextResponse.json({ error: "각 update에 id가 필요합니다" }, { status: 400 });
  }

  const supabase = getServiceClient();
  for (const { id, ...fields } of updates) {
    const row = kind === "category" ? categoryToRow(fields) : subcategoryToRow(fields);
    if (Object.keys(row).length === 0) continue;
    const { error } = await supabase.from(TABLE[kind]).update(row).eq("id", id!);
    if (error) return respondForError(error);
  }

  return NextResponse.json({ success: true, updated: updates.length });
}

/**
 * DELETE /api/service-categories?kind=category&id=...
 *
 * 외래키가 cascade라 하위가 함께 지워진다. 관리자 화면이 "N개가 함께 삭제됩니다"를
 * 사후에도 정확히 안내할 수 있도록, 지우기 전에 센 개수를 응답에 담는다.
 */
export async function DELETE(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const kind = parseKind(request.nextUrl.searchParams.get("kind"));
  const id = request.nextUrl.searchParams.get("id");
  if (!kind || !id) {
    return NextResponse.json({ error: "kind와 id가 필요합니다" }, { status: 400 });
  }

  const supabase = getServiceClient();

  let removedSubcategories = 0;
  let subcategoryIds: string[] = [id];

  if (kind === "category") {
    const { data } = await supabase
      .from("service_subcategories")
      .select("id")
      .eq("category_id", id);
    subcategoryIds = (data ?? []).map((r) => r.id as string);
    removedSubcategories = subcategoryIds.length;
  }

  let removedServices = 0;
  if (subcategoryIds.length > 0) {
    const { count } = await supabase
      .from("services")
      .select("id", { count: "exact", head: true })
      .in("subcategory_id", subcategoryIds);
    removedServices = count ?? 0;
  }

  const { error } = await supabase.from(TABLE[kind]).delete().eq("id", id);
  if (error) return respondForError(error);

  return NextResponse.json({ success: true, removedSubcategories, removedServices });
}
