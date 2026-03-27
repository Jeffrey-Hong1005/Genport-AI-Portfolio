'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import LoginModal from '@/components/LoginModal';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleDashboardClick = (e) => {
    if (!isAuthenticated) {
      e.preventDefault();
      setShowLoginModal(true);
    }
  };

  return (
    <>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Navigation */}
      <nav className="sticky top-0 z-40 border-b border-gray-800 bg-gray-950 bg-opacity-80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="text-2xl font-bold gradient-text">GENPORT</div>
          <div className="flex gap-4">
            <Link
              href={isAuthenticated ? '/dashboard' : '#'}
              onClick={handleDashboardClick}
              className="px-4 py-2 rounded-lg text-gray-300 hover:text-white transition"
            >
              대시보드
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="btn-primary"
              >
                로그인
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 py-20 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
        </div>

        <div className="max-w-4xl mx-auto text-center animate-fadeIn">
          <h1 className="text-5xl md:text-7xl font-bold mb-6 gradient-text">
            당신만의 포트폴리오를
            <br />
            AI가 설계합니다
          </h1>

          <p className="text-xl md:text-2xl text-gray-400 mb-12 max-w-2xl mx-auto">
            뉴스 감정 분석과 AI 추천을 통해
            <br />
            최적의 투자 포트폴리오를 만들어보세요
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href={isAuthenticated ? '/dashboard' : '#'}
              onClick={handleDashboardClick}
              className="btn-primary text-lg"
            >
              지금 시작하기
            </Link>
            <Link
              href="#features"
              className="btn-secondary text-lg"
            >
              더 알아보기
            </Link>
          </div>

          <div className="text-gray-400 text-sm">
            무료로 시작하세요. 신용카드 불필요합니다.
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">어떻게 작동하나요?</h2>
            <p className="text-gray-400 text-lg">
              3가지 간단한 단계로 AI 포트폴리오를 만들어보세요
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="card p-8 hover:border-indigo-500 animate-slideInLeft">
              <div className="w-12 h-12 rounded-lg gradient-indigo-purple flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">1</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">주제 선택</h3>
              <p className="text-gray-400">
                AI반도체, 친환경에너지, 헬스케어 등 관심있는 주제를 선택하세요
              </p>
            </div>

            {/* Step 2 */}
            <div className="card p-8 hover:border-indigo-500 animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              <div className="w-12 h-12 rounded-lg gradient-indigo-purple flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">2</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">조건 입력</h3>
              <p className="text-gray-400">
                "ESG 높고 PER 낮은 기업으로" 같은 자연어로 조건을 입력하세요
              </p>
            </div>

            {/* Step 3 */}
            <div className="card p-8 hover:border-indigo-500 animate-slideInRight">
              <div className="w-12 h-12 rounded-lg gradient-indigo-purple flex items-center justify-center mb-4">
                <span className="text-white font-bold text-xl">3</span>
              </div>
              <h3 className="text-xl font-semibold mb-3">AI 생성 & 저장</h3>
              <p className="text-gray-400">
                AI가 최적의 포트폴리오를 생성하고 저장하세요
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">주요 기능</h2>
            <p className="text-gray-400 text-lg">
              GENPORT의 강력한 도구들로 투자를 더 똑똑하게
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1 */}
            <div className="card p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">실시간 감정 분석</h3>
                  <p className="text-gray-400">
                    뉴스 기사의 감정을 AI가 실시간으로 분석합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="card p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">AI 포트폴리오 생성</h3>
                  <p className="text-gray-400">
                    자연어 입력으로 최적의 포트폴리오를 AI가 추천합니다
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="card p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-indigo-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">다중 주제 지원</h3>
                  <p className="text-gray-400">
                    AI반도체, 친환경에너지, 헬스케어 등 다양한 주제 선택
                  </p>
                </div>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="card p-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-lg bg-purple-500 bg-opacity-20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-2">포트폴리오 관리</h3>
                  <p className="text-gray-400">
                    생성된 포트폴리오를 저장하고 언제든지 확인하세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-opacity-20 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">지금 시작하세요</h2>
          <p className="text-xl text-gray-300 mb-8">
            AI의 힘으로 더 똑똑한 투자 결정을 하세요
          </p>
          <Link
            href={isAuthenticated ? '/dashboard' : '#'}
            onClick={handleDashboardClick}
            className="btn-primary inline-block text-lg"
          >
            무료로 시작하기
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-6xl mx-auto text-center text-gray-400 text-sm">
          <p>© 2026 GENPORT. AI-powered portfolio recommendation service.</p>
        </div>
      </footer>
    </>
  );
}
