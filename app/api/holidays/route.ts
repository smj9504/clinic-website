import { NextRequest, NextResponse } from "next/server";

export type HolidayItem = {
  name: string;
  date: string; // YYYY-MM-DD
  isHoliday: boolean;
};

/**
 * 공공데이터포털 한국천문연구원 특일 정보 API 프록시
 * GET /api/holidays?year=2026&month=06
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get("year");
  const month = searchParams.get("month");

  if (!year || !month) {
    return NextResponse.json(
      { error: "year와 month 파라미터가 필요합니다." },
      { status: 400 }
    );
  }

  // 외부 API 주소에 그대로 붙이므로 숫자 형식만 받는다 (다른 파라미터를 끼워 넣지 못하게)
  const y = Number(year);
  const m = Number(month);
  if (!/^\d{4}$/.test(year) || !/^\d{1,2}$/.test(month) || y < 2000 || y > 2100 || m < 1 || m > 12) {
    return NextResponse.json({ error: "year는 2000~2100, month는 1~12로 입력해 주세요." }, { status: 400 });
  }
  const solMonth = String(m).padStart(2, "0");

  const apiKey = process.env.HOLIDAY_API_KEY;
  if (!apiKey || apiKey === "YOUR_API_KEY_HERE") {
    console.error("[holidays] HOLIDAY_API_KEY가 설정되지 않았습니다");
    return NextResponse.json({ error: "공휴일 정보를 불러오지 못했습니다." }, { status: 503 });
  }

  try {
    // serviceKey는 이미 인코딩된 값일 수 있으므로 직접 문자열로 조합 (이중 인코딩 방지)
    const baseUrl =
      "https://apis.data.go.kr/B090041/openapi/service/SpcdeInfoService/getRestDeInfo";
    const queryString =
      `serviceKey=${apiKey}&solYear=${y}&solMonth=${solMonth}&_type=json&numOfRows=30`;
    const fullUrl = `${baseUrl}?${queryString}`;

    const res = await fetch(fullUrl, { next: { revalidate: 86400 } });

    if (!res.ok) {
      console.error(`[holidays] 공휴일 API 응답 ${res.status}`);
      return NextResponse.json({ error: "공휴일 정보를 불러오지 못했습니다." }, { status: 502 });
    }

    const data = await res.json();

    const body = data?.response?.body;
    if (!body) {
      console.error("[holidays] 공휴일 API 응답 형식 오류:", JSON.stringify(data).slice(0, 500));
      return NextResponse.json({ error: "공휴일 정보를 불러오지 못했습니다." }, { status: 502 });
    }

    // items가 없으면 해당 월에 공휴일 없음
    if (body.totalCount === 0 || !body.items) {
      return NextResponse.json({ holidays: [] });
    }

    // 단일 항목이면 배열로 감싸기
    const rawItems = Array.isArray(body.items.item)
      ? body.items.item
      : [body.items.item];

    const holidays: HolidayItem[] = rawItems.map(
      (item: { dateName: string; locdate: number; isHoliday: string }) => {
        const loc = String(item.locdate);
        const dateStr = `${loc.slice(0, 4)}-${loc.slice(4, 6)}-${loc.slice(6, 8)}`;
        return {
          name: item.dateName,
          date: dateStr,
          isHoliday: item.isHoliday === "Y",
        };
      }
    );

    return NextResponse.json({ holidays });
  } catch (err) {
    console.error("[holidays] 공휴일 API 요청 오류:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "공휴일 정보를 불러오지 못했습니다." }, { status: 502 });
  }
}
