-- ─────────────────────────────────────────────────────────────
-- 시술 카탈로그 스키마
--
-- site_data(JSONB 블롭)와 달리 시술은 전용 테이블에 저장한다.
--   · 시술 하나를 고칠 때 사이트 전체 JSON을 다시 쓰지 않는다
--   · 목록 조회 시 무거운 상세(blocks)를 SELECT에서 뺄 수 있다
--   · 다국어 텍스트를 레코드마다 i18n으로 들고 있어 배열 인덱스가 밀릴 일이 없다
--
-- 계층·순서·노출 여부처럼 질의 대상인 것은 컬럼으로,
-- 항목마다 모양이 달라지는 것(가격 옵션·상세 블록·번역 텍스트)은 JSONB로 둔다.
--
-- 사용법: Supabase SQL Editor에 붙여넣고 실행. 여러 번 실행해도 안전하다.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── 카테고리 ───
create table if not exists service_categories (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  image       text not null default '',
  sort_order  int  not null default 0,
  is_hidden   boolean not null default false,
  -- { "ko": { "name": "리프팅", "description": "..." }, "en": { ... } }
  i18n        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ─── 서브카테고리 ───
create table if not exists service_subcategories (
  id          uuid primary key default gen_random_uuid(),
  category_id uuid not null references service_categories(id) on delete cascade,
  slug        text not null,
  sort_order  int  not null default 0,
  is_hidden   boolean not null default false,
  -- { "ko": { "name": "초음파·고주파" }, "en": { ... } }
  i18n        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (category_id, slug)
);

-- ─── 시술 ───
create table if not exists services (
  id              uuid primary key default gen_random_uuid(),
  subcategory_id  uuid not null references service_subcategories(id) on delete cascade,
  image           text not null default '',      -- 언어 공통. 번역해도 그대로 유지된다
  tag             text,                          -- 자유 라벨: "여성" · "1부위"
  badges          text[] not null default '{}',  -- NEW · HOT · BEST
  sale_start_date date,
  sale_end_date   date,
  sort_order      int  not null default 0,
  is_hidden       boolean not null default false,
  -- { "ko": { "name": "...", "summary": "..." }, "en": { ... } }
  i18n            jsonb not null default '{}'::jsonb,
  -- 가격 옵션. 1개든 5개든 같은 구조. 항상 시술과 함께 읽히므로 별도 테이블로 두지 않는다
  prices          jsonb not null default '[]'::jsonb,
  -- 상세 블록. 타입마다 필드가 달라 컬럼으로 펼 수 없다. 목록 조회 시 SELECT에서 제외한다
  blocks          jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists idx_subcat_by_category on service_subcategories (category_id, sort_order);
create index if not exists idx_services_by_subcat on services (subcategory_id, sort_order);

-- ─── updated_at 자동 갱신 ───
create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists t_service_categories_updated on service_categories;
create trigger t_service_categories_updated
  before update on service_categories
  for each row execute function set_updated_at();

drop trigger if exists t_service_subcategories_updated on service_subcategories;
create trigger t_service_subcategories_updated
  before update on service_subcategories
  for each row execute function set_updated_at();

drop trigger if exists t_services_updated on services;
create trigger t_services_updated
  before update on services
  for each row execute function set_updated_at();

-- ─── RLS ───
-- 공개된 항목의 읽기만 허용한다.
-- 쓰기 정책은 일부러 두지 않는다 — service role은 RLS를 우회하므로 정책이 필요 없고,
-- 정책을 만들면 브라우저에 노출되는 anon 키에도 함께 열리기 때문이다.
-- (관리자는 서버 API를 거치므로 숨김 항목까지 읽고 쓸 수 있다.)
alter table service_categories    enable row level security;
alter table service_subcategories enable row level security;
alter table services              enable row level security;

drop policy if exists "read visible service categories" on service_categories;
create policy "read visible service categories"
  on service_categories for select using (is_hidden = false);

drop policy if exists "read visible service subcategories" on service_subcategories;
create policy "read visible service subcategories"
  on service_subcategories for select using (is_hidden = false);

drop policy if exists "read visible services" on services;
create policy "read visible services"
  on services for select using (is_hidden = false);
