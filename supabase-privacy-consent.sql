-- 상담 신청 동의 기록 컬럼 추가 (2026-11)
-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- (supabase-schema.sql 8번과 같은 내용입니다)

alter table reservation_requests
  add column if not exists privacy_agreed_at   timestamptz,
  add column if not exists sensitive_agreed_at timestamptz,
  add column if not exists consent_version     text;

-- PostgREST가 새 컬럼을 바로 인식하도록 스키마 캐시를 새로 고친다
notify pgrst, 'reload schema';

-- 확인용: 아래 결과에 세 컬럼이 나와야 한다.
select column_name, data_type from information_schema.columns
where table_name = 'reservation_requests'
  and column_name in ('privacy_agreed_at', 'sensitive_agreed_at', 'consent_version');
