'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Link from 'next/link';

interface Portfolio {
  id: string;
  name: string;
  theme: string;
  createdAt: Date;
  stocks: number;
  expectedReturn?: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadPortfolios = async () => {
      try {
        const q = query(
          collection(db, 'portfolios'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
        } as Portfolio));
        setPortfolios(data);
      } catch (error) {
        console.error('Failed to load portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolios();
  }, [user]);

  return (
    <div style={{ padding: '2rem' }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: '3rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '0.5rem' }}>
          안녕하세요, {user?.displayName || '사용자'}님
        </h1>
        <p style={{ color: '#9ca3af' }}>당신의 포트폴리오 대시보드에 오신 것을 환영합니다.</p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <div
          style={{
            padding: '1.5rem',
            background: '#1f2937',
            borderRadius: '0.5rem',
            border: '1px solid rgba(107, 114, 128, 0.2)',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            생성한 포트폴리오 수
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#6366f1' }}>
            {portfolios.length}
          </p>
        </div>
        <div
          style={{
            padding: '1.5rem',
            background: '#1f2937',
            borderRadius: '0.5rem',
            border: '1px solid rgba(107, 114, 128, 0.2)',
          }}
        >
          <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
            최근 분석
          </p>
          <p style={{ fontSize: '2rem', fontWeight: '700', color: '#8b5cf6' }}>
            {portfolios.length > 0 ? '완료' : '-'}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <Link href="/builder">
          <button
            style={{
              width: '100%',
              padding: '1rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            새 포트폴리오 만들기
          </button>
        </Link>
        <Link href="/sentiment">
          <button
            style={{
              width: '100%',
              padding: '1rem',
              background: '#1f2937',
              color: 'white',
              border: '1px solid rgba(107, 114, 128, 0.2)',
              borderRadius: '0.5rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            Sentiment 분석
          </button>
        </Link>
      </div>

      {/* Recent Portfolios */}
      <div>
        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1.5rem' }}>
          최근 포트폴리오
        </h2>
        {loading ? (
          <p style={{ color: '#9ca3af' }}>로딩 중...</p>
        ) : portfolios.length === 0 ? (
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
            <p>아직 생성된 포트폴리오가 없습니다.</p>
            <Link href="/builder">
              <button
                style={{
                  marginTop: '1rem',
                  padding: '0.5rem 1rem',
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  cursor: 'pointer',
                }}
              >
                포트폴리오 만들기
              </button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {portfolios.map((portfolio) => (
              <Link key={portfolio.id} href={`/portfolio/${portfolio.id}`}>
                <div
                  style={{
                    padding: '1.5rem',
                    background: '#1f2937',
                    borderRadius: '0.5rem',
                    border: '1px solid rgba(107, 114, 128, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    const target = e.currentTarget;
                    target.style.background = '#2d3748';
                    target.style.borderColor = '#6366f1';
                  }}
                  onMouseLeave={(e) => {
                    const target = e.currentTarget;
                    target.style.background = '#1f2937';
                    target.style.borderColor = 'rgba(107, 114, 128, 0.2)';
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                    <div>
                      <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                        {portfolio.name}
                      </h3>
                      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
                        테마: {portfolio.theme}
                      </p>
                    </div>
                    {portfolio.expectedReturn && (
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
                          예상 수익률
                        </p>
                        <p style={{ fontSize: '1.25rem', fontWeight: '700', color: '#10b981' }}>
                          {portfolio.expectedReturn.toFixed(2)}%
                        </p>
                      </div>
                    )}
                  </div>
                  <div style={{ marginTop: '1rem', display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#9ca3af' }}>
                    <span>종목 수: {portfolio.stocks}</span>
                    <span>
                      생성일: {portfolio.createdAt?.toLocaleDateString('ko-KR')}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
