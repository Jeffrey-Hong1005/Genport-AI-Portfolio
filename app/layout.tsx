import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'GENPORT - AI 포트폴리오 서비스',
  description: 'AI가 당신만의 포트폴리오를 설계합니다',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" style={{ background: '#0a0e1a' }}>
      <body style={{ background: '#0a0e1a', color: '#f9fafb' }} className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
