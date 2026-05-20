-- site_data: 사이트 콘텐츠를 언어별로 저장하는 테이블
CREATE TABLE IF NOT EXISTS site_data (
  locale TEXT PRIMARY KEY,        -- 'ko' | 'en'
  data   JSONB NOT NULL,          -- SiteData 전체 JSON
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 누구나 읽기 가능, 서비스 키로만 쓰기
ALTER TABLE site_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read site_data"
  ON site_data FOR SELECT
  USING (true);

CREATE POLICY "Service role can write site_data"
  ON site_data FOR ALL
  USING (true)
  WITH CHECK (true);
