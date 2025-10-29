import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, WorkspaceLayout, MonitorConfig, Panel, PanelLayout } from '../types/workspace';
import { defaultWorkspaceLayout, layoutPresets } from '../constants/layoutPresets';
import { cloneWorkspaceLayout } from '../utils/workspace';

interface WorkspaceState {
  workspaces: Workspace[];
  activeWorkspaceId: string;
  isWorkspaceSwitcherOpen: boolean;
  currentMonitorConfig: MonitorConfig | null;

  addWorkspace: (name?: string, layout?: WorkspaceLayout) => void;
  duplicateWorkspace: (workspaceId: string) => void;
  deleteWorkspace: (workspaceId: string) => void;
  renameWorkspace: (workspaceId: string, name: string) => void;
  setActiveWorkspace: (workspaceId: string) => void;
  reorderWorkspaces: (workspaceIds: string[]) => void;
  updateWorkspaceLayout: (workspaceId: string, layout: WorkspaceLayout) => void;
  markWorkspaceAsUnsaved: (workspaceId: string) => void;
  saveWorkspace: (workspaceId: string) => void;
  resetWorkspaceLayout: (workspaceId: string) => void;
  loadPreset: (presetId: string) => void;
  toggleWorkspaceSwitcher: () => void;
  setWorkspaceSwitcherOpen: (isOpen: boolean) => void;
  updateMonitorConfig: (config: MonitorConfig) => void;
  getActiveWorkspace: () => Workspace | undefined;

  addPanel: (workspaceId: string, panel: Panel, layout: PanelLayout) => void;
  removePanel: (workspaceId: string, panelId: string) => void;
  togglePanelLock: (workspaceId: string, panelId: string) => void;
  togglePanelMinimize: (workspaceId: string, panelId: string) => void;
  setPanelMinimized: (workspaceId: string, panelId: string, minimized: boolean) => void;
}

const generateId = () => `ws-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const createWorkspace = (name: string, layout?: WorkspaceLayout): Workspace => ({
  id: generateId(),
  name,
  layout: cloneWorkspaceLayout(layout ?? defaultWorkspaceLayout),
  isUnsaved: false,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

const detectMonitorConfig = (): MonitorConfig => {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      count: 1,
    };
  }

  return {
    width: window.screen.width,
    height: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    count: 1,
  };
};

const initialWorkspace = createWorkspace('Workspace 1');

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set, get) => ({
      workspaces: [initialWorkspace],
      activeWorkspaceId: initialWorkspace.id,
      isWorkspaceSwitcherOpen: false,
      currentMonitorConfig: detectMonitorConfig(),

      addWorkspace: (name, layout) => {
        set(state => {
          const newWorkspace = createWorkspace(
            name || `Workspace ${state.workspaces.length + 1}`,
            layout
          );

          return {
            workspaces: [...state.workspaces, newWorkspace],
            activeWorkspaceId: newWorkspace.id,
          };
        });
      },

      duplicateWorkspace: workspaceId => {
        const source = get().workspaces.find(w => w.id === workspaceId);
        if (!source) return;

        const duplicated = createWorkspace(`${source.name} (Copy)`, source.layout);

        set(state => ({
          workspaces: [...state.workspaces, duplicated],
          activeWorkspaceId: duplicated.id,
        }));
      },

      deleteWorkspace: workspaceId => {
        const state = get();
        if (state.workspaces.length === 1) return;

        const updatedWorkspaces = state.workspaces.filter(w => w.id !== workspaceId);
        const activeId =
          state.activeWorkspaceId === workspaceId
            ? updatedWorkspaces[0]?.id ?? ''
            : state.activeWorkspaceId;

        set({
          workspaces: updatedWorkspaces,
          activeWorkspaceId: activeId,
        });
      },

      renameWorkspace: (workspaceId, name) => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId ? { ...w, name, updatedAt: Date.now() } : w
          ),
        }));
      },

      setActiveWorkspace: workspaceId => {
        if (!get().workspaces.some(w => w.id === workspaceId)) return;
        set({ activeWorkspaceId: workspaceId });
      },

      reorderWorkspaces: workspaceIds => {
        const current = get().workspaces;
        const reordered = workspaceIds
          .map(id => current.find(w => w.id === id))
          .filter((w): w is Workspace => Boolean(w));

        const activeExists = reordered.some(w => w.id === get().activeWorkspaceId);
        set({
          workspaces: reordered,
          activeWorkspaceId: activeExists ? get().activeWorkspaceId : reordered[0]?.id ?? '',
        });
      },

      updateWorkspaceLayout: (workspaceId, layout) => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId
              ? {
                  ...w,
                  layout: {
                    ...cloneWorkspaceLayout(layout),
                    monitorConfig: state.currentMonitorConfig || undefined,
                  },
                  isUnsaved: true,
                  updatedAt: Date.now(),
                }
              : w
          ),
        }));
      },

      markWorkspaceAsUnsaved: workspaceId => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId ? { ...w, isUnsaved: true } : w
          ),
        }));
      },

      saveWorkspace: workspaceId => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId ? { ...w, isUnsaved: false, updatedAt: Date.now() } : w
          ),
        }));
      },

      resetWorkspaceLayout: workspaceId => {
        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === workspaceId
              ? {
                  ...w,
                  layout: cloneWorkspaceLayout(defaultWorkspaceLayout),
                  isUnsaved: false,
                  updatedAt: Date.now(),
                }
              : w
          ),
        }));
      },

      loadPreset: presetId => {
        const preset = layoutPresets.find(p => p.id === presetId);
        if (!preset) return;

        const activeId = get().activeWorkspaceId;
        if (!activeId) return;

        set(state => ({
          workspaces: state.workspaces.map(w =>
            w.id === activeId
              ? {
                  ...w,
                  layout: cloneWorkspaceLayout(preset.layout),
                  isUnsaved: false,
                  updatedAt: Date.now(),
                }
              : w
          ),
        }));
      },

      toggleWorkspaceSwitcher: () => {
        set(state => ({ isWorkspaceSwitcherOpen: !state.isWorkspaceSwitcherOpen }));
      },

      setWorkspaceSwitcherOpen: isOpen => {
        set({ isWorkspaceSwitcherOpen: isOpen });
      },

      updateMonitorConfig: config => {
        set({ currentMonitorConfig: config });
      },

      getActiveWorkspace: () => {
        const state = get();
        return state.workspaces.find(w => w.id === state.activeWorkspaceId);
      },

      addPanel: (workspaceId, panel, layout) => {
        const panelClone: Panel = { ...panel };
        const layoutClone: PanelLayout = { ...layout };

        set(state => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== workspaceId) return w;

            return {
              ...w,
              layout: {
                ...w.layout,
                panels: [...w.layout.panels, panelClone],
                layouts: [...w.layout.layouts, layoutClone],
              },
              isUnsaved: true,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      removePanel: (workspaceId, panelId) => {
        set(state => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== workspaceId) return w;

            return {
              ...w,
              layout: {
                ...w.layout,
                panels: w.layout.panels.filter(p => p.id !== panelId),
                layouts: w.layout.layouts.filter(l => l.i !== panelId),
              },
              isUnsaved: true,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      togglePanelLock: (workspaceId, panelId) => {
        set(state => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== workspaceId) return w;

            return {
              ...w,
              layout: {
                ...w.layout,
                panels: w.layout.panels.map(p =>
                  p.id === panelId ? { ...p, isLocked: !p.isLocked } : p
                ),
                layouts: w.layout.layouts.map(l =>
                  l.i === panelId
                    ? {
                        ...l,
                        static: !l.static,
                        isDraggable: l.static,
                        isResizable: l.static,
                      }
                    : l
                ),
              },
              isUnsaved: true,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      togglePanelMinimize: (workspaceId, panelId) => {
        set(state => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== workspaceId) return w;

            return {
              ...w,
              layout: {
                ...w.layout,
                panels: w.layout.panels.map(p =>
                  p.id === panelId ? { ...p, isMinimized: !p.isMinimized } : p
                ),
              },
              isUnsaved: true,
              updatedAt: Date.now(),
            };
          }),
        }));
      },

      setPanelMinimized: (workspaceId, panelId, minimized) => {
        set(state => ({
          workspaces: state.workspaces.map(w => {
            if (w.id !== workspaceId) return w;

            return {
              ...w,
              layout: {
                ...w.layout,
                panels: w.layout.panels.map(p =>
                  p.id === panelId ? { ...p, isMinimized: minimized } : p
                ),
              },
              isUnsaved: true,
              updatedAt: Date.now(),
            };
          }),
        }));
      },
    }),
    {
      name: 'workspace-storage',
      version: 1,
      partialize: state => ({
        workspaces: state.workspaces,
        activeWorkspaceId: state.activeWorkspaceId,
        currentMonitorConfig: state.currentMonitorConfig,
      }),
      onRehydrateStorage: () => state => {
        if (!state) return;
        if (state.workspaces.length > 0 && !state.activeWorkspaceId) {
          state.activeWorkspaceId = state.workspaces[0].id;
        }
      },
    }
  )
);
