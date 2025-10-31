import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldX, AlertTriangle } from 'lucide-react';

export type ReputationLevel = 'excellent' | 'good' | 'neutral' | 'poor' | 'malicious';

interface ReputationBadgeProps {
  level: ReputationLevel;
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export const ReputationBadge: React.FC<ReputationBadgeProps> = ({
  level,
  score,
  size = 'md',
  showLabel = true,
  className = '',
}) => {
  const getConfig = () => {
    switch (level) {
      case 'excellent':
        return {
          icon: ShieldCheck,
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/30',
          label: 'Excellent',
        };
      case 'good':
        return {
          icon: Shield,
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/30',
          label: 'Good',
        };
      case 'neutral':
        return {
          icon: Shield,
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/30',
          label: 'Neutral',
        };
      case 'poor':
        return {
          icon: ShieldAlert,
          color: 'text-orange-500',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/30',
          label: 'Poor',
        };
      case 'malicious':
        return {
          icon: ShieldX,
          color: 'text-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          label: 'Malicious',
        };
    }
  };

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return {
          container: 'px-2 py-1 text-xs',
          icon: 'w-3 h-3',
          gap: 'gap-1',
        };
      case 'md':
        return {
          container: 'px-3 py-1.5 text-sm',
          icon: 'w-4 h-4',
          gap: 'gap-1.5',
        };
      case 'lg':
        return {
          container: 'px-4 py-2 text-base',
          icon: 'w-5 h-5',
          gap: 'gap-2',
        };
    }
  };

  const config = getConfig();
  const sizeClasses = getSizeClasses();
  const Icon = config.icon;

  return (
    <div
      className={`
        inline-flex items-center ${sizeClasses.gap} ${sizeClasses.container}
        ${config.bgColor} ${config.borderColor}
        border rounded-lg font-medium
        ${className}
      `}
      title={`Reputation Score: ${score.toFixed(1)}`}
    >
      <Icon className={`${sizeClasses.icon} ${config.color}`} />
      {showLabel && (
        <span className={config.color}>
          {config.label}
        </span>
      )}
      <span className={`${config.color} font-semibold`}>
        {score.toFixed(0)}
      </span>
    </div>
  );
};

interface ReputationWarningProps {
  level: ReputationLevel;
  isBlacklisted?: boolean;
  blacklistReason?: string;
  className?: string;
}

export const ReputationWarning: React.FC<ReputationWarningProps> = ({
  level,
  isBlacklisted,
  blacklistReason,
  className = '',
}) => {
  if (!isBlacklisted && level !== 'poor' && level !== 'malicious') {
    return null;
  }

  const getMessage = () => {
    if (isBlacklisted) {
      return blacklistReason || 'This address has been blacklisted';
    }
    if (level === 'malicious') {
      return 'High risk: This address shows suspicious activity patterns';
    }
    if (level === 'poor') {
      return 'Warning: This address has a poor reputation score';
    }
    return '';
  };

  const bgColor = isBlacklisted || level === 'malicious' ? 'bg-red-500/10' : 'bg-orange-500/10';
  const borderColor = isBlacklisted || level === 'malicious' ? 'border-red-500/30' : 'border-orange-500/30';
  const textColor = isBlacklisted || level === 'malicious' ? 'text-red-400' : 'text-orange-400';

  return (
    <div
      className={`
        flex items-start gap-2 p-3 rounded-lg border
        ${bgColor} ${borderColor}
        ${className}
      `}
    >
      <AlertTriangle className={`w-5 h-5 ${textColor} flex-shrink-0 mt-0.5`} />
      <div className="flex-1">
        <p className={`text-sm ${textColor} font-medium`}>
          {getMessage()}
        </p>
      </div>
    </div>
  );
};
