import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GPUInfo, GPUStats } from '../utils/gpu';

export interface PerformanceMetrics {
  fps: number;
  frameTime: number;
  cpuLoad: number;
  gpuLoad: number;
  memoryUsed: number;
  memoryTotal: number;
  networkDownlink: number;
  networkType: string;
  drawCalls: number;
  triangles: number;
  timestamp: number;
}

export interface PerformanceBudget {
  metric: keyof PerformanceMetrics;
  threshold: number;
  description: string;
}

export interface PerformanceAlert {
  id: string;
  metric: keyof PerformanceMetrics;
  value: number;
  threshold: number;
  level: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: number;
}

interface PerformanceState {
  gpuInfo: GPUInfo | null;
  gpuStats: GPUStats | null;
  gpuSupported: boolean;
  gpuEnabled: boolean;
  gpuOverride: boolean | null;
  lowMemoryMode: boolean;
  metrics: PerformanceMetrics;
  history: PerformanceMetrics[];
  historyLimit: number;
  budgets: PerformanceBudget[];
  alerts: PerformanceAlert[];

  setGpuInfo: (info: GPUInfo | null) => void;
  setGpuStats: (stats: GPUStats | null) => void;
  setGpuEnabled: (enabled: boolean) => void;
  setGpuSupported: (supported: boolean) => void;
  setLowMemoryMode: (enabled: boolean) => void;
  updateMetrics: (metrics: Partial<PerformanceMetrics>) => void;
  pushAlert: (alert: PerformanceAlert) => void;
  clearAlert: (alertId: string) => void;
  clearAlertsForMetric: (metric: keyof PerformanceMetrics) => void;
  setBudgets: (budgets: PerformanceBudget[]) => void;
  trimHistory: () => void;
}

const DEFAULT_METRICS: PerformanceMetrics = {
  fps: 0,
  frameTime: 0,
  cpuLoad: 0,
  gpuLoad: 0,
  memoryUsed: 0,
  memoryTotal: 0,
  networkDownlink: 0,
  networkType: 'unknown',
  drawCalls: 0,
  triangles: 0,
  timestamp: Date.now(),
};

const DEFAULT_BUDGETS: PerformanceBudget[] = [
  { metric: 'fps', threshold: 30, description: 'Minimum FPS' },
  { metric: 'frameTime', threshold: 55, description: 'Maximum frame time (ms)' },
  { metric: 'cpuLoad', threshold: 85, description: 'Maximum CPU utilization (%)' },
  { metric: 'gpuLoad', threshold: 90, description: 'Maximum GPU utilization (%)' },
  { metric: 'memoryUsed', threshold: 0.8, description: 'Memory usage (fraction of total)' },
  {
    metric: 'networkDownlink',
    threshold: 1,
    description: 'Minimum network downlink (Mbps) for streaming',
  },
];

const HISTORY_LIMIT = 120;

const createAlertId = () => `perf-alert-${crypto.randomUUID?.() || Date.now()}`;

export const usePerformanceStore = create<PerformanceState>()(
  persist(
    (set, get) => ({
      gpuInfo: null,
      gpuStats: null,
      gpuSupported: false,
      gpuEnabled: false,
      gpuOverride: null,
      lowMemoryMode: false,
      metrics: DEFAULT_METRICS,
      history: [],
      historyLimit: HISTORY_LIMIT,
      budgets: DEFAULT_BUDGETS,
      alerts: [],

      setGpuInfo: info => {
        set({ gpuInfo: info, gpuSupported: Boolean(info?.supported) });
      },

      setGpuStats: stats => {
        set({ gpuStats: stats });
      },

      setGpuEnabled: enabled => {
        set({
          gpuEnabled: enabled,
          gpuOverride: enabled,
        });
      },

      setGpuSupported: supported => {
        const { gpuOverride } = get();
        set({
          gpuSupported: supported,
          gpuEnabled: gpuOverride !== null ? gpuOverride && supported : supported,
        });
      },

      setLowMemoryMode: enabled => {
        set({ lowMemoryMode: enabled });
      },

      updateMetrics: metrics => {
        const current = get().metrics;
        const updated: PerformanceMetrics = {
          ...current,
          ...metrics,
          timestamp: metrics.timestamp ?? Date.now(),
        };

        const newHistory = [...get().history, updated];
        if (newHistory.length > get().historyLimit) {
          newHistory.splice(0, newHistory.length - get().historyLimit);
        }

        set({ metrics: updated, history: newHistory });

        // Evaluate budgets
        const { budgets } = get();
        budgets.forEach(budget => {
          const value = updated[budget.metric];

          if (budget.metric === 'memoryUsed' && updated.memoryTotal > 0) {
            const ratio = updated.memoryUsed / updated.memoryTotal;
            if (ratio >= budget.threshold) {
              get().pushAlert({
                id: createAlertId(),
                metric: budget.metric,
                level: ratio > budget.threshold * 1.2 ? 'critical' : 'warning',
                value: ratio,
                threshold: budget.threshold,
                message: `Memory usage exceeded ${(budget.threshold * 100).toFixed(0)}% budget`,
                timestamp: Date.now(),
              });
            }
            return;
          }

          const isBelowBudget = budget.metric === 'fps' || budget.metric === 'networkDownlink';
          const exceedsThreshold = isBelowBudget ? value < budget.threshold : value > budget.threshold;

          if (exceedsThreshold) {
            get().pushAlert({
              id: createAlertId(),
              metric: budget.metric,
              level: exceedsThreshold && !isBelowBudget ? 'warning' : 'critical',
              value,
              threshold: budget.threshold,
              message: `${budget.description} threshold breached`,
              timestamp: Date.now(),
            });
          }
        });
      },

      pushAlert: alert => {
        set(state => ({ alerts: [...state.alerts, alert] }));
      },

      clearAlert: alertId => {
        set(state => ({ alerts: state.alerts.filter(alert => alert.id !== alertId) }));
      },

      clearAlertsForMetric: metric => {
        set(state => ({ alerts: state.alerts.filter(alert => alert.metric !== metric) }));
      },

      setBudgets: budgets => {
        set({ budgets });
      },

      trimHistory: () => {
        set(state => {
          if (state.history.length <= state.historyLimit) {
            return state;
          }

          return {
            history: state.history.slice(-state.historyLimit),
          } as Partial<PerformanceState>;
        });
      },
    }),
    {
      name: 'performance-store',
      version: 1,
      partialize: state => ({
        gpuEnabled: state.gpuEnabled,
        gpuOverride: state.gpuOverride,
        lowMemoryMode: state.lowMemoryMode,
        budgets: state.budgets,
      }),
    }
  )
);
