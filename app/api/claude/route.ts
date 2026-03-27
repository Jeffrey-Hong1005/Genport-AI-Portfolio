import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface Stock {
  name: string;
  allocation: number;
  reason: string;
}

interface PortfolioResponse {
  allocation: Stock[];
  expectedReturn: number;
  sharpeRatio: number;
  volatility: number;
}

interface SentimentAnalysisResponse {
  topic: string;
  sentiment: string;
  score: number;
  summary: string;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, type, theme, dartData, sentimentData, kisData } = await req.json();

    if (type === 'portfolio') {
      // OpenDart 실제 재무데이터
      const dartContext = dartData?.companies?.length > 0
        ? `\n\n【OpenDart 재무데이터 (금융감독원 공시)】\n${dartData.companies.map((c: any) => {
            const m = c.metrics;
            if (!m) return `• ${c.name}: 재무데이터 없음`;
            return `• ${c.name} (${c.listingMarket})\n  매출: ${m.revenue} | 영업이익: ${m.operatingProfit} | 순이익: ${m.netIncome}\n  ROE: ${m.roe} | 부채비율: ${m.debtRatio} | 영업이익률: ${m.operatingMargin}`;
          }).join('\n')}`
        : '';

      // KIS 실시간 주가 데이터 + 투자 신호 + 수급 동향
      const kisContext = kisData?.prices?.length > 0
        ? `\n\n【KIS 실시간 시장 데이터 + 투자 신호】\n${kisData.prices.map((p: any) => {
            const sign = p.changeRate >= 0 ? '+' : '';
            const cap = p.marketCap > 0 ? `시가총액 ${(p.marketCap / 10000).toFixed(1)}조원` : '';
            const pos52 = p.position52w != null ? `52주위치 ${p.position52w}%` : '';
            const sigStr = (p.signals && p.signals.length > 0) ? ` [신호: ${p.signals.join(', ')}]` : '';
            const trendStr =
              p.foreignTrend && p.institutionTrend
                ? ` | 수급: ${p.foreignTrend}/${p.institutionTrend}`
                : '';
            return `• ${p.name || p.stockCode}: 현재가 ${p.currentPrice.toLocaleString()}원 (${sign}${p.changeRate.toFixed(2)}%) | PER ${p.per || 'N/A'} | PBR ${p.pbr || 'N/A'} | ${cap} | 외국인소진율 ${p.foreignRate?.toFixed(1)}% | ${pos52}${trendStr}${sigStr}`;
          }).join('\n')}

[신호 해석 가이드]
• 52주_바닥권(0~20%): 저점 매수 기회일 수 있으나 하락 추세 확인 필요
• 52주_고점권(80~100%): 강한 상승 모멘텀이나 단기 과열 위험
• 저PER_가치주: 이익 대비 저평가 → 안정적 가치 투자 적합
• PBR<1_자산저평가: 순자산보다 시총이 낮음 → 구조조정·배당 기대
• 외국인_5일순매수 + 기관_5일순매수: 기관·외국인 동반 매수 → 가장 강한 매수 신호
• 외국인저소진율_여력있음: 외국인 추가 매수 여력이 충분함

실제 주가·밸류에이션·수급 신호를 반드시 추천 이유에 구체적으로 반영하세요.`
        : '';

      // Sentiment 분석 결과
      const sentimentContext = sentimentData
        ? `\n\n【시장 센티먼트 분석】\n- 전체 점수: ${(sentimentData.overallScore * 100).toFixed(1)} (${sentimentData.overallScore > 0.3 ? '긍정적' : sentimentData.overallScore < -0.3 ? '부정적' : '중립적'})\n- 주요 뉴스:\n${(sentimentData.news || []).slice(0, 3).map((n: any) => `  • [${n.sentiment}] ${n.title}`).join('\n')}\n\n센티먼트가 긍정적이면 해당 섹터 비중을 높이고, 부정적이면 방어적 종목 비중을 높이세요.`
        : '';

      const systemPrompt = `당신은 전문 투자 포트폴리오 매니저입니다. ${theme} 테마 포트폴리오를 사용자 요구사항에 맞게 생성하세요.${dartContext}${kisContext}${sentimentContext}

반드시 아래 JSON 형식으로만 응답하세요 (마크다운·코드블록 없이 순수 JSON):
{
  "allocation": [
    {"name": "종목명", "allocation": 25.0, "reason": "추천 이유 — 현재가·PER·수급신호 등 실제 수치와 신호 반드시 포함"},
    {"name": "종목명2", "allocation": 20.0, "reason": "추천 이유"}
  ],
  "expectedReturn": 12.5,
  "sharpeRatio": 1.2,
  "volatility": 15.3
}

5~8개 종목. 비중 합계 100%.
- KIS 실시간 데이터가 제공된 경우: 해당 종목들을 우선 사용하되, 데이터에 없어도 테마에 필요한 종목은 추가 가능
- 종목명은 반드시 실제 한국 KOSPI/KOSDAQ 상장 종목명으로 작성
- 외국인/기관 5일 순매수 신호가 있으면 그 의미를 추천 이유에 반드시 언급할 것
- 52주 위치, PER, PBR, 수급 신호를 종합해 투자 매력도를 설명할 것`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const responseText = content.text.trim();
      console.log('[Claude Portfolio] Raw response:', responseText.substring(0, 500));

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('[Claude Portfolio] No JSON found. Full response:', responseText);
        throw new Error('No JSON found in response');
      }

      let portfolioData: PortfolioResponse;
      try {
        portfolioData = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error('[Claude Portfolio] JSON parse error:', parseErr, 'Matched text:', jsonMatch[0].substring(0, 300));
        throw new Error('Failed to parse Claude response as JSON');
      }

      if (!portfolioData.allocation || !Array.isArray(portfolioData.allocation)) {
        console.error('[Claude Portfolio] Missing allocation array:', portfolioData);
        throw new Error('Invalid portfolio structure from Claude');
      }

      return NextResponse.json(portfolioData);
    } else if (type === 'sentiment') {
      // Sentiment analysis with Claude
      const systemPrompt = `You are a financial sentiment analyst. Analyze the sentiment of financial news and provide a score from -1 (very negative) to 1 (very positive).

      Respond ONLY with valid JSON (no markdown, no code blocks, just raw JSON) in this exact format:
      {
        "sentiment": "긍정" or "부정" or "중립",
        "score": 0.5,
        "summary": "Brief analysis summary"
      }`;

      const message = await client.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        system: systemPrompt,
      });

      const content = message.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type');
      }

      const responseText = content.text.trim();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const sentimentData = JSON.parse(jsonMatch[0]) as SentimentAnalysisResponse;
      return NextResponse.json(sentimentData);
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
  } catch (error: any) {
    console.error('[Claude API] Error:', error?.message || error);
    return NextResponse.json({ error: error?.message || 'Failed to process request' }, { status: 500 });
  }
}
