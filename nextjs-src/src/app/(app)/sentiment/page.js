'use client';

import React, { useState } from 'react';

const SENTIMENTS = {
  positive: { label: '긍정', color: 'bg-green-500', textColor: 'text-green-400' },
  neutral: { label: '중립', color: 'bg-gray-500', textColor: 'text-gray-400' },
  negative: { label: '부정', color: 'bg-red-500', textColor: 'text-red-400' },
};

export default function SentimentPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(true);
    setError('');
    setNews([]);

    try {
      const response = await fetch('/api/sentiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      if (!response.ok) {
        throw new Error('검색 실패');
      }

      const data = await response.json();
      setNews(data.news || []);
    } catch (err) {
      setError(err.message);
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentConfig = (sentiment) => {
    return SENTIMENTS[sentiment] || SENTIMENTS.neutral;
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold mb-2">Sentiment 분석</h1>
        <p className="text-gray-400">뉴스 기사의 감정을 분석하고 시장 트렌드를 파악하세요</p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="space-y-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="종목명, 주제 또는 키워드를 입력하세요 (예: 삼성전자, AI반도체, 친환경에너지)"
            className="input-base flex-1"
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-primary disabled:opacity-50"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>
      </form>

      {/* Error Message */}
      {error && (
        <div className="card p-4 border-red-500 bg-red-900 bg-opacity-10">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Results */}
      <div className="space-y-4">
        {loading ? (
          <div className="card p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="mt-4 text-gray-400">뉴스를 분석하는 중입니다...</p>
          </div>
        ) : news.length > 0 ? (
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">{news.length}개의 뉴스 분석 결과</h2>
            {news.map((article, index) => {
              const sentimentConfig = getSentimentConfig(article.sentiment);
              return (
                <div key={index} className="card p-6 hover:border-indigo-500 transition-all">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <a
                        href={article.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-lg font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        {article.title}
                      </a>
                      <p className="text-gray-400 text-sm mt-2">{article.description}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-xs text-gray-500">{article.pubDate}</span>
                        {article.source && (
                          <>
                            <span className="text-gray-600">•</span>
                            <span className="text-xs text-gray-500">{article.source}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold badge-accent ${sentimentConfig.textColor}`}
                      >
                        {sentimentConfig.label}
                      </span>
                      {article.score !== undefined && (
                        <span className="text-xs text-gray-400">
                          신뢰도: {(article.score * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card p-12 text-center text-gray-400">
            {searchQuery ? '검색 결과를 찾을 수 없습니다' : '검색어를 입력하고 엔터를 누르세요'}
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="card p-6 bg-indigo-500 bg-opacity-5 border-indigo-500 border-opacity-30">
        <h3 className="font-semibold mb-2">💡 팁</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>• 특정 종목명으로 검색하면 해당 기업 관련 뉴스를 분석합니다</li>
          <li>• 주제(AI반도체, 친환경에너지 등)로 검색하면 해당 분야 트렌드를 파악할 수 있습니다</li>
          <li>• AI가 각 뉴스의 긍정/중립/부정을 자동으로 분석합니다</li>
        </ul>
      </div>
    </div>
  );
}
