import { useState, useCallback, useEffect } from 'react';
import { ChartLayout, ChartPanelConfig, MultiChartState } from '../types/indicators';

const STORAGE_KEY = 'multi_chart_layouts';

const DEFAULT_LAYOUTS: ChartLayout[] = [
  {
    id: 'single',
    name: 'Single Chart',
    grid: { rows: 1, cols: 1 },
    panels: [
      {
        id: 'panel-0',
        symbol: 'SOL/USDC',
        timeframe: '1h',
        indicators: [],
        showVolumeProfile: false,
        showOrderBook: false,
        position: { row: 0, col: 0, width: 1, height: 1 },
      },
    ],
    syncCrosshair: false,
    syncTimeframe: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '2x2',
    name: '2x2 Grid',
    grid: { rows: 2, cols: 2 },
    panels: [
      {
        id: 'panel-0',
        symbol: 'SOL/USDC',
        timeframe: '1h',
        indicators: [],
        showVolumeProfile: true,
        showOrderBook: false,
        position: { row: 0, col: 0, width: 1, height: 1 },
      },
      {
        id: 'panel-1',
        symbol: 'BTC/USDC',
        timeframe: '1h',
        indicators: [],
        showVolumeProfile: false,
        showOrderBook: false,
        position: { row: 0, col: 1, width: 1, height: 1 },
      },
      {
        id: 'panel-2',
        symbol: 'ETH/USDC',
        timeframe: '1h',
        indicators: [],
        showVolumeProfile: false,
        showOrderBook: false,
        position: { row: 1, col: 0, width: 1, height: 1 },
      },
      {
        id: 'panel-3',
        symbol: 'USDC',
        timeframe: '1h',
        indicators: [],
        showVolumeProfile: false,
        showOrderBook: true,
        position: { row: 1, col: 1, width: 1, height: 1 },
      },
    ],
    syncCrosshair: true,
    syncTimeframe: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
  {
    id: '3x3',
    name: '3x3 Grid',
    grid: { rows: 3, cols: 3 },
    panels: Array.from({ length: 9 }, (_, i) => ({
      id: `panel-${i}`,
      symbol: 'SOL/USDC',
      timeframe: '1h',
      indicators: [],
      showVolumeProfile: false,
      showOrderBook: false,
      position: {
        row: Math.floor(i / 3),
        col: i % 3,
        width: 1,
        height: 1,
      },
    })),
    syncCrosshair: true,
    syncTimeframe: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  },
];

export function useMultiChart() {
  const [state, setState] = useState<MultiChartState>(() => {
    if (typeof window === 'undefined') {
      return {
        activeLayout: 'single',
        layouts: DEFAULT_LAYOUTS,
        crosshairPosition: null,
        globalTimeframe: '1h',
      };
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return {
          activeLayout: 'single',
          layouts: DEFAULT_LAYOUTS,
          crosshairPosition: null,
          globalTimeframe: '1h',
        };
      }

      const parsed = JSON.parse(stored);
      return {
        ...parsed,
        crosshairPosition: null,
        layouts: [...DEFAULT_LAYOUTS, ...(parsed.layouts || [])],
      };
    } catch (err) {
      console.error('Failed to load multi-chart layouts:', err);
      return {
        activeLayout: 'single',
        layouts: DEFAULT_LAYOUTS,
        crosshairPosition: null,
        globalTimeframe: '1h',
      };
    }
  });

  const saveLayouts = useCallback((layouts: ChartLayout[]) => {
    if (typeof window === 'undefined') return;

    try {
      const toSave = {
        activeLayout: state.activeLayout,
        layouts: layouts.filter(l => !['single', '2x2', '3x3'].includes(l.id)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (err) {
      console.error('Failed to save multi-chart layouts:', err);
    }
  }, [state.activeLayout]);

  const setActiveLayout = useCallback((layoutId: string) => {
    setState(prev => ({ ...prev, activeLayout: layoutId }));
  }, []);

  const updatePanel = useCallback((panelId: string, updates: Partial<ChartPanelConfig>) => {
    setState(prev => {
      const layout = prev.layouts.find(l => l.id === prev.activeLayout);
      if (!layout) return prev;

      const updatedPanels = layout.panels.map(panel =>
        panel.id === panelId ? { ...panel, ...updates } : panel
      );

      const updatedLayout = {
        ...layout,
        panels: updatedPanels,
        updatedAt: Date.now(),
      };

      const updatedLayouts = prev.layouts.map(l =>
        l.id === prev.activeLayout ? updatedLayout : l
      );

      saveLayouts(updatedLayouts);

      return {
        ...prev,
        layouts: updatedLayouts,
      };
    });
  }, [saveLayouts]);

  const createLayout = useCallback((name: string, rows: number, cols: number) => {
    const panels: ChartPanelConfig[] = Array.from({ length: rows * cols }, (_, i) => ({
      id: `panel-${i}`,
      symbol: 'SOL/USDC',
      timeframe: '1h',
      indicators: [],
      showVolumeProfile: false,
      showOrderBook: false,
      position: {
        row: Math.floor(i / cols),
        col: i % cols,
        width: 1,
        height: 1,
      },
    }));

    const newLayout: ChartLayout = {
      id: `custom-${Date.now()}`,
      name,
      grid: { rows, cols },
      panels,
      syncCrosshair: true,
      syncTimeframe: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    setState(prev => {
      const updatedLayouts = [...prev.layouts, newLayout];
      saveLayouts(updatedLayouts);
      return {
        ...prev,
        layouts: updatedLayouts,
        activeLayout: newLayout.id,
      };
    });
  }, [saveLayouts]);

  const deleteLayout = useCallback((layoutId: string) => {
    setState(prev => {
      const updatedLayouts = prev.layouts.filter(l => l.id !== layoutId);
      saveLayouts(updatedLayouts);
      return {
        ...prev,
        layouts: updatedLayouts,
        activeLayout: prev.activeLayout === layoutId ? 'single' : prev.activeLayout,
      };
    });
  }, [saveLayouts]);

  const updateCrosshair = useCallback((position: { x: number; y: number; timestamp: number } | null) => {
    setState(prev => ({ ...prev, crosshairPosition: position }));
  }, []);

  const updateGlobalTimeframe = useCallback((timeframe: string) => {
    setState(prev => {
      const layout = prev.layouts.find(l => l.id === prev.activeLayout);
      if (!layout || !layout.syncTimeframe) {
        return { ...prev, globalTimeframe: timeframe };
      }

      // Update all panels in synced layout
      const updatedPanels = layout.panels.map(panel => ({
        ...panel,
        timeframe,
      }));

      const updatedLayout = { ...layout, panels: updatedPanels, updatedAt: Date.now() };
      const updatedLayouts = prev.layouts.map(l =>
        l.id === prev.activeLayout ? updatedLayout : l
      );

      saveLayouts(updatedLayouts);

      return {
        ...prev,
        layouts: updatedLayouts,
        globalTimeframe: timeframe,
      };
    });
  }, [saveLayouts]);

  const activeLayout = state.layouts.find(l => l.id === state.activeLayout) || state.layouts[0];

  return {
    state,
    activeLayout,
    setActiveLayout,
    updatePanel,
    createLayout,
    deleteLayout,
    updateCrosshair,
    updateGlobalTimeframe,
  };
}
