import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { requireAdminRequest } from "@/lib/adminAuth";
import { translateTexts } from "@/lib/translate";
import { isMissingTableError } from "@/lib/services";

export const dynamic = "force-dynamic";

/**
 * POST /api/services/translate — 시술 카탈로그 한국어 → 영어 자동 번역
 * Header: x-admin-password
 * Body: { cursor?: number, limit?: number }
 *
 * 한 번에 몇 건씩만 처리하고 다음 커서를 돌려준다. 시술이 수십 건이면
 * 한 요청 안에 다 끝내려다 서버리스 실행 시간 제한에 걸리기 때문이다.
 *
 * 번역 결과는 레코드마다 i18n.en에 들어간다. site_data처럼 배열 인덱스로
 * 짝을 맞추지 않으므로 순서를 바꾸거나 중간을 지워도 밀리지 않는다.
 */

const DEFAULT_LIMIT = 5;

type Json = Record<string, unknown>;
type Job = { text: string; set: (value: string) => void };

type Plan = {
  table: string;
  id: string;
  jobs: Job[];
  /** 번역이 채워진 뒤 DB에 쓸 내용 (getter로 감싸 최신 상태를 읽는다) */
  payload: () => Json;
};

function planTaxonomy(table: string, row: Json): Plan {
  const jobs: Job[] = [];
  const i18n = { ...((row.i18n as Json) ?? {}) } as Json;
  const ko = (i18n.ko ?? {}) as Record<string, string>;
  const en = { ...((i18n.en ?? {}) as Record<string, string>) };

  const push = (text: string | undefined, set: (v: string) => void) => {
    if (text && text.trim()) jobs.push({ text, set });
  };

  push(ko.name, (v) => { en.name = v; });
  push(ko.description, (v) => { en.description = v; });
  i18n.en = en;

  return { table, id: row.id as string, jobs, payload: () => ({ i18n }) };
}

function planService(row: Json): Plan {
  const jobs: Job[] = [];
  const push = (text: string | undefined, set: (v: string) => void) => {
    if (text && text.trim()) jobs.push({ text, set });
  };

  const i18n = { ...((row.i18n as Json) ?? {}) } as Json;
  const ko = (i18n.ko ?? {}) as Record<string, string>;
  const en = { ...((i18n.en ?? {}) as Record<string, string>) };
  push(ko.name, (v) => { en.name = v; });
  push(ko.summary, (v) => { en.summary = v; });
  i18n.en = en;

  const prices = (Array.isArray(row.prices) ? row.prices : []).map((raw) => {
    const price = raw as Json;
    const pI18n = { ...((price.i18n as Json) ?? {}) } as Json;
    const pKo = (pI18n.ko ?? {}) as Record<string, string>;
    const pEn = { ...((pI18n.en ?? {}) as Record<string, string>) };
    push(pKo.label, (v) => { pEn.label = v; });
    push(pKo.note, (v) => { pEn.note = v; });
    pI18n.en = pEn;
    return { ...price, i18n: pI18n };
  });

  const blocks = (Array.isArray(row.blocks) ? row.blocks : []).map((raw) => {
    const block = raw as Json;
    const bI18n = { ...((block.i18n as Json) ?? {}) } as Json;
    const bKo = (bI18n.ko ?? {}) as Record<string, unknown>;
    const bEn = { ...((bI18n.en ?? {}) as Record<string, unknown>) };

    push(bKo.title as string | undefined, (v) => { bEn.title = v; });

    if (Array.isArray(bKo.items)) {
      const items = [...(bKo.items as string[])];
      (bKo.items as string[]).forEach((item, index) =>
        push(item, (v) => { items[index] = v; })
      );
      bEn.items = items;
    }

    if (Array.isArray(bKo.qna)) {
      const qna = (bKo.qna as { q: string; a: string }[]).map((pair) => ({ ...pair }));
      (bKo.qna as { q: string; a: string }[]).forEach((pair, index) => {
        push(pair.q, (v) => { qna[index].q = v; });
        push(pair.a, (v) => { qna[index].a = v; });
      });
      bEn.qna = qna;
    }

    if (bKo.captions && typeof bKo.captions === "object") {
      const captions = { ...(bKo.captions as Record<string, string>) };
      Object.entries(bKo.captions as Record<string, string>).forEach(([key, value]) =>
        push(value, (v) => { captions[key] = v; })
      );
      bEn.captions = captions;
    }

    // richtext의 html은 건드리지 않는다. 평문 번역 엔드포인트가 태그와
    // 이미지 주소를 망가뜨리기 때문이다. 영어가 비면 공개 화면이 한국어로
    // 폴백하므로 그대로 두는 편이 낫다.

    bI18n.en = bEn;
    return { ...block, i18n: bI18n };
  });

  return {
    table: "services",
    id: row.id as string,
    jobs,
    payload: () => ({ i18n, prices, blocks }),
  };
}

export async function POST(request: NextRequest) {
  const denied = await requireAdminRequest(request);
  if (denied) return denied;

  const body = await request.json().catch(() => ({}));
  const cursor = Number.isInteger(body?.cursor) ? Math.max(0, body.cursor) : 0;
  const limit = Number.isInteger(body?.limit) ? Math.min(20, Math.max(1, body.limit)) : DEFAULT_LIMIT;

  const supabase = getServiceClient();
  const [catRes, subRes, svcRes] = await Promise.all([
    supabase.from("service_categories").select("id,i18n").order("id"),
    supabase.from("service_subcategories").select("id,i18n").order("id"),
    supabase.from("services").select("id,i18n,prices,blocks").order("id"),
  ]);

  const firstError = catRes.error || subRes.error || svcRes.error;
  if (firstError) {
    if (isMissingTableError(firstError)) {
      return NextResponse.json({ processed: 0, nextCursor: null, total: 0, setupRequired: true });
    }
    return NextResponse.json({ error: firstError.message }, { status: 500 });
  }

  // 커서가 가리키는 위치가 호출 사이에 흔들리지 않도록 id 순으로 고정한다
  const plans: Plan[] = [
    ...(catRes.data ?? []).map((row) => planTaxonomy("service_categories", row as Json)),
    ...(subRes.data ?? []).map((row) => planTaxonomy("service_subcategories", row as Json)),
    ...(svcRes.data ?? []).map((row) => planService(row as Json)),
  ];

  const slice = plans.slice(cursor, cursor + limit);
  if (slice.length === 0) {
    return NextResponse.json({ processed: 0, nextCursor: null, total: plans.length });
  }

  const jobs = slice.flatMap((plan) => plan.jobs);
  if (jobs.length > 0) {
    const translated = await translateTexts(jobs.map((job) => job.text), "ko", "en");
    // 수집과 반영이 같은 배열 순서를 쓰므로 어긋날 수 없다
    jobs.forEach((job, index) => job.set(translated[index]));
  }

  for (const plan of slice) {
    const { error } = await supabase.from(plan.table).update(plan.payload()).eq("id", plan.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextCursor = cursor + slice.length;
  return NextResponse.json({
    processed: slice.length,
    nextCursor: nextCursor >= plans.length ? null : nextCursor,
    total: plans.length,
  });
}
