import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingUp, Flame } from 'lucide-react';

interface TrendingTokensProps {
  fullWidth?: boolean;
}

export default function TrendingTokens({ fullWidth }: TrendingTokensProps) {
  const [trending, setTrending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrending();
  }, []);

  const loadTrending = async () => {
    try {
      const result = await invoke('get_social_trending_tokens');
      setTrending(result as any[]);
    } catch (error) {
      console.error('Failed to load trending tokens:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-semibold">Trending Tokens</h2>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      ) : (
        <div className="space-y-3">
          {trending.map((token, idx) => (
            <div
              key={token.token_address}
              className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-xl font-bold text-gray-500">#{idx + 1}</div>
                  <div>
                    <div className="font-semibold">{token.token}</div>
                    <div className="text-xs text-gray-400">
                      Momentum: {token.momentum_score.toFixed(0)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-sm font-semibold ${
                    token.sentiment_score > 0.2 ? 'text-green-400' : token.sentiment_score < -0.2 ? 'text-red-400' : 'text-gray-400'
                  }`}>
                    {token.sentiment_score > 0 ? '+' : ''}
                    {(token.sentiment_score * 100).toFixed(0)}
                  </div>
                  <div className="text-xs text-gray-400">{token.stage}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
