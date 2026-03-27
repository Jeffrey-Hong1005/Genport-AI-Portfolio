'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    if (!user) return;

    const fetchPortfolios = async () => {
      try {
        const q = query(
          collection(db, 'portfolios'),
          where('userId', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);

        const portfoliosList = [];
        querySnapshot.forEach((doc) => {
          portfoliosList.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt descending
        portfoliosList.sort(
          (a, b) => (b.createdAt?.toDate?.() || 0) - (a.createdAt?.toDate?.() || 0)
        );
        setPortfolios(portfoliosList);
      } catch (err) {
        setError(err.message);
        console.error('Error fetching portfolios:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolios();
  }, [user]);

  const handleDelete = async (portfolioId) => {
    if (!confirm('이 포트폴리오를 삭제하시겠습니까?')) return;

    setDeleteLoading(portfolioId);

    try {
      await deleteDoc(doc(db, 'portfolios', portfolioId));
      setPortfolios((prev) => prev.filter((p) => p.id !== portfolioId));
    } catch (err) {
      setError(err.message);
      console.error('Delete error:', err);
    } finally {
      setDeleteLoading(null);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold mb-2">내 포트폴리오</h1>
          <p className="text-gray-400">저장된 포트폴리오를 확인하고 관리하세요</p>
        </div>
        <Link href="/builder" className="btn-primary">
          새 포트폴리오 만들기
        </Link>
      </div>

      {/* Error Message */}
      {error && (
        <div className="card p-4 border-red-500 bg-red-900 bg-opacity-10">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Portfolios List */}
      {loading ? (
        <div className="card p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-400">포트폴리오를 불러오는 중...</p>
        </div>
      ) : portfolios.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-6">
          {portfolios.map((portfolio) => (
            <div
              key={portfolio.id}
              className="card p-8 hover:border-indigo-500 transition-all group"
            >
              {/* Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">
                      {portfolio.themeName || portfolio.theme}
                    </h2>
                    <span className="badge-accent">
                      {portfolio.stocks?.length || 0}개 종목
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-400">
                      {portfolio.expectedReturn}%
                    </p>
                    <p className="text-xs text-gray-400">예상 수익률</p>
                  </div>
                </div>
              </div>

              {/* Condition */}
              {portfolio.condition && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-2">투자 조건</p>
                  <p className="text-gray-300">"{portfolio.condition}"</p>
                </div>
              )}

              {/* Description */}
              {portfolio.description && (
                <div className="mb-6">
                  <p className="text-sm text-gray-300 line-clamp-2">
                    {portfolio.description}
                  </p>
                </div>
              )}

              {/* Allocation Chart */}
              {portfolio.allocation && portfolio.allocation.length > 0 && (
                <div className="mb-6">
                  <p className="text-sm text-gray-400 mb-3">주식 배분</p>
                  <div className="space-y-2">
                    {portfolio.allocation.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">{item.stock}</span>
                        <div className="flex items-center gap-2 flex-1 ml-4">
                          <div className="h-1.5 flex-1 bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                              style={{ width: `${item.percentage}%` }}
                            ></div>
                          </div>
                          <span className="text-indigo-400 w-10 text-right">
                            {item.percentage}%
                          </span>
                        </div>
                      </div>
                    ))}
                    {portfolio.allocation.length > 3 && (
                      <p className="text-xs text-gray-500 pt-2">
                        + {portfolio.allocation.length - 3}개 종목
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-6 border-t border-gray-800">
                <span>
                  생성일: {new Date(portfolio.createdAt.toDate()).toLocaleDateString('ko-KR')}
                </span>
                <div className="flex gap-2">
                  <Link
                    href={`/portfolio/${portfolio.id}`}
                    className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                  >
                    상세보기
                  </Link>
                  <button
                    onClick={() => handleDelete(portfolio.id)}
                    disabled={deleteLoading === portfolio.id}
                    className="px-3 py-1 rounded bg-red-500 bg-opacity-20 hover:bg-opacity-30 text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleteLoading === portfolio.id ? '삭제 중...' : '삭제'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center">
          <p className="text-gray-400 mb-6">저장된 포트폴리오가 없습니다</p>
          <Link href="/builder" className="btn-primary inline-block">
            첫 번째 포트폴리오 만들기
          </Link>
        </div>
      )}
    </div>
  );
}
