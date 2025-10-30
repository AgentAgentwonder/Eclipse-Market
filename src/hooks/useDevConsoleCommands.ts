import { useEffect } from 'react';
import { useDevConsoleStore } from '../store/devConsoleStore';
import { usePerformanceStore } from '../store/performanceStore';
import { useWalletStore } from '../store/walletStore';
import { useMaintenanceStore } from '../store/maintenanceStore';

export function useDevConsoleCommands() {
  const registerCommand = useDevConsoleStore(state => state.registerCommand);
  const unregisterCommand = useDevConsoleStore(state => state.unregisterCommand);
  const setEnabled = useDevConsoleStore(state => state.setEnabled);

  useEffect(() => {
    // Enable console for advanced users (can be gated behind a setting)
    setEnabled(true);

    const commands = [
      {
        id: 'system:clear-cache',
        name: 'Clear Cache',
        description: 'Clear all application caches',
        category: 'system' as const,
        execute: () => {
          if (typeof window !== 'undefined' && 'caches' in window) {
            return caches.keys().then(names => {
              return Promise.all(names.map(name => caches.delete(name)));
            });
          }
          return Promise.resolve('Cache API not available');
        },
      },
      {
        id: 'system:reload',
        name: 'Reload Application',
        description: 'Force reload the application',
        category: 'system' as const,
        execute: () => {
          window.location.reload();
          return Promise.resolve('Reloading...');
        },
      },
      {
        id: 'performance:reset-budgets',
        name: 'Reset Performance Budgets',
        description: 'Reset all performance budgets to default',
        category: 'performance' as const,
        execute: () => {
          const defaultBudgets = [
            { metric: 'fps' as const, threshold: 30, description: 'Minimum FPS' },
            { metric: 'frameTime' as const, threshold: 55, description: 'Maximum frame time (ms)' },
            { metric: 'cpuLoad' as const, threshold: 85, description: 'Maximum CPU utilization (%)' },
            { metric: 'gpuLoad' as const, threshold: 90, description: 'Maximum GPU utilization (%)' },
            { metric: 'memoryUsed' as const, threshold: 0.8, description: 'Memory usage (fraction)' },
            { metric: 'networkDownlink' as const, threshold: 1, description: 'Minimum network (Mbps)' },
          ];
          usePerformanceStore.getState().setBudgets(defaultBudgets);
          return Promise.resolve('Budgets reset to defaults');
        },
      },
      {
        id: 'performance:clear-alerts',
        name: 'Clear Performance Alerts',
        description: 'Clear all performance alerts',
        category: 'performance' as const,
        execute: () => {
          usePerformanceStore.setState({ alerts: [] });
          return Promise.resolve('All alerts cleared');
        },
      },
      {
        id: 'state:export-wallet',
        name: 'Export Wallet State',
        description: 'Export current wallet state to JSON',
        category: 'state' as const,
        execute: () => {
          const state = useWalletStore.getState();
          return Promise.resolve({
            wallets: state.wallets.map(w => ({ id: w.id, name: w.name, address: w.address })),
            groups: state.groups,
            activeWalletId: state.activeWalletId,
          });
        },
      },
      {
        id: 'state:export-performance',
        name: 'Export Performance Data',
        description: 'Export performance metrics and history',
        category: 'state' as const,
        execute: () => {
          const state = usePerformanceStore.getState();
          return Promise.resolve({
            metrics: state.metrics,
            history: state.history,
            alerts: state.alerts,
            budgets: state.budgets,
          });
        },
      },
      {
        id: 'network:simulate-offline',
        name: 'Simulate Offline Mode',
        description: 'Test offline mode behavior',
        category: 'network' as const,
        execute: () => {
          // This would trigger offline mode in network indicator
          return Promise.resolve('Offline mode simulation not fully implemented');
        },
      },
      {
        id: 'cache:clear-storage',
        name: 'Clear Local Storage',
        description: 'Clear all localStorage data',
        category: 'cache' as const,
        execute: () => {
          const itemCount = localStorage.length;
          localStorage.clear();
          return Promise.resolve(`Cleared ${itemCount} localStorage items`);
        },
      },
      {
        id: 'cache:clear-session',
        name: 'Clear Session Storage',
        description: 'Clear all sessionStorage data',
        category: 'cache' as const,
        execute: () => {
          const itemCount = sessionStorage.length;
          sessionStorage.clear();
          return Promise.resolve(`Cleared ${itemCount} sessionStorage items`);
        },
      },
      {
        id: 'system:memory-info',
        name: 'Get Memory Info',
        description: 'Display current memory usage',
        category: 'system' as const,
        execute: () => {
          if ('memory' in performance && (performance as any).memory) {
            const memory = (performance as any).memory;
            return Promise.resolve({
              usedJSHeapSize: memory.usedJSHeapSize,
              totalJSHeapSize: memory.totalJSHeapSize,
              jsHeapSizeLimit: memory.jsHeapSizeLimit,
              usagePercentage: ((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100).toFixed(2) + '%',
            });
          }
          return Promise.resolve('Memory API not available');
        },
      },
    ];

    commands.forEach(cmd => registerCommand(cmd));

    return () => {
      commands.forEach(cmd => unregisterCommand(cmd.id));
    };
  }, [registerCommand, unregisterCommand, setEnabled]);
}
