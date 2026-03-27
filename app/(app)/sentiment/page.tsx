'use client';

import { useState } from 'react';

interface NewsItem {
  title: string;
  summary: string;
  sentiment: '긍정' | '부정' | '중립';
  score: number;
}

interface SentimentResult {
  overallScore: number;
  news: NewsItem[];
}

interface DartDisclosure {
  rcept_no: string;
  corp_name: string;
  report_nm: string;
  rcept_dt: string;
  rm: string;
}

export default function SentimentPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SentimentResult | null>(null);
  const [disclosures, setDisclosures] = useState<DartDisclosure[]>([]);
  const [dartLoading, setDartLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!query.trim()) return;

    setLoading(true);
    setDartLoading(true);

    // OpenDart 공시 데이터와 뉴스 Sentiment 병렬 조회
    try {
      const [sentimentRes, dartRes] = await Promise.all([
        fetch('/api/sentiment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        }),
        fetch('/api/opendart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'disclosures', query }),
        }),
      ]);

      const [sentimentData, dartData] = await Promise.all([
        sentimentRes.json(),
        dartRes.json(),
      ]);

      setResult(sentimentData);
      setDisclosures(dartData.disclosures || []);
    } catch (error) {
      console.error('Failed to analyze:', error);
    } finally {
      setLoading(false);
      setDartLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    if (sentiment === '긍정') return '#10b981';
    if (sentiment === '부정') return '#ef4444';
    return '#6b7280';
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '2rem' }}>
        Sentiment 분석
      </h1>

      {/* Search Section */}
      <div
        style={{
          padding: '2rem',
          background: '#1f2937',
          borderRadius: '0.5rem',
          border: '1px solid rgba(107, 114, 128, 0.2)',
          marginBottom: '2rem',
        }}
      >
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
          분석할 키워드를 입력하세요
        </label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAnalyze()}
            placeholder="예: 삼성전자, AI 반도체, ESG 펀드"
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#111827',
              border: '1px solid rgba(107, 114, 128, 0.3)',
              borderRadius: '0.375rem',
              color: '#f9fafb',
              fontSize: '0.95rem',
            }}
          />
          <button
            onClick={handleAnalyze}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? '분석 중...' : '분석하기'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>뉴스를 수집하고 분석하는 중입니다...</p>
          <p style={{ marginTop: '1rem', fontSize: '2rem' }}>⏳</p>
        </div>
      )}

      {result && !loading && (
        <div>
          {/* Overall Score */}
          <div
            style={{
              padding: '2rem',
              background: '#1f2937',
              borderRadius: '0.5rem',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              marginBottom: '2rem',
              textAlign: 'center',
            }}
          >
            <p style={{ color: '#9ca3af', marginBottom: '0.5rem', fontSize: '0.875rem' }}>전체 센티먼트 점수</p>
            <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '1rem' }}>
              -100 (매우 부정) ~ 0 (중립) ~ +100 (매우 긍정)
            </p>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.75rem' }}>
              <p
                style={{
                  fontSize: '3.5rem',
                  fontWeight: '700',
                  color: getSentimentColor(
                    result.overallScore > 0.3
                      ? '긍정'
                      : result.overallScore < -0.3
                        ? '부정'
                        : '중립'
                  ),
                  lineHeight: 1,
                }}
              >
                {result.overallScore >= 0 ? '+' : ''}{(result.overallScore * 100).toFixed(1)}
              </p>
              <span style={{
                fontSize: '1rem', fontWeight: '600',
                color: getSentimentColor(
                  result.overallScore > 0.3 ? '긍정' : result.overallScore < -0.3 ? '부정' : '중립'
                ),
              }}>
                {result.overallScore > 0.3 ? '긍정적' : result.overallScore < -0.3 ? '부정적' : '중립적'}
              </span>
            </div>

            {/* Sentiment Gauge */}
            <div style={{ marginTop: '1.5rem', position: 'relative' }}>
              {/* Gauge bar */}
              <div style={{ height: '10px', background: '#111827', borderRadius: '5px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    background: `linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, #10b981 100%)`,
                    width: '100%',
                  }}
                />
              </div>
              {/* Pointer */}
              <div style={{
                position: 'absolute',
                top: '-4px',
                left: `${Math.max(2, Math.min(98, (result.overallScore + 1) * 50))}%`,
                transform: 'translateX(-50%)',
                width: '18px',
                height: '18px',
                background: 'white',
                borderRadius: '50%',
                border: `3px solid ${getSentimentColor(result.overallScore > 0.3 ? '긍정' : result.overallScore < -0.3 ? '부정' : '중립')}`,
                boxShadow: '0 0 6px rgba(0,0,0,0.4)',
              }} />
            </div>

            {/* Scale labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', fontSize: '0.75rem' }}>
              <div style={{ textAlign: 'left' }}>
                <span style={{ color: '#ef4444', fontWeight: '600' }}>-100</span>
                <span style={{ color: '#6b7280', marginLeft: '0.3rem' }}>매우 부정</span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ color: '#f59e0b', fontWeight: '600' }}>0</span>
                <span style={{ color: '#6b7280', marginLeft: '0.3rem' }}>중립</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ color: '#6b7280', marginRight: '0.3rem' }}>매우 긍정</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>+100</span>
              </div>
            </div>

            {/* Score description */}
            <div style={{
              marginTop: '1.25rem', padding: '0.75rem 1rem',
              background: '#111827', borderRadius: '0.375rem',
              fontSize: '0.8rem', color: '#9ca3af', textAlign: 'left', lineHeight: '1.6',
            }}>
              <span style={{ color: '#d1d5db', fontWeight: '600' }}>점수 기준 안내</span>
              <span style={{ margin: '0 0.5rem', color: '#374151' }}>|</span>
              <span style={{ color: '#ef4444' }}>-100 ~ -30</span> 부정적 &nbsp;
              <span style={{ color: '#f59e0b' }}>-30 ~ +30</span> 중립 &nbsp;
              <span style={{ color: '#10b981' }}>+30 ~ +100</span> 긍정적
            </div>
          </div>

          {/* OpenDart 공시 섹션 */}
          {disclosures.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📋 OpenDart 공식 공시
                <span style={{ fontSize: '0.75rem', background: '#6366f1', padding: '0.2rem 0.5rem', borderRadius: '0.25rem', fontWeight: '500' }}>
                  금융감독원
                </span>
              </h2>
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {disclosures.slice(0, 5).map((item, idx) => (
                  <a
                    key={idx}
                    href={`https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${item.rcept_no}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        padding: '1rem 1.5rem',
                        background: '#111827',
                        borderRadius: '0.5rem',
                        border: '1px solid rgba(99, 102, 241, 0.3)',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <p style={{ fontWeight: '600', color: '#f9fafb', marginBottom: '0.25rem' }}>
                          {item.report_nm}
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          {item.corp_name} · {item.rcept_dt?.replace(/(\d{4})(\d{2})(\d{2})/, '$1.$2.$3')}
                        </p>
                      </div>
                      <span style={{ color: '#6366f1', fontSize: '0.875rem' }}>→</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* News Cards */}
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>
              분석 결과 ({result.news.length}개)
            </h2>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {result.news.map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '1.5rem',
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(107, 114, 128, 0.2)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: '600', flex: 1 }}>
                      {item.title}
                    </h3>
                    <span
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: getSentimentColor(item.sentiment),
                        color: 'white',
                        borderRadius: '0.25rem',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        marginLeft: '1rem',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.sentiment}
                    </span>
                  </div>
                  <p style={{ color: '#d1d5db', marginBottom: '0.75rem', lineHeight: '1.5' }}>
                    {item.summary}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div
                      style={{
                        height: '4px',
                        width: '200px',
                        background: '#111827',
                        borderRadius: '2px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${Math.max(0, Math.min(100, (item.score + 1) * 50))}%`,
                          background: getSentimentColor(item.sentiment),
                        }}
                      />
                    </div>
                    <span style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                      {(item.score * 100).toFixed(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {!result && !loading && (
        <div
          style={{
            padding: '2rem',
            background: '#1f2937',
            borderRadius: '0.5rem',
            border: '1px solid rgba(107, 114, 128, 0.2)',
            textAlign: 'center',
            color: '#9ca3af',
          }}
        >
          <p>분석할 키워드를 입력하고 "분석하기" 버튼을 클릭하세요.</p>
        </div>
      )}
    </div>
  );
}
