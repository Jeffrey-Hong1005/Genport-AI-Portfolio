'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { db } from '@/lib/firebase';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import Link from 'next/link';

interface StockAllocation {
  name: string;
  allocation: number;
  reason: string;
}

interface Portfolio {
  id: string;
  name: string;
  theme: string;
  createdAt: Date;
  stocks: number;
  allocation: StockAllocation[];
  expectedReturn: number;
  sharpeRatio: number;
  volatility: number;
  sentimentScore: number | null;
  hasKisData: boolean;
  basePrices?: Record<string, number>;
  basePriceAt?: Date;
}

interface KisPrice {
  stockCode: string;
  name: string;
  currentPrice: number;
  changeRate: number;
  marketCap: number;
  per: number;
  pbr: number;
  foreignRate: number;
}

export default function PortfolioDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [prices, setPrices] = useState<KisPrice[]>([]);
  const [pricesLoading, setPricesLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Firestore에서 포트폴리오 로드
  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const snap = await getDoc(doc(db, 'portfolios', id));
        if (!snap.exists()) { router.push('/portfolio'); return; }
        setPortfolio({
          id: snap.id,
          ...snap.data(),
          createdAt: snap.data().createdAt?.toDate(),
          basePriceAt: snap.data().basePriceAt?.toDate(),
        } as Portfolio);
      } catch (e) {
        console.error('포트폴리오 로드 실패:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  // KIS 실시간 시세 조회
  useEffect(() => {
    if (!portfolio?.allocation?.length) return;
    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        // company-database에서 종목명 → stockCode 매핑
        const { getByName } = await import('@/lib/company-database');
        const stockCodes = portfolio.allocation
          .map((s) => getByName(s.name)?.stockCode)
          .filter(Boolean) as string[];

        if (stockCodes.length === 0) return;

        const res = await fetch('/api/kis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'prices', stockCodes }),
        });
        if (!res.ok) return;

        const data = await res.json();
        const codeToName: Record<string, string> = {};
        portfolio.allocation.forEach((s) => {
          const code = getByName(s.name)?.stockCode;
          if (code) codeToName[code] = s.name;
        });
        setPrices(
          (data.prices || []).map((p: KisPrice) => ({
            ...p,
            name: codeToName[p.stockCode] || p.stockCode,
          }))
        );
      } catch (e) {
        console.warn('실시간 시세 조회 실패:', e);
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
  }, [portfolio]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, 'portfolios', id));
      router.push('/portfolio');
    } catch (e) {
      console.error('삭제 실패:', e);
    }
  };

  const getSentimentLabel = (score: number | null) => {
    if (score === null) return null;
    if (score > 0.3) return { label: '긍정적', color: '#10b981' };
    if (score < -0.3) return { label: '부정적', color: '#ef4444' };
    return { label: '중립적', color: '#f59e0b' };
  };

  const getPriceForStock = (name: string) =>
    prices.find((p) => p.name === name);

  if (loading) {
    return (
      <div style={{ padding: '2rem', color: '#9ca3af', textAlign: 'center' }}>
        <p>포트폴리오를 불러오는 중...</p>
      </div>
    );
  }

  if (!portfolio) return null;

  const sentiment = getSentimentLabel(portfolio.sentimentScore);
  const totalAllocation = portfolio.allocation?.reduce((s, a) => s + a.allocation, 0) ?? 0;

  return (
    <div style={{ padding: '2rem', maxWidth: '1100px' }}>

      {/* 헤더 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link href="/portfolio" style={{ color: '#6b7280', textDecoration: 'none', fontSize: '0.875rem' }}>
              ← 목록으로
            </Link>
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: '700', marginBottom: '0.375rem' }}>
            {portfolio.name}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ background: '#312e81', color: '#a5b4fc', padding: '0.25rem 0.75rem', borderRadius: '2rem', fontSize: '0.8rem', fontWeight: '600' }}>
              {portfolio.theme}
            </span>
            <span style={{ color: '#6b7280', fontSize: '0.8rem' }}>
              {portfolio.createdAt?.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
            {sentiment && (
              <span style={{ color: sentiment.color, fontSize: '0.8rem', fontWeight: '600' }}>
                📊 {sentiment.label} 시장
              </span>
            )}
          </div>
        </div>

        {/* 삭제 버튼 */}
        <div>
          {!deleteConfirm ? (
            <button
              onClick={() => setDeleteConfirm(true)}
              style={{ padding: '0.5rem 1.25rem', background: 'transparent', color: '#ef4444', border: '1px solid #ef4444', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
            >
              삭제
            </button>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleDelete}
                style={{ padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}
              >
                확인 삭제
              </button>
              <button
                onClick={() => setDeleteConfirm(false)}
                style={{ padding: '0.5rem 1rem', background: '#374151', color: 'white', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontSize: '0.875rem' }}
              >
                취소
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 핵심 지표 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        {[
          { label: '예상 수익률', value: `${portfolio.expectedReturn?.toFixed(2) ?? '—'}%`, color: '#10b981' },
          { label: '샤프 비율', value: portfolio.sharpeRatio?.toFixed(2) ?? '—', color: '#8b5cf6' },
          { label: '변동성', value: `${portfolio.volatility?.toFixed(2) ?? '—'}%`, color: '#f59e0b' },
          { label: '종목 수', value: `${portfolio.stocks ?? portfolio.allocation?.length ?? '—'}개`, color: '#6366f1' },
        ].map((m) => (
          <div key={m.label} style={{ padding: '1.25rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)', textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', fontSize: '0.8rem', marginBottom: '0.5rem' }}>{m.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: '700', color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* 비중 시각화 바 */}
      {portfolio.allocation?.length > 0 && (
        <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700', marginBottom: '1rem' }}>종목 비중 분포</h2>
          <div style={{ display: 'flex', height: '28px', borderRadius: '6px', overflow: 'hidden', gap: '2px' }}>
            {portfolio.allocation.map((stock, idx) => {
              const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
              return (
                <div
                  key={idx}
                  title={`${stock.name}: ${stock.allocation.toFixed(1)}%`}
                  style={{
                    width: `${stock.allocation}%`,
                    background: COLORS[idx % COLORS.length],
                    transition: 'opacity 0.2s',
                    cursor: 'default',
                  }}
                />
              );
            })}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', marginTop: '0.875rem' }}>
            {portfolio.allocation.map((stock, idx) => {
              const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                  <span style={{ fontSize: '0.8rem', color: '#d1d5db' }}>{stock.name}</span>
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>{stock.allocation.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 종목 상세 테이블 */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '700' }}>종목별 상세</h2>
          {pricesLoading && (
            <span style={{ fontSize: '0.8rem', color: '#9ca3af' }}>📡 실시간 시세 조회 중...</span>
          )}
          {prices.length > 0 && !pricesLoading && (
            <span style={{ fontSize: '0.75rem', color: '#4b5563' }}>
              📡 KIS 실시간 시세 반영
              {portfolio.basePriceAt && (
                <span style={{ marginLeft: '0.5rem', color: '#6366f1' }}>
                  · 기준가 {portfolio.basePriceAt.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })} 대비
                </span>
              )}
            </span>
          )}
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: '#1f2937', borderRadius: '0.5rem', border: '1px solid rgba(107, 114, 128, 0.2)' }}>
            <thead>
              <tr style={{ background: '#111827', borderBottom: '1px solid rgba(107, 114, 128, 0.2)' }}>
                {[
                  '종목명', '비중',
                  ...(prices.length > 0 ? ['현재가', '등락률', ...(portfolio.basePrices && Object.keys(portfolio.basePrices).length > 0 ? ['수익률'] : []), 'PER', 'PBR', '시가총액'] : []),
                  '추천 이유',
                ].map((h) => (
                  <th key={h} style={{ padding: '0.875rem 1rem', textAlign: h === '비중' || h === '현재가' || h === '등락률' || h === '수익률' || h === 'PER' || h === 'PBR' || h === '시가총액' ? 'right' : 'left', fontSize: '0.8rem', fontWeight: '600', color: h === '수익률' ? '#6366f1' : '#9ca3af', whiteSpace: 'nowrap' }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {portfolio.allocation?.map((stock, idx) => {
                const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
                const price = getPriceForStock(stock.name);
                const isUp = price && price.changeRate > 0;
                const isDown = price && price.changeRate < 0;
                const priceColor = isUp ? '#10b981' : isDown ? '#ef4444' : '#9ca3af';

                // 수익률 계산
                const basePrice = portfolio.basePrices?.[stock.name];
                const hasReturn = basePrice && basePrice > 0 && price?.currentPrice && price.currentPrice > 0;
                const stockReturn = hasReturn ? ((price!.currentPrice - basePrice) / basePrice) * 100 : null;
                const returnColor = stockReturn != null ? (stockReturn > 0 ? '#10b981' : stockReturn < 0 ? '#ef4444' : '#9ca3af') : '#6b7280';
                const hasBasePrices = portfolio.basePrices && Object.keys(portfolio.basePrices).length > 0;

                return (
                  <tr key={idx} style={{ borderBottom: idx < portfolio.allocation.length - 1 ? '1px solid rgba(107,114,128,0.12)' : 'none' }}>
                    {/* 종목명 */}
                    <td style={{ padding: '1rem', fontWeight: '600' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[idx % COLORS.length], flexShrink: 0 }} />
                        {stock.name}
                      </div>
                    </td>
                    {/* 비중 */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <div style={{ width: '60px', height: '6px', background: '#111827', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${(stock.allocation / totalAllocation) * 100}%`, height: '100%', background: COLORS[idx % COLORS.length] }} />
                        </div>
                        <span style={{ fontWeight: '700', color: COLORS[idx % COLORS.length], minWidth: '44px' }}>
                          {stock.allocation.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    {/* KIS 실시간 데이터 */}
                    {prices.length > 0 && (
                      <>
                        <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {price ? `${price.currentPrice.toLocaleString()}원` : <span style={{ color: '#4b5563' }}>—</span>}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: priceColor, fontWeight: '600', whiteSpace: 'nowrap' }}>
                          {price ? `${price.changeRate >= 0 ? '+' : ''}${price.changeRate.toFixed(2)}%` : <span style={{ color: '#4b5563' }}>—</span>}
                        </td>
                        {/* 수익률 (기준가 있을 때만) */}
                        {hasBasePrices && (
                          <td style={{ padding: '1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                            {stockReturn != null ? (
                              <span style={{ fontWeight: '700', color: returnColor, fontSize: '0.9rem' }}>
                                {stockReturn > 0 ? '+' : ''}{stockReturn.toFixed(2)}%
                              </span>
                            ) : (
                              <span style={{ color: '#4b5563', fontSize: '0.8rem' }}>
                                {pricesLoading ? '…' : '—'}
                              </span>
                            )}
                          </td>
                        )}
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#a78bfa', whiteSpace: 'nowrap' }}>
                          {price?.per ? price.per.toFixed(1) : <span style={{ color: '#4b5563' }}>—</span>}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', color: '#a78bfa', whiteSpace: 'nowrap' }}>
                          {price?.pbr ? price.pbr.toFixed(2) : <span style={{ color: '#4b5563' }}>—</span>}
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'right', fontSize: '0.8rem', color: '#9ca3af', whiteSpace: 'nowrap' }}>
                          {price?.marketCap
                            ? price.marketCap >= 10000
                              ? `${(price.marketCap / 10000).toFixed(1)}조`
                              : `${price.marketCap.toLocaleString()}억`
                            : <span style={{ color: '#4b5563' }}>—</span>}
                        </td>
                      </>
                    )}
                    {/* 추천 이유 */}
                    <td style={{ padding: '1rem', color: '#9ca3af', fontSize: '0.825rem', lineHeight: '1.6', maxWidth: '360px' }}>
                      {stock.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 하단 액션 */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <Link href="/builder">
          <button style={{ padding: '0.75rem 1.5rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}>
            + 새 포트폴리오 만들기
          </button>
        </Link>
        <Link href="/portfolio">
          <button style={{ padding: '0.75rem 1.5rem', background: '#1f2937', color: '#d1d5db', border: '1px solid rgba(107,114,128,0.3)', borderRadius: '0.375rem', fontWeight: '600', cursor: 'pointer' }}>
            목록으로
          </button>
        </Link>
      </div>
    </div>
  );
}
