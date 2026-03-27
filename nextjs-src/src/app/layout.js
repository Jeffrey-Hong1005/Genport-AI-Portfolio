import React from 'react';
import { AuthProvider } from '@/lib/auth-context';
import './globals.css';

export const metadata = {
  title: 'GENPORT - AI Portfolio Recommendation',
  description:
    '당신만의 포트폴리오를 AI가 설계합니다. GENPORT와 함께 시작하세요.',
  charset: 'utf-8',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className="bg-gray-950">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
