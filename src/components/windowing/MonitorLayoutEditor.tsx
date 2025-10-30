import { useState } from 'react';
import { Monitor as MonitorIcon, Maximize2 } from 'lucide-react';
import { useMonitors } from '../../hooks/useMonitors';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { Monitor, MonitorLayoutAssignment } from '../../types/workspace';

export const MonitorLayoutEditor = () => {
  const { monitors, loading } = useMonitors();
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const updateWorkspaceLayout = useWorkspaceStore(state => state.updateWorkspaceLayout);
  const [selectedMonitor, setSelectedMonitor] = useState<string | null>(null);

  const getMonitorAssignment = (monitorId: string): MonitorLayoutAssignment | undefined => {
    return activeWorkspace?.layout.monitorAssignments?.find(a => a.monitorId === monitorId);
  };

  const assignPanelToMonitor = (panelId: string, monitorId: string) => {
    if (!activeWorkspace) return;

    const currentAssignments = activeWorkspace.layout.monitorAssignments || [];
    const otherAssignments = currentAssignments.filter(a => a.monitorId !== monitorId);
    const currentAssignment = getMonitorAssignment(monitorId);

    const updatedAssignment: MonitorLayoutAssignment = {
      monitorId,
      panelIds: currentAssignment
        ? [...new Set([...currentAssignment.panelIds, panelId])]
        : [panelId],
    };

    const cleanedAssignments = otherAssignments.map(a => ({
      ...a,
      panelIds: a.panelIds.filter(id => id !== panelId),
    }));

    const updatedLayout = {
      ...activeWorkspace.layout,
      monitorAssignments: [...cleanedAssignments, updatedAssignment],
    };

    updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
  };

  const removePanelFromMonitor = (panelId: string, monitorId: string) => {
    if (!activeWorkspace) return;

    const currentAssignments = activeWorkspace.layout.monitorAssignments || [];
    const updatedAssignments = currentAssignments
      .map(a =>
        a.monitorId === monitorId
          ? { ...a, panelIds: a.panelIds.filter(id => id !== panelId) }
          : a
      )
      .filter(a => a.panelIds.length > 0);

    const updatedLayout = {
      ...activeWorkspace.layout,
      monitorAssignments: updatedAssignments,
    };

    updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading monitors...</div>
      </div>
    );
  }

  if (monitors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">No monitors detected</div>
      </div>
    );
  }

  const scale = 0.08;

  return (
    <div className="p-6 bg-slate-900/50 rounded-xl">
      <div className="flex items-center gap-2 mb-6">
        <MonitorIcon className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold">Monitor Layout Editor</h3>
        <span className="text-sm text-gray-400">
          ({monitors.length} display{monitors.length > 1 ? 's' : ''} detected)
        </span>
      </div>

      <div className="relative bg-slate-800/50 rounded-lg p-8 border border-purple-500/20 min-h-[400px]">
        {monitors.map((monitor, index) => {
          const assignment = getMonitorAssignment(monitor.id);
          const isSelected = selectedMonitor === monitor.id;

          return (
            <div
              key={monitor.id}
              className={`absolute border-2 rounded-lg transition-all cursor-pointer ${
                isSelected
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-purple-500/30 bg-slate-700/30 hover:border-purple-500/50'
              } ${monitor.isPrimary ? 'ring-2 ring-purple-400/50' : ''}`}
              style={{
                left: `${monitor.x * scale + 50}px`,
                top: `${monitor.y * scale + 50}px`,
                width: `${monitor.width * scale}px`,
                height: `${monitor.height * scale}px`,
              }}
              onClick={() => setSelectedMonitor(monitor.id)}
            >
              <div className="absolute top-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-900/80 px-2 py-1 rounded text-xs">
                  <MonitorIcon className="w-3 h-3" />
                  <span>{monitor.name || `Monitor ${index + 1}`}</span>
                </div>
                {monitor.isPrimary && (
                  <div className="bg-purple-500/80 px-2 py-1 rounded text-xs font-medium">
                    Primary
                  </div>
                )}
              </div>

              <div className="absolute bottom-2 left-2 right-2">
                <div className="bg-slate-900/80 px-2 py-1 rounded text-xs text-center">
                  {monitor.width} × {monitor.height} @ {monitor.scaleFactor.toFixed(1)}x
                </div>
                {assignment && assignment.panelIds.length > 0 && (
                  <div className="mt-1 bg-slate-900/80 px-2 py-1 rounded text-xs">
                    {assignment.panelIds.length} panel{assignment.panelIds.length > 1 ? 's' : ''}{' '}
                    assigned
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedMonitor && (
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-purple-500/20">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-purple-400" />
            Assign Panels to {monitors.find(m => m.id === selectedMonitor)?.name || 'Selected Monitor'}
          </h4>

          {activeWorkspace && (
            <div className="space-y-2">
              {activeWorkspace.layout.panels
                .filter(p => !p.isFloating)
                .map(panel => {
                  const assignment = getMonitorAssignment(selectedMonitor);
                  const isAssigned = assignment?.panelIds.includes(panel.id);

                  return (
                    <div
                      key={panel.id}
                      className="flex items-center justify-between p-2 bg-slate-700/30 rounded hover:bg-slate-700/50 transition-colors"
                    >
                      <span className="text-sm">{panel.title}</span>
                      <button
                        onClick={() => {
                          if (isAssigned) {
                            removePanelFromMonitor(panel.id, selectedMonitor);
                          } else {
                            assignPanelToMonitor(panel.id, selectedMonitor);
                          }
                        }}
                        className={`px-3 py-1 rounded text-xs transition-colors ${
                          isAssigned
                            ? 'bg-purple-500/80 hover:bg-purple-500 text-white'
                            : 'bg-slate-600 hover:bg-slate-500 text-gray-300'
                        }`}
                      >
                        {isAssigned ? 'Assigned' : 'Assign'}
                      </button>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
