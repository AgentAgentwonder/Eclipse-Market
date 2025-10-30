import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Terminal,
  X,
  Trash2,
  Download,
  Database,
  Wifi,
  Activity,
  Code,
  Play,
  ChevronRight,
} from 'lucide-react';
import { useDevConsoleStore } from '../../store/devConsoleStore';
import { useWalletStore } from '../../store/walletStore';
import { usePerformanceStore } from '../../store/performanceStore';
import { useMaintenanceStore } from '../../store/maintenanceStore';
import { usePaperTradingStore } from '../../store/paperTradingStore';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { useAlertStore } from '../../store/alertStore';

export function DeveloperConsole() {
  const {
    isOpen,
    isEnabled,
    close,
    wsLogs,
    apiLogs,
    clearWsLogs,
    clearApiLogs,
    clearAllLogs,
    selectedTab,
    setSelectedTab,
    debugCommands,
    executeCommand,
    profiles,
    activeProfile,
  } = useDevConsoleStore();

  const [commandOutput, setCommandOutput] = useState<any>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        event.preventDefault();
        if (isEnabled) {
          useDevConsoleStore.getState().toggle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnabled]);

  if (!isOpen || !isEnabled) return null;

  const exportLogs = () => {
    const data = {
      timestamp: new Date().toISOString(),
      wsLogs,
      apiLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-console-logs-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs = [
    { id: 'state', label: 'Store Inspector', icon: Database },
    { id: 'websocket', label: 'WebSocket', icon: Wifi },
    { id: 'api', label: 'API Logs', icon: Activity },
    { id: 'commands', label: 'Commands', icon: Code },
    { id: 'performance', label: 'Profiler', icon: Activity },
  ] as const;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] bg-slate-950/98 backdrop-blur-xl border-t border-purple-500/30 shadow-2xl"
        style={{ height: '60vh', maxHeight: '800px' }}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h2 className="font-semibold text-purple-100">Developer Console</h2>
              <span className="text-xs text-slate-500 font-mono">Ctrl+Shift+D</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={exportLogs}
                className="p-1.5 hover:bg-purple-500/10 rounded transition-colors"
                title="Export logs"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={clearAllLogs}
                className="p-1.5 hover:bg-red-500/10 rounded transition-colors text-red-400"
                title="Clear all logs"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={close}
                className="p-1.5 hover:bg-slate-700 rounded transition-colors"
                title="Close console"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex border-b border-slate-800">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'bg-purple-500/20 border-b-2 border-purple-500'
                    : 'hover:bg-slate-800/50'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="text-sm">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-auto p-4">
            {selectedTab === 'state' && <StoreInspector />}
            {selectedTab === 'websocket' && (
              <LogViewer
                logs={wsLogs}
                onClear={clearWsLogs}
                expandedLog={expandedLog}
                setExpandedLog={setExpandedLog}
                type="websocket"
              />
            )}
            {selectedTab === 'api' && (
              <LogViewer
                logs={apiLogs}
                onClear={clearApiLogs}
                expandedLog={expandedLog}
                setExpandedLog={setExpandedLog}
                type="api"
              />
            )}
            {selectedTab === 'commands' && (
              <CommandExecutor
                commands={debugCommands}
                executeCommand={executeCommand}
                output={commandOutput}
                setOutput={setCommandOutput}
              />
            )}
            {selectedTab === 'performance' && (
              <PerformanceProfiler profiles={profiles} activeProfile={activeProfile} />
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StoreInspector() {
  const walletStore = useWalletStore();
  const performanceStore = usePerformanceStore();
  const maintenanceStore = useMaintenanceStore();
  const paperTradingStore = usePaperTradingStore();
  const workspaceStore = useWorkspaceStore();
  const alertStore = useAlertStore();

  const stores = {
    wallet: walletStore,
    performance: performanceStore,
    maintenance: maintenanceStore,
    paperTrading: paperTradingStore,
    workspace: workspaceStore,
    alerts: alertStore,
  };

  const [selectedStore, setSelectedStore] = useState<keyof typeof stores>('wallet');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(key)) {
      newExpanded.delete(key);
    } else {
      newExpanded.add(key);
    }
    setExpanded(newExpanded);
  };

  const renderValue = (value: any, key: string, depth = 0): React.ReactNode => {
    if (value === null) return <span className="text-slate-500">null</span>;
    if (value === undefined) return <span className="text-slate-500">undefined</span>;
    if (typeof value === 'boolean') {
      return <span className="text-blue-400">{value.toString()}</span>;
    }
    if (typeof value === 'number') {
      return <span className="text-green-400">{value}</span>;
    }
    if (typeof value === 'string') {
      return <span className="text-yellow-400">"{value}"</span>;
    }
    if (typeof value === 'function') {
      return <span className="text-pink-400">[Function]</span>;
    }
    if (Array.isArray(value)) {
      const isExpanded = expanded.has(key);
      return (
        <div>
          <button
            onClick={() => toggleExpand(key)}
            className="text-purple-400 hover:text-purple-300"
          >
            <ChevronRight
              className={`w-3 h-3 inline transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            Array({value.length})
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-slate-700 pl-2 mt-1">
              {value.map((item, i) => (
                <div key={i} className="text-sm">
                  <span className="text-slate-500">[{i}]:</span>{' '}
                  {renderValue(item, `${key}.${i}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (typeof value === 'object') {
      const isExpanded = expanded.has(key);
      const keys = Object.keys(value);
      return (
        <div>
          <button
            onClick={() => toggleExpand(key)}
            className="text-purple-400 hover:text-purple-300"
          >
            <ChevronRight
              className={`w-3 h-3 inline transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            />
            Object({keys.length})
          </button>
          {isExpanded && (
            <div className="ml-4 border-l border-slate-700 pl-2 mt-1">
              {keys.map(k => (
                <div key={k} className="text-sm">
                  <span className="text-cyan-400">{k}:</span>{' '}
                  {renderValue(value[k], `${key}.${k}`, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <span className="text-slate-400">{String(value)}</span>;
  };

  const currentStore = stores[selectedStore];

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {Object.keys(stores).map(storeName => (
          <button
            key={storeName}
            onClick={() => setSelectedStore(storeName as keyof typeof stores)}
            className={`px-3 py-1 rounded text-sm font-mono transition-colors ${
              selectedStore === storeName
                ? 'bg-purple-500/20 text-purple-300'
                : 'bg-slate-800 hover:bg-slate-700'
            }`}
          >
            {storeName}
          </button>
        ))}
      </div>

      <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm space-y-2 max-h-96 overflow-auto">
        {Object.entries(currentStore).map(([key, value]) => (
          <div key={key}>
            <span className="text-cyan-400">{key}:</span> {renderValue(value, key)}
          </div>
        ))}
      </div>
    </div>
  );
}

function LogViewer({
  logs,
  onClear,
  expandedLog,
  setExpandedLog,
  type,
}: {
  logs: any[];
  onClear: () => void;
  expandedLog: string | null;
  setExpandedLog: (id: string | null) => void;
  type: 'websocket' | 'api';
}) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-slate-400">{logs.length} logs</span>
        <button
          onClick={onClear}
          className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20"
        >
          Clear
        </button>
      </div>

      <div className="space-y-1 max-h-96 overflow-auto">
        {logs.slice(-100).map(log => {
          const isExpanded = expandedLog === log.id;
          return (
            <div
              key={log.id}
              className="bg-slate-900 rounded p-2 text-xs font-mono cursor-pointer hover:bg-slate-800"
              onClick={() => setExpandedLog(isExpanded ? null : log.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  {type === 'websocket' && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        log.type === 'sent'
                          ? 'bg-blue-500/20 text-blue-300'
                          : log.type === 'received'
                          ? 'bg-green-500/20 text-green-300'
                          : 'bg-red-500/20 text-red-300'
                      }`}
                    >
                      {log.type}
                    </span>
                  )}
                  {type === 'api' && (
                    <>
                      <span className="text-purple-400">{log.method}</span>
                      <span
                        className={
                          log.status
                            ? log.status < 400
                              ? 'text-green-400'
                              : 'text-red-400'
                            : 'text-slate-400'
                        }
                      >
                        {log.status || 'pending'}
                      </span>
                    </>
                  )}
                </div>
                {type === 'api' && log.duration && (
                  <span className="text-slate-500">{log.duration}ms</span>
                )}
              </div>

              {isExpanded && (
                <div className="mt-2 pt-2 border-t border-slate-800">
                  <pre className="text-[10px] text-slate-400 whitespace-pre-wrap break-all">
                    {JSON.stringify(log, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CommandExecutor({
  commands,
  executeCommand,
  output,
  setOutput,
}: {
  commands: any[];
  executeCommand: (id: string) => Promise<any>;
  output: any;
  setOutput: (output: any) => void;
}) {
  const [executing, setExecuting] = useState<string | null>(null);

  const handleExecute = async (commandId: string) => {
    setExecuting(commandId);
    try {
      const result = await executeCommand(commandId);
      setOutput({ success: true, result });
    } catch (error) {
      setOutput({ success: false, error: String(error) });
    } finally {
      setExecuting(null);
    }
  };

  const categories = Array.from(new Set(commands.map(c => c.category)));

  return (
    <div className="space-y-4">
      {categories.map(category => (
        <div key={category} className="space-y-2">
          <h3 className="text-sm font-semibold text-purple-300 uppercase tracking-wider">
            {category}
          </h3>
          <div className="space-y-1">
            {commands
              .filter(c => c.category === category)
              .map(command => (
                <button
                  key={command.id}
                  onClick={() => handleExecute(command.id)}
                  disabled={executing === command.id}
                  className="w-full text-left px-3 py-2 bg-slate-900 hover:bg-slate-800 rounded text-sm transition-colors disabled:opacity-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{command.name}</div>
                      <div className="text-xs text-slate-400">{command.description}</div>
                    </div>
                    <Play className={`w-4 h-4 ${executing === command.id ? 'animate-spin' : ''}`} />
                  </div>
                </button>
              ))}
          </div>
        </div>
      ))}

      {output && (
        <div className="mt-4 p-4 bg-slate-900 rounded-lg">
          <h4 className="text-sm font-semibold mb-2">Output:</h4>
          <pre className="text-xs text-slate-300 whitespace-pre-wrap break-all">
            {JSON.stringify(output, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function PerformanceProfiler({
  profiles,
  activeProfile,
}: {
  profiles: any[];
  activeProfile: any;
}) {
  return (
    <div className="space-y-4">
      {activeProfile && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-green-400">Active Profile</h3>
              <p className="text-sm text-slate-400">{activeProfile.name}</p>
            </div>
            <div className="text-sm text-slate-400">
              Started: {new Date(activeProfile.startTime).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-purple-300">Recent Profiles</h3>
        {profiles.slice(-10).reverse().map(profile => (
          <div key={profile.id} className="bg-slate-900 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold">{profile.name}</span>
              <span className="text-sm text-slate-400">{profile.duration}ms</span>
            </div>
            {profile.measures.length > 0 && (
              <div className="space-y-1">
                {profile.measures.map((measure: any, i: number) => (
                  <div key={i} className="text-xs text-slate-400 flex justify-between">
                    <span>{measure.name}</span>
                    <span>{measure.duration.toFixed(2)}ms</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
