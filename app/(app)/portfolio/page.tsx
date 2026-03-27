'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import Link from 'next/link';

interface Portfolio {
  id: string;
  name: string;
  theme: string;
  createdAt: Date;
  stocks: number;
  expectedReturn?: number;
  sharpeRatio?: number;
  volatility?: number;
  sentimentScore?: number | null;
  allocation?: { name: string; allocation: number }[];
  basePrices?: Record<string, number>;   // 저장 시점 기준가
  basePriceAt?: Date;
}

// 포트폴리오 실현 수익률 계산 (가중평균)
function calcReturn(
  allocation: { name: string; allocation: number }[],
  basePrices: Record<string, number>,
  currentPrices: Record<string, number>,
): number | null {
  let weightedReturn = 0;
  let totalWeight = 0;

  for (const stock of allocation) {
    const base = basePrices[stock.name];
    const current = currentPrices[stock.name];
    if (base && base > 0 && current && current > 0) {
      weightedReturn += ((current - base) / base) * 100 * (stock.allocation / 100);
      totalWeight += stock.allocation;
    }
  }

  return totalWeight > 0 ? weightedReturn / (totalWeight / 100) : null;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  // 포트폴리오 ID → 실현 수익률
  const [returns, setReturns] = useState<Record<string, number | null>>({});
  const [returnsLoading, setReturnsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const loadPortfolios = async () => {
      try {
        const q = query(collection(db, 'portfolios'), where('userId', '==', user.uid));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
          createdAt: d.data().createdAt?.toDate(),
          basePriceAt: d.data().basePriceAt?.toDate(),
        } as Portfolio));
        const sorted = data.sort((a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        setPortfolios(sorted);
      } catch (error) {
        console.error('Failed to load portfolios:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPortfolios();
  }, [user]);

  // 포트폴리오 목록 로드 후 실현 수익률 계산
  const fetchReturns = useCallback(async (portfolioList: Portfolio[]) => {
    const withBase = portfolioList.filter(
      (p) => p.basePrices && Object.keys(p.basePrices).length > 0 && p.allocation?.length,
    );
    if (withBase.length === 0) return;

    setReturnsLoading(true);
    try {
      // 모든 포트폴리오에 등장하는 종목명 수집 → stockCode 조회
      const { getByName } = await import('@/lib/company-database');
      const allNames = [...new Set(withBase.flatMap((p) => p.allocation?.map((s) => s.name) || []))];
      const stockCodes = allNames.map((n) => getByName(n)?.stockCode).filter(Boolean) as string[];

      if (stockCodes.length === 0) return;

      const res = await fetch('/api/kis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'prices', stockCodes }),
      });
      if (!res.ok) return;

      const { prices } = await res.json();

      // stockCode → 현재가 매핑
      const codeToPrice: Record<string, number> = {};
      for (const p of prices || []) {
        codeToPrice[p.stockCode] = p.currentPrice;
      }

      // 종목명 → 현재가 매핑 (이름으로 stockCode 거쳐서)
      const nameToCurrentPrice: Record<string, number> = {};
      for (const name of allNames) {
        const code = getByName(name)?.stockCode;
        if (code && codeToPrice[code]) {
          nameToCurrentPrice[name] = codeToPrice[code];
        }
      }

      // 포트폴리오별 수익률 계산
      const newReturns: Record<string, number | null> = {};
      for (const p of withBase) {
        newReturns[p.id] = calcReturn(p.allocation!, p.basePrices!, nameToCurrentPrice);
      }
      setReturns(newReturns);
    } catch (e) {
      console.warn('수익률 계산 실패:', e);
    } finally {
      setReturnsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (portfolios.length > 0) fetchReturns(portfolios);
  }, [portfolios, fetchReturns]);

  const handleDelete = async (portfolioId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'portfolios', portfolioId));
      setPortfolios(portfolios.filter((p) => p.id !== portfolioId));
    } catch (error) {
      console.error('Failed to delete portfolio:', error);
    }
  };

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'];

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700' }}>내 포트폴리오</h1>
        <Link href="/builder">
          <button style={{ padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}>
            새 포트폴리오 만들기
          </button>
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#9ca3af' }}>로딩 중...</p>
      ) : portfolios.length === 0 ? (
        <div style={{ padding: '3rem 2rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center', color: '#9ca3af' }}>
          <p style={{ marginBottom: '1rem' }}>아직 생성된 포트폴리오가 없습니다.</p>
          <p style={{ fontSize: '0.875rem' }}>새로운 포트폴리오를 만들어보세요!</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {portfolios.map((portfolio) => {
            const ret = returns[portfolio.id];
            const hasReturn = ret != null;
            const retColor = ret && ret > 0 ? '#10b981' : ret && ret < 0 ? '#ef4444' : '#9ca3af';

            return (
              <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}>
                <div
                  style={{ padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', cursor: 'pointer', transition: 'all 0.2s', height: '100%', display: 'flex', flexDirection: 'column' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#2d3748'; e.currentTarget.style.borderColor = '#6366f1'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#1f2937'; e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.2)'; }}
                >
                  {/* 헤더: 이름 + 수익률 배지 */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f9fafb', flex: 1, marginRight: '0.5rem' }}>
                      {portfolio.name}
                    </h3>
                    {/* 실현 수익률 배지 */}
                    {hasReturn ? (
                      <div style={{ flexShrink: 0, padding: '0.25rem 0.6rem', borderRadius: '0.375rem', background: ret! > 0 ? 'rgba(16,185,129,0.15)' : ret! < 0 ? 'rgba(239,68,68,0.15)' : 'rgba(107,114,128,0.15)', border: `1px solid ${retColor}40` }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: retColor }}>
                          {ret! > 0 ? '+' : ''}{ret!.toFixed(2)}%
                        </span>
                      </div>
                    ) : portfolio.basePrices && Object.keys(portfolio.basePrices).length > 0 ? (
                      <div style={{ flexShrink: 0, padding: '0.25rem 0.6rem', borderRadius: '0.375rem', background: 'rgba(107,114,128,0.1)' }}>
                        <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {returnsLoading ? '계산중...' : '—'}
                        </span>
                      </div>
                    ) : null}
                  </div>

                  {/* 테마 + 센티먼트 */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                    <span style={{ background: '#312e81', color: '#a5b4fc', padding: '0.15rem 0.6rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: '600' }}>
                      {portfolio.theme}
                    </span>
                    {portfolio.sentimentScore != null && (
                      <span style={{ fontSize: '0.75rem', color: portfolio.sentimentScore > 0.3 ? '#10b981' : portfolio.sentimentScore < -0.3 ? '#ef4444' : '#f59e0b' }}>
                        {portfolio.sentimentScore > 0.3 ? '📈' : portfolio.sentimentScore < -0.3 ? '📉' : '➡️'}
                      </span>
                    )}
                    {/* 기준가 있으면 추적 중 표시 */}
                    {portfolio.basePrices && Object.keys(portfolio.basePrices).length > 0 && (
                      <span style={{ fontSize: '0.65rem', color: '#6366f1', background: 'rgba(99,102,241,0.1)', padding: '0.1rem 0.4rem', borderRadius: '0.25rem' }}>
                        추적중
                      </span>
                    )}
                  </div>

                  {/* 비중 미니 바 */}
                  {portfolio.allocation && portfolio.allocation.length > 0 && (
                    <div style={{ display: 'flex', height: '6px', borderRadius: '3px', overflow: 'hidden', gap: '1px', marginBottom: '1rem' }}>
                      {portfolio.allocation.slice(0, 8).map((s, i) => (
                        <div key={i} style={{ width: `${s.allocation}%`, background: COLORS[i % COLORS.length] }} />
                      ))}
                    </div>
                  )}

                  {/* 지표 그리드 */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#111827', borderRadius: '0.375rem' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.65rem', marginBottom: '0.2rem' }}>AI 예상</p>
                      <p style={{ fontSize: '1rem', fontWeight: '700', color: '#10b981' }}>
                        {portfolio.expectedReturn != null ? `${portfolio.expectedReturn.toFixed(1)}%` : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#111827', borderRadius: '0.375rem' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.65rem', marginBottom: '0.2rem' }}>샤프</p>
                      <p style={{ fontSize: '1rem', fontWeight: '700', color: '#8b5cf6' }}>
                        {portfolio.sharpeRatio != null ? portfolio.sharpeRatio.toFixed(2) : '—'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'center', padding: '0.5rem', background: '#111827', borderRadius: '0.375rem' }}>
                      <p style={{ color: '#6b7280', fontSize: '0.65rem', marginBottom: '0.2rem' }}>종목</p>
                      <p style={{ fontSize: '1rem', fontWeight: '700', color: '#6366f1' }}>
                        {portfolio.stocks ?? portfolio.allocation?.length ?? '—'}개
                      </p>
                    </div>
                  </div>

                  {/* 상위 종목 */}
                  {portfolio.allocation && portfolio.allocation.length > 0 && (
                    <div style={{ marginBottom: '0.875rem' }}>
                      <p style={{ fontSize: '0.7rem', color: '#6b7280', marginBottom: '0.4rem' }}>상위 종목</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
                        {portfolio.allocation.slice(0, 4).map((s, i) => (
                          <span key={i} style={{ fontSize: '0.72rem', background: '#374151', color: '#d1d5db', padding: '0.15rem 0.5rem', borderRadius: '0.25rem' }}>
                            {s.name} {s.allocation.toFixed(0)}%
                          </span>
                        ))}
                        {portfolio.allocation.length > 4 && (
                          <span style={{ fontSize: '0.72rem', color: '#6b7280', padding: '0.15rem 0.25rem' }}>
                            +{portfolio.allocation.length - 4}개
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <p style={{ color: '#4b5563', fontSize: '0.72rem', marginBottom: '0.875rem' }}>
                    {portfolio.createdAt?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })}
                    {portfolio.basePriceAt && (
                      <span style={{ marginLeft: '0.5rem', color: '#374151' }}>
                        · 기준가 {portfolio.basePriceAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </span>
                    )}
                  </p>

                  <button
                    onClick={(e) => { e.preventDefault(); handleDelete(portfolio.id); }}
                    style={{ width: '100%', padding: '0.5rem', background: 'transparent', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.8rem', fontWeight: '500' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    삭제
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
