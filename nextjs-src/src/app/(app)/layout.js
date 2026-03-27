'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';

const navItems = [
  { label: '대시보드', href: '/dashboard', icon: '📊' },
  { label: 'Sentiment 분석', href: '/sentiment', icon: '📈' },
  { label: '포트폴리오 빌더', href: '/builder', icon: '🛠️' },
  { label: '내 포트폴리오', href: '/portfolio', icon: '💼' },
];

export default function AppLayout({ children }) {
  const router = useRouter();
  const { user, userProfile, logout, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-950">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-400">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } border-r border-gray-800 bg-gray-900 transition-all duration-300 flex flex-col`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <h1 className={`font-bold gradient-text ${sidebarOpen ? 'text-2xl' : 'text-lg'}`}>
            {sidebarOpen ? 'GENPORT' : 'GP'}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all group"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          ))}
        </nav>

        {/* Toggle Sidebar Button */}
        <div className="border-t border-gray-800 p-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-all"
          >
            {sidebarOpen ? '‹' : '›'}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <nav className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">GENPORT</h2>

          <div className="flex items-center gap-4">
            {/* User Info */}
            <div className="text-right">
              <p className="text-sm font-medium text-white">
                {userProfile?.displayName || '사용자'}
              </p>
              <p className="text-xs text-gray-400">{user?.email}</p>
            </div>

            {/* Avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-semibold overflow-hidden">
              {userProfile?.photoURL ? (
                <img
                  src={userProfile.photoURL}
                  alt="User avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                (userProfile?.displayName || user?.email)?.[0]?.toUpperCase()
              )}
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
            >
              로그아웃
            </button>
          </div>
        </nav>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
