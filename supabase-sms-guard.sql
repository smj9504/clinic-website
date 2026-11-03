-- 인증번호 문자 발송 한도용 접속 IP 기록 (2026-11)
-- Supabase 대시보드 → SQL Editor에서 한 번 실행하세요. 여러 번 실행해도 안전합니다.
-- (supabase-schema.sql 10번과 같은 내용입니다)
--
-- 인증번호 발송 기록에 접속 IP를 남겨, 같은 IP에서 10분 5회·하루 20회를 넘으면
-- 발송을 막는다(lib/smsGuard.ts). 번호당 하루 5회, 사이트 전체 10분 50회·하루 300회
-- 한도는 이 컬럼 없이도 동작한다. 기록은 24시간 뒤 지워진다(lib/retention.ts).

alter table sms_verifications add column if not exists ip text;

create index if not exists sms_verifications_created_at_idx on sms_verifications(created_at desc);
create index if not exists sms_verifications_ip_idx on sms_verifications(ip, created_at desc);

notify pgrst, 'reload schema';

-- 확인용: 아래 결과에 ip 한 줄이 나와야 한다.
select column_name, data_type from information_schema.columns
where table_name = 'sms_verifications' and column_name = 'ip';
