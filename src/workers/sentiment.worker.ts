import type { SocialPost, SentimentResult } from '../types/sentiment';

type WorkerPost = Omit<SocialPost, 'sentiment'> & {
  sentiment?: SentimentResult;
};

type WorkerMessage = {
  posts: WorkerPost[];
};

type WorkerResponse = {
  posts: SocialPost[];
  summary: {
    averageScore: number;
    positiveMentions: number;
    negativeMentions: number;
    neutralMentions: number;
  };
};

const positiveWords = [
  'bullish',
  'pump',
  'moon',
  'gain',
  'profit',
  'rocket',
  'great',
  'excellent',
  'amazing',
  'strong',
  'breakout',
  'surge',
  'green',
  'win',
  'buy',
  'up',
];

const negativeWords = [
  'bearish',
  'dump',
  'crash',
  'loss',
  'rug',
  'fail',
  'scam',
  'sell',
  'down',
  'panic',
  'red',
  'collapse',
  'bleed',
  'dead',
  'bad',
  'terrible',
  'bearish',
];

const intensifiers = ['very', 'super', 'extremely', 'massively', 'insanely'];

function computeSentiment(text: string): SentimentResult {
  const tokens = text.toLowerCase().split(/\W+/);
  let score = 0;
  let lastIntensifier = false;

  for (const token of tokens) {
    if (!token) continue;
    if (intensifiers.includes(token)) {
      lastIntensifier = true;
      continue;
    }

    const weight = lastIntensifier ? 0.2 : 0.1;

    if (positiveWords.includes(token)) {
      score += weight;
    }

    if (negativeWords.includes(token)) {
      score -= weight;
    }

    lastIntensifier = false;
  }

  if (text.includes('🚀') || text.includes('🔥')) {
    score += 0.15;
  }

  if (text.includes('💀') || text.includes('😱')) {
    score -= 0.15;
  }

  const normalized = Math.max(-1, Math.min(1, score));

  let label: 'positive' | 'negative' | 'neutral';
  if (normalized > 0.2) {
    label = 'positive';
  } else if (normalized < -0.2) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return {
    score: normalized,
    label,
    confidence: Math.min(1, Math.abs(normalized)),
  };
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { posts } = event.data;

  let totalScore = 0;
  let positiveMentions = 0;
  let negativeMentions = 0;
  let neutralMentions = 0;

  const processed = posts.map((post) => {
    const sentiment = computeSentiment(post.text);

    if (sentiment.label === 'positive') positiveMentions += 1;
    if (sentiment.label === 'negative') negativeMentions += 1;
    if (sentiment.label === 'neutral') neutralMentions += 1;

    totalScore += sentiment.score;

    return {
      ...post,
      sentiment,
    } as SocialPost;
  });

  const averageScore = processed.length > 0 ? totalScore / processed.length : 0;

  const response: WorkerResponse = {
    posts: processed,
    summary: {
      averageScore,
      positiveMentions,
      negativeMentions,
      neutralMentions,
    },
  };

  self.postMessage(response);
};

export {};
