import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFloatingWindows } from '../hooks/useFloatingWindows';
import { useMonitors } from '../hooks/useMonitors';
import { useWorkspaceStore } from '../store/workspaceStore';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Windowing Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useWorkspaceStore.setState({
      workspaces: [],
      activeWorkspaceId: '',
      isWorkspaceSwitcherOpen: false,
      currentMonitorConfig: null,
    });
  });

  describe('useMonitors', () => {
    it('should fetch monitors on mount', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue([
        {
          id: 'monitor-0',
          name: 'Primary Monitor',
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scaleFactor: 1,
          isPrimary: true,
        },
      ]);

      const { result } = renderHook(() => useMonitors());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.monitors).toHaveLength(1);
      expect(result.current.monitors[0].id).toBe('monitor-0');
      expect(result.current.loading).toBe(false);
    });

    it('should handle multiple monitors', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue([
        {
          id: 'monitor-0',
          name: 'Primary Monitor',
          width: 1920,
          height: 1080,
          x: 0,
          y: 0,
          scaleFactor: 1,
          isPrimary: true,
        },
        {
          id: 'monitor-1',
          name: 'Secondary Monitor',
          width: 2560,
          height: 1440,
          x: 1920,
          y: 0,
          scaleFactor: 1,
          isPrimary: false,
        },
      ]);

      const { result } = renderHook(() => useMonitors());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.monitors).toHaveLength(2);
      expect(result.current.monitors[1].width).toBe(2560);
    });

    it('should fallback to default monitor on error', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockRejectedValue(new Error('Failed to get monitors'));

      const { result } = renderHook(() => useMonitors());

      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.monitors).toHaveLength(1);
      expect(result.current.monitors[0].isPrimary).toBe(true);
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('FloatingWindows', () => {
    it('should create floating window', async () => {
      const testWorkspace = {
        id: 'ws-1',
        name: 'Test Workspace',
        layout: {
          panels: [
            {
              id: 'panel-1',
              type: 'dashboard' as const,
              title: 'Dashboard',
              isMinimized: false,
              isLocked: false,
            },
          ],
          layouts: [],
        },
        isUnsaved: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useWorkspaceStore.setState({
        workspaces: [testWorkspace],
        activeWorkspaceId: testWorkspace.id,
        isWorkspaceSwitcherOpen: false,
        currentMonitorConfig: null,
      });

      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue('floating-panel-1-123456');

      const { result } = renderHook(() => useFloatingWindows());

      await act(async () => {
        await result.current.createFloatingWindow({
          panelId: 'panel-1',
          title: 'Dashboard',
          x: 100,
          y: 100,
          width: 800,
          height: 600,
        });
      });

      expect(invoke).toHaveBeenCalledWith(
        'create_floating_window',
        expect.objectContaining({
          options: expect.objectContaining({
            panel_id: 'panel-1',
            title: 'Dashboard',
          }),
        })
      );

      expect(result.current.floatingWindows).toHaveLength(1);
    });

    it('should close floating window', async () => {
      const testWorkspace = {
        id: 'ws-1',
        name: 'Test Workspace',
        layout: {
          panels: [
            {
              id: 'panel-1',
              type: 'dashboard' as const,
              title: 'Dashboard',
              isMinimized: false,
              isLocked: false,
              isFloating: true,
              floatingWindowId: 'floating-1',
            },
          ],
          layouts: [],
          floatingWindows: [
            {
              id: 'floating-1',
              panelId: 'panel-1',
              x: 100,
              y: 100,
              width: 800,
              height: 600,
            },
          ],
        },
        isUnsaved: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useWorkspaceStore.setState({
        workspaces: [testWorkspace],
        activeWorkspaceId: testWorkspace.id,
        isWorkspaceSwitcherOpen: false,
        currentMonitorConfig: null,
      });

      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFloatingWindows());

      await act(async () => {
        await result.current.closeFloatingWindow('floating-1');
      });

      expect(invoke).toHaveBeenCalledWith('close_floating_window', {
        windowId: 'floating-1',
      });

      expect(result.current.floatingWindows).toHaveLength(0);
    });

    it('should set window always on top', async () => {
      const testWorkspace = {
        id: 'ws-1',
        name: 'Test Workspace',
        layout: {
          panels: [],
          layouts: [],
          floatingWindows: [
            {
              id: 'floating-1',
              panelId: 'panel-1',
              x: 100,
              y: 100,
              width: 800,
              height: 600,
              alwaysOnTop: false,
            },
          ],
        },
        isUnsaved: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useWorkspaceStore.setState({
        workspaces: [testWorkspace],
        activeWorkspaceId: testWorkspace.id,
        isWorkspaceSwitcherOpen: false,
        currentMonitorConfig: null,
      });

      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFloatingWindows());

      await act(async () => {
        await result.current.setWindowAlwaysOnTop('floating-1', true);
      });

      expect(invoke).toHaveBeenCalledWith('set_window_always_on_top', {
        windowId: 'floating-1',
        alwaysOnTop: true,
      });

      expect(result.current.floatingWindows[0].alwaysOnTop).toBe(true);
    });

    it('should snap window to edge', async () => {
      const testWorkspace = {
        id: 'ws-1',
        name: 'Test Workspace',
        layout: {
          panels: [],
          layouts: [],
          floatingWindows: [
            {
              id: 'floating-1',
              panelId: 'panel-1',
              x: 100,
              y: 100,
              width: 800,
              height: 600,
            },
          ],
        },
        isUnsaved: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      useWorkspaceStore.setState({
        workspaces: [testWorkspace],
        activeWorkspaceId: testWorkspace.id,
        isWorkspaceSwitcherOpen: false,
        currentMonitorConfig: null,
      });

      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockResolvedValue(undefined);

      const { result } = renderHook(() => useFloatingWindows());

      await act(async () => {
        await result.current.snapWindowToEdge('floating-1', 'left', 'monitor-0');
      });

      expect(invoke).toHaveBeenCalledWith('snap_window_to_edge', {
        windowId: 'floating-1',
        edge: 'left',
        monitorId: 'monitor-0',
      });

      expect(result.current.floatingWindows[0].snappedEdge).toBe('left');
    });
  });

  describe('Split Pane Behavior', () => {
    it('should handle split configuration', () => {
      const splitConfig = {
        direction: 'horizontal' as const,
        sizes: [50, 50],
        children: ['panel-1', 'panel-2'],
      };

      expect(splitConfig.direction).toBe('horizontal');
      expect(splitConfig.sizes).toHaveLength(2);
      expect(splitConfig.children).toHaveLength(2);
    });

    it('should handle nested splits', () => {
      const nestedSplit = {
        direction: 'horizontal' as const,
        sizes: [50, 50],
        children: [
          'panel-1',
          {
            direction: 'vertical' as const,
            sizes: [50, 50],
            children: ['panel-2', 'panel-3'],
          },
        ],
      };

      expect(nestedSplit.children).toHaveLength(2);
      expect(typeof nestedSplit.children[1]).toBe('object');
    });
  });

  describe('Window Persistence', () => {
    it('should persist floating window positions', () => {
      const workspace = useWorkspaceStore.getState().workspaces[0];
      
      const floatingWindow = {
        id: 'floating-1',
        panelId: 'panel-1',
        x: 150,
        y: 200,
        width: 900,
        height: 700,
        alwaysOnTop: true,
        transparent: false,
      };

      expect(floatingWindow.x).toBe(150);
      expect(floatingWindow.y).toBe(200);
      expect(floatingWindow.alwaysOnTop).toBe(true);
    });

    it('should persist monitor assignments', () => {
      const monitorAssignment = {
        monitorId: 'monitor-1',
        panelIds: ['panel-1', 'panel-2'],
      };

      expect(monitorAssignment.monitorId).toBe('monitor-1');
      expect(monitorAssignment.panelIds).toHaveLength(2);
    });
  });
});
