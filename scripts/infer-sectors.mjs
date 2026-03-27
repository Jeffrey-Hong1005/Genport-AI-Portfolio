/**
 * 회사명 키워드 기반 업종 추론 스크립트
 * 실행: node scripts/infer-sectors.mjs
 *
 * KRX API 실패 시 data/companies.json의 sector='기타' 항목을
 * 회사명 패턴 매칭으로 업종을 채워넣음
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const JSON_PATH = path.join(ROOT, 'data', 'companies.json');

// ── 업종 추론 규칙 (순서 중요: 더 구체적인 것 먼저) ──────────────
const SECTOR_RULES = [
  // 반도체
  { sector: '반도체', patterns: ['반도체', '파운드리', '웨이퍼', '실리콘', 'soc', '칩스', '마이크로', '팹리스'] },
  // 2차전지
  { sector: '2차전지', patterns: ['배터리', '에너지솔루션', '양극재', '음극재', '전해질', '분리막', '리튬', '이차전지'] },
  // 디스플레이
  { sector: '디스플레이', patterns: ['디스플레이', 'oled', 'lcd', '패널', '디스'] },
  // 전자/부품
  { sector: '전자부품', patterns: ['전자', '전기', '전장', '인버터', '커패시터', '저항', 'mlcc', '기판', 'pcb', '회로'] },
  // IT/소프트웨어
  { sector: 'IT/소프트웨어', patterns: ['소프트', '시스템즈', '시스템스', '솔루션', '테크', '정보', '데이터', 'ai', '인공지능', '클라우드', '플랫폼', '네트웍스', '네트워크', '인터넷', '소프'] },
  // 통신
  { sector: '통신', patterns: ['텔레콤', '텔레', '통신', '이통', '케이티', 'kt', 'skt', 'lgu'] },
  // 자동차
  { sector: '자동차', patterns: ['자동차', '모터스', '오토', '타이어', '브레이크', '조향', '샤시', '도어', '시트', '오토모티브'] },
  // 자동차부품
  { sector: '자동차부품', patterns: ['모비스', '만도', '한온', '현대위아', '성우', '세종', '화신', '영신'] },
  // 바이오/헬스케어
  { sector: '바이오/헬스케어', patterns: ['바이오', '셀', '테라퓨틱스', '제네틱스', '지노믹스', '유전', '항체', '줄기세포', '헬스케어', '의료', '진단', '치료', '백신', '메디'] },
  // 제약
  { sector: '제약', patterns: ['제약', '약품', '파마', '파마슈티컬', '약', '의약'] },
  // 화장품/뷰티
  { sector: '화장품', patterns: ['화장품', '뷰티', '코스메틱', '코스', '퍼퓸', '향수'] },
  // 게임/엔터
  { sector: '엔터/미디어', patterns: ['게임', '엔터테인먼트', '엔터', '미디어', '방송', '영화', '음악', '콘텐츠', '스튜디오', '픽처스', '매니지먼트', '엔터스'] },
  // 금융
  { sector: '금융', patterns: ['은행', '금융', '캐피탈', '파이낸스', '투자', '자산운용', '신용', '카드'] },
  // 보험
  { sector: '보험', patterns: ['생명', '화재', '손해보험', '보험', '재보험'] },
  // 증권
  { sector: '증권', patterns: ['증권', '선물', '투자증권'] },
  // 건설/부동산
  { sector: '건설/부동산', patterns: ['건설', '건축', '엔지니어링', '리츠', '부동산', '개발', '종합건설', 'e&c'] },
  // 철강/금속
  { sector: '철강/금속', patterns: ['철강', '철', '스틸', '강판', '메탈', '금속', '비철', '동', '알루미늄', '포스코'] },
  // 화학/소재
  { sector: '화학/소재', patterns: ['화학', '케미칼', '소재', '폴리머', '수지', '고무', '섬유', '플라스틱', '코팅'] },
  // 에너지
  { sector: '에너지', patterns: ['에너지', '전력', '발전', '가스', '원전', '핵연료', '태양광', '풍력', '수소', '연료전지'] },
  // 방위산업
  { sector: '방위산업', patterns: ['방위', '항공우주', '한화', '로템', '방산', 'kai', '항공', '우주'] },
  // 로보틱스
  { sector: '로보틱스', patterns: ['로봇', '로보틱스', '자동화', '협동로봇'] },
  // 음식료
  { sector: '음식료', patterns: ['식품', '음료', '음식', '농업', '수산', '제과', '주류', '맥주', '소주', '커피', '유제품', '사료'] },
  // 유통/물류
  { sector: '유통', patterns: ['유통', '마트', '쇼핑', '리테일', '물류', '택배', '배송', '이커머스'] },
  // 운송/항공
  { sector: '운송/항공', patterns: ['항공', '운항', '해운', '선박', '조선', '항만', '육운', '운수'] },
  // 조선
  { sector: '조선', patterns: ['조선', '중공업', '해양'] },
  // 호텔/레저
  { sector: '여행/레저', patterns: ['호텔', '리조트', '여행', '레저', '카지노', '골프', '스포츠'] },
];

function inferSector(companyName) {
  if (!companyName) return null;
  const name = companyName.toLowerCase();
  for (const rule of SECTOR_RULES) {
    if (rule.patterns.some((p) => name.includes(p.toLowerCase()))) {
      return rule.sector;
    }
  }
  return null; // 추론 불가
}

// KOSPI/KOSDAQ 판별 (종목코드 기반 휴리스틱)
// - KOSPI: 0으로 시작하는 경우가 많음 (완벽하지 않음)
// - 실제로는 KIS API가 자동 판별하므로 큰 문제 없음
function inferMarket(stockCode) {
  // 코드 앞자리가 0인 경우 일반적으로 KOSPI 대형주
  // 1,2,3으로 시작하는 경우 KOSDAQ 가능성 높음
  // 단, 완벽한 규칙이 없어 KIS API 자동 판별에 맡기는 것이 맞음
  // 여기서는 기본값만 설정
  return 'KOSPI'; // KIS API가 J/Q 자동 판별하므로 큰 문제 없음
}

async function main() {
  if (!fs.existsSync(JSON_PATH)) {
    console.error('❌ data/companies.json 없음. npm run sync-companies 먼저 실행하세요.');
    process.exit(1);
  }

  const raw = JSON.parse(fs.readFileSync(JSON_PATH, 'utf-8'));
  const companies = raw.companies;

  console.log(`총 ${companies.length}개 종목 처리 중...`);

  let inferredCount = 0;
  let alreadyHasSector = 0;

  for (const company of companies) {
    if (company.sector && company.sector !== '기타') {
      alreadyHasSector++;
      continue;
    }

    const inferred = inferSector(company.name);
    if (inferred) {
      company.sector = inferred;
      inferredCount++;
    }
    // 추론 못 하면 '기타' 유지
  }

  // 섹터별 통계
  const sectorStats = {};
  for (const c of companies) {
    sectorStats[c.sector] = (sectorStats[c.sector] || 0) + 1;
  }
  const sortedStats = Object.entries(sectorStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20);

  // 저장
  raw.companies = companies;
  raw.sectorInferredAt = new Date().toISOString();
  fs.writeFileSync(JSON_PATH, JSON.stringify(raw, null, 2), 'utf-8');

  console.log(`\n✅ 완료`);
  console.log(`  이미 업종 있음: ${alreadyHasSector}개`);
  console.log(`  키워드 추론 성공: ${inferredCount}개`);
  console.log(`  '기타' 남은 것: ${companies.filter(c => c.sector === '기타').length}개`);
  console.log(`\n📊 업종별 상위 20개:`);
  for (const [sector, count] of sortedStats) {
    console.log(`  ${sector.padEnd(20)} ${count}개`);
  }
}

main().catch(console.error);
