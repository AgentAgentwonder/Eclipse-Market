import { useState } from 'react';
import { Window as WindowIcon, X, Pin, PinOff, Move, Minimize as MinimizeIcon } from 'lucide-react';
import { useFloatingWindows } from '../../hooks/useFloatingWindows';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const FloatingWindowManager = () => {
  const { floatingWindows, closeFloatingWindow, setWindowAlwaysOnTop, snapWindowToEdge } = useFloatingWindows();
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const [expandedWindow, setExpandedWindow] = useState<string | null>(null);

  if (!activeWorkspace || floatingWindows.length === 0) {
    return null;
  }

  return (
    <div className="absolute top-4 right-4 z-50 w-80 max-h-[600px] overflow-auto bg-slate-900/95 backdrop-blur-sm rounded-xl border border-purple-500/30 shadow-2xl">
      <div className="sticky top-0 bg-slate-900 px-4 py-3 border-b border-purple-500/20">
        <div className="flex items-center gap-2">
          <WindowIcon className="w-4 h-4 text-purple-400" />
          <h3 className="text-sm font-semibold">Floating Windows</h3>
          <span className="text-xs text-gray-400">({floatingWindows.length})</span>
        </div>
      </div>

      <div className="divide-y divide-purple-500/10">
        {floatingWindows.map(window => {
          const panel = activeWorkspace.layout.panels.find(p => p.id === window.panelId);
          if (!panel) return null;

          const isExpanded = expandedWindow === window.id;

          return (
            <div key={window.id} className="p-3 hover:bg-slate-800/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div
                    className="flex items-center gap-2 cursor-pointer"
                    onClick={() => setExpandedWindow(isExpanded ? null : window.id)}
                  >
                    <WindowIcon className="w-3.5 h-3.5 flex-shrink-0 text-purple-400" />
                    <span className="text-sm font-medium truncate">{panel.title}</span>
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    {window.width}×{window.height} at ({window.x}, {window.y})
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setWindowAlwaysOnTop(window.id, !window.alwaysOnTop)}
                    className={`p-1.5 rounded transition-all ${
                      window.alwaysOnTop
                        ? 'bg-purple-500/30 text-purple-300'
                        : 'hover:bg-slate-700/50'
                    }`}
                    title={window.alwaysOnTop ? 'Unpin from top' : 'Pin to top'}
                  >
                    {window.alwaysOnTop ? (
                      <Pin className="w-3.5 h-3.5" />
                    ) : (
                      <PinOff className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    onClick={() => closeFloatingWindow(window.id)}
                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
                    title="Close window"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="mt-3 pt-3 border-t border-purple-500/10 space-y-2">
                  <div>
                    <div className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                      <Move className="w-3 h-3" />
                      Snap to Edge
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {['top-left', 'top', 'top-right', 'left', 'center', 'right', 'bottom-left', 'bottom', 'bottom-right'].map(edge => (
                        <button
                          key={edge}
                          onClick={() => {
                            if (edge !== 'center') {
                              snapWindowToEdge(
                                window.id,
                                edge as any,
                                window.monitorId
                              );
                            }
                          }}
                          disabled={edge === 'center'}
                          className={`p-2 text-xs rounded transition-all ${
                            window.snappedEdge === edge
                              ? 'bg-purple-500/50 text-white'
                              : edge === 'center'
                              ? 'bg-slate-800/50 text-gray-600 cursor-not-allowed'
                              : 'bg-slate-700/30 hover:bg-slate-700/50'
                          }`}
                        >
                          {edge.split('-').map(part => part[0].toUpperCase()).join('')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => closeFloatingWindow(window.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-slate-700/50 hover:bg-slate-700 rounded text-xs transition-colors"
                    >
                      <MinimizeIcon className="w-3 h-3" />
                      Dock to Layout
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
