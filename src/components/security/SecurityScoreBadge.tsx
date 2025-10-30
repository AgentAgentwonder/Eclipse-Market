import { Shield, AlertTriangle, AlertOctagon, Ban } from 'lucide-react';
import type { RiskLevel } from '../../types/audit';

interface SecurityScoreBadgeProps {
  score: number;
  riskLevel: RiskLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function SecurityScoreBadge({
  score,
  riskLevel,
  size = 'md',
  showLabel = true,
}: SecurityScoreBadgeProps) {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const config = {
    low: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      icon: Shield,
      label: 'Low Risk',
    },
    medium: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      icon: AlertTriangle,
      label: 'Medium Risk',
    },
    high: {
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      text: 'text-orange-400',
      icon: AlertOctagon,
      label: 'High Risk',
    },
    critical: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      icon: Ban,
      label: 'Critical Risk',
    },
  };

  const { bg, border, text, icon: Icon, label } = config[riskLevel];

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-lg border ${bg} ${border} ${sizeClasses[size]}`}
    >
      <Icon className={`${iconSizes[size]} ${text}`} />
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${text}`}>{score}</span>
        {showLabel && <span className={`${text} font-medium`}>{label}</span>}
      </div>
    </div>
  );
}
