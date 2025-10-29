import { ReactNode } from 'react';
import { Minus, Maximize2, Lock, Unlock, X } from 'lucide-react';
import { Panel } from '../../types/workspace';

interface PanelWrapperProps {
  panel: Panel;
  workspaceId: string;
  onToggleLock: () => void;
  onToggleMinimize: () => void;
  onClose: () => void;
  children: ReactNode;
}

export const PanelWrapper = ({
  panel,
  onToggleLock,
  onToggleMinimize,
  onClose,
  children,
}: PanelWrapperProps) => {
  return (
    <div className="h-full flex flex-col bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold">{panel.title}</h3>
          {panel.isLocked && <Lock className="w-3 h-3 text-purple-400" />}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onToggleMinimize}
            className="p-1.5 hover:bg-slate-700/50 rounded transition-all"
            title={panel.isMinimized ? 'Maximize' : 'Minimize'}
          >
            {panel.isMinimized ? (
              <Maximize2 className="w-3.5 h-3.5" />
            ) : (
              <Minus className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onToggleLock}
            className="p-1.5 hover:bg-slate-700/50 rounded transition-all"
            title={panel.isLocked ? 'Unlock' : 'Lock'}
          >
            {panel.isLocked ? (
              <Lock className="w-3.5 h-3.5" />
            ) : (
              <Unlock className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
            title="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {children}
      </div>
    </div>
  );
};
