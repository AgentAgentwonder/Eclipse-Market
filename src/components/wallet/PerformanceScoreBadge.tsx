import React from 'react';
import { TrendingUp, TrendingDown, Award, AlertCircle } from 'lucide-react';

interface PerformanceScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  previousScore?: number;
}

export const PerformanceScoreBadge: React.FC<PerformanceScoreBadgeProps> = ({
  score,
  size = 'md',
  showLabel = true,
  previousScore,
}) => {
  const getScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (score >= 60) return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    if (score >= 40) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (score >= 20) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getScoreLabel = (score: number): string => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Poor';
    return 'Very Poor';
  };

  const getIcon = (score: number) => {
    if (score >= 80) return Award;
    if (score >= 60) return TrendingUp;
    if (score >= 40) return TrendingDown;
    return AlertCircle;
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 12,
    md: 16,
    lg: 20,
  };

  const colorClasses = getScoreColor(score);
  const Icon = getIcon(score);
  const change = previousScore !== undefined ? score - previousScore : 0;

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${colorClasses} ${sizeClasses[size]} font-medium`}
    >
      <Icon size={iconSizes[size]} />
      <span className="font-bold">{score.toFixed(1)}</span>
      {showLabel && (
        <>
          <span className="opacity-70">/</span>
          <span className="opacity-80">{getScoreLabel(score)}</span>
        </>
      )}
      {previousScore !== undefined && change !== 0 && (
        <span className={`text-xs ${change > 0 ? 'text-green-400' : 'text-red-400'}`}>
          {change > 0 ? '+' : ''}
          {change.toFixed(1)}
        </span>
      )}
    </div>
  );
};
