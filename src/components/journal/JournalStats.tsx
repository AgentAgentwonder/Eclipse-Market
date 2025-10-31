import { FC } from 'react';
import { JournalStats as JournalStatsType } from '../../types/journal';
import { BarChart2, Tag, Smile } from 'lucide-react';

interface Props {
  stats: JournalStatsType;
}

export const JournalStats: FC<Props> = ({ stats }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-400" /> Most Used Strategies
          </h3>
          {stats.most_used_strategies.length === 0 ? (
            <div className="text-gray-400 text-sm">No strategies recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {stats.most_used_strategies.map((strategy, index) => (
                <div
                  key={strategy.tag}
                  className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg p-3"
                >
                  <div>
                    <div className="font-medium text-gray-200">
                      #{index + 1} {strategy.tag}
                    </div>
                    <div className="text-sm text-gray-400">{strategy.count} uses</div>
                  </div>
                  <div className="text-emerald-400 font-semibold">{strategy.win_rate.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Smile className="w-5 h-5 text-purple-400" /> Most Common Emotions
          </h3>
          {stats.most_common_emotions.length === 0 ? (
            <div className="text-gray-400 text-sm">No emotions logged yet.</div>
          ) : (
            <div className="space-y-3">
              {stats.most_common_emotions.map((emotion, index) => (
                <div
                  key={emotion.emotion}
                  className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg p-3"
                >
                  <div>
                    <div className="font-medium text-gray-200 capitalize">
                      #{index + 1} {emotion.emotion}
                    </div>
                    <div className="text-sm text-gray-400">{emotion.count} occurrences</div>
                  </div>
                  <div className="text-purple-400 font-semibold">{emotion.percentage.toFixed(1)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-green-400" /> Journaling Activity
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Average Per Week</div>
            <div className="text-2xl font-bold text-white">{stats.average_entries_per_week.toFixed(1)}</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">This Month</div>
            <div className="text-2xl font-bold text-white">{stats.entries_this_month}</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-2xl font-bold text-white">{stats.entries_this_week}</div>
          </div>
          <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Discipline</div>
            <div className="text-2xl font-bold text-emerald-400">
              {(stats.overall_discipline_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
