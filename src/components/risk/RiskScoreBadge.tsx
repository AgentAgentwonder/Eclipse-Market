import { AlertTriangle, ShieldCheck, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RiskScoreBadgeProps {
  score: number;
  riskLevel: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function RiskScoreBadge({ score, riskLevel, size = 'md', showLabel = true }: RiskScoreBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSize = {
    sm: 14,
    md: 16,
    lg: 20,
  };

  const getColorClasses = () => {
    switch (riskLevel) {
      case 'Low':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Medium':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getIcon = () => {
    const size = iconSize[size];
    switch (riskLevel) {
      case 'Low':
        return <ShieldCheck size={size} />;
      case 'Medium':
        return <ShieldAlert size={size} />;
      case 'High':
        return <AlertTriangle size={size} />;
      case 'Critical':
        return <AlertOctagon size={size} />;
      default:
        return <AlertTriangle size={size} />;
    }
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border font-semibold ${sizeClasses[size]} ${getColorClasses()}`}
    >
      {getIcon()}
      {showLabel && (
        <>
          <span>{riskLevel}</span>
          <span className="opacity-75">({score.toFixed(0)})</span>
        </>
      )}
    </div>
  );
}
