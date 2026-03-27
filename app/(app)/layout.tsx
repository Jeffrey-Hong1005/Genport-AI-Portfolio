'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/');
    }
  }, [user, loading, mounted, router]);

  if (!mounted || loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          background: '#0a0e1a',
          color: '#f9fafb',
        }}
      >
        Loading...
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          background: '#111827',
          borderRight: '1px solid rgba(107, 114, 128, 0.2)',
          padding: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#6366f1' }}>GENPORT</h1>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {[
            { label: '대시보드', href: '/dashboard' },
            { label: 'Sentiment 분석', href: '/sentiment' },
            { label: '포트폴리오 빌더', href: '/builder' },
            { label: '내 포트폴리오', href: '/portfolio' },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '0.375rem',
                color: '#d1d5db',
                textDecoration: 'none',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                const target = e.currentTarget;
                target.style.background = '#1f2937';
                target.style.color = '#6366f1';
              }}
              onMouseLeave={(e) => {
                const target = e.currentTarget;
                target.style.background = 'transparent';
                target.style.color = '#d1d5db';
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(107, 114, 128, 0.2)', paddingTop: '1rem' }}>
          <p style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
            {user.displayName || user.email}
          </p>
          <button
            onClick={async () => {
              await signOut();
              router.push('/');
            }}
            style={{
              width: '100%',
              padding: '0.5rem',
              background: '#6366f1',
              color: 'white',
              border: 'none',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.875rem',
            }}
          >
            로그아웃
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, background: '#0a0e1a', overflow: 'auto' }}>
        {children}
      </main>
    </div>
  );
}
