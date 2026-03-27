'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import LoginModal from '@/app/components/LoginModal';

export default function Home() {
  const { user } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div style={{ background: '#0a0e1a', color: '#f9fafb', minHeight: '100vh' }}>
      {/* Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          background: 'rgba(10, 14, 26, 0.95)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid rgba(107, 114, 128, 0.2)',
        }}
      >
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>
              GENPORT
            </div>
            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
              <a href="#" style={{ cursor: 'pointer' }}>
                서비스소개
              </a>
              <a href="#pricing" style={{ cursor: 'pointer' }}>
                요금제
              </a>
              {!user && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{
                    padding: '0.5rem 1.5rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '500',
                  }}
                >
                  로그인
                </button>
              )}
              {user && (
                <a href="/dashboard" style={{ color: '#6366f1', fontWeight: '500' }}>
                  대시보드
                </a>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '6rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <h1
            style={{
              fontSize: '3.5rem',
              fontWeight: '700',
              lineHeight: '1.1',
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            당신만의 포트폴리오를
            <br />
            AI가 설계합니다
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '2rem' }}>
            희망 투자 분야와 투자 조건을 입력하면, AI가 최적의 포트폴리오를 추천합니다.
            <br />
            실시간 뉴스 분석과 자동 리밸런싱으로 수익을 극대화하세요.
          </p>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            style={{
              padding: '1rem 2rem',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              color: 'white',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
            }}
          >
            무료로 시작하기
          </button>
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '4rem 2rem', background: '#111827' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '3rem', textAlign: 'center' }}>
            어떻게 작동하나요?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
            {['테마 선택', 'AI 분석', '포트폴리오 완성'].map((step, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2rem',
                  background: '#1f2937',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(107, 114, 128, 0.2)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    color: '#6366f1',
                    marginBottom: '1rem',
                  }}
                >
                  {idx + 1}
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {step}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '4rem 2rem' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '3rem', textAlign: 'center' }}>
            주요 기능
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              'AI 자연어 입력',
              '실시간 뉴스 분석',
              '종목 스크리닝',
              '포트폴리오 최적화',
              '자동 리밸런싱 알림',
              '멀티 테마',
            ].map((feature, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2rem',
                  background: '#1f2937',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(107, 114, 128, 0.2)',
                }}
              >
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '0.5rem' }}>
                  {feature}
                </h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '4rem 2rem', background: '#111827' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: '700', marginBottom: '3rem', textAlign: 'center' }}>
            요금제
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
            {[
              { name: 'Free', price: '₩0', features: ['3개 포트폴리오', '기본 분석', '이메일 지원'] },
              { name: 'Pro', price: '₩29,000/월', features: ['무제한 포트폴리오', '실시간 분석', '우선 지원'] },
              { name: 'Enterprise', price: '문의', features: ['커스텀 기능', '전담 지원', 'API 접근'] },
            ].map((plan, idx) => (
              <div
                key={idx}
                style={{
                  padding: '2rem',
                  background: '#1f2937',
                  borderRadius: '0.5rem',
                  border: '1px solid rgba(107, 114, 128, 0.2)',
                  textAlign: 'center',
                }}
              >
                <h3 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '1rem' }}>{plan.name}</h3>
                <p style={{ fontSize: '1.75rem', fontWeight: '700', color: '#6366f1', marginBottom: '1.5rem' }}>
                  {plan.price}
                </p>
                <ul style={{ textAlign: 'left', marginBottom: '1.5rem', lineHeight: '1.8' }}>
                  {plan.features.map((feature, i) => (
                    <li key={i}>✓ {feature}</li>
                  ))}
                </ul>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    background: '#6366f1',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    cursor: 'pointer',
                    fontWeight: '600',
                  }}
                >
                  선택
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '2rem', textAlign: 'center', borderTop: '1px solid rgba(107, 114, 128, 0.2)' }}>
        <p style={{ color: '#9ca3af' }}>© 2026 GENPORT. All rights reserved.</p>
      </footer>

      {/* Login Modal */}
      <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    </div>
  );
}
