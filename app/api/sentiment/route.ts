import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface NewsItem {
  title: string;
  summary: string;
  sentiment: '긍정' | '부정' | '중립';
  score: number;
}

interface SentimentResult {
  overallScore: number;
  news: NewsItem[];
}

async function generateMockNews(query: string): Promise<NewsItem[]> {
  // Generate mock news items using Claude when no real API is available
  const systemPrompt = `You are a financial news generator. Generate 5 realistic financial news items about "${query}".

  Respond ONLY with valid JSON (no markdown, no code blocks, just raw JSON) in this exact format:
  [
    {"title": "News title", "summary": "Brief summary of the news", "sentiment": "긍정" or "부정" or "중립", "score": 0.5}
  ]

  Scores should range from -1 (very negative) to 1 (very positive). Keep summaries under 100 characters.`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `Generate financial news about: ${query}`,
        },
      ],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type');
    }

    const responseText = content.text.trim();
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error('No JSON array found');
    }

    return JSON.parse(jsonMatch[0]) as NewsItem[];
  } catch (error) {
    console.error('Error generating mock news:', error);
    return [];
  }
}

async function analyzeSentiment(text: string): Promise<{ sentiment: string; score: number }> {
  const systemPrompt = `You are a financial sentiment analyst. Analyze the sentiment of financial news.

  Respond ONLY with valid JSON (no markdown, no code blocks, just raw JSON) in this exact format:
  {"sentiment": "긍정" or "부정" or "중립", "score": 0.5}

  Scores should range from -1 (very negative) to 1 (very positive).`;

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 100,
      messages: [
        {
          role: 'user',
          content: `Analyze sentiment: ${text}`,
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
      throw new Error('No JSON found');
    }

    return JSON.parse(jsonMatch[0]) as { sentiment: string; score: number };
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return { sentiment: '중립', score: 0 };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ error: 'Invalid query' }, { status: 400 });
    }

    // Try to use Naver API if keys are available
    const naverClientId = process.env.NAVER_CLIENT_ID;
    const naverClientSecret = process.env.NAVER_CLIENT_SECRET;

    let newsItems: NewsItem[] = [];

    if (naverClientId && naverClientSecret) {
      try {
        const response = await fetch(
          `https://openapi.naver.com/v1/search/news.json?query=${encodeURIComponent(query)}&sort=date&display=5`,
          {
            headers: {
              'X-Naver-Client-Id': naverClientId,
              'X-Naver-Client-Secret': naverClientSecret,
            },
          }
        );

        if (response.ok) {
          const data = await response.json() as any;
          const naverItems = data.items || [];

          for (const item of naverItems) {
            const cleanTitle = item.title.replace(/<[^>]*>/g, '');
            const cleanDesc = item.description.replace(/<[^>]*>/g, '');

            const sentimentResult = await analyzeSentiment(cleanDesc);

            newsItems.push({
              title: cleanTitle,
              summary: cleanDesc.substring(0, 100),
              sentiment: sentimentResult.sentiment as '긍정' | '부정' | '중립',
              score: sentimentResult.score,
            });
          }
        } else {
          // Fall back to mock news if Naver API fails
          newsItems = await generateMockNews(query);
        }
      } catch (error) {
        console.error('Naver API error, falling back to mock:', error);
        newsItems = await generateMockNews(query);
      }
    } else {
      // Use mock news if no API keys
      newsItems = await generateMockNews(query);
    }

    // Calculate overall score
    const scores = newsItems.map((item) => item.score);
    const overallScore =
      scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

    const result: SentimentResult = {
      overallScore: Math.max(-1, Math.min(1, overallScore)),
      news: newsItems,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json({ error: 'Failed to analyze sentiment' }, { status: 500 });
  }
}
