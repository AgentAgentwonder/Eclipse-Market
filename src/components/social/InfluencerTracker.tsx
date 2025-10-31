import { motion } from 'framer-motion';
import { Users, Star, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface InfluencerTrackerProps {
  tokenAddress: string;
}

export default function InfluencerTracker({ tokenAddress }: InfluencerTrackerProps) {
  const [influencers, setInfluencers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadInfluencers();
  }, []);

  const loadInfluencers = async () => {
    try {
      const result = await invoke('get_influencer_profiles');
      setInfluencers(result as any[]);
    } catch (error) {
      console.error('Failed to load influencers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = async (influencerId: string) => {
    try {
      await invoke('track_influencer', { handle: influencerId });
      await loadInfluencers();
    } catch (error) {
      console.error('Failed to track influencer:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Users className="w-5 h-5" />
            Crypto Influencers
          </h2>
          <p className="text-sm text-gray-400 mt-1">Track top influencers and their token mentions</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-3">
          {influencers.map((influencer) => (
            <div
              key={influencer.id}
              className="bg-slate-900/50 rounded-lg p-4 hover:bg-slate-900/70 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{influencer.handle}</h3>
                    {influencer.verified && (
                      <Star className="w-4 h-4 text-blue-400" fill="currentColor" />
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {influencer.follower_count.toLocaleString()} followers · {influencer.category}
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="text-green-400">
                      <TrendingUp className="w-3 h-3 inline mr-1" />
                      {influencer.accuracy_rate.toFixed(1)}% accuracy
                    </span>
                    <span className="text-purple-400">
                      {influencer.total_calls} calls
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => handleTrack(influencer.id)}
                  className={`px-3 py-1 rounded text-xs ${
                    influencer.is_tracked
                      ? 'bg-purple-500/20 text-purple-400'
                      : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                  }`}
                >
                  {influencer.is_tracked ? 'Tracking' : 'Track'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
