import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface KeyboardShortcut {
  id: string;
  name: string;
  description: string;
  keys: string; // e.g., "Ctrl+B", "Cmd+K", "Shift+Alt+T"
  category: 'trading' | 'navigation' | 'general' | 'windows' | 'tools';
  action: string; // Action identifier to be triggered
  enabled: boolean;
  customizable: boolean;
}

export interface ShortcutConflict {
  keys: string;
  shortcuts: KeyboardShortcut[];
}

interface ShortcutState {
  shortcuts: KeyboardShortcut[];
  setShortcut: (id: string, keys: string) => void;
  resetShortcut: (id: string) => void;
  resetAllShortcuts: () => void;
  toggleShortcut: (id: string, enabled: boolean) => void;
  getConflicts: () => ShortcutConflict[];
  exportShortcuts: () => string;
  importShortcuts: (json: string) => void;
  getShortcutByAction: (action: string) => KeyboardShortcut | undefined;
  getShortcutsByCategory: (category: string) => KeyboardShortcut[];
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform);
const modKey = isMac ? 'Cmd' : 'Ctrl';

export const DEFAULT_SHORTCUTS: KeyboardShortcut[] = [
  // Trading
  {
    id: 'quick-buy',
    name: 'Quick Buy',
    description: 'Open quick buy modal',
    keys: `${modKey}+B`,
    category: 'trading',
    action: 'trading:quick-buy',
    enabled: true,
    customizable: true,
  },
  {
    id: 'quick-sell',
    name: 'Quick Sell',
    description: 'Open quick sell modal',
    keys: `${modKey}+S`,
    category: 'trading',
    action: 'trading:quick-sell',
    enabled: true,
    customizable: true,
  },
  {
    id: 'swap',
    name: 'Open Swap',
    description: 'Open swap interface',
    keys: `${modKey}+Shift+S`,
    category: 'trading',
    action: 'trading:swap',
    enabled: true,
    customizable: true,
  },
  {
    id: 'limit-order',
    name: 'Limit Order',
    description: 'Open limit order form',
    keys: `${modKey}+L`,
    category: 'trading',
    action: 'trading:limit-order',
    enabled: true,
    customizable: true,
  },
  {
    id: 'cancel-orders',
    name: 'Cancel All Orders',
    description: 'Cancel all open orders',
    keys: `${modKey}+Shift+X`,
    category: 'trading',
    action: 'trading:cancel-all',
    enabled: true,
    customizable: true,
  },

  // Navigation
  {
    id: 'nav-dashboard',
    name: 'Dashboard',
    description: 'Navigate to Dashboard',
    keys: `${modKey}+1`,
    category: 'navigation',
    action: 'nav:dashboard',
    enabled: true,
    customizable: true,
  },
  {
    id: 'nav-coins',
    name: 'Coins',
    description: 'Navigate to Coins page',
    keys: `${modKey}+2`,
    category: 'navigation',
    action: 'nav:coins',
    enabled: true,
    customizable: true,
  },
  {
    id: 'nav-portfolio',
    name: 'Portfolio',
    description: 'Navigate to Portfolio',
    keys: `${modKey}+3`,
    category: 'navigation',
    action: 'nav:portfolio',
    enabled: true,
    customizable: true,
  },
  {
    id: 'nav-trading',
    name: 'Trading',
    description: 'Navigate to Trading page',
    keys: `${modKey}+4`,
    category: 'navigation',
    action: 'nav:trading',
    enabled: true,
    customizable: true,
  },
  {
    id: 'nav-settings',
    name: 'Settings',
    description: 'Open Settings',
    keys: `${modKey}+,`,
    category: 'navigation',
    action: 'nav:settings',
    enabled: true,
    customizable: true,
  },

  // General
  {
    id: 'command-palette',
    name: 'Command Palette',
    description: 'Open command palette',
    keys: `${modKey}+K`,
    category: 'general',
    action: 'general:command-palette',
    enabled: true,
    customizable: false,
  },
  {
    id: 'search',
    name: 'Search',
    description: 'Focus search bar',
    keys: `${modKey}+/`,
    category: 'general',
    action: 'general:search',
    enabled: true,
    customizable: true,
  },
  {
    id: 'refresh',
    name: 'Refresh',
    description: 'Refresh current view',
    keys: `${modKey}+R`,
    category: 'general',
    action: 'general:refresh',
    enabled: true,
    customizable: true,
  },
  {
    id: 'help',
    name: 'Show Help',
    description: 'Show keyboard shortcuts',
    keys: '?',
    category: 'general',
    action: 'general:help',
    enabled: true,
    customizable: false,
  },
  {
    id: 'escape',
    name: 'Escape',
    description: 'Close modal or cancel action',
    keys: 'Escape',
    category: 'general',
    action: 'general:escape',
    enabled: true,
    customizable: false,
  },

  // Windows
  {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    description: 'Show/hide sidebar',
    keys: `${modKey}+\\`,
    category: 'windows',
    action: 'window:toggle-sidebar',
    enabled: true,
    customizable: true,
  },
  {
    id: 'next-workspace',
    name: 'Next Workspace',
    description: 'Switch to next workspace',
    keys: `${modKey}+]`,
    category: 'windows',
    action: 'window:next-workspace',
    enabled: true,
    customizable: true,
  },
  {
    id: 'prev-workspace',
    name: 'Previous Workspace',
    description: 'Switch to previous workspace',
    keys: `${modKey}+[`,
    category: 'windows',
    action: 'window:prev-workspace',
    enabled: true,
    customizable: true,
  },
  {
    id: 'toggle-fullscreen',
    name: 'Toggle Fullscreen',
    description: 'Toggle fullscreen mode',
    keys: 'F11',
    category: 'windows',
    action: 'window:fullscreen',
    enabled: true,
    customizable: true,
  },

  // Tools
  {
    id: 'calculator',
    name: 'Calculator',
    description: 'Open calculator in command palette',
    keys: `${modKey}+Shift+C`,
    category: 'tools',
    action: 'tools:calculator',
    enabled: true,
    customizable: true,
  },
  {
    id: 'export-data',
    name: 'Export Data',
    description: 'Export current data',
    keys: `${modKey}+E`,
    category: 'tools',
    action: 'tools:export',
    enabled: true,
    customizable: true,
  },
];

export const useShortcutStore = create<ShortcutState>()(
  persist(
    (set, get) => ({
      shortcuts: DEFAULT_SHORTCUTS,

      setShortcut: (id, keys) => {
        set(state => ({
          shortcuts: state.shortcuts.map(s => (s.id === id && s.customizable ? { ...s, keys } : s)),
        }));
      },

      resetShortcut: id => {
        const defaultShortcut = DEFAULT_SHORTCUTS.find(s => s.id === id);
        if (!defaultShortcut) return;

        set(state => ({
          shortcuts: state.shortcuts.map(s => (s.id === id ? { ...s, keys: defaultShortcut.keys } : s)),
        }));
      },

      resetAllShortcuts: () => {
        set({ shortcuts: DEFAULT_SHORTCUTS });
      },

      toggleShortcut: (id, enabled) => {
        set(state => ({
          shortcuts: state.shortcuts.map(s => (s.id === id ? { ...s, enabled } : s)),
        }));
      },

      getConflicts: () => {
        const shortcuts = get().shortcuts.filter(s => s.enabled);
        const keyMap = new Map<string, KeyboardShortcut[]>();

        shortcuts.forEach(shortcut => {
          const existing = keyMap.get(shortcut.keys) || [];
          keyMap.set(shortcut.keys, [...existing, shortcut]);
        });

        return Array.from(keyMap.entries())
          .filter(([, shortcuts]) => shortcuts.length > 1)
          .map(([keys, shortcuts]) => ({ keys, shortcuts }));
      },

      exportShortcuts: () => {
        return JSON.stringify(get().shortcuts, null, 2);
      },

      importShortcuts: json => {
        try {
          const imported = JSON.parse(json) as KeyboardShortcut[];
          const validShortcuts = imported.filter(
            s =>
              s.id &&
              s.name &&
              s.keys &&
              s.action &&
              s.category &&
              typeof s.enabled === 'boolean' &&
              typeof s.customizable === 'boolean'
          );

          if (validShortcuts.length === 0) {
            throw new Error('No valid shortcuts found in import data');
          }

          set({ shortcuts: validShortcuts });
        } catch (error) {
          console.error('Failed to import shortcuts:', error);
          throw error;
        }
      },

      getShortcutByAction: action => {
        return get().shortcuts.find(s => s.action === action && s.enabled);
      },

      getShortcutsByCategory: category => {
        return get().shortcuts.filter(s => s.category === category && s.enabled);
      },
    }),
    {
      name: 'keyboard-shortcuts',
      version: 1,
    }
  )
);
