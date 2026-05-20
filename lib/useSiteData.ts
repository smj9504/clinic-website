"use client";

import { useEffect, useState } from "react";
import { getSiteData, getDefaultSiteData, type SiteData } from "./storage";
import { useLocale, type Locale } from "./i18n";

/**
 * 사이트 데이터 구독 Hook (다국어 지원)
 * - 현재 locale에 맞는 데이터 반환
 * - Admin에서 변경 시 자동으로 모든 페이지에 반영
 * - SSR 시에는 defaultSiteData 사용 (hydration mismatch 방지)
 */
export function useSiteData(): SiteData {
  const { locale } = useLocale();
  const [data, setData] = useState<SiteData>(getDefaultSiteData("ko"));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(getSiteData(locale));
    setHydrated(true);

    const onUpdate = () => setData(getSiteData(locale));
    window.addEventListener("siteDataUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("siteDataUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [locale]);

  return hydrated ? data : getDefaultSiteData("ko");
}

/**
 * Admin용: 특정 locale의 데이터를 직접 조회하는 Hook
 */
export function useSiteDataForLocale(locale: Locale): SiteData {
  const [data, setData] = useState<SiteData>(getDefaultSiteData(locale));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setData(getSiteData(locale));
    setHydrated(true);

    const onUpdate = () => setData(getSiteData(locale));
    window.addEventListener("siteDataUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("siteDataUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [locale]);

  return hydrated ? data : getDefaultSiteData(locale);
}
