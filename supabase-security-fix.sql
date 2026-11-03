-- ─────────────────────────────────────────────────────────────
-- site_data 보안 수정 (2026-11)
--
-- 문제: 예전 supabase-setup.sql의 정책 두 개가 너무 넓었다.
--   1) "Anyone can read site_data"  — USING (true)
--      관리자 비밀번호가 든 "_config" row까지 anon 키로 읽을 수 있었다.
--   2) "Service role can write site_data" — 이름과 달리 대상 role을 지정하지 않아
--      anon을 포함한 모든 role에 쓰기(INSERT/UPDATE/DELETE)가 열려 있었다.
--      브라우저에 노출되는 anon 키만 있으면 사이트 내용과 관리자 비밀번호를
--      바꿀 수 있었다.
--
-- 수정: 공개 콘텐츠(ko·en) 읽기만 허용하고 쓰기 정책은 두지 않는다.
-- 서버 API는 service role 키를 쓰므로 RLS를 우회해 지금처럼 동작한다.
--
-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- ─────────────────────────────────────────────────────────────

alter table site_data enable row level security;

drop policy if exists "Anyone can read site_data" on site_data;
drop policy if exists "Service role can write site_data" on site_data;
drop policy if exists "Public can read site content" on site_data;

create policy "Public can read site content"
  on site_data for select
  using (locale in ('ko', 'en'));

-- 확인용: 아래 결과에 "Public can read site content" 한 줄만 나와야 한다.
select policyname, cmd, roles, qual from pg_policies where tablename = 'site_data';
