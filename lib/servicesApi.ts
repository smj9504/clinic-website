"use client";

/**
 * 관리자용 시술 카탈로그 변경 API
 *
 * site_data는 updateSiteData()로 통째로 저장하지만, 시술은 전용 테이블이라
 * 항목 단위로 요청한다. 실패 시 기존 관리자 레이아웃과 같은
 * "siteDataSaveError" 이벤트를 쏘아 오류 토스트를 그대로 재사용한다.
 */

import type { Service, ServiceCategory, ServiceSubcategory } from "./services";

export type TaxonomyKind = "category" | "subcategory";

function notifyError(message: string) {
  window.dispatchEvent(new CustomEvent("siteDataSaveError", { detail: message }));
}

function headers(withBody: boolean): Record<string, string> {
  const password = sessionStorage.getItem("clinic_admin_pw") ?? "";
  return {
    "x-admin-password": password,
    ...(withBody ? { "content-type": "application/json" } : {}),
  };
}

async function request<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: headers(body !== undefined),
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      notifyError(
        res.status === 401
          ? "인증이 만료되었습니다. 다시 로그인해 주세요."
          : json?.error ?? `저장 실패 (${res.status})`
      );
      return null;
    }
    return json as T;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    notifyError(`네트워크 오류로 저장에 실패했습니다. (${message})`);
    return null;
  }
}

// ─── 시술 ───

export async function createService(draft: Partial<Service>): Promise<Service | null> {
  const res = await request<{ service: Service }>("/api/services", "POST", { service: draft });
  return res?.service ?? null;
}

export async function updateService(
  id: string,
  patch: Partial<Service>
): Promise<Service | null> {
  const res = await request<{ service: Service }>(
    `/api/services/${encodeURIComponent(id)}`,
    "PUT",
    { service: patch }
  );
  return res?.service ?? null;
}

export async function deleteService(id: string): Promise<boolean> {
  const res = await request<{ success: boolean }>(
    `/api/services/${encodeURIComponent(id)}`,
    "DELETE"
  );
  return res?.success === true;
}

/** 순서 변경·숨김 토글처럼 여러 건을 한 번에 고칠 때 */
export async function patchServices(
  updates: (Partial<Service> & { id: string })[]
): Promise<boolean> {
  if (updates.length === 0) return true;
  const res = await request<{ success: boolean }>("/api/services", "PATCH", { updates });
  return res?.success === true;
}

// ─── 카테고리 · 서브카테고리 ───

export async function createCategory(
  data: Partial<ServiceCategory>
): Promise<ServiceCategory | null> {
  const res = await request<{ category: ServiceCategory }>(
    "/api/service-categories",
    "POST",
    { kind: "category", data }
  );
  return res?.category ?? null;
}

export async function createSubcategory(
  data: Partial<ServiceSubcategory>
): Promise<ServiceSubcategory | null> {
  const res = await request<{ subcategory: ServiceSubcategory }>(
    "/api/service-categories",
    "POST",
    { kind: "subcategory", data }
  );
  return res?.subcategory ?? null;
}

export async function patchTaxonomy(
  kind: TaxonomyKind,
  updates: (Partial<ServiceCategory & ServiceSubcategory> & { id: string })[]
): Promise<boolean> {
  if (updates.length === 0) return true;
  const res = await request<{ success: boolean }>("/api/service-categories", "PATCH", {
    kind,
    updates,
  });
  return res?.success === true;
}

export type DeleteTaxonomyResult = {
  removedSubcategories: number;
  removedServices: number;
};

export async function deleteTaxonomy(
  kind: TaxonomyKind,
  id: string
): Promise<DeleteTaxonomyResult | null> {
  const res = await request<{ success: boolean } & DeleteTaxonomyResult>(
    `/api/service-categories?kind=${kind}&id=${encodeURIComponent(id)}`,
    "DELETE"
  );
  return res?.success ? { removedSubcategories: res.removedSubcategories, removedServices: res.removedServices } : null;
}
