-- site_data: 사이트 콘텐츠를 언어별로 저장하는 테이블
CREATE TABLE IF NOT EXISTS site_data (
  locale TEXT PRIMARY KEY,        -- 'ko' | 'en' (관리자 설정용 '_config' row도 여기 있다)
  data   JSONB NOT NULL,          -- SiteData 전체 JSON
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 공개 콘텐츠(ko·en)만 누구나 읽기 가능.
-- '_config' row(관리자 비밀번호 해시)는 읽을 수 없다.
-- 쓰기 정책은 일부러 두지 않는다 — service role은 RLS를 우회하므로 정책이 필요 없고,
-- 정책을 만들면 브라우저에 노출되는 anon 키에도 함께 열리기 때문이다.
-- (이미 설치된 DB는 supabase-security-fix.sql을 실행해 정책을 바꾼다.)
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read site content" ON site_data;
CREATE POLICY "Public can read site content"
  ON site_data FOR SELECT
  USING (locale IN ('ko', 'en'));
