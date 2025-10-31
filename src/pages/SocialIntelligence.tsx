import { useState } from 'react';
import { FollowedWalletFeed } from '../components/social/FollowedWalletFeed';
import { WhaleInsightsPanel } from '../components/social/WhaleInsightsPanel';
import { TrendingUp, Waves } from 'lucide-react';

export function SocialIntelligence() {
  const [activeTab, setActiveTab] = useState<'feed' | 'insights'>('feed');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Social Intelligence</h1>
          <p className="text-gray-400">
            Track whale wallet activity and social sentiment correlation
          </p>
        </div>

        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('feed')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'feed'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Followed Wallets Feed
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'insights'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Waves className="w-5 h-5" />
            Whale Insights
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'feed' ? (
            <FollowedWalletFeed />
          ) : (
            <WhaleInsightsPanel />
          )}
        </div>

        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h3 className="font-semibold mb-2">About Social Intelligence</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong>Followed Wallets Feed:</strong> Monitor social media mentions and on-chain
              activity for whale wallets you follow. Detects when whales or influencers discuss
              tokens before making transactions.
            </p>
            <p>
              <strong>Whale Insights:</strong> Analyze whale wallet behavior through clustering
              algorithms and correlation scoring. Identify high-impact wallets with strong
              social-to-onchain signal reliability.
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Correlation scores ≥ 2.0 indicate wallets with reliable social-to-onchain patterns.
              Monitor sentiment trends and recent actions to anticipate potential movements.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
