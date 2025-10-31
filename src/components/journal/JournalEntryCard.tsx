import { FC } from 'react';
import { JournalEntry } from '../../types/journal';
import { Calendar, Tag, Edit, Trash2, Thermometer, Activity } from 'lucide-react';
import { cn } from '../../utils/cn';

interface Props {
  entry: JournalEntry;
  onEdit: () => void;
  onDelete: () => void;
}

const emotionColorMap: Record<string, string> = {
  confident: 'bg-emerald-500/10 text-emerald-400 border-emerald-400/30',
  anxious: 'bg-amber-500/10 text-amber-300 border-amber-400/30',
  fearful: 'bg-red-500/10 text-red-400 border-red-500/30',
  greedy: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
  patient: 'bg-blue-500/10 text-blue-300 border-blue-500/30',
  calm: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  stressed: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
  excited: 'bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/30',
  euphoric: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
  regretful: 'bg-orange-500/10 text-orange-300 border-orange-500/30',
  neutral: 'bg-gray-500/10 text-gray-300 border-gray-500/30',
  impatient: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
};

const entryTypeBadge: Record<string, string> = {
  pre_trade: 'Pre-Trade Plan',
  in_trade: 'In-Trade Journal',
  post_trade: 'Post-Trade Review',
  reflection: 'Reflection',
  goal: 'Goal Setting',
  mistake: 'Mistake Review',
};

const confidenceTone = (value: number) => {
  if (value >= 0.8) return 'text-emerald-400';
  if (value >= 0.6) return 'text-blue-300';
  if (value >= 0.4) return 'text-amber-300';
  return 'text-rose-300';
};

export const JournalEntryCard: FC<Props> = ({ entry, onEdit, onDelete }) => {
  const date = new Date(entry.timestamp * 1000);
  const primaryEmotion = entry.emotions.primary_emotion;
  const emotionClass = emotionColorMap[primaryEmotion] || emotionColorMap.neutral;
  const confidencePercent = Math.round(entry.confidence_level * 100);

  return (
    <div className="border border-gray-800 bg-gray-900/80 backdrop-blur rounded-xl p-4 hover:border-gray-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span>{date.toLocaleString()}</span>
          <span className="px-2 py-0.5 border border-blue-400/30 rounded-full text-blue-300 bg-blue-500/10 text-xs">
            {entryTypeBadge[entry.entry_type] || 'Journal Entry'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-sm transition-colors"
          >
            <Edit className="w-4 h-4" /> Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30 text-sm transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Primary Emotion</div>
          <div className={cn('inline-flex items-center gap-2 px-3 py-1 rounded-full border text-sm capitalize', emotionClass)}>
            <Activity className="w-4 h-4" /> {primaryEmotion.replace('_', ' ')}
          </div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Confidence Level</div>
          <div className={cn('text-2xl font-semibold', confidenceTone(entry.confidence_level))}>{confidencePercent}%</div>
          <div className="w-full h-2 mt-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 via-blue-400 to-emerald-400"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-3">
          <div className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Stress vs Discipline</div>
          <div className="flex items-center justify-between text-sm text-gray-300">
            <span>Stress</span>
            <span>{Math.round(entry.emotions.stress_level * 100)}%</span>
          </div>
          <div className="w-full h-1.5 mt-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-rose-400 to-rose-600"
              style={{ width: `${Math.round(entry.emotions.stress_level * 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-sm text-gray-300 mt-2">
            <span>Discipline</span>
            <span>{Math.round(entry.emotions.discipline_score * 100)}%</span>
          </div>
          <div className="w-full h-1.5 mt-1 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600"
              style={{ width: `${Math.round(entry.emotions.discipline_score * 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="text-gray-200 mb-3 leading-relaxed whitespace-pre-wrap">
        {entry.notes}
      </div>

      {entry.lessons_learned && (
        <div className="border border-emerald-500/30 bg-emerald-500/5 rounded-lg p-3 mb-3">
          <div className="text-xs text-emerald-300 uppercase tracking-wider mb-1">Lesson Learned</div>
          <div className="text-emerald-100 text-sm whitespace-pre-wrap leading-relaxed">
            {entry.lessons_learned}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-sm">
        <div className="flex flex-wrap gap-2">
          {entry.strategy_tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1 px-3 py-1 bg-gray-800/60 border border-gray-700 rounded-full text-gray-300">
              <Tag className="w-3 h-3" /> {tag}
            </span>
          ))}
        </div>
        {entry.outcome && (
          <div className="flex items-center gap-4 text-gray-300">
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">P&L</span>
              <span className={entry.outcome.pnl >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {entry.outcome.pnl >= 0 ? '+' : ''}
                {entry.outcome.pnl.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">P&L %</span>
              <span className={entry.outcome.pnl_percent >= 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                {entry.outcome.pnl_percent >= 0 ? '+' : ''}
                {entry.outcome.pnl_percent.toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 uppercase tracking-wider block">Risk/Reward</span>
              <span className="text-blue-300 font-semibold">{entry.outcome.risk_reward_ratio.toFixed(2)}x</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
