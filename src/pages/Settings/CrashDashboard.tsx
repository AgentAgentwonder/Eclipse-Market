import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  AlertTriangle,
  Trash2,
  TrendingUp,
  TrendingDown,
  Activity,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { useDiagnosticsStore } from '../../store/diagnosticsStore';

interface CrashDashboardProps {
  onClose: () => void;
}

export function CrashDashboard({ onClose }: CrashDashboardProps) {
  const {
    crashes,
    totalCrashes,
    lastCrashTimestamp,
    getCrashFrequency,
    deleteCrashReport,
    clearCrashReports,
  } = useDiagnosticsStore();

  const [selectedCrashId, setSelectedCrashId] = useState<string | null>(null);

  const selectedCrash = selectedCrashId ? crashes.find(c => c.id === selectedCrashId) : null;

  const crashesLast24h = getCrashFrequency(24);
  const crashesLast7d = getCrashFrequency(24 * 7);
  const crashesLast30d = getCrashFrequency(24 * 30);

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to delete all crash reports?')) {
      clearCrashReports();
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this crash report?')) {
      deleteCrashReport(id);
      if (selectedCrashId === id) {
        setSelectedCrashId(null);
      }
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to diagnostics
        </button>

        {crashes.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-sm font-medium text-red-300 transition-all"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-gradient-to-br from-red-500/10 to-red-600/10 border border-red-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white/80">Last 24 Hours</h3>
            <Activity className="w-5 h-5 text-red-300" />
          </div>
          <p className="text-2xl font-bold text-white">{crashesLast24h}</p>
          <div className="flex items-center gap-1 text-xs mt-1">
            {crashesLast24h > crashesLast7d / 7 ? (
              <>
                <TrendingUp className="w-3 h-3 text-red-400" />
                <span className="text-red-400">Above average</span>
              </>
            ) : (
              <>
                <TrendingDown className="w-3 h-3 text-green-400" />
                <span className="text-green-400">Below average</span>
              </>
            )}
          </div>
        </div>

        <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white/80">Last 7 Days</h3>
            <Activity className="w-5 h-5 text-orange-300" />
          </div>
          <p className="text-2xl font-bold text-white">{crashesLast7d}</p>
          <p className="text-xs text-white/60 mt-1">
            Avg: {(crashesLast7d / 7).toFixed(1)} per day
          </p>
        </div>

        <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-white/80">All Time</h3>
            <Activity className="w-5 h-5 text-yellow-300" />
          </div>
          <p className="text-2xl font-bold text-white">{totalCrashes}</p>
          {lastCrashTimestamp && (
            <p className="text-xs text-white/60 mt-1">
              Last: {new Date(lastCrashTimestamp).toLocaleString()}
            </p>
          )}
        </div>
      </div>

      {crashes.length === 0 ? (
        <div className="p-8 bg-green-500/10 border border-green-500/20 rounded-2xl text-center">
          <AlertTriangle className="w-12 h-12 text-green-400 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-green-400 mb-2">No Crashes Recorded</h3>
          <p className="text-white/60">Your application is running smoothly! Crash reports will appear here if any errors occur.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 mb-2">Recent Crashes</h3>
            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
              {crashes.slice().reverse().map(crash => (
                <motion.button
                  key={crash.id}
                  onClick={() => setSelectedCrashId(crash.id)}
                  whileHover={{ scale: 1.01 }}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedCrashId === crash.id
                      ? 'bg-red-500/20 border border-red-500/40'
                      : 'bg-slate-900/50 border border-slate-800 hover:border-red-500/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{crash.message}</p>
                      <div className="flex items-center gap-2 mt-1 text-xs text-white/50">
                        <Clock className="w-3 h-3" />
                        {new Date(crash.timestamp).toLocaleString()}
                      </div>
                      {crash.userComment && (
                        <div className="flex items-center gap-1 mt-1 text-xs text-blue-300">
                          <MessageSquare className="w-3 h-3" />
                          Has user feedback
                        </div>
                      )}
                    </div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(crash.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-red-300" />
                    </button>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            {selectedCrash ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-1">Error Message</h3>
                  <p className="text-sm text-white">{selectedCrash.message}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-1">Timestamp</h3>
                  <p className="text-sm text-white">
                    {new Date(selectedCrash.timestamp).toLocaleString()}
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-1">URL</h3>
                  <p className="text-sm text-white break-all">{selectedCrash.url}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-white/60 mb-1">Environment</h3>
                  <div className="space-y-1 text-sm text-white/80">
                    <p>Platform: {selectedCrash.environment.platform}</p>
                    <p>Language: {selectedCrash.environment.language}</p>
                    <p>Screen: {selectedCrash.environment.screenResolution}</p>
                    <p>Viewport: {selectedCrash.environment.viewport}</p>
                  </div>
                </div>

                {selectedCrash.sessionId && (
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Session ID</h3>
                    <p className="text-xs text-white/60 font-mono">{selectedCrash.sessionId}</p>
                  </div>
                )}

                {selectedCrash.userComment && (
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">User Feedback</h3>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-sm text-white/90">{selectedCrash.userComment}</p>
                    </div>
                  </div>
                )}

                {selectedCrash.stack && (
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Stack Trace</h3>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl overflow-x-auto">
                      <pre className="text-xs text-white/70 whitespace-pre-wrap break-words">
                        {selectedCrash.stack}
                      </pre>
                    </div>
                  </div>
                )}

                {selectedCrash.componentStack && (
                  <div>
                    <h3 className="text-sm font-medium text-white/60 mb-1">Component Stack</h3>
                    <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl overflow-x-auto">
                      <pre className="text-xs text-white/70 whitespace-pre-wrap break-words">
                        {selectedCrash.componentStack}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-white/40">
                <div className="text-center">
                  <AlertTriangle className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">Select a crash report to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
