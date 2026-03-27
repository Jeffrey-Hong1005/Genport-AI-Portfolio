'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function PortfolioDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchPortfolio = async () => {
      try {
        const docRef = doc(db, 'portfolios', params.id);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          setError('포트폴리오를 찾을 수 없습니다');
          setLoading(false);
          return;
        }

        const portfolioData = docSnap.data();

        // Check ownership
        if (portfolioData.userId !== user.uid) {
          setError('접근 권한이 없습니다');
          setLoading(false);
          return;
        }

        setPortfolio({ id: docSnap.id, ...portfolioData });
      } catch (err) {
        setError(err.message);
        console.error('Error fetching portfolio:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
  }, [user, params.id]);

  const handleDelete = async () => {
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?')) return;

    setDeleteLoading(true);

    try {
      await deleteDoc(doc(db, 'portfolios', params.id));
      router.push('/portfolio');
    } catch (err) {
      setError(err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-400">포트폴리오를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="card p-4 border-red-500 bg-red-900 bg-opacity-10">
          <p className="text-red-400">{error}</p>
        </div>
        <Link href="/portfolio" className="btn-primary inline-block">
          포트폴리오 목록으로
        </Link>
      </div>
    );
  }

  if (!portfolio) {
    return null;
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">
            {portfolio.themeName || portfolio.theme}
          </h1>
          <p className="text-gray-400">
            생성일: {new Date(portfolio.createdAt.toDate()).toLocaleDateString('ko-KR')}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/portfolio" className="btn-secondary">
            목록으로
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleteLoading}
            className="px-4 py-3 rounded-lg font-semibold border border-red-500 text-red-400 hover:bg-red-500 hover:bg-opacity-10 transition-all disabled:opacity-50"
          >
            {deleteLoading ? '삭제 중...' : '삭제'}
          </button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-6">
              <p className="text-gray-400 text-sm mb-2">예상 수익률</p>
              <p className="text-4xl font-bold text-indigo-400">
                {portfolio.expectedReturn}%
              </p>
            </div>
            <div className="card p-6">
              <p className="text-gray-400 text-sm mb-2">포함 종목</p>
              <p className="text-4xl font-bold">{portfolio.stocks?.length || 0}개</p>
            </div>
          </div>

          {/* Investment Condition */}
          {portfolio.condition && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">투자 조건</h2>
              <p className="text-gray-300 text-lg">"{portfolio.condition}"</p>
            </div>
          )}

          {/* Description */}
          {portfolio.description && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">포트폴리오 설명</h2>
              <p className="text-gray-300 whitespace-pre-wrap">
                {portfolio.description}
              </p>
            </div>
          )}

          {/* Allocation Details */}
          {portfolio.allocation && portfolio.allocation.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-6">주식 배분 상세</h2>

              {/* Pie Chart Representation */}
              <div className="mb-8">
                <div className="flex items-center justify-center">
                  <div className="relative w-48 h-48">
                    {portfolio.allocation.map((item, index) => {
                      const total = portfolio.allocation.reduce((sum, a) => sum + a.percentage, 0);
                      const percentage = (item.percentage / total) * 100;
                      return (
                        <div
                          key={index}
                          className="absolute w-full h-full"
                          style={{
                            background: `conic-gradient(hsl(${index * 360 / portfolio.allocation.length}, 70%, 50%) ${percentage}%, transparent 0)`,
                          }}
                        ></div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Allocation Table */}
              <div className="space-y-3">
                {portfolio.allocation.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-white">{item.stock}</p>
                    </div>
                    <div className="flex items-center gap-4 flex-1 ml-4">
                      <div className="h-2 flex-1 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-indigo-400 font-semibold w-16 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Stocks List */}
          {portfolio.stocks && portfolio.stocks.length > 0 && (
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4">포함 종목</h2>
              <div className="space-y-2">
                {portfolio.stocks.map((stock, index) => (
                  <div
                    key={index}
                    className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm"
                  >
                    {stock}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="card p-6 bg-indigo-500 bg-opacity-5 border-indigo-500 border-opacity-30">
            <h3 className="font-semibold mb-3">💡 정보</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li>• AI가 생성한 추천 포트폴리오입니다</li>
              <li>• 실제 투자 시에는 전문가 상담을 권장합니다</li>
              <li>• 시장 상황에 따라 조정이 필요할 수 있습니다</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Link href="/builder" className="btn-primary w-full text-center">
              새 포트폴리오 만들기
            </Link>
            <Link href="/sentiment" className="btn-secondary w-full text-center">
              감정 분석 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
