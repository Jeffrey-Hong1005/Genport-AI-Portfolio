import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const THEMES = {
  'ai-semiconductor': 'AI 반도체',
  'green-energy': '친환경 에너지',
  healthcare: '헬스케어',
  'global-consumer': '글로벌 소비재',
  finance: '금융',
  'real-estate': '부동산',
};

export async function POST(request) {
  try {
    const { theme, condition, action } = await request.json();

    if (!action || !theme) {
      return Response.json(
        { error: '필수 파라미터가 없습니다' },
        { status: 400 }
      );
    }

    if (action === 'generate-portfolio') {
      return await generatePortfolio(theme, condition);
    }

    return Response.json(
      { error: '알 수 없는 액션입니다' },
      { status: 400 }
    );
  } catch (error) {
    console.error('API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

async function generatePortfolio(theme, condition) {
  const themeName = THEMES[theme] || theme;

  const prompt = `당신은 경험 많은 금융 분석가입니다. ${themeName} 분야의 AI 포트폴리오를 생성하세요.

투자 주제: ${themeName}
투자 조건: ${condition || '특별한 조건 없음'}

다음 JSON 형식으로 포트폴리오를 제안해주세요:
{
  "stocks": ["종목1", "종목2", "종목3", ...],
  "allocation": [
    {"stock": "종목1", "percentage": 25},
    {"stock": "종목2", "percentage": 20},
    ...
  ],
  "expectedReturn": 12.5,
  "description": "이 포트폴리오는..."
}

주의사항:
1. 모든 종목은 실제 존재하는 기업이어야 합니다
2. allocation의 percentage 합계는 100이어야 합니다
3. expectedReturn은 합리적인 예상 수익률 (%)입니다
4. description은 포트폴리오의 투자 전략과 특징을 설명합니다
5. 최소 5개 이상의 종목을 포함하세요
6. JSON만 반환하세요 (다른 텍스트 없음)`;

  const message = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].text;

  // Parse JSON from response
  let portfolio;
  try {
    portfolio = JSON.parse(responseText);
  } catch (e) {
    // Try to extract JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      portfolio = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('포트폴리오 생성에 실패했습니다');
    }
  }

  return Response.json({
    portfolio: {
      ...portfolio,
      theme,
      themeName,
    },
  });
}
