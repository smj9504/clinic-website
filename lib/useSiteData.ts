"use client";

import { useEffect, useState } from "react";
import { getSiteData, fetchSiteData, getDefaultSiteData, type SiteData } from "./storage";
import { useLocale, type Locale } from "./i18n";

/**
 * 사이트 데이터 구독 Hook (Supabase DB 연동)
 * 1. 초기: 캐시(localStorage)에서 동기 로드
 * 2. 마운트 후: DB에서 최신 데이터 비동기 fetch → 캐시 갱신
 * 3. Admin 수정 시: siteDataUpdated 이벤트로 즉시 반영
 */
export function useSiteData(): SiteData & { hydrated: boolean } {
  const { locale } = useLocale();
  const [data, setData] = useState<SiteData>(getDefaultSiteData("ko"));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // 1) 캐시에서 즉시 로드
    setData(getSiteData(locale));
    setHydrated(true);

    // 2) DB에서 최신 데이터 fetch
    fetchSiteData(locale).then((fresh) => {
      setData(fresh);
    });

    // 3) Admin 수정 이벤트 구독
    const onUpdate = () => {
      setData(getSiteData(locale));
    };
    window.addEventListener("siteDataUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("siteDataUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [locale]);

  const resolved = hydrated ? data : getDefaultSiteData("ko");
  return { ...resolved, hydrated };
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

    fetchSiteData(locale).then((fresh) => {
      setData(fresh);
    });

    const onUpdate = () => {
      setData(getSiteData(locale));
    };
    window.addEventListener("siteDataUpdated", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("siteDataUpdated", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, [locale]);

  return hydrated ? data : getDefaultSiteData(locale);
}
