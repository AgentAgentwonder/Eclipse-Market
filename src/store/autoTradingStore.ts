import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import {
  TradingStrategy,
  StrategyExecution,
  BacktestResult,
  OptimizationRun,
  BacktestConfig,
  OptimizationConfig,
} from '../types/autoTrading';

interface AutoTradingState {
  strategies: TradingStrategy[];
  executions: Map<string, StrategyExecution>;
  backtestResults: BacktestResult[];
  optimizationRuns: OptimizationRun[];
  isKillSwitchActive: boolean;
  
  // Strategy Management
  addStrategy: (strategy: Omit<TradingStrategy, 'id' | 'createdAt' | 'updatedAt'>) => Promise<TradingStrategy>;
  updateStrategy: (id: string, updates: Partial<TradingStrategy>) => Promise<void>;
  deleteStrategy: (id: string) => Promise<void>;
  toggleStrategy: (id: string, enabled: boolean) => Promise<void>;
  
  // Execution Management
  startStrategy: (strategyId: string) => Promise<void>;
  stopStrategy: (strategyId: string) => Promise<void>;
  pauseStrategy: (strategyId: string) => Promise<void>;
  updateExecution: (execution: StrategyExecution) => void;
  
  // Kill Switch
  activateKillSwitch: () => Promise<void>;
  deactivateKillSwitch: () => Promise<void>;
  
  // Backtesting
  runBacktest: (config: BacktestConfig) => Promise<BacktestResult>;
  deleteBacktestResult: (id: string) => void;
  clearBacktestResults: () => void;
  
  // Optimization
  startOptimization: (config: OptimizationConfig) => Promise<string>;
  cancelOptimization: (id: string) => Promise<void>;
  updateOptimizationProgress: (run: OptimizationRun) => void;
  deleteOptimizationRun: (id: string) => void;
  applyOptimizedParameters: (strategyId: string, parameters: Record<string, number>) => Promise<void>;
}

export const useAutoTradingStore = create<AutoTradingState>()(
  persist(
    (set, get) => ({
      strategies: [],
      executions: new Map(),
      backtestResults: [],
      optimizationRuns: [],
      isKillSwitchActive: false,
      
      addStrategy: async (strategyInput) => {
        try {
          const strategy = await invoke<TradingStrategy>('auto_trading_create_strategy', {
            strategy: strategyInput,
          });
          
          set(state => ({
            strategies: [...state.strategies, strategy],
          }));
          
          return strategy;
        } catch (error) {
          console.error('Failed to create strategy:', error);
          throw error;
        }
      },
      
      updateStrategy: async (id, updates) => {
        try {
          await invoke('auto_trading_update_strategy', { id, updates });
          
          set(state => ({
            strategies: state.strategies.map(s => 
              s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
            ),
          }));
        } catch (error) {
          console.error('Failed to update strategy:', error);
          throw error;
        }
      },
      
      deleteStrategy: async (id) => {
        try {
          await invoke('auto_trading_delete_strategy', { id });
          
          set(state => ({
            strategies: state.strategies.filter(s => s.id !== id),
          }));
        } catch (error) {
          console.error('Failed to delete strategy:', error);
          throw error;
        }
      },
      
      toggleStrategy: async (id, enabled) => {
        await get().updateStrategy(id, { enabled });
      },
      
      startStrategy: async (strategyId) => {
        try {
          const execution = await invoke<StrategyExecution>('auto_trading_start_strategy', {
            strategyId,
          });
          
          set(state => {
            const newExecutions = new Map(state.executions);
            newExecutions.set(strategyId, execution);
            return { executions: newExecutions };
          });
        } catch (error) {
          console.error('Failed to start strategy:', error);
          throw error;
        }
      },
      
      stopStrategy: async (strategyId) => {
        try {
          await invoke('auto_trading_stop_strategy', { strategyId });
          
          set(state => {
            const newExecutions = new Map(state.executions);
            const execution = newExecutions.get(strategyId);
            if (execution) {
              execution.status = 'stopped';
              execution.stoppedAt = Date.now();
              newExecutions.set(strategyId, execution);
            }
            return { executions: newExecutions };
          });
        } catch (error) {
          console.error('Failed to stop strategy:', error);
          throw error;
        }
      },
      
      pauseStrategy: async (strategyId) => {
        try {
          await invoke('auto_trading_pause_strategy', { strategyId });
          
          set(state => {
            const newExecutions = new Map(state.executions);
            const execution = newExecutions.get(strategyId);
            if (execution) {
              execution.status = 'paused';
              newExecutions.set(strategyId, execution);
            }
            return { executions: newExecutions };
          });
        } catch (error) {
          console.error('Failed to pause strategy:', error);
          throw error;
        }
      },
      
      updateExecution: (execution) => {
        set(state => {
          const newExecutions = new Map(state.executions);
          newExecutions.set(execution.strategyId, execution);
          return { executions: newExecutions };
        });
      },
      
      activateKillSwitch: async () => {
        try {
          await invoke('auto_trading_activate_kill_switch');
          
          // Stop all running strategies
          const state = get();
          const runningStrategies = Array.from(state.executions.entries())
            .filter(([_, exec]) => exec.status === 'running')
            .map(([id]) => id);
          
          await Promise.all(runningStrategies.map(id => get().stopStrategy(id)));
          
          set({ isKillSwitchActive: true });
        } catch (error) {
          console.error('Failed to activate kill switch:', error);
          throw error;
        }
      },
      
      deactivateKillSwitch: async () => {
        try {
          await invoke('auto_trading_deactivate_kill_switch');
          set({ isKillSwitchActive: false });
        } catch (error) {
          console.error('Failed to deactivate kill switch:', error);
          throw error;
        }
      },
      
      runBacktest: async (config) => {
        try {
          const result = await invoke<BacktestResult>('backtest_run', { config });
          
          set(state => ({
            backtestResults: [result, ...state.backtestResults],
          }));
          
          return result;
        } catch (error) {
          console.error('Failed to run backtest:', error);
          throw error;
        }
      },
      
      deleteBacktestResult: (id) => {
        set(state => ({
          backtestResults: state.backtestResults.filter(r => r.id !== id),
        }));
      },
      
      clearBacktestResults: () => {
        set({ backtestResults: [] });
      },
      
      startOptimization: async (config) => {
        try {
          const runId = await invoke<string>('optimizer_start', { config });
          
          const run: OptimizationRun = {
            id: runId,
            config,
            status: 'running',
            progress: 0,
            results: [],
            startedAt: Date.now(),
          };
          
          set(state => ({
            optimizationRuns: [run, ...state.optimizationRuns],
          }));
          
          return runId;
        } catch (error) {
          console.error('Failed to start optimization:', error);
          throw error;
        }
      },
      
      cancelOptimization: async (id) => {
        try {
          await invoke('optimizer_cancel', { id });
          
          set(state => ({
            optimizationRuns: state.optimizationRuns.map(r =>
              r.id === id ? { ...r, status: 'cancelled' as const } : r
            ),
          }));
        } catch (error) {
          console.error('Failed to cancel optimization:', error);
          throw error;
        }
      },
      
      updateOptimizationProgress: (run) => {
        set(state => ({
          optimizationRuns: state.optimizationRuns.map(r =>
            r.id === run.id ? run : r
          ),
        }));
      },
      
      deleteOptimizationRun: (id) => {
        set(state => ({
          optimizationRuns: state.optimizationRuns.filter(r => r.id !== id),
        }));
      },
      
      applyOptimizedParameters: async (strategyId, parameters) => {
        try {
          await invoke('auto_trading_apply_parameters', { strategyId, parameters });
          
          // Update strategy with new parameters
          set(state => ({
            strategies: state.strategies.map(s =>
              s.id === strategyId
                ? { ...s, signalSources: s.signalSources.map(source => ({
                    ...source,
                    config: { ...source.config, ...parameters }
                  })), updatedAt: Date.now() }
                : s
            ),
          }));
        } catch (error) {
          console.error('Failed to apply optimized parameters:', error);
          throw error;
        }
      },
    }),
    {
      name: 'auto-trading-storage',
      partialize: (state) => ({
        strategies: state.strategies,
        backtestResults: state.backtestResults,
        optimizationRuns: state.optimizationRuns.filter(r => r.status === 'completed'),
        isKillSwitchActive: state.isKillSwitchActive,
      }),
    }
  )
);
