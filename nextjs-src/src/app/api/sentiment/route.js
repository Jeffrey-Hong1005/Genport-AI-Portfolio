import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Fallback: Generate mock news articles when Naver API is not available
async function generateMockNews(query) {
  const prompt = `You are a financial news analyzer. Generate 5 realistic financial news articles about "${query}".

Return a JSON array with this format:
[
  {
    "title": "Article title",
    "description": "Brief summary",
    "link": "https://example.com",
    "pubDate": "2026-03-24",
    "source": "Financial Times",
    "sentiment": "positive|neutral|negative",
    "score": 0.85
  },
  ...
]

The sentiment should be based on the news content. Return ONLY valid JSON, no other text.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].text;
  let news = [];

  try {
    news = JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      news = JSON.parse(jsonMatch[0]);
    }
  }

  return news;
}

// Analyze sentiment using Claude
async function analyzeSentiment(title, description) {
  const prompt = `Analyze the sentiment of this financial news article and rate it on a scale of 0-1.

Title: "${title}"
Description: "${description}"

Respond with a JSON object containing:
{
  "sentiment": "positive" or "neutral" or "negative",
  "score": 0.0-1.0
}

Return ONLY the JSON, no other text.`;

  const message = await client.messages.create({
    model: 'claude-opus-4-1-20250805',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  });

  const responseText = message.content[0].text;

  try {
    return JSON.parse(responseText);
  } catch (e) {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { sentiment: 'neutral', score: 0.5 };
  }
}

export async function POST(request) {
  try {
    const { query } = await request.json();

    if (!query) {
      return Response.json(
        { error: '검색 쿼리가 필요합니다' },
        { status: 400 }
      );
    }

    // Try to use Naver News API if credentials are available
    let newsArticles = [];

    if (process.env.NAVER_CLIENT_ID && process.env.NAVER_CLIENT_SECRET) {
      try {
        const response = await fetch('https://openapi.naver.com/v1/search/news.json', {
          method: 'GET',
          headers: {
            'X-Naver-Client-Id': process.env.NAVER_CLIENT_ID,
            'X-Naver-Client-Secret': process.env.NAVER_CLIENT_SECRET,
          },
          cache: 'no-store',
        });

        if (response.ok) {
          const data = await response.json();
          newsArticles = data.items || [];
        }
      } catch (err) {
        console.error('Naver API error:', err);
        // Fall back to Claude-generated news
      }
    }

    // If no news from Naver API, generate mock news using Claude
    if (newsArticles.length === 0) {
      newsArticles = await generateMockNews(query);
    }

    // Format articles with sentiment analysis
    const formattedNews = await Promise.all(
      newsArticles.slice(0, 10).map(async (article) => {
        // If already has sentiment (from Claude-generated), use it
        if (article.sentiment) {
          return {
            title: article.title,
            description: article.description,
            link: article.link || '#',
            pubDate: article.pubDate || new Date().toISOString().split('T')[0],
            source: article.source || 'GENPORT',
            sentiment: article.sentiment,
            score: article.score || 0.5,
          };
        }

        // Otherwise analyze with Claude
        const { sentiment, score } = await analyzeSentiment(
          article.title,
          article.description
        );

        return {
          title: article.title,
          description: article.description,
          link: article.link || '#',
          pubDate: article.pubDate || new Date().toISOString().split('T')[0],
          source: article.source || 'Naver',
          sentiment,
          score,
        };
      })
    );

    return Response.json({
      query,
      news: formattedNews,
    });
  } catch (error) {
    console.error('Sentiment API error:', error);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
