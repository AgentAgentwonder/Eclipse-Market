import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { UpcomingDeadline } from '../../types/governance';

interface UpcomingDeadlinesProps {
  deadlines: UpcomingDeadline[];
  onVote: (proposalId: string) => void;
}

export function UpcomingDeadlines({ deadlines, onVote }: UpcomingDeadlinesProps) {
  if (deadlines.length === 0) {
    return null;
  }

  const getUrgencyColor = (hours: number) => {
    if (hours < 24) return 'text-red-400 bg-red-900/20 border-red-800';
    if (hours < 72) return 'text-yellow-400 bg-yellow-900/20 border-yellow-800';
    return 'text-blue-400 bg-blue-900/20 border-blue-800';
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold">Upcoming Deadlines</h3>
      </div>

      <div className="space-y-3">
        {deadlines.map((deadline, index) => (
          <motion.div
            key={deadline.proposalId}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-lg border ${getUrgencyColor(deadline.timeRemainingHours)}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-medium">{deadline.daoName}</span>
                  {deadline.hasVoted && (
                    <CheckCircle className="w-4 h-4 text-green-400" />
                  )}
                  {!deadline.hasVoted && deadline.timeRemainingHours < 24 && (
                    <AlertCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <p className="text-sm font-medium mb-1">{deadline.title}</p>
                <p className="text-xs text-gray-400">
                  {deadline.timeRemainingHours < 1
                    ? 'Less than 1 hour remaining'
                    : `${deadline.timeRemainingHours}h remaining`}
                </p>
              </div>

              {!deadline.hasVoted && (
                <button
                  onClick={() => onVote(deadline.proposalId)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
                >
                  Vote Now
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
