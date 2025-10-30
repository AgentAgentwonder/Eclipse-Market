import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw, Wifi, Activity, Clock, Database, AlertCircle } from 'lucide-react';
import { useStream } from '../../contexts/StreamContext';
import { useDevConsoleStore } from '../../store/devConsoleStore';

interface ApiStatus {
  name: string;
  url: string;
  status: 'online' | 'offline' | 'degraded';
  latency: number;
  lastCheck: Date;
}

export function NetworkStatusIndicator() {
  const { statuses, isAnyConnected, isFallbackActive, reconnect } = useStream();
  const devConsole = useDevConsoleStore();
  const [expanded, setExpanded] = useState(false);
  const [pendingProvider, setPendingProvider] = useState<string | null>(null);
  const [offlineMode, setOfflineMode] = useState(false);
  const [apiStatuses, setApiStatuses] = useState<ApiStatus[]>([]);
  const [latencyHistory, setLatencyHistory] = useState<{ timestamp: Date; latency: number }[]>([]);

  useEffect(() => {
    // Simulate API health checks
    const checkApis = async () => {
      const apis: ApiStatus[] = [
        {
          name: 'Birdeye API',
          url: 'api.birdeye.so',
          status: Math.random() > 0.1 ? 'online' : 'degraded',
          latency: Math.floor(Math.random() * 200) + 50,
          lastCheck: new Date(),
        },
        {
          name: 'Solana RPC',
          url: 'api.mainnet-beta.solana.com',
          status: Math.random() > 0.05 ? 'online' : 'offline',
          latency: Math.floor(Math.random() * 500) + 100,
          lastCheck: new Date(),
        },
        {
          name: 'WebSocket',
          url: 'ws.eclipse-market.pro',
          status: isAnyConnected ? 'online' : 'offline',
          latency: Math.floor(Math.random() * 100) + 20,
          lastCheck: new Date(),
        },
      ];
      setApiStatuses(apis);

      // Add to history
      const avgLatency = apis.reduce((sum, api) => sum + api.latency, 0) / apis.length;
      setLatencyHistory(prev => [...prev.slice(-59), { timestamp: new Date(), latency: avgLatency }]);
    };

    const interval = setInterval(checkApis, 5000);
    checkApis();

    return () => clearInterval(interval);
  }, [isAnyConnected]);

  const overallState = useMemo(() => {
    if (offlineMode) return 'Offline Mode';
    if (isAnyConnected && !isFallbackActive) return 'Connected';
    if (isFallbackActive) return 'Fallback';
    return 'Disconnected';
  }, [isAnyConnected, isFallbackActive, offlineMode]);

  const indicatorColor = useMemo(() => {
    if (offlineMode) return 'bg-gray-400';
    if (overallState === 'Connected') return 'bg-green-400';
    if (overallState === 'Fallback') return 'bg-yellow-400';
    return 'bg-red-400';
  }, [overallState, offlineMode]);

  const avgLatency = useMemo(() => {
    if (statuses.length === 0) return 0;
    const sum = statuses.reduce((acc, s) => acc + s.statistics.averageLatencyMs, 0);
    return Math.round(sum / statuses.length);
  }, [statuses]);

  const packetLoss = useMemo(() => {
    if (statuses.length === 0) return 0;
    const totalMessages = statuses.reduce((acc, s) => acc + s.statistics.messagesReceived, 0);
    const totalDropped = statuses.reduce((acc, s) => acc + s.statistics.droppedMessages, 0);
    if (totalMessages === 0) return 0;
    return ((totalDropped / totalMessages) * 100).toFixed(2);
  }, [statuses]);

  const handleReconnectAll = async () => {
    for (const status of statuses) {
      try {
        await reconnect(status.provider);
      } catch (error) {
        console.error(`Failed to reconnect ${status.provider}:`, error);
      }
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-purple-500/40 bg-slate-900/60 hover:bg-slate-900/80 transition-all"
        title={`Network Status: ${overallState}`}
      >
        <span className={`w-2 h-2 rounded-full ${indicatorColor} animate-pulse`} aria-hidden />
        <Wifi className="w-4 h-4" />
        {!isAnyConnected && !offlineMode && <WifiOff className="w-4 h-4 text-red-400" />}
        <span className="text-xs font-mono">{avgLatency}ms</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setExpanded(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-96 bg-slate-900/98 backdrop-blur-xl border border-purple-500/30 rounded-xl shadow-2xl p-4 z-50"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold">Network Status</h4>
                    <p className="text-xs text-slate-400">Connection quality and API health</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleReconnectAll}
                      className="p-1.5 hover:bg-purple-500/10 rounded transition-colors"
                      title="Reconnect all"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={offlineMode}
                        onChange={e => setOfflineMode(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-xs text-slate-400">Offline</span>
                    </label>
                  </div>
                </div>

                {offlineMode && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-yellow-400">
                        <p className="font-medium">Offline Mode Active</p>
                        <p className="text-yellow-400/80 mt-1">Using cached data. Real-time updates paused.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Connection Quality
                  </h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Activity className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Latency</span>
                      </div>
                      <div className="text-sm font-mono font-semibold">{avgLatency}ms</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Database className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Packet Loss</span>
                      </div>
                      <div className="text-sm font-mono font-semibold">{packetLoss}%</div>
                    </div>
                    <div className="bg-slate-800/50 rounded-lg p-2">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Wifi className="w-3 h-3 text-slate-400" />
                        <span className="text-[10px] text-slate-400">Status</span>
                      </div>
                      <div className="text-xs font-semibold">{overallState}</div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    API Status
                  </h5>
                  {apiStatuses.map(api => (
                    <div key={api.name} className="bg-slate-800/50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              api.status === 'online'
                                ? 'bg-green-400'
                                : api.status === 'degraded'
                                ? 'bg-yellow-400'
                                : 'bg-red-400'
                            }`}
                          />
                          <span className="text-sm font-semibold">{api.name}</span>
                        </div>
                        <span className="text-xs text-slate-400">{api.latency}ms</span>
                      </div>
                      <div className="text-xs text-slate-500">{api.url}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    WebSocket Connections
                  </h5>
                  {statuses.map(status => {
                    const isPending = pendingProvider === status.provider;
                    const statusColor =
                      status.state === 'Connected'
                        ? 'bg-green-400'
                        : status.state === 'Connecting' || status.state === 'Disconnecting'
                        ? 'bg-yellow-400'
                        : 'bg-red-400';

                    return (
                      <div key={status.provider} className="bg-slate-800/50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${statusColor}`} />
                            <span className="text-sm font-semibold capitalize">{status.provider}</span>
                          </div>
                          <button
                            onClick={async () => {
                              setPendingProvider(status.provider);
                              try {
                                await reconnect(status.provider);
                                devConsole.addWsLog({
                                  provider: status.provider,
                                  type: 'connected',
                                  message: 'Manual reconnect',
                                });
                              } finally {
                                setPendingProvider(null);
                              }
                            }}
                            className="text-xs flex items-center gap-1 px-2 py-1 rounded-md border border-purple-500/30 hover:bg-purple-500/20 transition-colors"
                          >
                            <RefreshCw className={`w-3 h-3 ${isPending ? 'animate-spin' : ''}`} />
                            Reconnect
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-slate-400">
                          <div>
                            <span className="text-slate-500">Messages:</span>{' '}
                            {status.statistics.messagesReceived.toLocaleString()}
                          </div>
                          <div>
                            <span className="text-slate-500">Latency:</span>{' '}
                            {Math.round(status.statistics.averageLatencyMs)}ms
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {latencyHistory.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Latency History (Last 5 min)
                    </h5>
                    <div className="h-20 bg-slate-800/50 rounded-lg p-2">
                      <div className="h-full flex items-end justify-between gap-0.5">
                        {latencyHistory.map((point, i) => {
                          const maxLatency = Math.max(...latencyHistory.map(p => p.latency));
                          const height = (point.latency / maxLatency) * 100;
                          return (
                            <div
                              key={i}
                              className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm"
                              style={{ height: `${height}%` }}
                              title={`${point.latency}ms at ${point.timestamp.toLocaleTimeString()}`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
