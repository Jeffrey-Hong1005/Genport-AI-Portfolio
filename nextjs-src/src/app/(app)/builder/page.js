'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/lib/auth-context';

const THEMES = [
  { id: 'ai-semiconductor', label: 'AI반도체', icon: '🤖' },
  { id: 'green-energy', label: '친환경에너지', icon: '♻️' },
  { id: 'healthcare', label: '헬스케어', icon: '🏥' },
  { id: 'global-consumer', label: '글로벌소비재', icon: '🛍️' },
  { id: 'finance', label: '금융', icon: '💰' },
  { id: 'real-estate', label: '부동산', icon: '🏢' },
];

export default function BuilderPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [condition, setCondition] = useState('');
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saveLoading, setSaveLoading] = useState(false);

  const handleThemeSelect = (themeId) => {
    setSelectedTheme(themeId);
    setStep(2);
  };

  const handleConditionSubmit = async (e) => {
    e.preventDefault();
    if (!condition.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theme: selectedTheme,
          condition: condition,
          action: 'generate-portfolio',
        }),
      });

      if (!response.ok) {
        throw new Error('포트폴리오 생성 실패');
      }

      const data = await response.json();
      setPortfolio(data.portfolio);
      setStep(3);
    } catch (err) {
      setError(err.message);
      console.error('Generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePortfolio = async () => {
    if (!portfolio || !user) return;

    setSaveLoading(true);
    setError('');

    try {
      const portfolioData = {
        userId: user.uid,
        theme: selectedTheme,
        themeName: THEMES.find((t) => t.id === selectedTheme)?.label || selectedTheme,
        condition: condition,
        stocks: portfolio.stocks || [],
        expectedReturn: portfolio.expectedReturn || 0,
        allocation: portfolio.allocation || [],
        description: portfolio.description || '',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'portfolios'), portfolioData);
      router.push(`/portfolio/${docRef.id}`);
    } catch (err) {
      setError(err.message);
      console.error('Save error:', err);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setSelectedTheme('');
    setCondition('');
    setPortfolio(null);
    setError('');
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">포트폴리오 빌더</h1>
        <p className="text-gray-400">AI의 도움으로 최적의 포트폴리오를 만들어보세요</p>
      </div>

      {/* Progress Indicator */}
      <div className="flex gap-4 justify-between max-w-2xl">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= s
                  ? 'bg-indigo-500 text-white'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {s}
            </div>
            {s < 4 && (
              <div
                className={`flex-1 h-1 mx-2 ${
                  step > s ? 'bg-indigo-500' : 'bg-gray-800'
                }`}
              ></div>
            )}
          </div>
        ))}
      </div>

      {/* Error Message */}
      {error && (
        <div className="card p-4 border-red-500 bg-red-900 bg-opacity-10">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Step 1: Theme Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold mb-4">1단계: 주제 선택</h2>
            <p className="text-gray-400 mb-6">
              관심있는 투자 주제를 선택하세요
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                className={`card p-6 text-center hover:border-indigo-500 cursor-pointer transition-all group ${
                  selectedTheme === theme.id ? 'border-indigo-500' : ''
                }`}
              >
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">
                  {theme.icon}
                </div>
                <h3 className="font-semibold">{theme.label}</h3>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Condition Input */}
      {step === 2 && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-2xl font-bold mb-4">2단계: 조건 입력</h2>
            <p className="text-gray-400 mb-6">
              포트폴리오에 반영할 투자 조건을 자연어로 입력하세요
            </p>
          </div>

          <form onSubmit={handleConditionSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                투자 조건 (예: "ESG 높고 PER 낮은 기업으로 구성해줘")
              </label>
              <textarea
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                placeholder="원하는 조건을 입력하세요..."
                rows="5"
                className="input-base resize-none"
              />
            </div>

            <div className="space-y-2">
              <button
                type="submit"
                disabled={loading || !condition.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'AI 포트폴리오 생성 중...' : 'AI 포트폴리오 생성'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-secondary w-full"
              >
                처음부터 다시
              </button>
            </div>
          </form>

          {/* Example Conditions */}
          <div className="card p-6 bg-indigo-500 bg-opacity-5 border-indigo-500 border-opacity-30">
            <h3 className="font-semibold mb-3">📝 입력 예시</h3>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• ESG 점수 높고 PER 낮은 대형주로 구성해줘</li>
              <li>• 배당금 높은 안정적인 주식들로 만들어줘</li>
              <li>• 성장성 높은 중소형주 위주로 포트폴리오 만들어줘</li>
              <li>• 기술주와 금융주의 균형잡힌 포트폴리오</li>
            </ul>
          </div>
        </div>
      )}

      {/* Step 3: AI Generated Portfolio */}
      {step === 3 && portfolio && (
        <div className="space-y-6 max-w-2xl">
          <div>
            <h2 className="text-2xl font-bold mb-4">3단계: AI 생성 포트폴리오</h2>
            <p className="text-gray-400 mb-6">
              AI가 생성한 포트폴리오를 검토하세요
            </p>
          </div>

          <div className="card p-8 space-y-6">
            {/* Portfolio Overview */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-400 text-sm mb-2">예상 수익률</p>
                <p className="text-3xl font-bold text-indigo-400">
                  {portfolio.expectedReturn}%
                </p>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">포함 종목 수</p>
                <p className="text-3xl font-bold">
                  {portfolio.stocks?.length || 0}개
                </p>
              </div>
            </div>

            {/* Description */}
            {portfolio.description && (
              <div>
                <h3 className="font-semibold mb-3">포트폴리오 설명</h3>
                <p className="text-gray-300 whitespace-pre-wrap">
                  {portfolio.description}
                </p>
              </div>
            )}

            {/* Stocks Allocation */}
            {portfolio.allocation && portfolio.allocation.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">주식 배분</h3>
                <div className="space-y-2">
                  {portfolio.allocation.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-300">{item.stock}</span>
                      <div className="flex items-center gap-3">
                        <div className="w-32 h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            style={{ width: `${item.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-indigo-400 font-semibold w-12 text-right">
                          {item.percentage}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stocks List */}
            {portfolio.stocks && portfolio.stocks.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3">포함 종목 ({portfolio.stocks.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {portfolio.stocks.map((stock, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm text-center"
                    >
                      {stock}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={handleSavePortfolio}
              disabled={saveLoading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saveLoading ? '저장 중...' : '포트폴리오 저장'}
            </button>
            <button
              onClick={handleReset}
              className="btn-secondary flex-1"
            >
              다시 시작
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {step === 1 && selectedTheme === '' && (
        <div className="card p-12 text-center text-gray-400">
          <p>주제를 선택하여 시작하세요</p>
        </div>
      )}
    </div>
  );
}
