import { useEffect, useRef, useState } from 'react';
import rrwebPlayer from 'rrweb-player';
import 'rrweb-player/dist/style.css';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Download,
  AlertTriangle,
  Clock,
  Monitor,
  Terminal,
} from 'lucide-react';
import { useDiagnosticsStore } from '../../store/diagnosticsStore';

interface SessionReplayViewerProps {
  recordingId: string;
  onClose: () => void;
}

export function SessionReplayViewer({ recordingId, onClose }: SessionReplayViewerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<rrwebPlayer | null>(null);
  const [activeTab, setActiveTab] = useState<'replay' | 'console' | 'errors'>('replay');

  const recording = useDiagnosticsStore(state =>
    state.recordings.find(r => r.id === recordingId)
  );
  const exportRecording = useDiagnosticsStore(state => state.exportRecording);

  useEffect(() => {
    if (!recording || !containerRef.current) return;

    playerRef.current = new rrwebPlayer({
      target: containerRef.current,
      props: {
        events: recording.events,
        width: '100%',
        height: 360,
        showController: true,
      },
    });

    return () => {
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [recording]);

  if (!recording) {
    return (
      <div className="space-y-4">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-sm text-white/60 hover:text-white/80"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to diagnostics
        </button>
        <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
          <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-white/70">Recording not found or has expired.</p>
        </div>
      </div>
    );
  }

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

        <button
          onClick={() => exportRecording(recording.id)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl text-sm font-medium text-blue-300 transition-all"
        >
          <Download className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="p-4 bg-slate-900/40 border border-purple-500/10 rounded-2xl">
        <div className="flex flex-wrap gap-4 text-sm text-white/70">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-300" />
            {new Date(recording.timestamp).toLocaleString()}
          </div>
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-purple-300" />
            {recording.userAgent}
          </div>
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-purple-300" />
            {recording.url}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-700 flex gap-4 text-sm">
        <button
          onClick={() => setActiveTab('replay')}
          className={`pb-3 transition-colors ${
            activeTab === 'replay' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-white/50'
          }`}
        >
          Replay
        </button>
        <button
          onClick={() => setActiveTab('console')}
          className={`pb-3 transition-colors ${
            activeTab === 'console' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-white/50'
          }`}
        >
          Console Logs ({recording.consoleLogs.length})
        </button>
        <button
          onClick={() => setActiveTab('errors')}
          className={`pb-3 transition-colors ${
            activeTab === 'errors' ? 'text-purple-300 border-b-2 border-purple-400' : 'text-white/50'
          }`}
        >
          Errors ({recording.errors.length})
        </button>
      </div>

      {activeTab === 'replay' && (
        <div className="rounded-2xl overflow-hidden border border-slate-700">
          <div ref={containerRef} className="rrweb-player" />
        </div>
      )}

      {activeTab === 'console' && (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {recording.consoleLogs.length === 0 ? (
            <p className="text-sm text-white/50">No console logs were captured during this session.</p>
          ) : (
            recording.consoleLogs.map((log, index) => (
              <div
                key={`${log.timestamp}-${index}`}
                className="p-3 bg-slate-900/50 rounded-xl border border-slate-800"
              >
                <div className="flex items-center justify-between text-xs text-white/40 mb-1">
                  <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                  <span className="uppercase">
                    {log.level === 'warn'
                      ? 'Warning'
                      : log.level === 'error'
                        ? 'Error'
                        : log.level}
                  </span>
                </div>
                <pre className="text-xs text-white whitespace-pre-wrap break-words">
                  {typeof log.message === 'string' ? log.message : JSON.stringify(log.message)}
                </pre>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'errors' && (
        <div className="space-y-2 max-h-[420px] overflow-y-auto">
          {recording.errors.length === 0 ? (
            <p className="text-sm text-white/50">No errors were captured during this session.</p>
          ) : (
            recording.errors.map(error => (
              <div
                key={`${error.timestamp}-${error.message}`}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl"
              >
                <div className="flex items-center justify-between text-xs text-red-200 mb-1">
                  <span>{new Date(error.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-sm text-red-100 font-medium mb-2">{error.message}</p>
                {error.stack && (
                  <details className="text-xs text-red-200/80">
                    <summary className="cursor-pointer mb-1 text-white/60">View stack trace</summary>
                    <pre className="whitespace-pre-wrap break-words text-xs">{error.stack}</pre>
                  </details>
                )}
                {error.componentStack && (
                  <details className="text-xs text-red-200/80 mt-2">
                    <summary className="cursor-pointer mb-1 text-white/60">Component stack</summary>
                    <pre className="whitespace-pre-wrap break-words text-xs">{error.componentStack}</pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </motion.div>
  );
}
