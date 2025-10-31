import React, { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  AlertCircle,
  TrendingUp,
  Settings,
  Download,
  Trash2,
  Play,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: string;
  message: string;
  category?: string;
  details?: any;
  threadId?: string;
}

interface CompilationError {
  file: string;
  line: number;
  column?: number;
  message: string;
  severity: string;
  code?: string;
}

interface PerformanceMetrics {
  timestamp: string;
  cpuUsage: number;
  memoryUsage: number;
  totalMemoryMb: number;
  usedMemoryMb: number;
  processCpuUsage: number;
  processMemoryMb: number;
}

interface ErrorStats {
  totalErrors: number;
  errorsByCategory: Record<string, number>;
  errorsByCode: Record<string, number>;
  autoFixed: number;
  manuallyFixed: number;
  recoverySuccessRate: number;
}

type TabType = 'console' | 'compiler' | 'errors' | 'performance';

const DevConsole: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('console');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [compilationErrors, setCompilationErrors] = useState<CompilationError[]>([]);
  const [buildStatus, setBuildStatus] = useState<string>('idle');
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [errorStats, setErrorStats] = useState<ErrorStats | null>(null);
  const [logFilter, setLogFilter] = useState<string>('');
  const [minLogLevel, setMinLogLevel] = useState<string>('INFO');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    try {
      const fetchedLogs = await invoke<LogEntry[]>('get_logs', {
        limit: 1000,
        level: minLogLevel !== 'ALL' ? minLogLevel : null,
      });
      setLogs(fetchedLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  }, [minLogLevel]);

  const fetchCompilationErrors = useCallback(async () => {
    try {
      const errors = await invoke<CompilationError[]>('get_compile_errors');
      setCompilationErrors(errors);
    } catch (error) {
      console.error('Failed to fetch compilation errors:', error);
    }
  }, []);

  const fetchBuildStatus = useCallback(async () => {
    try {
      const status = await invoke<string>('get_build_status');
      setBuildStatus(status);
    } catch (error) {
      console.error('Failed to fetch build status:', error);
    }
  }, []);

  const fetchPerformanceMetrics = useCallback(async () => {
    try {
      const metrics = await invoke<PerformanceMetrics>('get_performance_metrics');
      setPerformanceMetrics(metrics);
    } catch (error) {
      console.error('Failed to fetch performance metrics:', error);
    }
  }, []);

  const fetchErrorStats = useCallback(async () => {
    try {
      const stats = await invoke<ErrorStats>('get_error_stats');
      setErrorStats(stats);
    } catch (error) {
      console.error('Failed to fetch error stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchLogs();
    fetchBuildStatus();
    fetchPerformanceMetrics();
    fetchErrorStats();
    fetchCompilationErrors();

    const interval = setInterval(() => {
      if (activeTab === 'console') fetchLogs();
      if (activeTab === 'compiler') {
        fetchBuildStatus();
        fetchCompilationErrors();
      }
      if (activeTab === 'performance') fetchPerformanceMetrics();
      if (activeTab === 'errors') fetchErrorStats();
    }, 2000);

    return () => clearInterval(interval);
  }, [activeTab, fetchLogs, fetchBuildStatus, fetchPerformanceMetrics, fetchErrorStats, fetchCompilationErrors]);

  const handleClearLogs = async () => {
    try {
      await invoke('clear_logs');
      setLogs([]);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  const handleExportLogs = async () => {
    try {
      const exported = await invoke<string>('export_logs', { format: 'json' });
      const blob = new Blob([exported], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `logs_${new Date().toISOString()}.json`;
      a.click();
    } catch (error) {
      console.error('Failed to export logs:', error);
    }
  };

  const handleCompileNow = async () => {
    setIsRefreshing(true);
    try {
      await invoke('compile_now');
      await fetchBuildStatus();
      await fetchCompilationErrors();
    } catch (error) {
      console.error('Failed to compile:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleAutoFix = async () => {
    try {
      const errorMessages = compilationErrors.map(e => e.message);
      await invoke('auto_fix_errors', { errors: errorMessages });
      await fetchCompilationErrors();
    } catch (error) {
      console.error('Failed to auto-fix errors:', error);
    }
  };

  const getLogLevelColor = (level: string) => {
    const colors: Record<string, string> = {
      TRACE: 'text-gray-400',
      DEBUG: 'text-cyan-400',
      INFO: 'text-blue-400',
      WARN: 'text-yellow-400',
      ERROR: 'text-red-400',
      FATAL: 'text-purple-600',
      SUCCESS: 'text-green-400',
      PERFORMANCE: 'text-pink-400',
    };
    return colors[level] || 'text-gray-400';
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.message.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.category?.toLowerCase().includes(logFilter.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="h-full flex flex-col bg-gray-900 text-white"
    >
      <div className="flex border-b border-gray-700">
        <TabButton
          active={activeTab === 'console'}
          onClick={() => setActiveTab('console')}
          icon={Terminal}
          label="Console"
        />
        <TabButton
          active={activeTab === 'compiler'}
          onClick={() => setActiveTab('compiler')}
          icon={Settings}
          label="Compiler"
        />
        <TabButton
          active={activeTab === 'errors'}
          onClick={() => setActiveTab('errors')}
          icon={AlertCircle}
          label="Errors"
        />
        <TabButton
          active={activeTab === 'performance'}
          onClick={() => setActiveTab('performance')}
          icon={TrendingUp}
          label="Performance"
        />
      </div>

      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'console' && (
            <ConsoleTab
              logs={filteredLogs}
              logFilter={logFilter}
              setLogFilter={setLogFilter}
              minLogLevel={minLogLevel}
              setMinLogLevel={setMinLogLevel}
              onClear={handleClearLogs}
              onExport={handleExportLogs}
              getLogLevelColor={getLogLevelColor}
            />
          )}
          {activeTab === 'compiler' && (
            <CompilerTab
              buildStatus={buildStatus}
              errors={compilationErrors}
              isRefreshing={isRefreshing}
              onCompile={handleCompileNow}
              onAutoFix={handleAutoFix}
            />
          )}
          {activeTab === 'errors' && <ErrorsTab stats={errorStats} />}
          {activeTab === 'performance' && <PerformanceTab metrics={performanceMetrics} />}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon: Icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors ${
      active
        ? 'bg-gray-800 text-blue-400 border-b-2 border-blue-400'
        : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

interface ConsoleTabProps {
  logs: LogEntry[];
  logFilter: string;
  setLogFilter: (value: string) => void;
  minLogLevel: string;
  setMinLogLevel: (value: string) => void;
  onClear: () => void;
  onExport: () => void;
  getLogLevelColor: (level: string) => string;
}

const ConsoleTab: React.FC<ConsoleTabProps> = ({
  logs,
  logFilter,
  setLogFilter,
  minLogLevel,
  setMinLogLevel,
  onClear,
  onExport,
  getLogLevelColor,
}) => (
  <motion.div
    key="console"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full flex flex-col"
  >
    <div className="flex items-center gap-4 p-4 bg-gray-800 border-b border-gray-700">
      <input
        type="text"
        placeholder="Filter logs..."
        value={logFilter}
        onChange={(e) => setLogFilter(e.target.value)}
        className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
      />
      <select
        value={minLogLevel}
        onChange={(e) => setMinLogLevel(e.target.value)}
        className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
      >
        <option value="ALL">All Levels</option>
        <option value="TRACE">Trace+</option>
        <option value="DEBUG">Debug+</option>
        <option value="INFO">Info+</option>
        <option value="WARN">Warn+</option>
        <option value="ERROR">Error+</option>
      </select>
      <button
        onClick={onExport}
        className="p-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        title="Export Logs"
      >
        <Download className="w-5 h-5" />
      </button>
      <button
        onClick={onClear}
        className="p-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
        title="Clear Logs"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>

    <div className="flex-1 overflow-auto p-4 font-mono text-sm">
      {logs.length === 0 ? (
        <div className="text-gray-500 text-center py-8">No logs to display</div>
      ) : (
        logs.map((log) => (
          <div key={log.id} className="mb-2 flex gap-2">
            <span className="text-gray-500">{new Date(log.timestamp).toLocaleTimeString()}</span>
            <span className={getLogLevelColor(log.level)}>[{log.level}]</span>
            {log.category && <span className="text-gray-400">[{log.category}]</span>}
            <span className="text-gray-200">{log.message}</span>
          </div>
        ))
      )}
    </div>
  </motion.div>
);

interface CompilerTabProps {
  buildStatus: string;
  errors: CompilationError[];
  isRefreshing: boolean;
  onCompile: () => void;
  onAutoFix: () => void;
}

const CompilerTab: React.FC<CompilerTabProps> = ({ buildStatus, errors, isRefreshing, onCompile, onAutoFix }) => (
  <motion.div
    key="compiler"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full flex flex-col"
  >
    <div className="p-4 bg-gray-800 border-b border-gray-700 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">Build Status:</span>
          <StatusBadge status={buildStatus} />
        </div>
        {errors.length > 0 && (
          <div className="text-red-400">
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          onClick={onAutoFix}
          disabled={errors.length === 0}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          Auto Fix
        </button>
        <button
          onClick={onCompile}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
        >
          <Play className="w-4 h-4" />
          {isRefreshing ? 'Compiling...' : 'Compile Now'}
        </button>
      </div>
    </div>

    <div className="flex-1 overflow-auto p-4">
      {errors.length === 0 ? (
        <div className="text-green-400 text-center py-8 flex flex-col items-center gap-2">
          <CheckCircle className="w-12 h-12" />
          <p>No compilation errors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map((error, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg border-l-4 border-red-500">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-red-400 font-medium mb-1">{error.message}</div>
                  <div className="text-gray-400 text-sm">
                    {error.file}:{error.line}
                    {error.column && `:${error.column}`}
                  </div>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    error.severity === 'error' ? 'bg-red-900 text-red-300' : 'bg-yellow-900 text-yellow-300'
                  }`}
                >
                  {error.severity}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </motion.div>
);

interface ErrorsTabProps {
  stats: ErrorStats | null;
}

const ErrorsTab: React.FC<ErrorsTabProps> = ({ stats }) => (
  <motion.div
    key="errors"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full overflow-auto p-6"
  >
    {stats ? (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          <StatCard label="Total Errors" value={stats.totalErrors} color="red" />
          <StatCard label="Auto Fixed" value={stats.autoFixed} color="green" />
          <StatCard label="Manual Fixed" value={stats.manuallyFixed} color="yellow" />
          <StatCard
            label="Recovery Rate"
            value={`${(stats.recoverySuccessRate * 100).toFixed(1)}%`}
            color="blue"
          />
        </div>

        {Object.keys(stats.errorsByCode).length > 0 && (
          <div className="bg-gray-800 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Errors by Code</h3>
            <div className="space-y-2">
              {Object.entries(stats.errorsByCode).map(([code, count]) => (
                <div key={code} className="flex justify-between items-center">
                  <span className="text-gray-300">{code}</span>
                  <span className="text-blue-400 font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    ) : (
      <div className="text-gray-500 text-center py-8">Loading error statistics...</div>
    )}
  </motion.div>
);

interface PerformanceTabProps {
  metrics: PerformanceMetrics | null;
}

const PerformanceTab: React.FC<PerformanceTabProps> = ({ metrics }) => (
  <motion.div
    key="performance"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="h-full overflow-auto p-6"
  >
    {metrics ? (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <MetricCard label="CPU Usage" value={`${metrics.cpuUsage.toFixed(1)}%`} max={100} current={metrics.cpuUsage} />
          <MetricCard
            label="Memory Usage"
            value={`${metrics.memoryUsage.toFixed(1)}%`}
            max={100}
            current={metrics.memoryUsage}
          />
          <MetricCard
            label="Process Memory"
            value={`${metrics.processMemoryMb.toFixed(0)} MB`}
            max={metrics.totalMemoryMb}
            current={metrics.processMemoryMb}
          />
          <MetricCard
            label="Process CPU"
            value={`${metrics.processCpuUsage.toFixed(1)}%`}
            max={100}
            current={metrics.processCpuUsage}
          />
        </div>

        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm text-gray-400 mb-2">Last Updated: {new Date(metrics.timestamp).toLocaleString()}</div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Memory:</span> {metrics.totalMemoryMb.toFixed(0)} MB
            </div>
            <div>
              <span className="text-gray-400">Used Memory:</span> {metrics.usedMemoryMb.toFixed(0)} MB
            </div>
          </div>
        </div>
      </div>
    ) : (
      <div className="text-gray-500 text-center py-8">Loading performance metrics...</div>
    )}
  </motion.div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = () => {
    switch (status.toLowerCase()) {
      case 'success':
        return 'bg-green-900 text-green-300';
      case 'building':
        return 'bg-yellow-900 text-yellow-300';
      case 'failed':
        return 'bg-red-900 text-red-300';
      default:
        return 'bg-gray-700 text-gray-300';
    }
  };

  const getIcon = () => {
    switch (status.toLowerCase()) {
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2 ${getStatusColor()}`}>
      {getIcon()}
      {status}
    </span>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  color: 'red' | 'green' | 'yellow' | 'blue';
}

const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  const colors = {
    red: 'border-red-500 bg-red-900/20',
    green: 'border-green-500 bg-green-900/20',
    yellow: 'border-yellow-500 bg-yellow-900/20',
    blue: 'border-blue-500 bg-blue-900/20',
  };

  return (
    <div className={`p-4 rounded-lg border-l-4 ${colors[color]}`}>
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: string;
  max: number;
  current: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ label, value, max, current }) => {
  const percentage = Math.min((current / max) * 100, 100);
  const getColor = () => {
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <div className="flex justify-between items-center mb-2">
        <span className="text-gray-400">{label}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div className={`h-2 rounded-full ${getColor()}`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

export default DevConsole;
