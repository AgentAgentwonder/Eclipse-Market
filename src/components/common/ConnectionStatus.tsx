import { useMemo, useState } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useStream } from '../../contexts/StreamContext';

interface ConnectionStatusProps {
  className?: string;
}

const stateColors: Record<string, string> = {
  Connected: 'bg-green-400',
  Connecting: 'bg-yellow-400',
  Disconnecting: 'bg-yellow-400',
  Disconnected: 'bg-red-400',
  Failed: 'bg-red-500',
  Fallback: 'bg-yellow-300',
};

export function ConnectionStatus({ className }: ConnectionStatusProps) {
  const { statuses, isAnyConnected, isFallbackActive, reconnect } = useStream();
  const [expanded, setExpanded] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);

  const overallState = useMemo(() => {
    if (isAnyConnected && !isFallbackActive) {
      return 'Connected';
    }
    if (isFallbackActive) {
      return 'Fallback';
    }
    return 'Disconnected';
  }, [isAnyConnected, isFallbackActive]);

  const indicatorColor = stateColors[overallState] || 'bg-slate-500';
  const label =
    overallState === 'Connected' ? 'Live' : overallState === 'Fallback' ? 'Delayed' : 'Offline';

  return (
    <div className={`relative ${className ?? ''}`}>
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1 rounded-xl border border-purple-500/40 bg-slate-900/60 hover:bg-slate-900/80 transition"
      >
        <span className={`w-2 h-2 rounded-full ${indicatorColor} animate-pulse`} aria-hidden />
        <span className="text-sm uppercase tracking-wide text-purple-100">{label}</span>
      </button>

      {expanded && (
        <div className="absolute right-0 mt-2 w-80 bg-slate-900/95 border border-purple-500/30 rounded-xl shadow-xl p-4 z-50">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-sm font-semibold">Connection Status</h4>
              <p className="text-xs text-slate-400">WebSocket stream health</p>
            </div>
            {!isAnyConnected && <WifiOff className="w-4 h-4 text-red-400" />}
          </div>

          <div className="space-y-3">
            {statuses.map(status => {
              const color = stateColors[status.state] || 'bg-slate-500';
              const isPending = pendingProvider === status.provider;

              return (
                <div key={status.provider} className="rounded-lg border border-purple-500/20 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${color}`} aria-hidden />
                      <span className="text-sm font-semibold capitalize">{status.provider}</span>
                    </div>
                    <button
                      onClick={async () => {
                        setPendingProvider(status.provider);
                        try {
                          await reconnect(status.provider);
                        } finally {
                          setPendingProvider(null);
                        }
                      }}
                      className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border border-purple-500/30 hover:bg-purple-500/20"
                    >
                      <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                      Reconnect
                    </button>
                  </div>
                  <dl className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                    <div>
                      <dt className="text-slate-400">Messages</dt>
                      <dd>{status.statistics.messagesReceived.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Bytes</dt>
                      <dd>{status.statistics.bytesReceived.toLocaleString()}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Reconnects</dt>
                      <dd>{status.statistics.reconnectCount}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Dropped</dt>
                      <dd>{status.statistics.droppedMessages}</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Latency</dt>
                      <dd>{Math.round(status.statistics.averageLatencyMs)} ms</dd>
                    </div>
                    <div>
                      <dt className="text-slate-400">Subscriptions</dt>
                      <dd>
                        {status.subscriptions.prices.length + status.subscriptions.wallets.length}
                      </dd>
                    </div>
                  </dl>
                  {status.fallback?.active && (
                    <p className="text-xs text-yellow-400 mt-2">
                      Fallback polling {status.fallback.intervalMs / 1000}s •{' '}
                      {status.fallback.reason ?? 'Unstable connection'}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
