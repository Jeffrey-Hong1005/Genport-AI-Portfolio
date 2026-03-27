import { NextRequest, NextResponse } from 'next/server';

const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';

// ──────────────────────────────────────────────
// 인메모리 토큰 캐시 (Next.js 서버 재시작 시 초기화)
// ──────────────────────────────────────────────
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const appKey = process.env.KIS_APP_KEY;
  const appSecret = process.env.KIS_APP_SECRET;

  if (!appKey || !appSecret) {
    throw new Error('KIS_APP_KEY 또는 KIS_APP_SECRET이 .env.local에 설정되지 않았습니다.');
  }

  console.log('[KIS] 새 액세스 토큰 요청 중...');

  const res = await fetch(`${KIS_BASE_URL}/oauth2/tokenP`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=UTF-8' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`KIS 토큰 발급 실패: ${res.status} - ${errText}`);
  }

  const data = await res.json();

  if (!data.access_token) {
    throw new Error(`KIS 토큰 없음: ${JSON.stringify(data)}`);
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (Number(data.expires_in) - 300) * 1000,
  };

  console.log('[KIS] 토큰 발급 완료, 만료까지:', Math.round((tokenCache.expiresAt - Date.now()) / 60000), '분');
  return tokenCache.token;
}

// ──────────────────────────────────────────────
// 투자 신호 태그 계산
// ──────────────────────────────────────────────
function calcSignals(
  currentPrice: number,
  high52w: number,
  low52w: number,
  per: number,
  pbr: number,
  foreignRate: number,
  changeRate: number,
): { position52w: number; signals: string[] } {
  const position52w =
    high52w > low52w
      ? Math.round(((currentPrice - low52w) / (high52w - low52w)) * 100)
      : 50;

  const signals: string[] = [];

  // 52주 위치 신호
  if (position52w <= 20) signals.push('52주_바닥권');
  else if (position52w >= 80) signals.push('52주_고점권');

  // 밸류에이션 신호
  if (per > 0 && per < 12) signals.push('저PER_가치주');
  else if (per > 35) signals.push('고PER_성장주');
  if (pbr > 0 && pbr < 1.0) signals.push('PBR<1_자산저평가');

  // 외국인 수급 신호
  if (foreignRate >= 50) signals.push('외국인고소진율');
  else if (foreignRate <= 10) signals.push('외국인저소진율_여력있음');

  // 단기 가격 모멘텀
  if (changeRate >= 4) signals.push('단기급등');
  else if (changeRate <= -4) signals.push('단기급락_역발상고려');

  return { position52w, signals };
}

// ──────────────────────────────────────────────
// 단일 종목 현재가 조회 (주식현재가 시세)
// ──────────────────────────────────────────────
async function fetchStockPrice(stockCode: string, token: string) {
  const appKey = process.env.KIS_APP_KEY!;
  const appSecret = process.env.KIS_APP_SECRET!;

  const tryFetch = async (mktCode: string) => {
    const url = `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-price?FID_COND_MRKT_DIV_CODE=${mktCode}&FID_INPUT_ISCD=${stockCode}`;
    return fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        appkey: appKey,
        appsecret: appSecret,
        tr_id: 'FHKST01010100',
        custtype: 'P',
      },
    });
  };

  let res = await tryFetch('J');
  let data = await res.json();

  if (data.rt_cd !== '0') {
    res = await tryFetch('Q');
    data = await res.json();
  }

  if (data.rt_cd !== '0') {
    console.warn(`[KIS] ${stockCode} 조회 실패: ${data.msg1}`);
    return null;
  }

  const o = data.output;

  const currentPrice = parseInt(o.stck_prpr || '0');
  const high52w = parseInt(o.d250_hgpr || '0');
  const low52w = parseInt(o.d250_lwpr || '0');
  const per = parseFloat(o.per || '0');
  const pbr = parseFloat(o.pbr || '0');
  const foreignRate = parseFloat(o.hts_frgn_ehrt || '0');
  const changeRate = parseFloat(o.prdy_ctrt || '0');

  const { position52w, signals } = calcSignals(
    currentPrice, high52w, low52w, per, pbr, foreignRate, changeRate,
  );

  return {
    stockCode,
    currentPrice,
    changeRate,
    changeAmount: parseInt(o.prdy_vrss || '0'),
    changeSign: o.prdy_vrss_sign || '3',
    marketCap: parseInt(o.hts_avls || '0'),
    per,
    pbr,
    eps: parseFloat(o.eps || '0'),
    volume: parseInt(o.acml_vol || '0'),
    openPrice: parseInt(o.stck_oprc || '0'),
    highPrice: parseInt(o.stck_hgpr || '0'),
    lowPrice: parseInt(o.stck_lwpr || '0'),
    high52w,
    low52w,
    foreignRate,
    position52w,   // 52주 위치 (%)
    signals,       // 투자 신호 태그 배열
  };
}

// ──────────────────────────────────────────────
// 투자자별 매매동향 (외국인/기관 당일 순매수)
// FHKST03010100: 주식현재가 투자자 (당일 투자자별 거래량)
// ──────────────────────────────────────────────
async function fetchInvestorTrend(stockCode: string, token: string) {
  const appKey = process.env.KIS_APP_KEY!;
  const appSecret = process.env.KIS_APP_SECRET!;

  const tryFetch = async (mktCode: string) => {
    const params = new URLSearchParams({
      FID_COND_MRKT_DIV_CODE: mktCode,
      FID_INPUT_ISCD: stockCode,
    });
    return fetch(
      `${KIS_BASE_URL}/uapi/domestic-stock/v1/quotations/inquire-investor?${params}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          appkey: appKey,
          appsecret: appSecret,
          tr_id: 'FHKST03010100',
          custtype: 'P',
        },
      },
    );
  };

  let res = await tryFetch('J');
  let data = await res.json();
  if (data.rt_cd !== '0') {
    res = await tryFetch('Q');
    data = await res.json();
  }
  if (data.rt_cd !== '0') {
    // 조회 실패 시 조용히 null 반환 (로그 레벨 낮춤)
    return null;
  }

  const output = data.output || {};

  // 외국인/기관 당일 순매수 수량
  const foreignNetBuy = parseInt(output.frgn_ntby_qty || '0');
  const institutionNetBuy = parseInt(output.orgn_ntby_qty || '0');

  const dailyTrend: any[] = [];

  // 당일 수급 추세 판단
  const foreignTrend =
    foreignNetBuy > 0 ? '외국인_당일순매수' : foreignNetBuy < 0 ? '외국인_당일순매도' : '외국인_중립';
  const institutionTrend =
    institutionNetBuy > 0
      ? '기관_당일순매수'
      : institutionNetBuy < 0
        ? '기관_당일순매도'
        : '기관_중립';

  return {
    stockCode,
    foreignNetBuy5d: foreignNetBuy,
    institutionNetBuy5d: institutionNetBuy,
    foreignTrend,
    institutionTrend,
    dailyTrend,
  };
}

// ──────────────────────────────────────────────
// POST 핸들러
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { type, stockCode, stockCodes } = await req.json();

    if (!process.env.KIS_APP_KEY || !process.env.KIS_APP_SECRET) {
      return NextResponse.json(
        { error: 'KIS API 키가 설정되지 않았습니다. .env.local을 확인하세요.' },
        { status: 500 }
      );
    }

    const token = await getAccessToken();

    // 단일 종목 현재가
    if (type === 'price' && stockCode) {
      const price = await fetchStockPrice(stockCode, token);
      if (!price) {
        return NextResponse.json({ error: `${stockCode} 종목 조회 실패` }, { status: 404 });
      }
      return NextResponse.json(price);
    }

    // 복수 종목 일괄 현재가
    if (type === 'prices' && Array.isArray(stockCodes) && stockCodes.length > 0) {
      const results: any[] = [];
      for (const code of stockCodes) {
        try {
          const price = await fetchStockPrice(code, token);
          if (price) results.push(price);
          await new Promise((r) => setTimeout(r, 120));
        } catch (e) {
          console.warn(`[KIS] ${code} 가격 조회 실패:`, e);
        }
      }
      return NextResponse.json({ prices: results });
    }

    // 단일 종목 투자자별 매매동향
    if (type === 'investor_trend' && stockCode) {
      const trend = await fetchInvestorTrend(stockCode, token);
      if (!trend) {
        return NextResponse.json({ error: `${stockCode} 투자자 동향 조회 실패` }, { status: 404 });
      }
      return NextResponse.json(trend);
    }

    // 복수 종목 투자자별 매매동향 일괄 조회
    if (type === 'investor_trends' && Array.isArray(stockCodes) && stockCodes.length > 0) {
      const results: any[] = [];
      for (const code of stockCodes) {
        try {
          const trend = await fetchInvestorTrend(code, token);
          if (trend) results.push(trend);
          await new Promise((r) => setTimeout(r, 200)); // 투자자 동향은 좀 더 여유롭게
        } catch (e) {
          console.warn(`[KIS] ${code} 투자자 동향 조회 실패:`, e);
        }
      }
      return NextResponse.json({ trends: results });
    }

    return NextResponse.json(
      { error: 'type은 price | prices | investor_trend | investor_trends 중 하나여야 합니다.' },
      { status: 400 },
    );
  } catch (error: any) {
    console.error('[KIS API] 오류:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'KIS API 요청 실패' },
      { status: 500 }
    );
  }
}
