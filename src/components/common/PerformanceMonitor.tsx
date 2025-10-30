import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity,
  Cpu,
  HardDrive,
  Network,
  Eye,
  EyeOff,
  Download,
  AlertTriangle,
  X,
  Zap,
} from 'lucide-react';
import { usePerformanceStore } from '../../store/performanceStore';
import { usePerformanceMonitor } from '../../hooks/usePerformanceMonitor';

interface PerformanceMonitorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export function PerformanceMonitor({ position = 'bottom-right' }: PerformanceMonitorProps) {
  const [expanded, setExpanded] = useState(false);
  const performanceStore = usePerformanceStore();
  const { metrics, alerts, gpuInfo, gpuEnabled, gpuSupported } = performanceStore;

  usePerformanceMonitor();

  const positionClass = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }[position];

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const exportReport = () => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics,
      gpuInfo,
      alerts,
      budgets: performanceStore.budgets,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getMetricColor = (metric: keyof typeof metrics, value: number) => {
    const budget = performanceStore.budgets.find(b => b.metric === metric);
    if (!budget) return 'text-gray-400';

    if (metric === 'fps' || metric === 'networkDownlink') {
      return value < budget.threshold ? 'text-red-400' : value < budget.threshold * 1.2 ? 'text-yellow-400' : 'text-green-400';
    }

    if (metric === 'memoryUsed' && metrics.memoryTotal > 0) {
      const ratio = metrics.memoryUsed / metrics.memoryTotal;
      return ratio > budget.threshold ? 'text-red-400' : ratio > budget.threshold * 0.9 ? 'text-yellow-400' : 'text-green-400';
    }

    return value > budget.threshold ? 'text-red-400' : value > budget.threshold * 0.9 ? 'text-yellow-400' : 'text-green-400';
  };

  return (
    <motion.div
      className={`fixed ${positionClass} z-50 pointer-events-auto`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <div className="bg-slate-900/95 backdrop-blur-md border border-purple-500/30 rounded-xl shadow-2xl overflow-hidden">
        {!expanded ? (
          <button
            onClick={() => setExpanded(true)}
            className="flex items-center gap-2 px-4 py-3 hover:bg-purple-500/10 transition-colors"
            title="Expand performance monitor"
          >
            <Activity className="w-4 h-4 text-purple-400" />
            <div className="flex gap-2 text-xs font-mono">
              <span className={getMetricColor('fps', metrics.fps)}>{metrics.fps} FPS</span>
              <span className="text-gray-600">|</span>
              <span className={getMetricColor('frameTime', metrics.frameTime)}>
                {metrics.frameTime.toFixed(1)}ms
              </span>
            </div>
            {alerts.length > 0 && (
              <AlertTriangle className="w-4 h-4 text-yellow-400 animate-pulse" />
            )}
          </button>
        ) : (
          <div className="w-80">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <h3 className="font-semibold">Performance Monitor</h3>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={exportReport}
                  className="p-1 hover:bg-purple-500/10 rounded transition-colors"
                  title="Export report"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="p-1 hover:bg-purple-500/10 rounded transition-colors"
                  title="Minimize"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={Activity}
                  label="FPS"
                  value={`${metrics.fps}`}
                  color={getMetricColor('fps', metrics.fps)}
                />
                <MetricCard
                  icon={Activity}
                  label="Frame Time"
                  value={`${metrics.frameTime.toFixed(1)}ms`}
                  color={getMetricColor('frameTime', metrics.frameTime)}
                />
                <MetricCard
                  icon={Cpu}
                  label="CPU Load"
                  value={`${metrics.cpuLoad.toFixed(0)}%`}
                  color={getMetricColor('cpuLoad', metrics.cpuLoad)}
                />
                <MetricCard
                  icon={Zap}
                  label="GPU Load"
                  value={`${metrics.gpuLoad.toFixed(0)}%`}
                  color={getMetricColor('gpuLoad', metrics.gpuLoad)}
                  badge={gpuEnabled && gpuSupported ? 'WebGL' : 'CPU'}
                />
                <MetricCard
                  icon={HardDrive}
                  label="Memory"
                  value={formatBytes(metrics.memoryUsed)}
                  subtitle={`/ ${formatBytes(metrics.memoryTotal)}`}
                  color={getMetricColor('memoryUsed', metrics.memoryUsed)}
                />
                <MetricCard
                  icon={Network}
                  label="Network"
                  value={`${metrics.networkDownlink.toFixed(1)} Mbps`}
                  subtitle={metrics.networkType}
                  color={getMetricColor('networkDownlink', metrics.networkDownlink)}
                />
              </div>

              {gpuInfo && (
                <div className="p-3 bg-slate-800/50 rounded-lg text-xs">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-400">GPU Acceleration</span>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gpuEnabled}
                        onChange={e => performanceStore.setGpuEnabled(e.target.checked)}
                        disabled={!gpuSupported}
                        className="rounded"
                      />
                      <span className="text-xs">{gpuEnabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                  </div>
                  {gpuSupported && (
                    <>
                      <div className="text-gray-500">
                        {gpuInfo.renderer}
                      </div>
                      <div className="text-gray-600 text-[10px]">
                        WebGL {gpuInfo.webglVersion} • {gpuInfo.vendor}
                      </div>
                    </>
                  )}
                  {!gpuSupported && (
                    <div className="text-yellow-400 text-xs">WebGL not supported</div>
                  )}
                </div>
              )}

              <AnimatePresence>
                {alerts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2"
                  >
                    {alerts.slice(-3).map(alert => (
                      <div
                        key={alert.id}
                        className={`p-2 rounded-lg text-xs flex items-start gap-2 ${
                          alert.level === 'critical'
                            ? 'bg-red-500/10 border border-red-500/20'
                            : 'bg-yellow-500/10 border border-yellow-500/20'
                        }`}
                      >
                        <AlertTriangle
                          className={`w-3 h-3 mt-0.5 ${
                            alert.level === 'critical' ? 'text-red-400' : 'text-yellow-400'
                          }`}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{alert.message}</div>
                          <div className="text-gray-500 text-[10px]">
                            {alert.value.toFixed(2)} / {alert.threshold.toFixed(2)}
                          </div>
                        </div>
                        <button
                          onClick={() => performanceStore.clearAlert(alert.id)}
                          className="text-gray-500 hover:text-gray-300"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface MetricCardProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  badge?: string;
}

function MetricCard({ icon: Icon, label, value, subtitle, color = 'text-gray-400', badge }: MetricCardProps) {
  return (
    <div className="bg-slate-800/50 rounded-lg p-3">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Icon className="w-3.5 h-3.5 text-gray-500" />
          <span className="text-xs text-gray-400">{label}</span>
        </div>
        {badge && (
          <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-300 rounded">
            {badge}
          </span>
        )}
      </div>
      <div className={`text-lg font-mono font-semibold ${color}`}>
        {value}
      </div>
      {subtitle && <div className="text-xs text-gray-600">{subtitle}</div>}
    </div>
  );
}
