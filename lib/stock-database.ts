// ──────────────────────────────────────────────────────────────────────────────
// GENPORT 종목 데이터베이스
// KRX 종목코드(STOCK_CODES) + OpenDart 고유번호(CORP_CODES) + 업종 분류
// ──────────────────────────────────────────────────────────────────────────────

export interface CompanyInfo {
  stockCode: string;      // KRX 6자리 (KIS API 호출용)
  corpCode?: string;      // OpenDart 고유번호 (재무제표 조회용)
  sector: string;         // 업종 분류
  market: 'KOSPI' | 'KOSDAQ'; // 상장 시장
}

export const COMPANY_DB: Record<string, CompanyInfo> = {
  // ── 반도체 / IT ──────────────────────────────────
  '삼성전자':       { stockCode: '005930', corpCode: '00126380', sector: '반도체', market: 'KOSPI' },
  'SK하이닉스':    { stockCode: '000660', corpCode: '00164779', sector: '반도체', market: 'KOSPI' },
  'LG전자':        { stockCode: '066570', corpCode: '00401731', sector: '전자', market: 'KOSPI' },
  'NAVER':         { stockCode: '035420', corpCode: '00266961', sector: 'IT플랫폼', market: 'KOSPI' },
  '카카오':        { stockCode: '035720', corpCode: '00918444', sector: 'IT플랫폼', market: 'KOSPI' },
  'SK텔레콤':      { stockCode: '017670', corpCode: '00111928', sector: '통신', market: 'KOSPI' },
  'KT':            { stockCode: '030200', corpCode: '00781786', sector: '통신', market: 'KOSPI' },

  // ── 배터리 / 2차전지 ─────────────────────────────
  'LG에너지솔루션': { stockCode: '373220', corpCode: '01606130', sector: '2차전지', market: 'KOSPI' },
  '삼성SDI':       { stockCode: '006400', corpCode: '00126371', sector: '2차전지', market: 'KOSPI' },
  'SK이노베이션':  { stockCode: '096770', corpCode: '00631518', sector: '2차전지', market: 'KOSPI' },
  'LG화학':        { stockCode: '051910', corpCode: '00186440', sector: '소재', market: 'KOSPI' },
  '에코프로비엠':  { stockCode: '247540', corpCode: '01024072', sector: '2차전지소재', market: 'KOSDAQ' },
  '에코프로':      { stockCode: '086520', corpCode: '00859736', sector: '2차전지소재', market: 'KOSDAQ' },
  '포스코퓨처엠':  { stockCode: '003670', corpCode: '00381711', sector: '2차전지소재', market: 'KOSPI' },
  '엘앤에프':      { stockCode: '066970', sector: '2차전지소재', market: 'KOSDAQ' },

  // ── 자동차 ───────────────────────────────────────
  '현대차':        { stockCode: '005380', corpCode: '00164742', sector: '자동차', market: 'KOSPI' },
  '기아':          { stockCode: '000270', corpCode: '00164783', sector: '자동차', market: 'KOSPI' },
  '현대모비스':    { stockCode: '012330', corpCode: '00164760', sector: '자동차부품', market: 'KOSPI' },
  '현대로템':      { stockCode: '064350', corpCode: '00399813', sector: '방위/철도', market: 'KOSPI' },
  '한온시스템':    { stockCode: '018880', sector: '자동차부품', market: 'KOSPI' },

  // ── 바이오 / 헬스케어 ────────────────────────────
  '삼성바이오로직스': { stockCode: '207940', corpCode: '00877059', sector: '바이오', market: 'KOSPI' },
  '셀트리온':      { stockCode: '068270', corpCode: '00421045', sector: '바이오', market: 'KOSPI' },
  '유한양행':      { stockCode: '000100', corpCode: '00104830', sector: '제약', market: 'KOSPI' },
  '한미약품':      { stockCode: '128940', corpCode: '00473671', sector: '제약', market: 'KOSPI' },
  '종근당':        { stockCode: '185750', corpCode: '00247162', sector: '제약', market: 'KOSPI' },
  '녹십자':        { stockCode: '006280', corpCode: '00142117', sector: '제약', market: 'KOSPI' },
  '대웅제약':      { stockCode: '069620', corpCode: '00023490', sector: '제약', market: 'KOSPI' },
  '동아에스티':    { stockCode: '170900', sector: '제약', market: 'KOSPI' },
  '보령':          { stockCode: '003850', sector: '제약', market: 'KOSPI' },
  'HLB':           { stockCode: '028300', sector: '바이오', market: 'KOSDAQ' },
  '알테오젠':      { stockCode: '196170', sector: '바이오', market: 'KOSDAQ' },

  // ── 화장품 / 뷰티 ────────────────────────────────
  '아모레퍼시픽':  { stockCode: '090430', sector: '화장품', market: 'KOSPI' },
  'LG생활건강':    { stockCode: '051900', sector: '화장품', market: 'KOSPI' },
  '코스맥스':      { stockCode: '192820', sector: '화장품', market: 'KOSPI' },
  '한국콜마':      { stockCode: '161890', sector: '화장품', market: 'KOSPI' },
  '클리오':        { stockCode: '237880', sector: '화장품', market: 'KOSDAQ' },
  '애경산업':      { stockCode: '018250', sector: '화장품', market: 'KOSPI' },
  '실리콘투':      { stockCode: '257720', sector: '화장품유통', market: 'KOSDAQ' },
  '토니모리':      { stockCode: '214420', sector: '화장품', market: 'KOSDAQ' },

  // ── 게임 ─────────────────────────────────────────
  '크래프톤':      { stockCode: '259960', sector: '게임', market: 'KOSPI' },
  '넷마블':        { stockCode: '251270', sector: '게임', market: 'KOSPI' },
  '엔씨소프트':    { stockCode: '036570', sector: '게임', market: 'KOSPI' },
  '펄어비스':      { stockCode: '263750', sector: '게임', market: 'KOSDAQ' },
  '카카오게임즈':  { stockCode: '293490', sector: '게임', market: 'KOSDAQ' },
  '위메이드':      { stockCode: '112040', sector: '게임', market: 'KOSDAQ' },
  '컴투스':        { stockCode: '078340', sector: '게임', market: 'KOSDAQ' },
  '넥슨게임즈':    { stockCode: '225570', sector: '게임', market: 'KOSDAQ' },

  // ── K-POP / 엔터테인먼트 ─────────────────────────
  '하이브':        { stockCode: '352820', sector: '엔터테인먼트', market: 'KOSPI' },
  'SM엔터테인먼트': { stockCode: '041510', sector: '엔터테인먼트', market: 'KOSDAQ' },
  'JYP엔터테인먼트': { stockCode: '035900', sector: '엔터테인먼트', market: 'KOSDAQ' },
  'YG엔터테인먼트': { stockCode: '122870', sector: '엔터테인먼트', market: 'KOSDAQ' },
  'CJ ENM':        { stockCode: '035760', sector: '미디어/엔터', market: 'KOSDAQ' },
  '스튜디오드래곤': { stockCode: '253450', sector: '미디어', market: 'KOSDAQ' },
  '쇼박스':        { stockCode: '086980', sector: '영화/엔터', market: 'KOSDAQ' },

  // ── 음식료 / 식품 ────────────────────────────────
  'CJ제일제당':    { stockCode: '097950', sector: '식품', market: 'KOSPI' },
  '오리온':        { stockCode: '271560', sector: '식품', market: 'KOSPI' },
  '농심':          { stockCode: '004370', sector: '식품', market: 'KOSPI' },
  '롯데웰푸드':    { stockCode: '280360', sector: '식품', market: 'KOSPI' },
  '빙그레':        { stockCode: '005180', sector: '식품', market: 'KOSPI' },
  '하이트진로':    { stockCode: '000080', sector: '음료', market: 'KOSPI' },
  '오비맥주':      { stockCode: '009680', sector: '음료', market: 'KOSPI' },
  '매일유업':      { stockCode: '267980', sector: '식품', market: 'KOSPI' },

  // ── 유통 / 리테일 ────────────────────────────────
  '롯데쇼핑':      { stockCode: '023530', sector: '유통', market: 'KOSPI' },
  '이마트':        { stockCode: '139480', sector: '유통', market: 'KOSPI' },
  'GS리테일':      { stockCode: '007070', sector: '유통', market: 'KOSPI' },
  '현대백화점':    { stockCode: '069960', sector: '유통', market: 'KOSPI' },
  'BGF리테일':     { stockCode: '282330', sector: '유통', market: 'KOSPI' },
  'GS홈쇼핑':      { stockCode: '028150', sector: '유통', market: 'KOSPI' },

  // ── 방위산업 / 항공우주 ──────────────────────────
  '한화에어로스페이스': { stockCode: '012450', corpCode: '00108675', sector: '방위산업', market: 'KOSPI' },
  'LIG넥스원':     { stockCode: '079550', corpCode: '00556097', sector: '방위산업', market: 'KOSPI' },
  '한국항공우주':  { stockCode: '047810', corpCode: '00427987', sector: '항공우주', market: 'KOSPI' },
  '한화시스템':    { stockCode: '272210', sector: '방위산업', market: 'KOSPI' },
  '퍼스텍':        { stockCode: '010820', sector: '방위산업', market: 'KOSDAQ' },
  'LIG':           { stockCode: '079550', sector: '방위산업', market: 'KOSPI' },

  // ── 원전 / 에너지 ────────────────────────────────
  '두산에너빌리티': { stockCode: '034020', corpCode: '00210195', sector: '원전/발전', market: 'KOSPI' },
  '한국전력':      { stockCode: '015760', corpCode: '00013447', sector: '전력', market: 'KOSPI' },
  '한전KPS':       { stockCode: '051600', corpCode: '00463568', sector: '원전', market: 'KOSPI' },
  '두산퓨얼셀':    { stockCode: '336260', sector: '수소/연료전지', market: 'KOSPI' },
  '비에이치아이':  { stockCode: '083650', sector: '원전', market: 'KOSDAQ' },

  // ── 로보틱스 ─────────────────────────────────────
  '두산로보틱스':  { stockCode: '454910', corpCode: '01744491', sector: '로봇', market: 'KOSPI' },
  '레인보우로보틱스': { stockCode: '277810', corpCode: '01546494', sector: '로봇', market: 'KOSDAQ' },
  '현대로보틱스':  { stockCode: '267270', sector: '로봇', market: 'KOSPI' },
  '로보티즈':      { stockCode: '108490', sector: '로봇', market: 'KOSDAQ' },
  '에스비비테크':  { stockCode: '389500', sector: '로봇부품', market: 'KOSDAQ' },

  // ── 금융 ─────────────────────────────────────────
  'KB금융':        { stockCode: '105560', corpCode: '00688996', sector: '은행', market: 'KOSPI' },
  '신한지주':      { stockCode: '055550', corpCode: '00382199', sector: '은행', market: 'KOSPI' },
  '하나금융지주':  { stockCode: '086790', corpCode: '00547583', sector: '은행', market: 'KOSPI' },
  '우리금융지주':  { stockCode: '316140', corpCode: '01473292', sector: '은행', market: 'KOSPI' },
  '미래에셋증권':  { stockCode: '006800', corpCode: '00368003', sector: '증권', market: 'KOSPI' },
  '삼성생명':      { stockCode: '032830', corpCode: '00573096', sector: '보험', market: 'KOSPI' },
  '삼성화재':      { stockCode: '000810', sector: '보험', market: 'KOSPI' },
  '카카오페이':    { stockCode: '377300', corpCode: '01567761', sector: '핀테크', market: 'KOSPI' },
  '카카오뱅크':    { stockCode: '323410', corpCode: '01461028', sector: '핀테크', market: 'KOSPI' },

  // ── 소재 / 철강 ──────────────────────────────────
  'POSCO홀딩스':   { stockCode: '005490', corpCode: '00254045', sector: '철강', market: 'KOSPI' },
  '현대제철':      { stockCode: '004020', sector: '철강', market: 'KOSPI' },
  '고려아연':      { stockCode: '010130', sector: '비철금속', market: 'KOSPI' },

  // ── 건설 / 부동산 ────────────────────────────────
  '현대건설':      { stockCode: '000720', corpCode: '00216422', sector: '건설', market: 'KOSPI' },
  'GS건설':        { stockCode: '006360', corpCode: '00116039', sector: '건설', market: 'KOSPI' },
  'DL이앤씨':      { stockCode: '375500', corpCode: '01368528', sector: '건설', market: 'KOSPI' },
  '삼성물산':      { stockCode: '028260', sector: '건설/상사', market: 'KOSPI' },

  // ── 기타 ─────────────────────────────────────────
  'KT&G':          { stockCode: '033780', corpCode: '00244985', sector: '담배', market: 'KOSPI' },
  'CJ대한통운':    { stockCode: '000120', sector: '물류', market: 'KOSPI' },
  '한진칼':        { stockCode: '180640', sector: '항공', market: 'KOSPI' },
  '대한항공':      { stockCode: '003490', sector: '항공', market: 'KOSPI' },
  '제주항공':      { stockCode: '089590', sector: '항공', market: 'KOSPI' },
  '롯데케미칼':    { stockCode: '011170', sector: '석유화학', market: 'KOSPI' },
  'SKC':           { stockCode: '011790', sector: '소재', market: 'KOSPI' },
  '한화솔루션':    { stockCode: '009830', sector: '태양광/화학', market: 'KOSPI' },
};

// 전체 회사 목록 (suggest-companies에서 Claude에게 전달)
export function getAllCompanyList(): { name: string; sector: string; market: string }[] {
  return Object.entries(COMPANY_DB).map(([name, info]) => ({
    name,
    sector: info.sector,
    market: info.market,
  }));
}

// 종목코드 → 회사명 역방향 조회
export function getNameByStockCode(stockCode: string): string | undefined {
  return Object.entries(COMPANY_DB).find(([, v]) => v.stockCode === stockCode)?.[0];
}

// 회사명 배열로 stock codes 반환
export function getStockCodesForCompanies(names: string[]): string[] {
  return names
    .map((name) => COMPANY_DB[name]?.stockCode)
    .filter(Boolean) as string[];
}

// 회사명으로 corp code 반환 (OpenDart용)
export function getCorpCode(name: string): string | undefined {
  return COMPANY_DB[name]?.corpCode;
}
