import { useState } from 'react';
import { SentimentDashboard } from '../components/sentiment/SentimentDashboard';
import { AnomalyDetector } from '../components/anomalies/AnomalyDetector';
import { BarChart3, TrendingUp, Search } from 'lucide-react';

export function MarketSurveillance() {
  const [activeTab, setActiveTab] = useState<'sentiment' | 'anomalies'>('sentiment');
  const [tokenAddress, setTokenAddress] = useState('So11111111111111111111111111111111111111112'); // Default to SOL

  const commonTokens = [
    { name: 'SOL', address: 'So11111111111111111111111111111111111111112' },
    { name: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
    { name: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
    { name: 'JUP', address: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN' },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Market Surveillance</h1>
          <p className="text-gray-400">
            Monitor sentiment trends and detect market anomalies in real-time
          </p>
        </div>

        {/* Token Selector */}
        <div className="bg-gray-800 rounded-lg p-4">
          <label className="block text-sm font-semibold mb-2">Token Address</label>
          <div className="flex gap-2 flex-wrap mb-3">
            {commonTokens.map((token) => (
              <button
                key={token.address}
                onClick={() => setTokenAddress(token.address)}
                className={`px-4 py-2 rounded-lg ${
                  tokenAddress === token.address
                    ? 'bg-blue-600'
                    : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {token.name}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                placeholder="Enter token address..."
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('sentiment')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'sentiment'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <TrendingUp className="w-5 h-5" />
            Sentiment Analysis
          </button>
          <button
            onClick={() => setActiveTab('anomalies')}
            className={`px-6 py-3 font-semibold flex items-center gap-2 transition-colors ${
              activeTab === 'anomalies'
                ? 'border-b-2 border-blue-500 text-blue-500'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            Anomaly Detection
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-800 rounded-lg p-6">
          {activeTab === 'sentiment' ? (
            <SentimentDashboard tokenAddress={tokenAddress} />
          ) : (
            <AnomalyDetector tokenAddress={tokenAddress} />
          )}
        </div>

        {/* Information Panel */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4">
          <h3 className="font-semibold mb-2">About Market Surveillance</h3>
          <div className="text-sm text-gray-300 space-y-2">
            <p>
              <strong>Sentiment Analysis:</strong> Aggregates social media data from Twitter and Reddit
              to calculate sentiment scores (-1 to +1) using NLP analysis. Tracks trends over time and
              alerts on significant sentiment shifts.
            </p>
            <p>
              <strong>Anomaly Detection:</strong> Uses statistical methods (Z-score, IQR) to identify
              unusual price movements, volume spikes, and potential wash trading patterns. Provides
              detailed explanations for each detected anomaly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
