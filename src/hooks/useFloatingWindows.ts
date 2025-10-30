import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { FloatingWindowState } from '../types/workspace';
import { useWorkspaceStore } from '../store/workspaceStore';

interface CreateFloatingWindowOptions {
  panelId: string;
  title: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  alwaysOnTop?: boolean;
  transparent?: boolean;
  monitorId?: string;
}

export const useFloatingWindows = () => {
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const updateWorkspaceLayout = useWorkspaceStore(state => state.updateWorkspaceLayout);

  const createFloatingWindow = useCallback(async (options: CreateFloatingWindowOptions) => {
    if (!activeWorkspace) return null;

    const windowId = `floating-${options.panelId}-${Date.now()}`;
    
    try {
      await invoke('create_floating_window', {
        options: {
          window_id: windowId,
          panel_id: options.panelId,
          x: options.x ?? 100,
          y: options.y ?? 100,
          width: options.width ?? 800,
          height: options.height ?? 600,
          always_on_top: options.alwaysOnTop ?? false,
          transparent: options.transparent ?? false,
          title: options.title,
        },
      });

      const floatingWindow: FloatingWindowState = {
        id: windowId,
        panelId: options.panelId,
        x: options.x ?? 100,
        y: options.y ?? 100,
        width: options.width ?? 800,
        height: options.height ?? 600,
        monitorId: options.monitorId,
        alwaysOnTop: options.alwaysOnTop ?? false,
        transparent: options.transparent ?? false,
      };

      const updatedLayout = {
        ...activeWorkspace.layout,
        floatingWindows: [...(activeWorkspace.layout.floatingWindows || []), floatingWindow],
        panels: activeWorkspace.layout.panels.map(p =>
          p.id === options.panelId ? { ...p, isFloating: true, floatingWindowId: windowId } : p
        ),
      };

      updateWorkspaceLayout(activeWorkspace.id, updatedLayout);

      return windowId;
    } catch (error) {
      console.error('Failed to create floating window:', error);
      throw error;
    }
  }, [activeWorkspace, updateWorkspaceLayout]);

  const closeFloatingWindow = useCallback(async (windowId: string) => {
    if (!activeWorkspace) return;

    try {
      await invoke('close_floating_window', { window_id: windowId });

      const floatingWindow = activeWorkspace.layout.floatingWindows?.find(w => w.id === windowId);
      if (!floatingWindow) return;

      const updatedLayout = {
        ...activeWorkspace.layout,
        floatingWindows: activeWorkspace.layout.floatingWindows?.filter(w => w.id !== windowId),
        panels: activeWorkspace.layout.panels.map(p =>
          p.floatingWindowId === windowId
            ? { ...p, isFloating: false, floatingWindowId: undefined }
            : p
        ),
      };

      updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
    } catch (error) {
      console.error('Failed to close floating window:', error);
    }
  }, [activeWorkspace, updateWorkspaceLayout]);

  const setWindowPosition = useCallback(async (windowId: string, x: number, y: number) => {
    if (!activeWorkspace) return;

    try {
      await invoke('set_window_position', { window_id: windowId, x, y });

      const updatedLayout = {
        ...activeWorkspace.layout,
        floatingWindows: activeWorkspace.layout.floatingWindows?.map(w =>
          w.id === windowId ? { ...w, x, y } : w
        ),
      };

      updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
    } catch (error) {
      console.error('Failed to set window position:', error);
    }
  }, [activeWorkspace, updateWorkspaceLayout]);

  const setWindowSize = useCallback(async (windowId: string, width: number, height: number) => {
    if (!activeWorkspace) return;

    try {
      await invoke('set_window_size', { window_id: windowId, width, height });

      const updatedLayout = {
        ...activeWorkspace.layout,
        floatingWindows: activeWorkspace.layout.floatingWindows?.map(w =>
          w.id === windowId ? { ...w, width, height } : w
        ),
      };

      updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
    } catch (error) {
      console.error('Failed to set window size:', error);
    }
  }, [activeWorkspace, updateWorkspaceLayout]);

  const setWindowAlwaysOnTop = useCallback(async (windowId: string, alwaysOnTop: boolean) => {
    if (!activeWorkspace) return;

    try {
      await invoke('set_window_always_on_top', { window_id: windowId, always_on_top: alwaysOnTop });

      const updatedLayout = {
        ...activeWorkspace.layout,
        floatingWindows: activeWorkspace.layout.floatingWindows?.map(w =>
          w.id === windowId ? { ...w, alwaysOnTop } : w
        ),
      };

      updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
    } catch (error) {
      console.error('Failed to set window always on top:', error);
    }
  }, [activeWorkspace, updateWorkspaceLayout]);

  const snapWindowToEdge = useCallback(
    async (
      windowId: string,
      edge: 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right',
      monitorId?: string
    ) => {
      if (!activeWorkspace) return;

      try {
        await invoke('snap_window_to_edge', { window_id: windowId, edge, monitor_id: monitorId });

        const updatedLayout = {
          ...activeWorkspace.layout,
          floatingWindows: activeWorkspace.layout.floatingWindows?.map(w =>
            w.id === windowId ? { ...w, snappedEdge: edge, monitorId } : w
          ),
        };

        updateWorkspaceLayout(activeWorkspace.id, updatedLayout);
      } catch (error) {
        console.error('Failed to snap window to edge:', error);
      }
    },
    [activeWorkspace, updateWorkspaceLayout]
  );

  const dockWindow = useCallback((windowId: string) => {
    closeFloatingWindow(windowId);
  }, [closeFloatingWindow]);

  return {
    createFloatingWindow,
    closeFloatingWindow,
    setWindowPosition,
    setWindowSize,
    setWindowAlwaysOnTop,
    snapWindowToEdge,
    dockWindow,
    floatingWindows: activeWorkspace?.layout.floatingWindows || [],
  };
};
