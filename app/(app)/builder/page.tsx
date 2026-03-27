'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

interface Stock {
  name: string;
  allocation: number;
  reason: string;
}

interface PortfolioResult {
  allocation: Stock[];
  expectedReturn: number;
  sharpeRatio: number;
  volatility: number;
}

interface SentimentResult {
  overallScore: number;
  news: { title: string; summary: string; sentiment: string; score: number }[];
}

interface KisPrice {
  stockCode: string;
  name?: string;
  currentPrice: number;
  changeRate: number;
  changeSign: string;
  marketCap: number;
  per: number;
  pbr: number;
  foreignRate: number;
  position52w?: number;
  signals?: string[];
  // investor_trend 조회 후 병합
  foreignTrend?: string;
  institutionTrend?: string;
  foreignNetBuy5d?: number;
  institutionNetBuy5d?: number;
}

interface KisData {
  prices: KisPrice[];
}

const EXAMPLE_PROMPTS = [
  'ESG 높고 PER 낮은 기업으로 구성해줘',
  '배당금 높은 대형주 위주로 만들어줘',
  '성장성 높은 중소형주로 구성해줘',
  '금리 인상에 강한 금융주로만 구성해줘',
];

export default function BuilderPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [prompt, setPrompt] = useState('');
  const [portfolioResult, setPortfolioResult] = useState<PortfolioResult | null>(null);
  const [portfolioName, setPortfolioName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loadingStatus, setLoadingStatus] = useState('');

  // Sentiment 관련 상태
  const [sentimentData, setSentimentData] = useState<SentimentResult | null>(null);
  const [sentimentLoading, setSentimentLoading] = useState(false);

  // KIS 실시간 데이터
  const [kisData, setKisData] = useState<KisData | null>(null);

  // Step 2로 넘어갈 때 선택된 테마의 sentiment 자동 분석
  useEffect(() => {
    if (step === 2 && selectedTheme && !sentimentData) {
      fetchSentiment(selectedTheme);
    }
  }, [step, selectedTheme]);

  const fetchSentiment = async (theme: string) => {
    setSentimentLoading(true);
    try {
      const res = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: theme }),
      });
      if (res.ok) {
        const data = await res.json();
        setSentimentData(data);
      }
    } catch (e) {
      console.warn('Sentiment 조회 실패:', e);
    } finally {
      setSentimentLoading(false);
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return '#10b981';
    if (score < -0.3) return '#ef4444';
    return '#f59e0b';
  };

  const getSentimentLabel = (score: number) => {
    if (score > 0.3) return '긍정적';
    if (score < -0.3) return '부정적';
    return '중립적';
  };

  const handleThemeSelect = (theme: string) => {
    setSelectedTheme(theme);
    setSentimentData(null); // 테마 바뀌면 기존 sentiment 초기화
  };

  const handleGeneratePortfolio = async () => {
    if (!prompt.trim() || !selectedTheme) return;

    setLoading(true);
    setErrorMsg('');
    setPortfolioResult(null);
    setStep(3);
    try {
      let dartData = null;
      let kisDataResult: KisData | null = null;

      // 1단계: Claude가 테마에 맞는 실제 상장 종목 선별
      setLoadingStatus('🔍 테마에 맞는 종목을 탐색하는 중...');
      let suggestedCompanies: any[] = [];
      let suggestedStockCodes: string[] = [];
      try {
        const suggestRes = await fetch('/api/suggest-companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: selectedTheme }),
        });
        if (suggestRes.ok) {
          const suggestData = await suggestRes.json();
          suggestedCompanies = suggestData.companies || [];
          suggestedStockCodes = suggestData.stockCodes || [];
          console.log('추천 종목:', suggestedCompanies.map((c: any) => c.name));
        }
      } catch (e) {
        console.warn('종목 추천 실패:', e);
      }

      // 2단계: OpenDart 재무데이터 + KIS 실시간 시세 병렬 조회
      try {
        const companyNames = suggestedCompanies.map((c: any) => c.name);

        const [dartRes, kisRes] = await Promise.allSettled([
          // OpenDart: 재무제표
          companyNames.length > 0
            ? fetch('/api/opendart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'companies_financials', companies: companyNames }),
              })
            : Promise.resolve(null),
          // KIS: 실시간 시세
          suggestedStockCodes.length > 0
            ? (setLoadingStatus('📈 KIS에서 실시간 주가를 조회하는 중...'),
              fetch('/api/kis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'prices', stockCodes: suggestedStockCodes }),
              }))
            : Promise.resolve(null),
        ]);

        // OpenDart 결과 처리
        if (dartRes.status === 'fulfilled' && dartRes.value?.ok) {
          dartData = await dartRes.value.json();
          console.log('OpenDart 재무데이터:', dartData);
        }

        // KIS 결과 처리
        if (kisRes.status === 'fulfilled' && kisRes.value?.ok) {
          const kisRaw = await kisRes.value.json();
          // 종목코드 → 이름 매핑
          const codeToName: Record<string, string> = {};
          suggestedCompanies.forEach((c: any) => {
            if (c.stockCode) codeToName[c.stockCode] = c.name;
          });
          const pricesWithName: KisPrice[] = (kisRaw.prices || []).map((p: KisPrice) => ({
            ...p,
            name: codeToName[p.stockCode] || p.stockCode,
          }));

          // 3단계: 외국인/기관 5일 수급 동향 추가 조회
          setLoadingStatus('🔭 외국인·기관 5일 수급 동향을 분석하는 중...');
          try {
            const trendRes = await fetch('/api/kis', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'investor_trends', stockCodes: suggestedStockCodes }),
            });
            if (trendRes.ok) {
              const trendRaw = await trendRes.json();
              const trendMap: Record<string, any> = {};
              (trendRaw.trends || []).forEach((t: any) => {
                trendMap[t.stockCode] = t;
              });
              // 기존 prices에 수급 동향 병합
              kisDataResult = {
                prices: pricesWithName.map((p) => ({
                  ...p,
                  ...(trendMap[p.stockCode]
                    ? {
                        foreignTrend: trendMap[p.stockCode].foreignTrend,
                        institutionTrend: trendMap[p.stockCode].institutionTrend,
                        foreignNetBuy5d: trendMap[p.stockCode].foreignNetBuy5d,
                        institutionNetBuy5d: trendMap[p.stockCode].institutionNetBuy5d,
                      }
                    : {}),
                })),
              };
            } else {
              kisDataResult = { prices: pricesWithName };
            }
          } catch (e) {
            console.warn('수급 동향 조회 실패, 기본 데이터로 진행:', e);
            kisDataResult = { prices: pricesWithName };
          }

          setKisData(kisDataResult);
          console.log('KIS 실시간+수급 데이터:', kisDataResult);
        } else if (kisRes.status === 'rejected') {
          console.warn('KIS 조회 실패:', kisRes.reason);
        }
      } catch (e) {
        console.warn('시장 데이터 조회 실패, AI 기반으로 생성합니다:', e);
      }

      // 2단계: OpenDart + KIS + Sentiment 모두 Claude에 전달
      setLoadingStatus('🤖 AI가 포트폴리오를 분석하는 중...');
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'portfolio',
          theme: selectedTheme,
          prompt,
          dartData,
          kisData: kisDataResult,
          sentimentData,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `API 오류: ${response.status}`);
      }

      const data = await response.json();
      console.log('Claude 응답 데이터:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      if (!data.allocation || !Array.isArray(data.allocation) || data.allocation.length === 0) {
        throw new Error('포트폴리오 데이터가 올바르게 반환되지 않았습니다. 다시 시도해주세요.');
      }

      const safeResult: PortfolioResult = {
        allocation: data.allocation.map((s: any) => ({
          name: s.name || '알 수 없음',
          allocation: Number(s.allocation) || 0,
          reason: s.reason || '',
        })),
        expectedReturn: Number(data.expectedReturn) || 0,
        sharpeRatio: Number(data.sharpeRatio) || 0,
        volatility: Number(data.volatility) || 0,
      };
      setPortfolioResult(safeResult);
    } catch (error: any) {
      console.error('Failed to generate portfolio:', error);
      setErrorMsg(error.message || '포트폴리오 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
      setLoadingStatus('');
    }
  };

  const handleSavePortfolio = async () => {
    if (!portfolioName.trim() || !portfolioResult || !user) return;

    setLoading(true);
    try {
      // 저장 시점 기준가 스냅샷 (수익률 추적용)
      const basePrices: Record<string, number> = {};
      if (kisData?.prices) {
        kisData.prices.forEach((p) => {
          if (p.name && p.currentPrice > 0) {
            basePrices[p.name] = p.currentPrice;
          }
        });
      }

      await addDoc(collection(db, 'portfolios'), {
        userId: user.uid,
        name: portfolioName,
        theme: selectedTheme,
        stocks: portfolioResult.allocation.length,
        allocation: portfolioResult.allocation,
        expectedReturn: portfolioResult.expectedReturn,
        sharpeRatio: portfolioResult.sharpeRatio,
        volatility: portfolioResult.volatility,
        sentimentScore: sentimentData?.overallScore ?? null,
        hasKisData: !!kisData,
        basePrices,          // 저장 시점 기준가
        basePriceAt: new Date(), // 기준가 기록 시각
        createdAt: new Date(),
      });
      router.push('/portfolio');
    } catch (error) {
      console.error('Failed to save portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
        포트폴리오 빌더
      </h1>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', justifyContent: 'center' }}>
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              background: step >= s ? '#6366f1' : '#1f2937',
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '600',
              cursor: 'pointer',
            }}
            onClick={() => s < step && setStep(s as 1 | 2 | 3 | 4)}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Theme Input */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.75rem' }}>
            Step 1: 테마 입력
          </h2>
          <p style={{ color: '#9ca3af', fontSize: '0.9rem', marginBottom: '2rem' }}>
            관심 있는 투자 테마를 자유롭게 입력하세요
          </p>

          <div style={{ marginBottom: '1.5rem' }}>
            <input
              type="text"
              value={selectedTheme}
              onChange={(e) => handleThemeSelect(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && selectedTheme.trim() && setStep(2)}
              placeholder="예: AI반도체, 방위산업, 원전, 바이오, 2차전지, 친환경에너지..."
              style={{
                width: '100%',
                padding: '1rem 1.25rem',
                background: '#1f2937',
                border: selectedTheme.trim()
                  ? '2px solid #6366f1'
                  : '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '0.5rem',
                color: '#f9fafb',
                fontSize: '1rem',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
            />
          </div>

          {/* Quick suggestions */}
          <div style={{ marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '0.75rem' }}>빠른 선택</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['AI반도체', '방위산업', '원전', '바이오헬스', '친환경에너지', '2차전지', '금융', '부동산리츠', '로보틱스', '우주항공'].map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleThemeSelect(tag)}
                  style={{
                    padding: '0.4rem 0.9rem',
                    background: selectedTheme === tag ? '#6366f1' : '#1f2937',
                    border: selectedTheme === tag ? '1px solid #6366f1' : '1px solid rgba(107, 114, 128, 0.25)',
                    borderRadius: '2rem',
                    color: selectedTheme === tag ? 'white' : '#9ca3af',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedTheme.trim()}
            style={{
              padding: '0.75rem 2rem',
              background: selectedTheme.trim() ? '#6366f1' : '#374151',
              color: selectedTheme.trim() ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: selectedTheme.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            다음
          </button>
        </div>
      )}

      {/* Step 2: Investment Conditions */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>
            Step 2: 투자 조건 입력
          </h2>

          {/* Sentiment 분석 카드 */}
          <div
            style={{
              padding: '1.5rem',
              background: '#111827',
              borderRadius: '0.5rem',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              marginBottom: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '1rem' }}>📊</span>
              <h3 style={{ fontWeight: '700', fontSize: '1rem' }}>
                {selectedTheme} 시장 센티먼트
              </h3>
              <span style={{ fontSize: '0.75rem', background: '#6366f1', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', color: 'white' }}>
                AI 분석
              </span>
            </div>

            {sentimentLoading ? (
              <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>⏳ 뉴스를 분석하는 중...</p>
            ) : sentimentData ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                  <div
                    style={{
                      fontSize: '1.75rem',
                      fontWeight: '700',
                      color: getSentimentColor(sentimentData.overallScore),
                    }}
                  >
                    {getSentimentLabel(sentimentData.overallScore)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ height: '6px', background: '#1f2937', borderRadius: '3px', overflow: 'hidden' }}>
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(0, Math.min(100, (sentimentData.overallScore + 1) * 50))}%`,
                          background: `linear-gradient(90deg, #ef4444, #f59e0b, #10b981)`,
                          transition: 'width 0.5s ease',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#6b7280', marginTop: '0.25rem' }}>
                      <span>부정</span><span>중립</span><span>긍정</span>
                    </div>
                  </div>
                  <span style={{ color: getSentimentColor(sentimentData.overallScore), fontWeight: '600', fontSize: '0.9rem' }}>
                    {(sentimentData.overallScore * 100).toFixed(1)}점
                  </span>
                </div>
                {sentimentData.news?.length > 0 && (
                  <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.15)', paddingTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>최근 뉴스</p>
                    {sentimentData.news.slice(0, 2).map((n, i) => (
                      <div key={i} style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                        <span style={{
                          fontSize: '0.7rem', padding: '0.15rem 0.4rem', borderRadius: '0.2rem',
                          background: n.sentiment === '긍정' ? 'rgba(16,185,129,0.2)' : n.sentiment === '부정' ? 'rgba(239,68,68,0.2)' : 'rgba(107,114,128,0.2)',
                          color: n.sentiment === '긍정' ? '#10b981' : n.sentiment === '부정' ? '#ef4444' : '#9ca3af',
                          whiteSpace: 'nowrap', flexShrink: 0,
                        }}>{n.sentiment}</span>
                        <p style={{ fontSize: '0.8rem', color: '#d1d5db', lineHeight: '1.4' }}>{n.title}</p>
                      </div>
                    ))}
                  </div>
                )}
                <p style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.75rem' }}>
                  ✓ 이 센티먼트 분석 결과가 포트폴리오 생성에 자동으로 반영됩니다
                </p>
              </div>
            ) : (
              <button
                onClick={() => fetchSentiment(selectedTheme)}
                style={{
                  padding: '0.5rem 1rem', background: '#1f2937', color: '#9ca3af',
                  border: '1px solid rgba(107, 114, 128, 0.3)', borderRadius: '0.375rem',
                  cursor: 'pointer', fontSize: '0.875rem',
                }}
              >
                센티먼트 분석하기
              </button>
            )}
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              자연어로 투자 조건을 설명해주세요
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="예: ESG 높고 PER 낮은 기업으로 구성해줘"
              style={{
                width: '100%',
                minHeight: '150px',
                padding: '1rem',
                background: '#1f2937',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '0.375rem',
                color: '#f9fafb',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <p style={{ marginBottom: '1rem', fontSize: '0.875rem', color: '#9ca3af' }}>
              참고 프롬프트:
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
              {EXAMPLE_PROMPTS.map((example, idx) => (
                <button
                  key={idx}
                  onClick={() => setPrompt(example)}
                  style={{
                    padding: '0.5rem 1rem',
                    background: '#1f2937',
                    border: '1px solid rgba(107, 114, 128, 0.3)',
                    borderRadius: '0.375rem',
                    color: '#d1d5db',
                    cursor: 'pointer',
                    fontSize: '0.875rem',
                  }}
                >
                  {example}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setStep(1)}
              style={{
                padding: '0.75rem 2rem',
                background: '#1f2937',
                color: 'white',
                border: '1px solid rgba(107, 114, 128, 0.2)',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              이전
            </button>
            <button
              onClick={handleGeneratePortfolio}
              disabled={!prompt.trim() || loading}
              style={{
                padding: '0.75rem 2rem',
                background: prompt.trim() ? '#6366f1' : '#6b7280',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: prompt.trim() ? 'pointer' : 'not-allowed',
                opacity: prompt.trim() ? 1 : 0.5,
              }}
            >
              {loading ? 'AI 분석 중...' : 'AI 분석 시작'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: AI Portfolio Generation */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>
            Step 3: AI 포트폴리오 생성
          </h2>

          {!portfolioResult && loading && (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</p>
              <p>{loadingStatus || '포트폴리오를 생성하는 중입니다...'}</p>
            </div>
          )}

          {!portfolioResult && !loading && errorMsg && (
            <div
              style={{
                padding: '1.5rem',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '0.5rem',
                color: '#fca5a5',
                marginBottom: '1.5rem',
              }}
            >
              <p style={{ fontWeight: '600', marginBottom: '0.5rem' }}>⚠️ 오류가 발생했습니다</p>
              <p style={{ fontSize: '0.875rem' }}>{errorMsg}</p>
              <button
                onClick={handleGeneratePortfolio}
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1.5rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                  fontWeight: '600',
                }}
              >
                다시 시도
              </button>
            </div>
          )}

          {portfolioResult && (
            <div>
              {/* Sentiment Badge */}
              {sentimentData && (
                <div
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.5rem 1rem', borderRadius: '0.375rem', marginBottom: '1.5rem',
                    background: `${getSentimentColor(sentimentData.overallScore)}20`,
                    border: `1px solid ${getSentimentColor(sentimentData.overallScore)}50`,
                  }}
                >
                  <span style={{ fontSize: '0.875rem' }}>📊 시장 센티먼트 반영됨:</span>
                  <span style={{ fontWeight: '700', color: getSentimentColor(sentimentData.overallScore) }}>
                    {getSentimentLabel(sentimentData.overallScore)} ({(sentimentData.overallScore * 100).toFixed(1)}점)
                  </span>
                </div>
              )}

              {/* Performance Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
                <div style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>예상 수익률</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#10b981' }}>
                    {portfolioResult.expectedReturn.toFixed(2)}%
                  </p>
                </div>
                <div style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>샤프 비율</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#8b5cf6' }}>
                    {portfolioResult.sharpeRatio.toFixed(2)}
                  </p>
                </div>
                <div style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center' }}>
                  <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>변동성</p>
                  <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#f59e0b' }}>
                    {portfolioResult.volatility.toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Allocation Table */}
              <div style={{ marginBottom: '2rem', overflowX: 'auto' }}>
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(107, 114, 128, 0.2)',
                  }}
                >
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(107, 114, 128, 0.2)', background: '#111827' }}>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>종목명</th>
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>비중</th>
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>현재가</th>}
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>등락률</th>}
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>PER</th>}
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>PBR</th>}
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'right', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>시가총액</th>}
                      {kisData && <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>수급 신호</th>}
                      <th style={{ padding: '0.875rem 1rem', textAlign: 'left', fontWeight: '600', fontSize: '0.85rem', color: '#d1d5db' }}>추천이유</th>
                    </tr>
                  </thead>
                  <tbody>
                    {portfolioResult.allocation.map((stock, idx) => {
                      const kisPrice = kisData?.prices.find(
                        (p) => p.name === stock.name || p.stockCode === stock.name
                      );
                      const isUp = kisPrice && kisPrice.changeRate > 0;
                      const isDown = kisPrice && kisPrice.changeRate < 0;
                      const priceColor = isUp ? '#10b981' : isDown ? '#ef4444' : '#9ca3af';

                      // 신호 배지 색상
                      const signalColors: Record<string, string> = {
                        '52주_바닥권': '#10b981',
                        '52주_고점권': '#f59e0b',
                        '저PER_가치주': '#6366f1',
                        '고PER_성장주': '#8b5cf6',
                        'PBR<1_자산저평가': '#06b6d4',
                        '외국인고소진율': '#f97316',
                        '외국인저소진율_여력있음': '#10b981',
                        '단기급등': '#ef4444',
                        '단기급락_역발상고려': '#10b981',
                      };

                      return (
                        <tr
                          key={idx}
                          style={{
                            borderBottom: idx < portfolioResult.allocation.length - 1 ? '1px solid rgba(107, 114, 128, 0.15)' : 'none',
                          }}
                        >
                          <td style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>
                            {stock.name}
                          </td>
                          <td style={{ padding: '1rem', textAlign: 'right', color: '#6366f1', fontWeight: '700' }}>
                            {stock.allocation.toFixed(1)}%
                          </td>
                          {kisData && (
                            <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>
                              {kisPrice ? `${kisPrice.currentPrice.toLocaleString()}원` : '-'}
                            </td>
                          )}
                          {kisData && (
                            <td style={{ padding: '1rem', textAlign: 'right', color: priceColor, fontWeight: '600' }}>
                              {kisPrice
                                ? `${kisPrice.changeRate >= 0 ? '+' : ''}${kisPrice.changeRate.toFixed(2)}%`
                                : '-'}
                            </td>
                          )}
                          {kisData && (
                            <td style={{ padding: '1rem', textAlign: 'right', color: '#a78bfa' }}>
                              {kisPrice?.per ? kisPrice.per.toFixed(1) : '-'}
                            </td>
                          )}
                          {kisData && (
                            <td style={{ padding: '1rem', textAlign: 'right', color: '#a78bfa' }}>
                              {kisPrice?.pbr ? kisPrice.pbr.toFixed(2) : '-'}
                            </td>
                          )}
                          {kisData && (
                            <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#9ca3af' }}>
                              {kisPrice?.marketCap
                                ? kisPrice.marketCap >= 10000
                                  ? `${(kisPrice.marketCap / 10000).toFixed(1)}조`
                                  : `${kisPrice.marketCap.toLocaleString()}억`
                                : '-'}
                            </td>
                          )}
                          {kisData && (
                            <td style={{ padding: '0.75rem 1rem', textAlign: 'left', minWidth: '160px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                {/* 52주 위치 바 */}
                                {kisPrice?.position52w != null && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <div style={{ width: '60px', height: '4px', background: '#374151', borderRadius: '2px', overflow: 'hidden', flexShrink: 0 }}>
                                      <div style={{ height: '100%', width: `${kisPrice.position52w}%`, background: kisPrice.position52w <= 20 ? '#10b981' : kisPrice.position52w >= 80 ? '#f59e0b' : '#6366f1' }} />
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: '#6b7280' }}>{kisPrice.position52w}%</span>
                                  </div>
                                )}
                                {/* 수급 동향 배지 */}
                                {kisPrice?.foreignTrend && (
                                  <span style={{
                                    fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '0.2rem',
                                    background: kisPrice.foreignTrend.includes('순매수') ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: kisPrice.foreignTrend.includes('순매수') ? '#10b981' : '#ef4444',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    외국인 {kisPrice.foreignTrend.includes('순매수') ? '▲' : kisPrice.foreignTrend.includes('순매도') ? '▼' : '─'}
                                  </span>
                                )}
                                {kisPrice?.institutionTrend && (
                                  <span style={{
                                    fontSize: '0.65rem', padding: '0.15rem 0.35rem', borderRadius: '0.2rem',
                                    background: kisPrice.institutionTrend.includes('순매수') ? 'rgba(99,102,241,0.15)' : 'rgba(239,68,68,0.15)',
                                    color: kisPrice.institutionTrend.includes('순매수') ? '#818cf8' : '#ef4444',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    기관 {kisPrice.institutionTrend.includes('순매수') ? '▲' : kisPrice.institutionTrend.includes('순매도') ? '▼' : '─'}
                                  </span>
                                )}
                                {/* 가격 신호 배지 */}
                                {(kisPrice?.signals || []).slice(0, 2).map((sig) => (
                                  <span key={sig} style={{
                                    fontSize: '0.6rem', padding: '0.1rem 0.3rem', borderRadius: '0.15rem',
                                    background: `${signalColors[sig] || '#6b7280'}20`,
                                    color: signalColors[sig] || '#9ca3af',
                                    whiteSpace: 'nowrap',
                                  }}>
                                    {sig.replace(/_/g, ' ')}
                                  </span>
                                ))}
                                {!kisPrice && <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>-</span>}
                              </div>
                            </td>
                          )}
                          <td style={{ padding: '1rem', textAlign: 'left', color: '#9ca3af', fontSize: '0.8rem', maxWidth: '300px' }}>
                            {stock.reason}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {kisData && (
                  <p style={{ fontSize: '0.7rem', color: '#4b5563', marginTop: '0.5rem', textAlign: 'right' }}>
                    📡 실시간 시세: KIS 한국투자증권 API
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={() => setStep(2)}
                  style={{
                    padding: '0.75rem 2rem', background: '#1f2937', color: 'white',
                    border: '1px solid rgba(107, 114, 128, 0.2)', borderRadius: '0.375rem',
                    fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  이전
                </button>
                <button
                  onClick={() => setStep(4)}
                  style={{
                    padding: '0.75rem 2rem', background: '#6366f1', color: 'white',
                    border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer',
                  }}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Save Portfolio */}
      {step === 4 && (
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '2rem' }}>
            Step 4: 포트폴리오 저장
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600' }}>
              포트폴리오 이름
            </label>
            <input
              type="text"
              value={portfolioName}
              onChange={(e) => setPortfolioName(e.target.value)}
              placeholder="예: 2026년 AI반도체 포트폴리오"
              style={{
                width: '100%',
                padding: '0.75rem',
                background: '#1f2937',
                border: '1px solid rgba(107, 114, 128, 0.3)',
                borderRadius: '0.375rem',
                color: '#f9fafb',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setStep(3)}
              style={{
                padding: '0.75rem 2rem', background: '#1f2937', color: 'white',
                border: '1px solid rgba(107, 114, 128, 0.2)', borderRadius: '0.375rem',
                fontWeight: '600', cursor: 'pointer',
              }}
            >
              이전
            </button>
            <button
              onClick={handleSavePortfolio}
              disabled={!portfolioName.trim() || loading}
              style={{
                padding: '0.75rem 2rem',
                background: portfolioName.trim() ? '#6366f1' : '#6b7280',
                color: 'white', border: 'none', borderRadius: '0.375rem',
                fontWeight: '600',
                cursor: portfolioName.trim() ? 'pointer' : 'not-allowed',
                opacity: portfolioName.trim() ? 1 : 0.5,
              }}
            >
              {loading ? '저장 중...' : '포트폴리오 저장'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
