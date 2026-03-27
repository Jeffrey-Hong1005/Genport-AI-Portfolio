import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  preFilterByTheme,
  getByName,
  getStats,
} from '@/lib/company-database';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { theme } = await req.json();

    if (!theme || typeof theme !== 'string') {
      return NextResponse.json({ error: 'theme is required' }, { status: 400 });
    }

    // ── 1단계: 키워드 사전 필터링 (전체 4000개 → 최대 80개) ──────
    const candidates = preFilterByTheme(theme, 80);

    const stats = getStats();
    console.log(`[suggest-companies] DB: ${stats.total}개 종목, 테마 "${theme}" → 후보 ${candidates.length}개`);

    // ── 2단계: Claude 최종 선별 (후보 80개 → 5~8개) ──────────────
    const companiesList = candidates
      .map((c) => `${c.name} (${c.sector}, ${c.market})`)
      .join('\n');

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 512,
      system: `당신은 한국 주식 전문가입니다. 주어진 투자 테마에 가장 관련성 높은 한국 상장 기업들을 골라주세요.

반드시 아래 JSON 형식으로만 응답하세요 (마크다운, 코드블록 없이 순수 JSON):
{"companies": ["회사명1", "회사명2", "회사명3", "회사명4", "회사명5"]}

규칙:
- 반드시 아래 후보 목록 중에서만 선택할 것
- 5~8개 선택
- 테마와 가장 직접 관련된 핵심 기업 우선
- 회사명은 목록과 정확히 동일하게 입력 (오타 금지)`,
      messages: [
        {
          role: 'user',
          content: `투자 테마: "${theme}"\n\n후보 기업 목록 (${candidates.length}개):\n${companiesList}`,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected response type');

    const responseText = content.text.trim();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const parsed = JSON.parse(jsonMatch[0]);
    const suggestedNames: string[] = parsed.companies || [];

    // 유효한 회사만 (DB에 있는 것만)
    const validNames = suggestedNames.filter((name) => getByName(name));
    const stockCodes = validNames.map((name) => getByName(name)!.stockCode).filter(Boolean);

    const companies = validNames.map((name) => {
      const info = getByName(name)!;
      return {
        name,
        stockCode: info.stockCode,
        corpCode: info.corpCode,
        sector: info.sector,
        market: info.market,
      };
    });

    console.log(`[suggest-companies] 최종 선택: ${validNames.join(', ')}`);

    return NextResponse.json({ companies, stockCodes });
  } catch (error: any) {
    console.error('[suggest-companies] 오류:', error?.message);
    return NextResponse.json(
      { error: error?.message || '회사 추천 실패' },
      { status: 500 }
    );
  }
}
