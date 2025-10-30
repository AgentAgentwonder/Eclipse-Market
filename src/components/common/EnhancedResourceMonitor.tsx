import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Download,
  Zap,
  Settings,
  TrendingUp,
} from 'lucide-react';
import { usePerformanceStore } from '../../store/performanceStore';

interface TimeInterval {
  label: string;
  minutes: number;
}

const TIME_INTERVALS: TimeInterval[] = [
  { label: '1m', minutes: 1 },
  { label: '5m', minutes: 5 },
  { label: '15m', minutes: 15 },
];

export function EnhancedResourceMonitor() {
  const [selectedInterval, setSelectedInterval] = useState<number>(1);
  const [performanceMode, setPerformanceMode] = useState<'balanced' | 'performance' | 'battery'>('balanced');
  const { history, metrics, gpuEnabled, setGpuEnabled, budgets, setBudgets } = usePerformanceStore();

  const filteredHistory = useMemo(() => {
    const now = Date.now();
    const cutoff = now - selectedInterval * 60 * 1000;
    return history.filter(entry => entry.timestamp >= cutoff);
  }, [history, selectedInterval]);

  const averages = useMemo(() => {
    if (filteredHistory.length === 0) return metrics;
    
    const sum = filteredHistory.reduce(
      (acc, entry) => ({
        fps: acc.fps + entry.fps,
        cpuLoad: acc.cpuLoad + entry.cpuLoad,
        gpuLoad: acc.gpuLoad + entry.gpuLoad,
        memoryUsed: acc.memoryUsed + entry.memoryUsed,
        networkDownlink: acc.networkDownlink + entry.networkDownlink,
      }),
      { fps: 0, cpuLoad: 0, gpuLoad: 0, memoryUsed: 0, networkDownlink: 0 }
    );

    const count = filteredHistory.length;
    return {
      fps: Math.round(sum.fps / count),
      cpuLoad: sum.cpuLoad / count,
      gpuLoad: sum.gpuLoad / count,
      memoryUsed: sum.memoryUsed / count,
      networkDownlink: sum.networkDownlink / count,
    };
  }, [filteredHistory, metrics]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const applyPerformanceMode = (mode: 'balanced' | 'performance' | 'battery') => {
    setPerformanceMode(mode);
    
    const modeConfigs = {
      performance: {
        fps: { threshold: 60, enabled: true },
        frameTime: { threshold: 16.67, enabled: true },
        cpuLoad: { threshold: 95, enabled: false },
        gpuEnabled: true,
      },
      balanced: {
        fps: { threshold: 30, enabled: true },
        frameTime: { threshold: 55, enabled: true },
        cpuLoad: { threshold: 85, enabled: true },
        gpuEnabled: true,
      },
      battery: {
        fps: { threshold: 24, enabled: true },
        frameTime: { threshold: 80, enabled: false },
        cpuLoad: { threshold: 70, enabled: true },
        gpuEnabled: false,
      },
    };

    const config = modeConfigs[mode];
    setGpuEnabled(config.gpuEnabled);

    // Update budgets based on mode
    const newBudgets = budgets.map(budget => {
      if (budget.metric === 'fps' && 'fps' in config) {
        return { ...budget, threshold: config.fps.threshold };
      }
      if (budget.metric === 'cpuLoad' && 'cpuLoad' in config) {
        return { ...budget, threshold: config.cpuLoad.threshold };
      }
      return budget;
    });
    setBudgets(newBudgets);
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      selectedInterval: `${selectedInterval}m`,
      performanceMode,
      averages,
      history: filteredHistory,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resource-monitor-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Resource Monitor</h3>
          <p className="text-sm text-slate-400">System resource usage and performance metrics</p>
        </div>
        <button
          onClick={exportReport}
          className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors text-sm"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      {/* Time Interval Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Time Range:</span>
        {TIME_INTERVALS.map(interval => (
          <button
            key={interval.minutes}
            onClick={() => setSelectedInterval(interval.minutes)}
            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
              selectedInterval === interval.minutes
                ? 'bg-purple-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            }`}
          >
            {interval.label}
          </button>
        ))}
      </div>

      {/* Performance Mode */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium">Performance Mode</span>
        </div>
        <div className="flex gap-2">
          {(['battery', 'balanced', 'performance'] as const).map(mode => (
            <button
              key={mode}
              onClick={() => applyPerformanceMode(mode)}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                performanceMode === mode
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          {performanceMode === 'performance' && 'Maximum FPS, GPU enabled, higher resource usage'}
          {performanceMode === 'balanced' && 'Optimal balance between performance and efficiency'}
          {performanceMode === 'battery' && 'Reduced FPS, GPU disabled, minimal resource usage'}
        </p>
      </div>

      {/* Current Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Activity}
          label="FPS"
          value={metrics.fps}
          average={averages.fps}
          unit=""
          threshold={budgets.find(b => b.metric === 'fps')?.threshold}
        />
        <MetricCard
          icon={Cpu}
          label="CPU"
          value={metrics.cpuLoad}
          average={averages.cpuLoad}
          unit="%"
          threshold={budgets.find(b => b.metric === 'cpuLoad')?.threshold}
        />
        <MetricCard
          icon={Zap}
          label="GPU"
          value={metrics.gpuLoad}
          average={averages.gpuLoad}
          unit="%"
          threshold={budgets.find(b => b.metric === 'gpuLoad')?.threshold}
          badge={gpuEnabled ? 'Enabled' : 'Disabled'}
        />
        <MetricCard
          icon={Network}
          label="Network"
          value={metrics.networkDownlink}
          average={averages.networkDownlink}
          unit=" Mbps"
          threshold={budgets.find(b => b.metric === 'networkDownlink')?.threshold}
        />
      </div>

      {/* Memory Usage */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium">Memory Usage</span>
          </div>
          <span className="text-sm text-slate-400">
            {formatBytes(metrics.memoryUsed)} / {formatBytes(metrics.memoryTotal)}
          </span>
        </div>
        <div className="h-4 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{
              width: `${(metrics.memoryUsed / metrics.memoryTotal) * 100}%`,
            }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="text-xs text-slate-500">
          {((metrics.memoryUsed / metrics.memoryTotal) * 100).toFixed(1)}% used
        </div>
      </div>

      {/* Historical Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HistoryChart
          title="CPU Usage"
          data={filteredHistory}
          dataKey="cpuLoad"
          color="from-blue-500 to-cyan-500"
          unit="%"
        />
        <HistoryChart
          title="Memory Usage"
          data={filteredHistory}
          dataKey="memoryUsed"
          color="from-purple-500 to-pink-500"
          unit="MB"
          formatValue={v => (v / 1024 / 1024).toFixed(0)}
        />
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  average,
  unit,
  threshold,
  badge,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  average: number;
  unit: string;
  threshold?: number;
  badge?: string;
}) {
  const isOverThreshold = threshold ? value > threshold : false;
  const color = isOverThreshold ? 'text-red-400' : 'text-green-400';

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-400">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className={`text-2xl font-mono font-semibold ${color}`}>
        {typeof value === 'number' ? value.toFixed(0) : value}
        {unit}
      </div>
      <div className="text-xs text-slate-500 mt-1">
        Avg: {typeof average === 'number' ? average.toFixed(0) : average}
        {unit}
      </div>
    </div>
  );
}

function HistoryChart({
  title,
  data,
  dataKey,
  color,
  unit,
  formatValue,
}: {
  title: string;
  data: any[];
  dataKey: string;
  color: string;
  unit: string;
  formatValue?: (v: number) => string;
}) {
  const maxValue = useMemo(() => {
    if (data.length === 0) return 100;
    return Math.max(...data.map(d => d[dataKey]));
  }, [data, dataKey]);

  return (
    <div className="bg-slate-800/50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold">{title}</h4>
        <div className="flex items-center gap-1 text-xs text-slate-400">
          <TrendingUp className="w-3 h-3" />
          <span>Last {data.length} samples</span>
        </div>
      </div>
      <div className="h-32 flex items-end justify-between gap-1">
        {data.map((entry, i) => {
          const value = entry[dataKey];
          const height = (value / maxValue) * 100;
          return (
            <div
              key={i}
              className={`flex-1 bg-gradient-to-t ${color} rounded-sm transition-all hover:opacity-80 cursor-pointer`}
              style={{ height: `${height}%`, minHeight: '2px' }}
              title={`${formatValue ? formatValue(value) : value.toFixed(0)}${unit}`}
            />
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0{unit}</span>
        <span>{formatValue ? formatValue(maxValue) : maxValue.toFixed(0)}{unit}</span>
      </div>
    </div>
  );
}
