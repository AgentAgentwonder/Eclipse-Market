import { FC, useMemo, useState } from 'react';
import {
  JournalEntry,
  EntryType,
  Emotion,
  MarketTrend,
  Volatility,
  VolumeLevel,
  TradeOutcome,
} from '../../types/journal';
import { X, PlusCircle } from 'lucide-react';

interface Props {
  entry?: JournalEntry;
  onSubmit: (entry: JournalEntry) => void;
  onCancel: () => void;
}

const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: 'pre_trade', label: 'Pre-Trade Plan' },
  { value: 'in_trade', label: 'In-Trade Journal' },
  { value: 'post_trade', label: 'Post-Trade Review' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'goal', label: 'Goal / Objective' },
  { value: 'mistake', label: 'Mistake Analysis' },
];

const EMOTIONS: { value: Emotion; label: string }[] = [
  { value: 'confident', label: 'Confident' },
  { value: 'anxious', label: 'Anxious' },
  { value: 'excited', label: 'Excited' },
  { value: 'fearful', label: 'Fearful' },
  { value: 'greedy', label: 'Greedy' },
  { value: 'patient', label: 'Patient' },
  { value: 'impatient', label: 'Impatient' },
  { value: 'calm', label: 'Calm' },
  { value: 'stressed', label: 'Stressed' },
  { value: 'euphoric', label: 'Euphoric' },
  { value: 'regretful', label: 'Regretful' },
  { value: 'neutral', label: 'Neutral' },
];

const MARKET_TRENDS: { value: MarketTrend; label: string }[] = [
  { value: 'strong_bullish', label: 'Strong Bullish' },
  { value: 'bullish', label: 'Bullish' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'bearish', label: 'Bearish' },
  { value: 'strong_bearish', label: 'Strong Bearish' },
];

const VOLATILITY_LEVELS: { value: Volatility; label: string }[] = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];

const VOLUME_LEVELS: { value: VolumeLevel; label: string }[] = [
  { value: 'very_low', label: 'Very Low' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'very_high', label: 'Very High' },
];

const defaultEntry = (): JournalEntry => ({
  id: '',
  timestamp: Math.floor(Date.now() / 1000),
  trade_id: undefined,
  entry_type: 'pre_trade',
  strategy_tags: [],
  emotions: {
    primary_emotion: 'neutral',
    intensity: 0.5,
    secondary_emotions: [],
    stress_level: 0.5,
    clarity_level: 0.5,
    fomo_level: 0,
    revenge_trading: false,
    discipline_score: 0.5,
  },
  notes: '',
  market_conditions: {
    trend: 'neutral',
    volatility: 'medium',
    volume: 'medium',
    news_sentiment: 0,
    notes: '',
  },
  confidence_level: 0.5,
  position_size: undefined,
  entry_price: undefined,
  exit_price: undefined,
  outcome: undefined,
  lessons_learned: undefined,
  attachments: [],
  created_at: 0,
  updated_at: 0,
});

export const JournalEntryForm: FC<Props> = ({ entry, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState<JournalEntry>(entry ? JSON.parse(JSON.stringify(entry)) : defaultEntry());
  const [tagInput, setTagInput] = useState('');
  const [includeOutcome, setIncludeOutcome] = useState(Boolean(entry?.outcome));

  const handleChange = <K extends keyof JournalEntry>(key: K, value: JournalEntry[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleEmotionChange = <K extends keyof JournalEntry['emotions']>(key: K, value: JournalEntry['emotions'][K]) => {
    setFormData(prev => ({
      ...prev,
      emotions: {
        ...prev.emotions,
        [key]: value,
      },
    }));
  };

  const handleMarketChange = <K extends keyof JournalEntry['market_conditions']>(
    key: K,
    value: JournalEntry['market_conditions'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      market_conditions: {
        ...prev.market_conditions,
        [key]: value,
      },
    }));
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed || formData.strategy_tags.includes(trimmed)) return;
    handleChange('strategy_tags', [...formData.strategy_tags, trimmed]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    handleChange(
      'strategy_tags',
      formData.strategy_tags.filter(t => t !== tag)
    );
  };

  const handleOutcomeChange = <K extends keyof TradeOutcome>(key: K, value: TradeOutcome[K]) => {
    const current = formData.outcome || {
      pnl: 0,
      pnl_percent: 0,
      success: false,
      followed_plan: false,
      risk_reward_ratio: 1,
    };
    handleChange('outcome', { ...current, [key]: value });
  };

  const resetOutcome = () => {
    handleChange('outcome', undefined);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const sanitized: JournalEntry = {
      ...formData,
      trade_id: formData.trade_id || undefined,
      lessons_learned: formData.lessons_learned?.trim() ? formData.lessons_learned : undefined,
      strategy_tags: formData.strategy_tags.map(tag => tag.trim()).filter(Boolean),
      outcome: includeOutcome ? formData.outcome : undefined,
    };

    onSubmit(sanitized);
  };

  return (
    <form onSubmit={handleSubmit} className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">{entry ? 'Edit Journal Entry' : 'New Journal Entry'}</h2>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-gray-300">Entry Type</span>
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
            value={formData.entry_type}
            onChange={e => handleChange('entry_type', e.target.value as EntryType)}
          >
            {ENTRY_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">Trade ID / Reference (optional)</span>
          <input
            type="text"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
            value={formData.trade_id || ''}
            onChange={e => handleChange('trade_id', e.target.value || undefined)}
          />
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">Confidence Level</span>
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(formData.confidence_level * 100)}
              onChange={e => handleChange('confidence_level', Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="text-right text-gray-400 text-sm">
              {Math.round(formData.confidence_level * 100)}%
            </div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-gray-300">Primary Emotion</span>
          <select
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 capitalize"
            value={formData.emotions.primary_emotion}
            onChange={e => handleEmotionChange('primary_emotion', e.target.value as Emotion)}
          >
            {EMOTIONS.map(emotion => (
              <option key={emotion.value} value={emotion.value}>
                {emotion.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">Emotion Intensity</span>
          <div>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(formData.emotions.intensity * 100)}
              onChange={e => handleEmotionChange('intensity', Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="text-right text-gray-400 text-sm">
              {Math.round(formData.emotions.intensity * 100)}%
            </div>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-gray-300">Stress Level</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(formData.emotions.stress_level * 100)}
            onChange={e => handleEmotionChange('stress_level', Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="text-right text-gray-400 text-sm">
            {Math.round(formData.emotions.stress_level * 100)}%
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">Clarity Level</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(formData.emotions.clarity_level * 100)}
            onChange={e => handleEmotionChange('clarity_level', Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="text-right text-gray-400 text-sm">
            {Math.round(formData.emotions.clarity_level * 100)}%
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">FOMO Level</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(formData.emotions.fomo_level * 100)}
            onChange={e => handleEmotionChange('fomo_level', Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="text-right text-gray-400 text-sm">
            {Math.round(formData.emotions.fomo_level * 100)}%
          </div>
        </label>

        <label className="space-y-2">
          <span className="text-sm text-gray-300">Discipline Score</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(formData.emotions.discipline_score * 100)}
            onChange={e => handleEmotionChange('discipline_score', Number(e.target.value) / 100)}
            className="w-full"
          />
          <div className="text-right text-gray-400 text-sm">
            {Math.round(formData.emotions.discipline_score * 100)}%
          </div>
        </label>
      </div>

      <label className="inline-flex items-center gap-2 text-sm text-gray-300">
        <input
          type="checkbox"
          checked={formData.emotions.revenge_trading}
          onChange={e => handleEmotionChange('revenge_trading', e.target.checked)}
          className="rounded border border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
        />
        Revenge trading tendencies detected in this trade
      </label>

      <div>
        <span className="text-sm text-gray-300 block mb-2">Strategy Tags</span>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.strategy_tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-2 bg-gray-800 border border-gray-700 rounded-full px-3 py-1 text-sm text-gray-200"
            >
              {tag}
              <button type="button" onClick={() => removeTag(tag)} className="text-gray-400 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="Add strategy tag (press Enter)"
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
          />
          <button
            type="button"
            onClick={addTag}
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-200 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm text-gray-300">Trade Notes / Narrative</span>
        <textarea
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 min-h-[150px]"
          value={formData.notes}
          onChange={e => handleChange('notes', e.target.value)}
          placeholder="Describe your setup, execution plan, thought processes, and emotional cues..."
        />
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border border-gray-800 rounded-xl bg-gray-900/50 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">Market Context</h3>
          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Market Trend</span>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 capitalize"
              value={formData.market_conditions.trend}
              onChange={e => handleMarketChange('trend', e.target.value as MarketTrend)}
            >
              {MARKET_TRENDS.map(trend => (
                <option key={trend.value} value={trend.value}>
                  {trend.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Volatility</span>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 capitalize"
              value={formData.market_conditions.volatility}
              onChange={e => handleMarketChange('volatility', e.target.value as Volatility)}
            >
              {VOLATILITY_LEVELS.map(vol => (
                <option key={vol.value} value={vol.value}>
                  {vol.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Volume</span>
            <select
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 capitalize"
              value={formData.market_conditions.volume}
              onChange={e => handleMarketChange('volume', e.target.value as VolumeLevel)}
            >
              {VOLUME_LEVELS.map(volume => (
                <option key={volume.value} value={volume.value}>
                  {volume.label}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">News Sentiment</span>
            <input
              type="range"
              min={-100}
              max={100}
              value={Math.round((formData.market_conditions.news_sentiment || 0) * 100)}
              onChange={e => handleMarketChange('news_sentiment', Number(e.target.value) / 100)}
              className="w-full"
            />
            <div className="text-right text-gray-400 text-sm">
              {Math.round((formData.market_conditions.news_sentiment || 0) * 100)}%
            </div>
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Market Notes</span>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 min-h-[80px]"
              value={formData.market_conditions.notes}
              onChange={e => handleMarketChange('notes', e.target.value)}
            />
          </label>
        </div>

        <div className="border border-gray-800 rounded-xl bg-gray-900/50 p-4 space-y-3">
          <h3 className="text-sm font-medium text-gray-200 uppercase tracking-wider">Trade Metrics</h3>
          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Position Size</span>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
              value={formData.position_size ?? ''}
              onChange={e => handleChange('position_size', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Amount committed"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Entry Price</span>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
              value={formData.entry_price ?? ''}
              onChange={e => handleChange('entry_price', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Average entry"
              step="0.0001"
            />
          </label>

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Exit Price</span>
            <input
              type="number"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
              value={formData.exit_price ?? ''}
              onChange={e => handleChange('exit_price', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Average exit (if closed)"
              step="0.0001"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-gray-300">
            <input
              type="checkbox"
              checked={includeOutcome}
              onChange={e => {
                setIncludeOutcome(e.target.checked);
                if (!e.target.checked) {
                  resetOutcome();
                }
              }}
              className="rounded border border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
            />
            Attach trade outcome details
          </label>

          {includeOutcome && (
            <div className="space-y-3 border border-gray-800 rounded-lg p-3 bg-gray-900/60">
              <label className="space-y-1 block text-sm text-gray-400">
                Success
                <select
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                  value={formData.outcome?.success ? 'true' : 'false'}
                  onChange={e => handleOutcomeChange('success', e.target.value === 'true')}
                >
                  <option value="true">Successful Trade</option>
                  <option value="false">Unsuccessful Trade</option>
                </select>
              </label>

              <label className="inline-flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={Boolean(formData.outcome?.followed_plan)}
                  onChange={e => handleOutcomeChange('followed_plan', e.target.checked)}
                  className="rounded border border-gray-600 bg-gray-900 text-blue-500 focus:ring-blue-500"
                />
                Followed trading plan
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="space-y-1 block">
                  <span className="text-sm text-gray-400">P&L</span>
                  <input
                    type="number"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                    value={formData.outcome?.pnl ?? ''}
                    onChange={e => handleOutcomeChange('pnl', e.target.value ? Number(e.target.value) : 0)}
                    step="0.01"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-sm text-gray-400">P&L %</span>
                  <input
                    type="number"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                    value={formData.outcome?.pnl_percent ?? ''}
                    onChange={e => handleOutcomeChange('pnl_percent', e.target.value ? Number(e.target.value) : 0)}
                    step="0.01"
                  />
                </label>
                <label className="space-y-1 block">
                  <span className="text-sm text-gray-400">Risk/Reward Ratio</span>
                  <input
                    type="number"
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
                    value={formData.outcome?.risk_reward_ratio ?? ''}
                    onChange={e => handleOutcomeChange('risk_reward_ratio', e.target.value ? Number(e.target.value) : 1)}
                    step="0.1"
                  />
                </label>
              </div>
            </div>
          )}

          <label className="space-y-2 block">
            <span className="text-sm text-gray-400">Lessons Learned (optional)</span>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100 min-h-[100px]"
              value={formData.lessons_learned ?? ''}
              onChange={e => handleChange('lessons_learned', e.target.value || undefined)}
              placeholder="Key takeaways, adjustments, affirmations, or reminders..."
            />
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-gray-300 hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          {entry ? 'Save Changes' : 'Create Entry'}
        </button>
      </div>
    </form>
  );
};
