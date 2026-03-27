import { NextRequest, NextResponse } from 'next/server';
import { getByName } from '@/lib/company-database';

const OPENDART_API_KEY = process.env.OPENDART_API_KEY;
const BASE_URL = 'https://opendart.fss.or.kr/api';

// ──────────────────────────────────────────────
// OpenDart API 함수들
// ──────────────────────────────────────────────
async function getFinancialData(corpCode: string, year = '2023') {
  const url = `${BASE_URL}/fnlttSinglAcntAll.json?crtfc_key=${OPENDART_API_KEY}&corp_code=${corpCode}&bsns_year=${year}&reprt_code=11011&fs_div=CFS`;
  const res = await fetch(url);
  return res.json();
}

async function getCorpInfo(corpCode: string) {
  const url = `${BASE_URL}/company.json?crtfc_key=${OPENDART_API_KEY}&corp_code=${corpCode}`;
  const res = await fetch(url);
  return res.json();
}

async function getDisclosureList(corpCode: string) {
  const url = `${BASE_URL}/list.json?crtfc_key=${OPENDART_API_KEY}&corp_code=${corpCode}&bgn_de=20240101&page_count=5`;
  const res = await fetch(url);
  return res.json();
}

function extractFinancialMetrics(financialData: any) {
  if (!financialData?.list) return null;

  const items = financialData.list;
  const getAmount = (accountName: string) => {
    const item = items.find(
      (i: any) => i.account_nm?.includes(accountName) && i.fs_nm === '연결재무제표'
    );
    return item ? parseInt(item.thstrm_amount?.replace(/,/g, '') || '0') : 0;
  };

  const revenue = getAmount('매출액');
  const operatingProfit = getAmount('영업이익');
  const netIncome = getAmount('당기순이익');
  const totalLiabilities = getAmount('부채총계');
  const totalEquity = getAmount('자본총계');

  const debtRatio = totalEquity > 0 ? ((totalLiabilities / totalEquity) * 100).toFixed(1) : 'N/A';
  const roe = totalEquity > 0 ? ((netIncome / totalEquity) * 100).toFixed(1) : 'N/A';
  const operatingMargin = revenue > 0 ? ((operatingProfit / revenue) * 100).toFixed(1) : 'N/A';

  return {
    revenue: revenue > 0 ? `${(revenue / 1_000_000_000_000).toFixed(1)}조` : 'N/A',
    operatingProfit: operatingProfit > 0 ? `${(operatingProfit / 1_000_000_000_000).toFixed(1)}조` : 'N/A',
    netIncome: netIncome > 0 ? `${(netIncome / 1_000_000_000_000).toFixed(1)}조` : 'N/A',
    debtRatio: `${debtRatio}%`,
    roe: `${roe}%`,
    operatingMargin: `${operatingMargin}%`,
  };
}

// ──────────────────────────────────────────────
// POST 핸들러
// ──────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { type, companies: companyNames, query } = await req.json();

    if (!OPENDART_API_KEY) {
      return NextResponse.json({ error: 'OpenDart API key not configured' }, { status: 500 });
    }

    // 특정 회사들의 재무데이터 조회 (suggest-companies 결과 기반)
    if (type === 'companies_financials' && Array.isArray(companyNames)) {
      const results = [];

      for (const name of companyNames) {
        const info = getByName(name);
        if (!info?.corpCode) {
          results.push({ name, stockCode: info?.stockCode, metrics: null });
          continue;
        }

        try {
          const [corpInfo, financialData] = await Promise.all([
            getCorpInfo(info.corpCode),
            getFinancialData(info.corpCode),
          ]);
          const metrics = extractFinancialMetrics(financialData);
          results.push({
            name,
            corpCode: info.corpCode,
            stockCode: info.stockCode,
            sector: info.sector,
            market: info.market,
            listingMarket: corpInfo.stock_mkt || info.market,
            employees: corpInfo.emp_no || 'N/A',
            metrics,
          });
        } catch (e) {
          console.error(`[OpenDart] ${name} 조회 실패:`, e);
          results.push({ name, stockCode: info?.stockCode, metrics: null });
        }
      }

      const stockCodes = results.map((r) => r.stockCode).filter(Boolean) as string[];
      return NextResponse.json({ companies: results, stockCodes });
    }

    // 공시 조회 (Sentiment 분석용)
    if (type === 'disclosures') {
      const info = getByName(query);
      if (!info?.corpCode) {
        return NextResponse.json({ disclosures: [], message: '기업 corp_code 없음' });
      }

      const [disclosures, corpInfo] = await Promise.all([
        getDisclosureList(info.corpCode),
        getCorpInfo(info.corpCode),
      ]);

      return NextResponse.json({
        company: corpInfo,
        disclosures: disclosures.list || [],
      });
    }

    // 단일 기업 재무정보
    if (type === 'company_financials') {
      const info = getByName(query);
      const corpCode = info?.corpCode || query;

      const [corpInfo, financialData] = await Promise.all([
        getCorpInfo(corpCode),
        getFinancialData(corpCode),
      ]);

      return NextResponse.json({
        company: corpInfo,
        stockCode: info?.stockCode,
        metrics: extractFinancialMetrics(financialData),
      });
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error) {
    console.error('[OpenDart] 오류:', error);
    return NextResponse.json({ error: 'Failed to fetch OpenDart data' }, { status: 500 });
  }
}
