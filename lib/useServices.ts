"use client";

/**
 * 시술 카탈로그 조회 Hook
 *
 * site_data(useSiteData)와 달리 시술은 전용 API에서 가져온다.
 * 목록 응답에는 상세(blocks)가 빠져 있어, 목록 화면이 상세 본문까지
 * 내려받는 일이 없다.
 *
 * 다국어 텍스트는 레코드마다 i18n으로 들어 있으므로 언어를 바꿔도
 * 다시 요청하지 않는다 — 화면에서 pickText로 고르기만 하면 된다.
 */

import { useCallback, useEffect, useState } from "react";
import type {
  Service,
  ServiceCatalog,
  ServiceCategory,
  ServiceSubcategory,
} from "./services";

const EMPTY: ServiceCatalog = { categories: [], subcategories: [], services: [] };

/** 관리자 화면에서 숨김 항목까지 조회할 때만 쓰인다 */
function adminHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const password = sessionStorage.getItem("clinic_admin_pw");
  return password ? { "x-admin-password": password } : {};
}

export type CatalogState = ServiceCatalog & {
  loading: boolean;
  /** supabase-services.sql을 아직 실행하지 않은 상태 */
  setupRequired: boolean;
  error: string | null;
  reload: () => void;
};

export function useServiceCatalog({ includeHidden = false } = {}): CatalogState {
  const [data, setData] = useState<ServiceCatalog>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [setupRequired, setSetupRequired] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetch(includeHidden ? "/api/services?includeHidden=1" : "/api/services", {
        cache: "no-store",
        headers: includeHidden ? adminHeaders() : undefined,
        signal,
      });
      const json = await res.json();
      if (signal?.aborted) return;
      if (!res.ok) {
        setError(json?.error ?? `조회 실패 (${res.status})`);
        setData(EMPTY);
        return;
      }
      setError(null);
      setSetupRequired(json.setupRequired === true);
      setData({
        categories: (json.categories ?? []) as ServiceCategory[],
        subcategories: (json.subcategories ?? []) as ServiceSubcategory[],
        services: (json.services ?? []) as Service[],
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") return;
      setError("네트워크 오류로 시술 정보를 불러오지 못했습니다.");
      setData(EMPTY);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [includeHidden]);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  // 호출부가 의존성 배열에 넣어도 안전하도록 참조를 고정한다
  const reload = useCallback(() => {
    load();
  }, [load]);

  return { ...data, loading, setupRequired, error, reload };
}

export type ServiceDetailState = {
  service: Service | null;
  subcategory: ServiceSubcategory | null;
  category: ServiceCategory | null;
  loading: boolean;
  /** 없는 시술이거나, 숨김·기간 밖이라 공개되지 않는 시술 */
  notFound: boolean;
  error: string | null;
};

export function useService(id: string | undefined, { includeHidden = false } = {}): ServiceDetailState {
  const [state, setState] = useState<Omit<ServiceDetailState, "loading">>({
    service: null,
    subcategory: null,
    category: null,
    notFound: false,
    error: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setState((p) => ({ ...p, notFound: true }));
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    (async () => {
      try {
        const url = `/api/services/${encodeURIComponent(id)}${includeHidden ? "?includeHidden=1" : ""}`;
        const res = await fetch(url, {
          cache: "no-store",
          headers: includeHidden ? adminHeaders() : undefined,
          signal: controller.signal,
        });
        if (controller.signal.aborted) return;

        if (res.status === 404) {
          setState({ service: null, subcategory: null, category: null, notFound: true, error: null });
          return;
        }
        const json = await res.json();
        if (controller.signal.aborted) return;
        if (!res.ok) {
          setState({
            service: null,
            subcategory: null,
            category: null,
            notFound: false,
            error: json?.error ?? `조회 실패 (${res.status})`,
          });
          return;
        }
        setState({
          service: json.service ?? null,
          subcategory: json.subcategory ?? null,
          category: json.category ?? null,
          notFound: false,
          error: null,
        });
      } catch (err) {
        if ((err as Error)?.name === "AbortError") return;
        setState({
          service: null,
          subcategory: null,
          category: null,
          notFound: false,
          error: "네트워크 오류로 시술 정보를 불러오지 못했습니다.",
        });
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    })();

    return () => controller.abort();
  }, [id, includeHidden]);

  return { ...state, loading };
}
