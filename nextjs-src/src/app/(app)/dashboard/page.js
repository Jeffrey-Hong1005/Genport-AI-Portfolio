'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function Dashboard() {
  const { user } = useAuth();
  const [portfolioCount, setPortfolioCount] = useState(0);
  const [recentPortfolios, setRecentPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchPortfolios = async () => {
      try {
        const q = query(
          collection(db, 'portfolios'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        setPortfolioCount(querySnapshot.size);

        const portfolios = [];
        querySnapshot.forEach((doc) => {
          portfolios.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt and get last 5
        portfolios.sort(
          (a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
        );
        setRecentPortfolios(portfolios.slice(0, 5));
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [user]);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">대시보드</h1>
        <p className="text-gray-400">당신의 포트폴리오 현황을 확인하세요</p>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Total Portfolios */}
        <div className="card p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">총 포트폴리오</p>
              <p className="text-4xl font-bold">{portfolioCount}</p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-indigo-500 bg-opacity-20 flex items-center justify-center text-indigo-400 text-2xl">
              📊
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">활성 주제</p>
              <p className="text-4xl font-bold">
                {new Set(recentPortfolios.map((p) => p.theme)).size}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-purple-500 bg-opacity-20 flex items-center justify-center text-purple-400 text-2xl">
              🎯
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="card p-8">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium mb-2">마지막 업데이트</p>
              <p className="text-lg font-semibold">
                {recentPortfolios[0]?.createdAt
                  ? new Date(recentPortfolios[0].createdAt.toDate()).toLocaleDateString('ko-KR')
                  : '없음'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-lg bg-green-500 bg-opacity-20 flex items-center justify-center text-green-400 text-2xl">
              ⏰
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">빠른 시작</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <Link
            href="/builder"
            className="card p-6 hover:border-indigo-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">새 포트폴리오 생성</h3>
                <p className="text-gray-400 text-sm">
                  AI 포트폴리오 빌더를 사용해 새로운 포트폴리오를 만들어보세요
                </p>
              </div>
              <div className="text-3xl group-hover:scale-110 transition-transform">🛠️</div>
            </div>
          </Link>

          <Link
            href="/sentiment"
            className="card p-6 hover:border-purple-500 cursor-pointer transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-1">감정 분석 보기</h3>
                <p className="text-gray-400 text-sm">
                  최근 뉴스의 감정을 분석하고 시장 트렌드를 확인하세요
                </p>
              </div>
              <div className="text-3xl group-hover:scale-110 transition-transform">📈</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Recent Portfolios */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">최근 포트폴리오</h2>
        {loading ? (
          <div className="card p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : recentPortfolios.length > 0 ? (
          <div className="space-y-3">
            {recentPortfolios.map((portfolio) => (
              <Link
                key={portfolio.id}
                href={`/portfolio/${portfolio.id}`}
                className="card p-6 hover:border-indigo-500 cursor-pointer transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{portfolio.theme}</h3>
                      <span className="badge-accent">{portfolio.stocks?.length || 0}개 종목</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      {portfolio.condition || '조건 없음'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-indigo-400">
                      {portfolio.expectedReturn ? `${portfolio.expectedReturn}%` : '-'}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(portfolio.createdAt.toDate()).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="card p-8 text-center">
            <p className="text-gray-400 mb-4">아직 생성된 포트폴리오가 없습니다</p>
            <Link href="/builder" className="btn-primary inline-block">
              포트폴리오 만들기
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
