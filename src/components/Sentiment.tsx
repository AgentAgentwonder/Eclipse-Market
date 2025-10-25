import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api';

export function Sentiment() {
  const [sentiment, setSentiment] = useState<{
    score: number;
    positive: number;
    negative: number;
  } | null>(null);

  useEffect(() => {
    const loadSentiment = async () => {
      const result = await invoke<{
        score: number;
        positive: number;
        negative: number;
      }>('analyze_sentiment');
      setSentiment(result);
    };
    loadSentiment();
  }, []);

  if (!sentiment) return <div>Loading sentiment...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-2">Market Sentiment</h2>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Score:</span>
          <span className={`${
            sentiment.score > 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {sentiment.score > 0 ? '+' : ''}{sentiment.score.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Positive:</span>
          <span>{sentiment.positive}%</span>
        </div>
        <div className="flex justify-between">
          <span>Negative:</span>
          <span>{sentiment.negative}%</span>
        </div>
      </div>
    </div>
  );
}
