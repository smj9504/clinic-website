import { NextRequest, NextResponse } from "next/server";
import { getServiceClient } from "@/lib/supabase";
import { answerQuestion, getKnowledgeBase } from "@/lib/chatbot";
import { getDefaultSiteData, type SiteData } from "@/lib/storage";
import {
  isMissingTableError,
  toCategory,
  toService,
  toSubcategory,
  type CategoryRow,
  type ServiceCatalog,
  type ServiceRow,
  type SubcategoryRow,
} from "@/lib/services";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const MAX_QUESTION_LENGTH = 300;

async function loadContent(locale: Locale): Promise<{ site: SiteData; catalog: ServiceCatalog }> {
  const supabase = getServiceClient();
  const [siteRes, catRes, subRes, svcRes] = await Promise.all([
    supabase.from("site_data").select("data").eq("locale", locale).maybeSingle(),
    supabase.from("service_categories").select("*").order("sort_order"),
    supabase.from("service_subcategories").select("*").order("sort_order"),
    // 챗봇은 상세 블록(시술 안내·Q&A)까지 검색해야 하므로 blocks를 포함한다
    supabase.from("services").select("*").order("sort_order"),
  ]);

  if (siteRes.error) throw siteRes.error;
  let siteRow = siteRes.data?.data as Partial<SiteData> | undefined;
  // 영어 데이터를 아직 만들지 않았으면 한국어 내용으로라도 답한다
  if (!siteRow && locale !== "ko") {
    const ko = await supabase.from("site_data").select("data").eq("locale", "ko").maybeSingle();
    siteRow = ko.data?.data as Partial<SiteData> | undefined;
  }
  const site: SiteData = { ...getDefaultSiteData(locale), ...(siteRow ?? {}) };

  const catalogError = catRes.error || subRes.error || svcRes.error;
  if (catalogError && !isMissingTableError(catalogError)) throw catalogError;
  const catalog: ServiceCatalog = catalogError
    ? { categories: [], subcategories: [], services: [] }
    : {
        categories: ((catRes.data ?? []) as CategoryRow[]).map(toCategory),
        subcategories: ((subRes.data ?? []) as SubcategoryRow[]).map(toSubcategory),
        services: ((svcRes.data ?? []) as ServiceRow[]).map(toService),
      };

  return { site, catalog };
}

/**
 * POST /api/chat
 * Body: { question: string, locale?: "ko" | "en" }
 * 홈페이지에 게시된 내용(병원 정보·FAQ·시술·이벤트·공지·소개)에서 답을 찾아 돌려준다.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const question = typeof body?.question === "string" ? body.question.trim().slice(0, MAX_QUESTION_LENGTH) : "";
  const locale: Locale = body?.locale === "en" ? "en" : "ko";
  if (!question) {
    return NextResponse.json({ error: "question required" }, { status: 400 });
  }

  try {
    const kb = await getKnowledgeBase(locale, () => loadContent(locale));
    return NextResponse.json(answerQuestion(kb, question, locale));
  } catch (err) {
    console.error("[chat]", err);
    return NextResponse.json({ error: "failed to load site content" }, { status: 500 });
  }
}
