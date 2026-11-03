-- 관리자 비밀번호 시도 횟수 제한 기록 (2026-11)
-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- (supabase-schema.sql 9번과 같은 내용입니다)
--
-- 틀린 비밀번호 시도를 기록해 15분 안에 같은 IP에서 서로 다른 비밀번호 5개,
-- 전체 30개가 틀리면 관리자 로그인을 잠시 막는다(lib/loginGuard.ts).
-- 비밀번호 자체는 저장하지 않고 HMAC 앞 16자리만 남기며, 기록은 24시간 뒤 지운다.
-- 실행 전에도 관리자 로그인은 되고, 그동안은 서버 메모리로 횟수를 센다.

create table if not exists admin_login_failures (
  id          bigint generated always as identity primary key,
  ip          text not null,
  fingerprint text not null,
  created_at  timestamptz not null default now()
);

create index if not exists admin_login_failures_created_at_idx on admin_login_failures(created_at desc);
create index if not exists admin_login_failures_ip_idx on admin_login_failures(ip, created_at desc);

-- RLS: 정책 없음 = 브라우저의 공개 키로는 읽기·쓰기 불가. 서버(service role)만 접근.
alter table admin_login_failures enable row level security;

notify pgrst, 'reload schema';

-- 확인용: 아래 결과에 rowsecurity = true 한 줄이 나와야 한다.
select tablename, rowsecurity from pg_tables where tablename = 'admin_login_failures';
