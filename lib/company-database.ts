/**
 * GENPORT 종목 데이터베이스 (동적 JSON 기반)
 *
 * data/companies.json 을 읽어 전체 상장 종목 정보를 제공합니다.
 * 데이터 갱신: node scripts/sync-companies.mjs
 */

import fs from 'fs';
import path from 'path';

export interface CompanyInfo {
  name: string;
  stockCode: string;   // KRX 6자리 (KIS API용)
  corpCode: string;    // OpenDart 8자리 (공시 조회용)
  sector: string;      // 업종
  market: 'KOSPI' | 'KOSDAQ' | string;
}

interface CompaniesJson {
  generatedAt: string;
  totalCount: number;
  kospiCount: number;
  kosdaqCount: number;
  companies: CompanyInfo[];
}

// ── 싱글턴 캐시 ──────────────────────────────────────────────────
let _cache: CompanyInfo[] | null = null;

function loadCompanies(): CompanyInfo[] {
  if (_cache) return _cache;

  const filePath = path.join(process.cwd(), 'data', 'companies.json');
  if (!fs.existsSync(filePath)) {
    console.warn('[CompanyDB] data/companies.json 없음 — 빈 배열 반환. scripts/sync-companies.mjs 실행 필요.');
    return [];
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed: CompaniesJson = JSON.parse(raw);
    _cache = parsed.companies || [];
    console.log(`[CompanyDB] ${_cache.length}개 종목 로드 (생성: ${parsed.generatedAt})`);
    return _cache;
  } catch (e) {
    console.error('[CompanyDB] companies.json 파싱 실패:', e);
    return [];
  }
}

// ── 공개 API ──────────────────────────────────────────────────────

/** 전체 종목 목록 */
export function getAllCompanies(): CompanyInfo[] {
  return loadCompanies();
}

/** 이름으로 검색 (부분 일치, 대소문자 무시) */
export function searchByName(query: string, limit = 50): CompanyInfo[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return loadCompanies()
    .filter((c) => c.name.toLowerCase().includes(q))
    .slice(0, limit);
}

/** 업종으로 필터 */
export function filterBySector(sector: string, limit = 100): CompanyInfo[] {
  return loadCompanies()
    .filter((c) => c.sector.includes(sector))
    .slice(0, limit);
}

/** stockCode 배열로 조회 */
export function getByStockCodes(stockCodes: string[]): CompanyInfo[] {
  const codeSet = new Set(stockCodes);
  return loadCompanies().filter((c) => codeSet.has(c.stockCode));
}

/** 단일 stockCode 조회 */
export function getByStockCode(stockCode: string): CompanyInfo | undefined {
  return loadCompanies().find((c) => c.stockCode === stockCode);
}

/** 단일 이름으로 정확히 조회 */
export function getByName(name: string): CompanyInfo | undefined {
  return loadCompanies().find((c) => c.name === name);
}

/** 이름 배열 → stockCodes 배열 */
export function getStockCodes(names: string[]): string[] {
  const db = loadCompanies();
  const nameMap = new Map(db.map((c) => [c.name, c.stockCode]));
  return names.map((n) => nameMap.get(n)).filter(Boolean) as string[];
}

/** 이름 배열 → corpCodes 배열 */
export function getCorpCodes(names: string[]): string[] {
  const db = loadCompanies();
  const nameMap = new Map(db.map((c) => [c.name, c.corpCode]));
  return names.map((n) => nameMap.get(n)).filter(Boolean) as string[];
}

/**
 * 테마 키워드로 관련 종목을 빠르게 사전 필터링
 * Claude에게 넘기기 전에 후보 수를 줄이는 용도
 */
export function preFilterByTheme(theme: string, maxResults = 80): CompanyInfo[] {
  const all = loadCompanies();

  // 1순위: 업종명에 키워드 포함
  const keywords = theme.split(/[\s,]+/).filter((k) => k.length >= 2);

  const sectorMatches = all.filter((c) =>
    keywords.some((kw) => c.sector.toLowerCase().includes(kw.toLowerCase()))
  );

  if (sectorMatches.length >= 10) {
    return sectorMatches.slice(0, maxResults);
  }

  // 2순위: 회사 이름에 키워드 포함
  const nameMatches = all.filter((c) =>
    keywords.some((kw) => c.name.toLowerCase().includes(kw.toLowerCase()))
  );

  const combined = [...new Map([...sectorMatches, ...nameMatches].map((c) => [c.stockCode, c])).values()];

  if (combined.length >= 5) {
    return combined.slice(0, maxResults);
  }

  // 3순위: 테마 → 섹터 매핑 테이블 (대표 키워드)
  const THEME_SECTOR_MAP: Record<string, string[]> = {
    'ai': ['반도체', 'IT/소프트웨어'],
    '인공지능': ['반도체', 'IT/소프트웨어'],
    '반도체': ['반도체'],
    '배터리': ['2차전지'],
    '2차전지': ['2차전지'],
    '전기차': ['자동차', '2차전지'],
    '자동차': ['자동차'],
    '바이오': ['바이오/헬스케어', '제약'],
    '제약': ['제약', '바이오/헬스케어'],
    '헬스케어': ['바이오/헬스케어'],
    '화장품': ['화장품'],
    '뷰티': ['화장품'],
    '게임': ['엔터/미디어'],
    '엔터': ['엔터/미디어'],
    'k-pop': ['엔터/미디어'],
    '방위': ['방위산업'],
    '원전': ['에너지'],
    '에너지': ['에너지'],
    '금융': ['금융', '보험', '증권'],
    '은행': ['금융'],
    '건설': ['건설/부동산'],
    '유통': ['유통'],
    '음식': ['음식료'],
    '철강': ['철강/금속'],
    '로봇': ['로보틱스'],
    '우주': ['방위산업', '로보틱스'],
    '통신': ['통신'],
  };

  const matchedSectors = new Set<string>();
  for (const [key, sectors] of Object.entries(THEME_SECTOR_MAP)) {
    if (theme.toLowerCase().includes(key)) {
      sectors.forEach((s) => matchedSectors.add(s));
    }
  }

  if (matchedSectors.size > 0) {
    const sectorResult = all.filter((c) =>
      [...matchedSectors].some((s) => c.sector.includes(s))
    );
    if (sectorResult.length > 0) return sectorResult.slice(0, maxResults);
  }

  // 4순위: 전체에서 랜덤 샘플 (최후 수단)
  return all
    .filter((c) => c.market === 'KOSPI')
    .sort(() => Math.random() - 0.5)
    .slice(0, 40);
}

/** DB 통계 */
export function getStats() {
  const all = loadCompanies();
  return {
    total: all.length,
    kospi: all.filter((c) => c.market === 'KOSPI').length,
    kosdaq: all.filter((c) => c.market === 'KOSDAQ').length,
    withCorpCode: all.filter((c) => c.corpCode).length,
    sectors: [...new Set(all.map((c) => c.sector))].sort(),
  };
}

// ── 하위 호환: stock-database.ts 에서 쓰던 함수들 ──────────────
export function getAllCompanyList(): { name: string; stockCode: string; sector: string }[] {
  return loadCompanies().map((c) => ({ name: c.name, stockCode: c.stockCode, sector: c.sector }));
}

export function getStockCodesForCompanies(names: string[]): string[] {
  return getStockCodes(names);
}

export function getCorpCode(name: string): string | undefined {
  return getByName(name)?.corpCode;
}

export function getNameByStockCode(stockCode: string): string | undefined {
  return getByStockCode(stockCode)?.name;
}
