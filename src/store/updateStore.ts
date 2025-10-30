import { create } from 'zustand';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import { checkUpdate, installUpdate, onUpdaterEvent } from '@tauri-apps/api/updater';
import { relaunch } from '@tauri-apps/api/process';

export type UpdateSchedule = 'daily' | 'weekly' | 'never';

export interface UpdateSettings {
  schedule: UpdateSchedule;
  autoDownload: boolean;
  autoInstall: boolean;
  lastCheck: string | null;
  dismissedVersion: string | null;
}

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date: string;
  body: string;
  downloadUrl: string;
}

export interface UpdateProgress {
  downloaded: number;
  total: number;
  percentage: number;
}

export interface RollbackInfo {
  available: boolean;
  previousVersion: string | null;
  backupTimestamp: string | null;
}

interface UpdateState {
  availableUpdate: UpdateInfo | null;
  settings: UpdateSettings | null;
  downloadProgress: UpdateProgress | null;
  rollbackInfo: RollbackInfo | null;
  isCheckingForUpdates: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  showUpdateModal: boolean;
  error: string | null;
  listenersRegistered: boolean;

  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  loadSettings: () => Promise<void>;
  saveSettings: (settings: UpdateSettings) => Promise<void>;
  dismissUpdate: (version: string) => Promise<void>;
  loadRollbackInfo: () => Promise<void>;
  rollbackUpdate: () => Promise<void>;
  setShowUpdateModal: (show: boolean) => void;
  setupEventListeners: () => void;
}

export const useUpdateStore = create<UpdateState>((set, get) => ({
  availableUpdate: null,
  settings: null,
  downloadProgress: null,
  rollbackInfo: null,
  isCheckingForUpdates: false,
  isDownloading: false,
  isInstalling: false,
  showUpdateModal: false,
  error: null,
  listenersRegistered: false,

  checkForUpdates: async () => {
    set({ isCheckingForUpdates: true, error: null });
    try {
      const { shouldUpdate, manifest } = await checkUpdate();
      if (shouldUpdate && manifest) {
        const settings = get().settings;
        const dismissedVersion = settings?.dismissedVersion;
        
        if (dismissedVersion && dismissedVersion === manifest.version) {
          set({ isCheckingForUpdates: false });
          return;
        }

        const updateInfo: UpdateInfo = {
          version: manifest.version,
          currentVersion: '1.0.0', // Will be updated from package.json
          date: manifest.date || '',
          body: manifest.body || '',
          downloadUrl: '',
        };
        
        set({ 
          availableUpdate: updateInfo, 
          showUpdateModal: true,
          isCheckingForUpdates: false 
        });

        // Update last check time
        const currentSettings = get().settings;
        if (currentSettings) {
          await get().saveSettings({
            ...currentSettings,
            lastCheck: new Date().toISOString(),
          });
        }
      } else {
        set({ isCheckingForUpdates: false });
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to check for updates',
        isCheckingForUpdates: false 
      });
    }
  },

  downloadAndInstall: async () => {
    set({ isDownloading: true, error: null });
    try {
      await installUpdate();
      set({ isDownloading: false, isInstalling: true });
      
      // Relaunch app after a short delay
      setTimeout(async () => {
        await relaunch();
      }, 1000);
    } catch (error) {
      console.error('Failed to download and install update:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to download and install update',
        isDownloading: false 
      });
    }
  },

  loadSettings: async () => {
    try {
      const settings = await invoke<UpdateSettings>('get_update_settings');
      set({ settings });
    } catch (error) {
      console.error('Failed to load update settings:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load update settings' });
    }
  },

  saveSettings: async (settings: UpdateSettings) => {
    try {
      await invoke('save_update_settings', { settings });
      set({ settings });
    } catch (error) {
      console.error('Failed to save update settings:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to save update settings' });
    }
  },

  dismissUpdate: async (version: string) => {
    try {
      await invoke('dismiss_update', { version });
      set({ availableUpdate: null, showUpdateModal: false });
    } catch (error) {
      console.error('Failed to dismiss update:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to dismiss update' });
    }
  },

  loadRollbackInfo: async () => {
    try {
      const rollbackInfo = await invoke<RollbackInfo>('get_rollback_info');
      set({ rollbackInfo });
    } catch (error) {
      console.error('Failed to load rollback info:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to load rollback info' });
    }
  },

  rollbackUpdate: async () => {
    try {
      await invoke('rollback_update');
      set({ isInstalling: true });
    } catch (error) {
      console.error('Failed to rollback update:', error);
      set({ error: error instanceof Error ? error.message : 'Failed to rollback update' });
    }
  },

  setShowUpdateModal: (show: boolean) => {
    set({ showUpdateModal: show });
  },

  setupEventListeners: () => {
    if (get().listenersRegistered) {
      return;
    }

    listen('rollback-started', () => {
      set({ isInstalling: true });
    });

    listen('rollback-completed', () => {
      set({ isInstalling: false });
    });

    onUpdaterEvent(status => {
      if (status.status === 'PENDING') {
        set({ isDownloading: true, downloadProgress: { downloaded: 0, total: 100, percentage: 5 } });
      } else if (status.status === 'DONE') {
        set({
          isDownloading: false,
          isInstalling: true,
          downloadProgress: { downloaded: 100, total: 100, percentage: 100 },
        });
      } else if (status.status === 'ERROR') {
        set({
          error: status.error || 'Update failed',
          isDownloading: false,
          isInstalling: false,
          downloadProgress: null,
        });
      } else if (status.status === 'UPTODATE') {
        set({ isDownloading: false, downloadProgress: null });
      }
    });

    set({ listenersRegistered: true });
  },
}));
