-- ─────────────────────────────────────────────────────────────
-- 예약 신청 스키마
--
-- 병원 예약 시스템이 병원 내부망(설치형)에서만 돌아가 홈페이지 서버가
-- 직접 호출할 수 없다. 그래서 홈페이지는 "확정 예약"이 아니라
-- "예약 신청"만 접수해 여기 저장하고, 병원 직원이 관리자 화면에서
-- 확인한 뒤 병원 시스템에 직접 입력하는 방식으로 운영한다.
--
-- 사용법: Supabase SQL Editor에 붙여넣고 실행. 여러 번 실행해도 안전하다.
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

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
