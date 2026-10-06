import type { MetadataRoute } from "next";
import { getServiceClient } from "@/lib/supabase";
import { todayKST } from "@/lib/date";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.gowoonbit-kmc.com";

/** 시술이 추가·수정되어도 하루 안에는 사이트맵에 반영된다 */
export const revalidate = 3600;

/**
 * 공개 중인 시술 상세 URL. 시술은 전용 테이블에 있어 서버에서 바로 조회할 수 있다.
 * DB를 못 읽어도(빌드 환경에 자격증명이 없거나 테이블 미생성) 사이트맵 생성이
 * 실패하면 안 되므로, 실패 시 정적 페이지만 내보낸다.
 */
async function serviceRoutes(): Promise<MetadataRoute.Sitemap> {
  try {
    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from("services")
      .select("id,updated_at,sale_start_date,sale_end_date,is_hidden")
      .eq("is_hidden", false);

    if (error || !data) return [];

    const today = todayKST();
    return data
      .filter((row) => {
        const start = row.sale_start_date as string | null;
        const end = row.sale_end_date as string | null;
        if (start && start > today) return false;
        if (end && end < today) return false;
        return true;
      })
      .map((row) => ({
        url: `${SITE_URL}/services/${row.id}`,
        lastModified: row.updated_at ? new Date(row.updated_at as string) : new Date(),
        changeFrequency: "monthly" as const,
        priority: 0.7,
      }));
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/services`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.95,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/treatments`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/events`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/community/notice`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/community/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  return [...staticPages, ...(await serviceRoutes())];
}
