import create from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import {
  DiagnosticsReport,
  DiagnosticIssue,
  AutoRepairResult,
  DiagnosticsSettings,
  RepairRecord,
  RepairPlan,
} from '@/types/diagnostics';

interface TroubleshooterState {
  report: DiagnosticsReport | null;
  loading: boolean;
  error: string | null;
  autoRepairResults: AutoRepairResult[];
  repairHistory: RepairRecord[];
  settings: DiagnosticsSettings;
  settingsLoaded: boolean;
  runScan: () => Promise<void>;
  loadReport: () => Promise<void>;
  autoRepair: (issues: DiagnosticIssue[]) => Promise<void>;
  fetchRepairHistory: () => Promise<void>;
  manualRepairPlan: (issueId: string) => Promise<RepairPlan | null>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: Partial<DiagnosticsSettings>) => Promise<void>;
  restoreDefaults: (component: string) => Promise<string>;
  downloadDependency: (dependency?: string) => Promise<void>;
  backupBeforeRepair: () => Promise<string>;
}

const defaultSettings: DiagnosticsSettings = {
  auto_scan_on_startup: true,
  scan_interval_minutes: 60,
  auto_repair_mode: 'ask',
  backup_before_repair: true,
  history_retention_days: 30,
  dry_run: false,
};

export const useTroubleshooterStore = create<TroubleshooterState>()(
  persist(
    (set, get) => ({
      report: null,
      loading: false,
      error: null,
      autoRepairResults: [],
      repairHistory: [],
      settings: defaultSettings,
      settingsLoaded: false,

      runScan: async () => {
        set({ loading: true, error: null });
        try {
          const report = await invoke<DiagnosticsReport>('run_diagnostics');
          set({ report, loading: false, error: null });
        } catch (error) {
          console.error('runScan error', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to run diagnostics',
          });
        }
      },

      loadReport: async () => {
        set({ loading: true, error: null });
        try {
          const report = await invoke<DiagnosticsReport>('get_health_report');
          set({ report, loading: false });
        } catch (error) {
          console.error('loadReport error', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to fetch report',
          });
        }
      },

      autoRepair: async (issues: DiagnosticIssue[]) => {
        set({ loading: true, error: null });
        try {
          const results = await invoke<AutoRepairResult[]>('auto_repair', { issues });
          set({ autoRepairResults: results });
          await get().loadReport();
          await get().fetchRepairHistory();
          set({ loading: false });
        } catch (error) {
          console.error('autoRepair error', error);
          set({
            loading: false,
            error: error instanceof Error ? error.message : 'Failed to auto-repair issues',
          });
        }
      },

      fetchRepairHistory: async () => {
        try {
          const history = await invoke<RepairRecord[]>('get_repair_history');
          set({ repairHistory: history });
        } catch (error) {
          console.error('fetchRepairHistory error', error);
        }
      },

      manualRepairPlan: async (issueId: string) => {
        try {
          const plan = await invoke<RepairPlan>('manual_repair', { issueId });
          return plan;
        } catch (error) {
          console.error('manualRepairPlan error', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to load repair plan',
          });
          return null;
        }
      },

      loadSettings: async () => {
        if (get().settingsLoaded) return;
        try {
          const settings = await invoke<DiagnosticsSettings>('get_diagnostics_settings');
          set({ settings, settingsLoaded: true });
        } catch (error) {
          console.error('loadSettings error', error);
          set({ settings: defaultSettings, settingsLoaded: true });
        }
      },

      saveSettings: async (changes: Partial<DiagnosticsSettings>) => {
        const nextSettings = { ...get().settings, ...changes };
        set({ settings: nextSettings });
        try {
          await invoke('save_diagnostics_settings', { settings: nextSettings });
        } catch (error) {
          console.error('saveSettings error', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to save settings',
          });
        }
      },

      restoreDefaults: async (component: string) => {
        try {
          const path = await invoke<string>('restore_defaults', { component });
          await get().loadReport();
          return path;
        } catch (error) {
          console.error('restoreDefaults error', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to restore defaults',
          });
          throw error;
        }
      },

      downloadDependency: async (dependency?: string) => {
        try {
          await invoke('download_missing', { dependency });
          await get().loadReport();
          await get().fetchRepairHistory();
        } catch (error) {
          console.error('downloadDependency error', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to download dependency',
          });
        }
      },

      backupBeforeRepair: async () => {
        try {
          const path = await invoke<string>('backup_before_repair');
          return path;
        } catch (error) {
          console.error('backupBeforeRepair error', error);
          set({
            error: error instanceof Error ? error.message : 'Failed to create backup',
          });
          throw error;
        }
      },
    }),
    {
      name: 'troubleshooter-settings',
      partialize: ({ settings, settingsLoaded }) => ({ settings, settingsLoaded }),
    }
  )
);
