/**
 * GENPORT 종목 동기화 스크립트
 *
 * 실행: node scripts/sync-companies.mjs
 *
 * 1. OpenDart corpCode.xml (ZIP) → 전체 상장 종목 목록 (name, stockCode, corpCode)
 * 2. KRX 업종/시장 데이터 → KOSPI/KOSDAQ 구분 + 업종명
 * 3. 병합 후 data/companies.json 생성
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// .env.local 파싱
function loadEnv() {
  const envPath = path.join(ROOT, '.env.local');
  if (!fs.existsSync(envPath)) throw new Error('.env.local 파일이 없습니다.');
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  const env = {};
  for (const line of lines) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) env[m[1].trim()] = m[2].trim();
  }
  return env;
}

// HTTP(S) GET → Buffer (브라우저처럼 헤더 설정)
function fetchBuffer(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/octet-stream,application/zip,*/*',
        'Accept-Language': 'ko-KR,ko;q=0.9',
        'Connection': 'keep-alive',
        ...extraHeaders,
      },
      rejectUnauthorized: false, // 정부 기관 SSL 인증서 문제 우회
    };

    const client = url.startsWith('https') ? https : http;
    const req = client.request(options, (res) => {
      // 리다이렉트 처리
      if ((res.statusCode === 301 || res.statusCode === 302) && res.headers.location) {
        const redirectUrl = res.headers.location.startsWith('http')
          ? res.headers.location
          : `${urlObj.protocol}//${urlObj.host}${res.headers.location}`;
        return fetchBuffer(redirectUrl, extraHeaders).then(resolve).catch(reject);
      }

      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}: ${url}`));
      }

      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
      res.on('error', reject);
    });

    req.on('error', reject);
    req.setTimeout(30000, () => {
      req.destroy(new Error('요청 타임아웃 (30초)'));
    });
    req.end();
  });
}

// HTTP POST → JSON (KRX용)
function fetchPost(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const bodyBuf = Buffer.from(body, 'utf-8');
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Content-Length': bodyBuf.length,
        'User-Agent': 'Mozilla/5.0',
        Origin: 'https://data.krx.co.kr',
        Referer: 'https://data.krx.co.kr/',
        ...headers,
      },
    };
    const req = https.request(options, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf-8')));
        } catch (e) {
          reject(new Error('KRX JSON 파싱 실패: ' + Buffer.concat(chunks).toString().slice(0, 200)));
        }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.write(bodyBuf);
    req.end();
  });
}

// ZIP 파일을 임시 폴더에 저장 후 시스템 unzip으로 추출
function extractZip(zipBuffer) {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'genport-'));
  const zipPath = path.join(tmpDir, 'corpcode.zip');

  try {
    fs.writeFileSync(zipPath, zipBuffer);
    execSync(`unzip -o "${zipPath}" -d "${tmpDir}"`, { stdio: 'pipe' });

    const files = {};
    for (const f of fs.readdirSync(tmpDir)) {
      if (f === 'corpcode.zip') continue;
      files[f] = fs.readFileSync(path.join(tmpDir, f));
    }
    return files;
  } finally {
    // 임시 폴더 정리
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  }
}

// OpenDart corpCode.xml 파싱
// <list><corp_code>00126380</corp_code><corp_name>삼성전자</corp_name><stock_code>005930</stock_code>...
function parseCorpCodeXml(xmlStr) {
  const companies = [];
  const regex = /<list>([\s\S]*?)<\/list>/g;
  let match;

  while ((match = regex.exec(xmlStr)) !== null) {
    const block = match[1];
    const corpCode = (block.match(/<corp_code>(.*?)<\/corp_code>/) || [])[1]?.trim() || '';
    const corpName = (block.match(/<corp_name>(.*?)<\/corp_name>/) || [])[1]?.trim() || '';
    const stockCode = (block.match(/<stock_code>\s*(.*?)\s*<\/stock_code>/) || [])[1]?.trim() || '';

    // stock_code가 있는 것만 (상장 종목)
    if (stockCode && stockCode !== ' ' && stockCode.length === 6 && /^\d{6}$/.test(stockCode)) {
      companies.push({ name: corpName, stockCode, corpCode });
    }
  }

  return companies;
}

// KRX에서 전체 종목 리스트 가져오기 (KOSPI + KOSDAQ)
async function fetchKrxList(marketId) {
  const label = marketId === 'STK' ? 'KOSPI' : 'KOSDAQ';
  console.log(`  KRX ${label} 종목 조회 중...`);
  try {
    const body = `bld=dbms%2FMDC%2FSTAT%2Fstandard%2FMDCSTAT01901&mktId=${marketId}`;
    const data = await fetchPost('https://data.krx.co.kr/comm/bldAttendant/getJsonData.cmd', body);

    if (!data.OutBlock_1) {
      console.warn(`  KRX ${label}: 데이터 없음`);
      return [];
    }

    return data.OutBlock_1.map((item) => ({
      stockCode: item.ISU_SRT_CD || '',         // 단축코드 (6자리)
      name: item.ISU_ABBRV || '',               // 종목명
      sector: item.IDX_KORAN_NM || item.SECT_TP_NM || '',  // 업종명
      market: label,
    })).filter((c) => c.stockCode && /^\d{6}$/.test(c.stockCode));
  } catch (e) {
    console.warn(`  KRX ${label} 조회 실패 (계속 진행):`, e.message);
    return [];
  }
}

// 업종 한글명 정규화
function normalizeSector(rawSector) {
  if (!rawSector) return '기타';
  if (rawSector.includes('반도체') || rawSector.includes('전자부품')) return '반도체';
  if (rawSector.includes('IT') || rawSector.includes('소프트웨어') || rawSector.includes('정보기술')) return 'IT/소프트웨어';
  if (rawSector.includes('통신')) return '통신';
  if (rawSector.includes('자동차') || rawSector.includes('운수장비')) return '자동차';
  if (rawSector.includes('배터리') || rawSector.includes('2차전지')) return '2차전지';
  if (rawSector.includes('화학') || rawSector.includes('정밀화학')) return '화학/소재';
  if (rawSector.includes('제약') || rawSector.includes('의약품')) return '제약';
  if (rawSector.includes('바이오') || rawSector.includes('의료') || rawSector.includes('헬스케어')) return '바이오/헬스케어';
  if (rawSector.includes('화장품') || rawSector.includes('뷰티')) return '화장품';
  if (rawSector.includes('은행') || rawSector.includes('금융')) return '금융';
  if (rawSector.includes('보험')) return '보험';
  if (rawSector.includes('증권')) return '증권';
  if (rawSector.includes('건설') || rawSector.includes('부동산')) return '건설/부동산';
  if (rawSector.includes('유통') || rawSector.includes('소매')) return '유통';
  if (rawSector.includes('음식') || rawSector.includes('식품') || rawSector.includes('음료')) return '음식료';
  if (rawSector.includes('철강') || rawSector.includes('금속')) return '철강/금속';
  if (rawSector.includes('에너지') || rawSector.includes('전력') || rawSector.includes('원전')) return '에너지';
  if (rawSector.includes('게임') || rawSector.includes('엔터') || rawSector.includes('방송') || rawSector.includes('미디어')) return '엔터/미디어';
  if (rawSector.includes('항공') || rawSector.includes('운송')) return '운송/항공';
  if (rawSector.includes('방위') || rawSector.includes('국방')) return '방위산업';
  if (rawSector.includes('로봇') || rawSector.includes('자동화')) return '로보틱스';
  if (rawSector.includes('호텔') || rawSector.includes('레저') || rawSector.includes('여행')) return '여행/레저';
  return rawSector || '기타';
}

async function main() {
  const env = loadEnv();
  const apiKey = env.OPENDART_API_KEY;
  if (!apiKey) throw new Error('OPENDART_API_KEY가 .env.local에 없습니다.');

  // ── 1. OpenDart corpCode.xml 다운로드 ──────────────────────────
  console.log('1️⃣  OpenDart corpCode.xml 다운로드 중...');
  const zipUrl = `https://opendart.fss.or.kr/api/corpCode.xml?crtfc_key=${apiKey}`;
  const zipBuffer = await fetchBuffer(zipUrl);
  console.log(`   다운로드 완료: ${(zipBuffer.length / 1024 / 1024).toFixed(2)}MB`);

  const files = extractZip(zipBuffer);
  const xmlFileName = Object.keys(files).find((f) => f.toLowerCase().endsWith('.xml'));
  if (!xmlFileName) throw new Error('ZIP 안에 XML 파일 없음. 파일 목록: ' + Object.keys(files).join(', '));

  console.log(`   XML 파일 추출: ${xmlFileName} (${(files[xmlFileName].length / 1024).toFixed(0)}KB)`);
  const xmlStr = files[xmlFileName].toString('utf-8');

  const dartCompanies = parseCorpCodeXml(xmlStr);
  console.log(`   상장 종목 파싱: ${dartCompanies.length}개`);

  // stockCode → {corpCode} 매핑
  const dartMap = {};
  for (const c of dartCompanies) {
    dartMap[c.stockCode] = { corpCode: c.corpCode, dartName: c.name };
  }

  // ── 2. KRX KOSPI + KOSDAQ 업종/시장 데이터 ──────────────────────
  console.log('2️⃣  KRX 업종 데이터 수집 중...');
  const [kospiList, kosdaqList] = await Promise.all([
    fetchKrxList('STK'),
    fetchKrxList('KSQ'),
  ]);
  console.log(`   KOSPI: ${kospiList.length}개, KOSDAQ: ${kosdaqList.length}개`);

  // ── 3. 병합 ────────────────────────────────────────────────────
  console.log('3️⃣  데이터 병합 중...');

  const companies = [];
  const seenCodes = new Set();

  for (const krxItem of [...kospiList, ...kosdaqList]) {
    if (seenCodes.has(krxItem.stockCode)) continue;
    seenCodes.add(krxItem.stockCode);

    const dartInfo = dartMap[krxItem.stockCode] || {};

    companies.push({
      name: krxItem.name,
      stockCode: krxItem.stockCode,
      corpCode: dartInfo.corpCode || '',
      sector: normalizeSector(krxItem.sector),
      market: krxItem.market,
    });
  }

  // KRX에 없는 OpenDart 종목 보충 (ETF 등 제외하고 일반 주식만)
  for (const c of dartCompanies) {
    if (seenCodes.has(c.stockCode)) continue;
    seenCodes.add(c.stockCode);
    companies.push({
      name: c.name,
      stockCode: c.stockCode,
      corpCode: c.corpCode,
      sector: '기타',
      market: 'KOSPI', // 기본값 (KIS API가 자동 판별)
    });
  }

  companies.sort((a, b) => a.stockCode.localeCompare(b.stockCode));

  console.log(`   최종 종목 수: ${companies.length}개`);

  // ── 4. 저장 ────────────────────────────────────────────────────
  const outPath = path.join(ROOT, 'data', 'companies.json');
  const meta = {
    generatedAt: new Date().toISOString(),
    totalCount: companies.length,
    kospiCount: companies.filter((c) => c.market === 'KOSPI').length,
    kosdaqCount: companies.filter((c) => c.market === 'KOSDAQ').length,
    companies,
  };
  fs.writeFileSync(outPath, JSON.stringify(meta, null, 2), 'utf-8');
  console.log(`\n✅ 저장 완료: data/companies.json (${(fs.statSync(outPath).size / 1024).toFixed(0)}KB)`);
  console.log(`   KOSPI: ${meta.kospiCount}개 | KOSDAQ: ${meta.kosdaqCount}개 | 합계: ${meta.totalCount}개`);
}

main().catch((err) => {
  console.error('❌ 오류:', err.message);
  process.exit(1);
});
