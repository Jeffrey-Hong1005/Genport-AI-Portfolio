'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      await signInWithGoogle();
      onClose();
      router.push('/dashboard');
    } catch (err) {
      setError('Google 로그인에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1f2937', borderRadius: 16, padding: 32,
          width: '100%', maxWidth: 400, position: 'relative',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 16,
            background: 'none', border: 'none', color: '#9ca3af',
            fontSize: 20, cursor: 'pointer',
          }}
        >
          ✕
        </button>

        {/* 탭 */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 24, borderBottom: '1px solid #374151' }}>
          {(['login', 'signup'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '12px 0', background: 'none', border: 'none',
                color: tab === t ? '#6366f1' : '#9ca3af',
                borderBottom: tab === t ? '2px solid #6366f1' : '2px solid transparent',
                fontWeight: tab === t ? 700 : 400, fontSize: 15, cursor: 'pointer',
              }}
            >
              {t === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        {/* 이메일 입력 */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: '#d1d5db', fontSize: 14, display: 'block', marginBottom: 6 }}>이메일</label>
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', background: '#111827',
              border: '1px solid #374151', borderRadius: 8, color: '#f9fafb',
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 비밀번호 입력 */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ color: '#d1d5db', fontSize: 14, display: 'block', marginBottom: 6 }}>비밀번호</label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{
              width: '100%', padding: '12px 14px', background: '#111827',
              border: '1px solid #374151', borderRadius: 8, color: '#f9fafb',
              fontSize: 15, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>

        {/* 에러 메시지 */}
        {error && (
          <p style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>{error}</p>
        )}

        {/* 이메일 로그인 버튼 */}
        <button
          style={{
            width: '100%', padding: '13px 0', background: '#6366f1',
            border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 15, fontWeight: 600, cursor: 'pointer', marginBottom: 12,
          }}
        >
          {tab === 'login' ? '로그인' : '회원가입'}
        </button>

        {/* 구분선 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div style={{ flex: 1, height: 1, background: '#374151' }} />
          <span style={{ color: '#6b7280', fontSize: 13 }}>또는</span>
          <div style={{ flex: 1, height: 1, background: '#374151' }} />
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          style={{
            width: '100%', padding: '13px 0',
            background: loading ? '#374151' : '#6366f1',
            border: 'none', borderRadius: 8, color: '#fff',
            fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          {loading ? '로그인 중...' : `Google로 ${tab === 'login' ? '로그인' : '회원가입'}`}
        </button>

        {/* 탭 전환 링크 */}
        <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 13, marginTop: 16 }}>
          {tab === 'login' ? '계정이 없으신가요? ' : '이미 계정이 있으신가요? '}
          <button
            onClick={() => setTab(tab === 'login' ? 'signup' : 'login')}
            style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
          >
            {tab === 'login' ? '회원가입' : '로그인'}
          </button>
        </p>
      </div>
    </div>
  );
}
