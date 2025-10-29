import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Twitter, Send, TrendingUp, Users, CheckCircle, AlertTriangle, Plus, Trash2 } from 'lucide-react';
import { useTwitterStore } from '../../store/twitterStore';

const TwitterSettings = () => {
  const {
    config,
    keywords,
    influencers,
    stats,
    isLoading,
    error,
    testConnectionResult,
    saveConfig,
    getConfig,
    deleteConfig,
    testConnection,
    addKeyword,
    removeKeyword,
    loadKeywords,
    addInfluencer,
    removeInfluencer,
    loadInfluencers,
    loadStats,
  } = useTwitterStore();

  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [accessSecret, setAccessSecret] = useState('');
  const [bearerToken, setBearerToken] = useState('');
  const [enabled, setEnabled] = useState(false);
  const [autoTweetEnabled, setAutoTweetEnabled] = useState(false);
  const [sentimentTrackingEnabled, setSentimentTrackingEnabled] = useState(false);

  const [newKeyword, setNewKeyword] = useState('');
  const [newKeywordCategory, setNewKeywordCategory] = useState('');
  const [newInfluencerUsername, setNewInfluencerUsername] = useState('');
  const [newInfluencerDisplayName, setNewInfluencerDisplayName] = useState('');

  useEffect(() => {
    getConfig();
    loadKeywords();
    loadInfluencers();
    loadStats();
  }, []);

  useEffect(() => {
    if (config) {
      setApiKey(config.apiKey);
      setApiSecret(config.apiSecret);
      setAccessToken(config.accessToken);
      setAccessSecret(config.accessSecret);
      setBearerToken(config.bearerToken);
      setEnabled(config.enabled);
      setAutoTweetEnabled(config.autoTweetEnabled);
      setSentimentTrackingEnabled(config.sentimentTrackingEnabled);
    }
  }, [config]);

  const handleSave = async () => {
    try {
      await saveConfig({
        apiKey,
        apiSecret,
        accessToken,
        accessSecret,
        bearerToken,
        enabled,
        autoTweetEnabled,
        sentimentTrackingEnabled,
      });
      alert('Twitter configuration saved successfully!');
    } catch (err) {
      console.error('Failed to save config:', err);
    }
  };

  const handleTest = async () => {
    await testConnection({
      apiKey,
      apiSecret,
      accessToken,
      accessSecret,
      bearerToken,
      enabled,
      autoTweetEnabled,
      sentimentTrackingEnabled,
    });
  };

  const handleDelete = async () => {
    if (window.confirm('Delete the Twitter configuration?')) {
      try {
        await deleteConfig();
        setApiKey('');
        setApiSecret('');
        setAccessToken('');
        setAccessSecret('');
        setBearerToken('');
        setEnabled(false);
      } catch (err) {
        console.error('Failed to delete config:', err);
      }
    }
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.trim() || !newKeywordCategory.trim()) {
      alert('Please enter both keyword and category');
      return;
    }

    try {
      await addKeyword(newKeyword, newKeywordCategory);
      setNewKeyword('');
      setNewKeywordCategory('');
    } catch (err) {
      console.error('Failed to add keyword:', err);
    }
  };

  const handleAddInfluencer = async () => {
    if (!newInfluencerUsername.trim() || !newInfluencerDisplayName.trim()) {
      alert('Please enter both username and display name');
      return;
    }

    try {
      await addInfluencer(newInfluencerUsername, newInfluencerDisplayName);
      setNewInfluencerUsername('');
      setNewInfluencerDisplayName('');
    } catch (err) {
      console.error('Failed to add influencer:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Twitter Integration</h2>
        <p className="text-slate-400">
          Connect Twitter API v2 for sentiment analysis and automated tweets
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-4 gap-4">
          <motion.div
            className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Tweets Posted</p>
              <Twitter className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold text-blue-400">{stats.totalTweetsPosted}</p>
            <p className="text-xs text-slate-500 mt-1">Last 24h: {stats.last24hTweets}</p>
          </motion.div>

          <motion.div
            className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Sentiment Checks</p>
              <TrendingUp className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold text-purple-400">{stats.totalSentimentChecks}</p>
          </motion.div>

          <motion.div
            className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Keywords</p>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-2xl font-bold text-emerald-400">{stats.trackedKeywords}</p>
          </motion.div>

          <motion.div
            className="bg-slate-800/60 border border-orange-500/20 rounded-2xl p-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-slate-400">Influencers</p>
              <Users className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold text-orange-400">{stats.trackedInfluencers}</p>
          </motion.div>
        </div>
      )}

      {/* API Configuration */}
      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3 mb-6">
          <Twitter className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-semibold">API Credentials</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">API Key</label>
              <input
                type="text"
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                placeholder="Your API key"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">API Secret</label>
              <input
                type="password"
                value={apiSecret}
                onChange={e => setApiSecret(e.target.value)}
                placeholder="Your API secret"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Access Token</label>
              <input
                type="text"
                value={accessToken}
                onChange={e => setAccessToken(e.target.value)}
                placeholder="Your access token"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Access Secret</label>
              <input
                type="password"
                value={accessSecret}
                onChange={e => setAccessSecret(e.target.value)}
                placeholder="Your access secret"
                className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bearer Token</label>
            <input
              type="password"
              value={bearerToken}
              onChange={e => setBearerToken(e.target.value)}
              placeholder="Your bearer token"
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={e => setEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Enable Twitter Integration</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoTweetEnabled}
                onChange={e => setAutoTweetEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Auto-Tweet</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={sentimentTrackingEnabled}
                onChange={e => setSentimentTrackingEnabled(e.target.checked)}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-sm">Sentiment Tracking</span>
            </label>
          </div>

          {testConnectionResult && (
            <div
              className={`p-4 rounded-xl ${
                testConnectionResult.success
                  ? 'bg-emerald-500/10 border border-emerald-500/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <p
                className={`text-sm font-medium ${
                  testConnectionResult.success ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {testConnectionResult.success
                  ? testConnectionResult.message
                  : `Connection failed: ${testConnectionResult.error}`}
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleTest}
              disabled={isLoading || !bearerToken}
              className="flex-1 px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:text-slate-500 transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={isLoading || !bearerToken}
              className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:text-slate-500 transition"
            >
              Save Configuration
            </button>
            {config && (
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 transition"
              >
                Delete
              </button>
            )}
          </div>

          {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
      </motion.div>

      {/* Sentiment Keywords */}
      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold mb-4">Sentiment Keywords</h3>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            placeholder="Keyword (e.g., SOL, Bitcoin)"
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="text"
            value={newKeywordCategory}
            onChange={e => setNewKeywordCategory(e.target.value)}
            placeholder="Category (e.g., crypto)"
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleAddKeyword}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {keywords.map(keyword => (
            <div
              key={keyword.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
            >
              <div>
                <p className="font-medium">{keyword.keyword}</p>
                <p className="text-sm text-slate-400">Category: {keyword.category}</p>
              </div>
              <button
                onClick={() => removeKeyword(keyword.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Influencers */}
      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h3 className="text-xl font-semibold mb-4">Track Influencers</h3>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={newInfluencerUsername}
            onChange={e => setNewInfluencerUsername(e.target.value)}
            placeholder="Username (e.g., @solana)"
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
          <input
            type="text"
            value={newInfluencerDisplayName}
            onChange={e => setNewInfluencerDisplayName(e.target.value)}
            placeholder="Display Name"
            className="flex-1 px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
          />
          <button
            onClick={handleAddInfluencer}
            className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        </div>

        <div className="space-y-2">
          {influencers.map(influencer => (
            <div
              key={influencer.id}
              className="flex items-center justify-between p-3 bg-slate-900/50 rounded-xl"
            >
              <div>
                <p className="font-medium">{influencer.displayName}</p>
                <p className="text-sm text-slate-400">@{influencer.username}</p>
              </div>
              <button
                onClick={() => removeInfluencer(influencer.id)}
                className="p-2 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default TwitterSettings;
