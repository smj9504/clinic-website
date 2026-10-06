-- ═════════════════════════════════════════════════════════════
-- 클리닉 웹사이트 — 통합 스키마
--
-- 아래 개별 파일들을 실행 순서대로 하나로 합친 것이다. 새 배포 환경
-- (별도 Supabase 프로젝트)에서 이 파일 하나만 SQL Editor에 붙여넣고
-- 실행하면 전체 스키마가 한 번에 구성된다. 각 구간이 원래 어느 파일에서
-- 왔는지는 구간 제목에 표시해 두었다 — 개별 변경 이력을 추적할 때는
-- 그 파일을 참고할 것.
--
--   1) supabase-services.sql            — 시술 카탈로그
--   2) supabase-reservations.sql        — 예약 신청 (v1)
--   3) supabase-reservations-v2.sql     — 본인인증 · 시술 스냅샷 컬럼
--   4) supabase-sms-verifications.sql   — SMS 본인인증 테이블
--   5) supabase-reservations-v3.sql     — 시그마(한의원 내부 예약 시스템) 연동 컬럼
--
-- 모든 구문이 if not exists / or replace 기반이라 여러 번 실행해도
-- 안전하고, 이미 일부만 적용된 DB에도 그대로 실행해 나머지만 채울 수 있다.
-- ═════════════════════════════════════════════════════════════


-- ─────────────────────────────────────────────────────────────
-- 1) 시술 카탈로그 스키마 (supabase-services.sql)
--
-- site_data(JSONB 블롭)와 달리 시술은 전용 테이블에 저장한다.
--   · 시술 하나를 고칠 때 사이트 전체 JSON을 다시 쓰지 않는다
--   · 목록 조회 시 무거운 상세(blocks)를 SELECT에서 뺄 수 있다
--   · 다국어 텍스트를 레코드마다 i18n으로 들고 있어 배열 인덱스가 밀릴 일이 없다
--
-- 계층·순서·노출 여부처럼 질의 대상인 것은 컬럼으로,
-- 항목마다 모양이 달라지는 것(가격 옵션·상세 블록·번역 텍스트)은 JSONB로 둔다.
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


-- ─────────────────────────────────────────────────────────────
-- 2) 예약 신청 스키마 v1 (supabase-reservations.sql)
--
-- 병원 예약 시스템이 병원 내부망(설치형)에서만 돌아가 홈페이지 서버가
-- 직접 호출할 수 없었다. 그래서 홈페이지는 "확정 예약"이 아니라
-- "예약 신청"만 접수해 여기 저장하고, 병원 직원이 관리자 화면에서
-- 확인한 뒤 병원 시스템에 직접 입력하는 방식으로 운영했다.
-- (v3에서 시그마 연동으로 이 수기 입력을 대체한다 — 아래 5) 참고)
-- ─────────────────────────────────────────────────────────────

create table if not exists reservation_requests (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  phone            text not null,
  desired_date     date not null,
  desired_time     text not null default '',
  memo             text not null default '',
  status           text not null default 'pending', -- pending | confirmed | cancelled
  admin_note       text not null default '',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create index if not exists reservation_requests_status_idx on reservation_requests(status);
create index if not exists reservation_requests_created_at_idx on reservation_requests(created_at desc);

-- RLS: 아무도 클라이언트에서 직접 읽거나 쓰지 못한다.
-- 모든 접근은 서버(API 라우트)의 service role 키를 통해서만 이뤄진다.
alter table reservation_requests enable row level security;


-- ─────────────────────────────────────────────────────────────
-- 3) 예약 신청 스키마 v2 — 본인인증 · 시술 스냅샷 컬럼 (supabase-reservations-v2.sql)
--
-- 장바구니(체크박스로 선택한 시술) 기능과 SMS 본인인증 기능을 위해
-- reservation_requests 테이블에 컬럼을 추가한다.
--
--   phone_verified / phone_verified_at
--     예약 신청 시점에 SMS 본인인증을 통과했는지 여부와 시각.
--
--   selected_services
--     장바구니에서 선택한 시술 스냅샷 배열. 시술 원본 데이터(services 테이블)가
--     이후 바뀌어도 이 예약 신청 시점의 시술명·옵션명·가격이 그대로 보존되도록
--     memo(자유 텍스트, 사용자가 편집 가능)와 별도로 구조화 저장한다.
--     형태: [{ serviceId, priceId, serviceName, priceLabel, originalPrice, finalPrice }]
-- ─────────────────────────────────────────────────────────────

alter table reservation_requests
  add column if not exists phone_verified boolean not null default false,
  add column if not exists phone_verified_at timestamptz,
  add column if not exists selected_services jsonb not null default '[]'::jsonb;

create index if not exists reservation_requests_phone_verified_idx
  on reservation_requests(phone_verified);


-- ─────────────────────────────────────────────────────────────
-- 4) SMS 본인인증 스키마 (supabase-sms-verifications.sql)
--
-- 예약 신청 폼에서 휴대폰 본인인증(인증번호 발송→검증)에 쓰는 임시 테이블.
-- 인증번호는 짧은 TTL(3분)만 유효하며, 검증에 성공하면 verified_token을
-- 발급해 클라이언트가 이후 예약 제출 시 이 토큰을 함께 보내 서버가 재검증한다.
--
-- 인메모리(Map 등)가 아니라 테이블로 두는 이유: 이 프로젝트의 배포 환경은
-- 서버리스로 추정되며(getServiceClient()가 매 호출마다 새로 생성되는 패턴이
-- 이를 전제한다), 인증번호 발송 요청과 검증 요청이 서로 다른 함수 인스턴스에서
-- 처리될 수 있어 인메모리 상태로는 신뢰할 수 없다.
-- ─────────────────────────────────────────────────────────────

create table if not exists sms_verifications (
  id             uuid primary key default gen_random_uuid(),
  phone          text not null,
  code           text not null,           -- 6자리 인증번호. TTL 3분짜리 1회용 값이라 해시하지 않는다
  verified       boolean not null default false,
  verified_token text,                    -- 검증 성공 시 발급하는 1회용 랜덤 토큰 (예약 제출 시 제시)
  attempt_count  int not null default 0,  -- 오답 시도 횟수 (브루트포스 방지)
  expires_at     timestamptz not null,
  created_at     timestamptz not null default now()
);

create index if not exists sms_verifications_phone_idx on sms_verifications(phone);
create index if not exists sms_verifications_token_idx on sms_verifications(verified_token);

-- RLS: 아무도 클라이언트에서 직접 읽거나 쓰지 못한다. 서버(service role)만 접근.
alter table sms_verifications enable row level security;


-- ─────────────────────────────────────────────────────────────
-- 5) 예약 신청 스키마 v3 — 시그마 연동 컬럼 (supabase-reservations-v3.sql)
--
-- 관리자가 "확정 처리"를 누르면 시그마(한의원 내부 예약 시스템)의
-- POST /external/v2/reservations를 호출해 실제 병원 예약을 생성한다
-- (lib/sigma.ts 참고). 그 결과로 받은 reservation_uuid를 저장해 두어야,
-- 이후 이 신청이 시그마의 어느 예약과 연결됐는지 추적할 수 있다 —
-- 시그마 응답은 reservation_id(순번)는 내려주지 않고 reservation_uuid만
-- 정본 식별자로 준다.
-- ─────────────────────────────────────────────────────────────

alter table reservation_requests
  add column if not exists sigma_reservation_uuid text,
  add column if not exists sigma_reservation_dt text;

comment on column reservation_requests.sigma_reservation_uuid is
  '확정 처리 시 시그마 API가 반환한 reservation_uuid. 시그마 호출이 실패하면
   확정 처리 자체가 취소되므로, 이 값이 채워진 신청은 실제로 병원 시스템에
   예약이 생성된 것이 보장된다.';
comment on column reservation_requests.sigma_reservation_dt is
  '관리자가 확정 처리 시 직접 입력한 정확한 예약 일시("YYYY-MM-DD HH:MM").
   desired_date/desired_time(환자가 신청한 희망 일시, 대략적인 값)과 달리
   이 값은 실제로 시그마에 등록된 확정 시각이다.';


-- ─────────────────────────────────────────────────────────────
-- 6) 시술 ↔ 이벤트 연결 컬럼 (supabase-services-events.sql)
--
-- 이벤트(site_data JSONB 블롭의 events 배열, id는 number)와 시술
-- (services 테이블, id는 uuid)을 연결한다. 이벤트는 전용 테이블이
-- 없으므로 참조 무결성(FK)을 걸 수 없어 event_id를 그대로 정수
-- 배열에 담는다 — 관리자가 이벤트를 삭제하면 app/admin/events/page.tsx가
-- 남은 참조를 함께 정리한다.
--
-- 방향은 시술 → 이벤트다(반대가 아니라). "이 시술이 적용받는 이벤트"를
-- 시술 카드/상세에서 바로 알아야 하고, 목록 화면에서 "이벤트 적용 시술만
-- 보기" 필터가 하나의 컬럼 조건(event_ids <> '{}')으로 끝나기 때문이다.
-- ─────────────────────────────────────────────────────────────

alter table services
  add column if not exists event_ids integer[] not null default '{}';

create index if not exists idx_services_event_ids on services using gin (event_ids);


-- ─────────────────────────────────────────────────────────────
-- 7) 시그마 동기화 로그 (supabase-reservations-sync.sql)
--
-- 확정된 예약은 병원 직원이 시그마(병원 내부 시스템)에서 직접 취소하거나
-- 시간을 바꿀 수 있는데, 그 변경이 홈페이지 DB에는 자동으로 반영되지
-- 않는다. lib/reservationSync.ts가 주기적으로(진료시간 중 30분마다,
-- app/instrumentation.ts의 스케줄러) 또는 관리자의 수동 "지금 동기화"
-- 요청으로 시그마 조회 결과와 대조해 어긋난 상태를 바로잡는다. 이 표는
-- 그 실행 이력이다 — 예약 신청 자체의 이력이 아니라 "동기화를 언제,
-- 몇 건 돌렸고 무엇이 바뀌었는지"를 남긴다.
-- ─────────────────────────────────────────────────────────────

create table if not exists reservation_sync_log (
  id              uuid primary key default gen_random_uuid(),
  trigger         text not null,               -- 'scheduled' | 'manual'
  checked_count   int not null default 0,       -- 시그마와 대조한 확정 예약 수
  updated_count   int not null default 0,       -- 상태가 바뀐(주로 취소 감지) 예약 수
  error_count     int not null default 0,       -- 시그마 조회 실패 등으로 확인 못 한 건수
  details         jsonb not null default '[]',  -- [{reservationId, name, previousStatus, newStatus, reason}]
  created_at      timestamptz not null default now()
);

create index if not exists reservation_sync_log_created_at_idx on reservation_sync_log(created_at desc);

alter table reservation_sync_log enable row level security;
