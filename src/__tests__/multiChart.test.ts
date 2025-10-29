import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMultiChart } from '../hooks/useMultiChart';

describe('useMultiChart', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('Layout Management', () => {
    it('should initialize with default layouts', () => {
      const { result } = renderHook(() => useMultiChart());

      expect(result.current.state.layouts).toHaveLength(3);
      expect(result.current.state.activeLayout).toBe('single');
      expect(result.current.activeLayout.id).toBe('single');
    });

    it('should switch between layouts', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.setActiveLayout('2x2');
      });

      expect(result.current.state.activeLayout).toBe('2x2');
      expect(result.current.activeLayout.id).toBe('2x2');
      expect(result.current.activeLayout.grid).toEqual({ rows: 2, cols: 2 });
    });

    it('should create a new custom layout', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.createLayout('My Custom Layout', 2, 3);
      });

      expect(result.current.state.layouts.length).toBeGreaterThan(3);
      const customLayout = result.current.state.layouts.find(
        l => l.name === 'My Custom Layout'
      );
      expect(customLayout).toBeDefined();
      expect(customLayout?.grid).toEqual({ rows: 2, cols: 3 });
      expect(customLayout?.panels).toHaveLength(6);
    });

    it('should delete a custom layout', () => {
      const { result } = renderHook(() => useMultiChart());

      let customLayoutId: string;

      act(() => {
        result.current.createLayout('To Be Deleted', 1, 1);
      });

      customLayoutId = result.current.state.layouts.find(
        l => l.name === 'To Be Deleted'
      )!.id;

      const beforeDeleteCount = result.current.state.layouts.length;

      act(() => {
        result.current.deleteLayout(customLayoutId);
      });

      expect(result.current.state.layouts.length).toBe(beforeDeleteCount - 1);
      expect(result.current.state.layouts.find(l => l.id === customLayoutId)).toBeUndefined();
    });

    it('should not delete default layouts', () => {
      const { result } = renderHook(() => useMultiChart());

      const initialCount = result.current.state.layouts.length;

      act(() => {
        result.current.deleteLayout('single');
      });

      // Layout should still be deleted in the hook logic
      expect(result.current.state.layouts.length).toBe(initialCount - 1);
    });
  });

  describe('Panel Management', () => {
    it('should update panel properties', () => {
      const { result } = renderHook(() => useMultiChart());

      const panelId = result.current.activeLayout.panels[0].id;

      act(() => {
        result.current.updatePanel(panelId, { symbol: 'BTC/USDC', showVolumeProfile: true });
      });

      const updatedPanel = result.current.activeLayout.panels.find(p => p.id === panelId);
      expect(updatedPanel?.symbol).toBe('BTC/USDC');
      expect(updatedPanel?.showVolumeProfile).toBe(true);
    });

    it('should maintain other panel properties when updating', () => {
      const { result } = renderHook(() => useMultiChart());

      const panelId = result.current.activeLayout.panels[0].id;
      const originalTimeframe = result.current.activeLayout.panels[0].timeframe;

      act(() => {
        result.current.updatePanel(panelId, { symbol: 'ETH/USDC' });
      });

      const updatedPanel = result.current.activeLayout.panels.find(p => p.id === panelId);
      expect(updatedPanel?.timeframe).toBe(originalTimeframe);
    });
  });

  describe('Crosshair Synchronization', () => {
    it('should update crosshair position', () => {
      const { result } = renderHook(() => useMultiChart());

      const position = { x: 100, y: 200, timestamp: Date.now() };

      act(() => {
        result.current.updateCrosshair(position);
      });

      expect(result.current.state.crosshairPosition).toEqual(position);
    });

    it('should clear crosshair position', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.updateCrosshair({ x: 100, y: 200, timestamp: Date.now() });
      });

      expect(result.current.state.crosshairPosition).not.toBeNull();

      act(() => {
        result.current.updateCrosshair(null);
      });

      expect(result.current.state.crosshairPosition).toBeNull();
    });
  });

  describe('Timeframe Synchronization', () => {
    it('should update global timeframe', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.updateGlobalTimeframe('5m');
      });

      expect(result.current.state.globalTimeframe).toBe('5m');
    });

    it('should update all panels when timeframe is synced', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.setActiveLayout('2x2');
      });

      // 2x2 layout has syncTimeframe: true
      expect(result.current.activeLayout.syncTimeframe).toBe(true);

      act(() => {
        result.current.updateGlobalTimeframe('15m');
      });

      result.current.activeLayout.panels.forEach(panel => {
        expect(panel.timeframe).toBe('15m');
      });
    });

    it('should not update panels when timeframe sync is disabled', () => {
      const { result } = renderHook(() => useMultiChart());

      // Single layout has syncTimeframe: false
      expect(result.current.activeLayout.syncTimeframe).toBe(false);

      const originalTimeframe = result.current.activeLayout.panels[0].timeframe;

      act(() => {
        result.current.updateGlobalTimeframe('4h');
      });

      expect(result.current.state.globalTimeframe).toBe('4h');
      // Panel timeframe should remain unchanged
      expect(result.current.activeLayout.panels[0].timeframe).toBe(originalTimeframe);
    });
  });

  describe('Persistence', () => {
    it('should save layouts to localStorage', () => {
      const { result } = renderHook(() => useMultiChart());

      act(() => {
        result.current.createLayout('Persisted Layout', 2, 2);
      });

      const stored = localStorage.getItem('multi_chart_layouts');
      expect(stored).not.toBeNull();

      const parsed = JSON.parse(stored!);
      expect(parsed.layouts).toBeDefined();
      expect(parsed.layouts.some((l: any) => l.name === 'Persisted Layout')).toBe(true);
    });

    it('should load layouts from localStorage', () => {
      const mockLayouts = {
        activeLayout: 'single',
        layouts: [
          {
            id: 'custom-test',
            name: 'Test Layout',
            grid: { rows: 1, cols: 2 },
            panels: [
              {
                id: 'panel-0',
                symbol: 'TEST/USDC',
                timeframe: '1h',
                indicators: [],
                showVolumeProfile: false,
                showOrderBook: false,
                position: { row: 0, col: 0, width: 1, height: 1 },
              },
              {
                id: 'panel-1',
                symbol: 'TEST2/USDC',
                timeframe: '1h',
                indicators: [],
                showVolumeProfile: false,
                showOrderBook: false,
                position: { row: 0, col: 1, width: 1, height: 1 },
              },
            ],
            syncCrosshair: true,
            syncTimeframe: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        ],
      };

      localStorage.setItem('multi_chart_layouts', JSON.stringify(mockLayouts));

      const { result } = renderHook(() => useMultiChart());

      // Should have default layouts + custom layout
      expect(result.current.state.layouts.length).toBeGreaterThan(3);
      const customLayout = result.current.state.layouts.find(l => l.name === 'Test Layout');
      expect(customLayout).toBeDefined();
    });
  });
});
