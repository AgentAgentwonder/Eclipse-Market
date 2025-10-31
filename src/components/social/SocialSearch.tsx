import { motion } from 'framer-motion';
import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Search } from 'lucide-react';

export default function SocialSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;

    try {
      setLoading(true);
      const result = await invoke('search_social', { query });
      setResults(result as any);
    } catch (error) {
      console.error('Failed to search social data:', error);
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
      <div className="flex gap-2 mb-6">
        <div className="flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search mentions, influencers, whales..."
            className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {loading && <div className="text-sm text-gray-400">Searching...</div>}

      {results && (
        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-semibold text-blue-400 mb-2">Mentions</h3>
            <div className="space-y-2 text-sm text-gray-300">
              {results.mentions?.map((mention: any) => (
                <div key={mention.id} className="bg-slate-900/40 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {mention.platform} · {mention.author}
                  </div>
                  {mention.content}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-purple-400 mb-2">Influencers</h3>
            <div className="space-y-2 text-sm text-gray-300">
              {results.influencers?.map((mention: any) => (
                <div key={mention.id} className="bg-slate-900/40 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {mention.influencer_handle}
                  </div>
                  {mention.content}
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-green-400 mb-2">Whale Transactions</h3>
            <div className="space-y-2 text-sm text-gray-300">
              {results.whales?.map((tx: any) => (
                <div key={tx.id} className="bg-slate-900/40 rounded-lg p-3">
                  <div className="text-xs text-gray-500 mb-1">
                    {tx.wallet_address} · {tx.action}
                  </div>
                  {tx.amount.toLocaleString()} {tx.token} · ${tx.usd_value.toLocaleString()}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
