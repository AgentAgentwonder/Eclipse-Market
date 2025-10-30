import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CommandCategory =
  | 'navigation'
  | 'trading'
  | 'analytics'
  | 'workspace'
  | 'data'
  | 'system'
  | 'tools';

export interface CommandDefinition {
  id: string;
  title: string;
  description?: string;
  category: CommandCategory;
  action: () => Promise<void> | void;
  shortcutId?: string;
  keywords?: string[];
}

export interface CommandUsage {
  commandId: string;
  lastUsed: number;
  count: number;
}

interface CommandState {
  commands: Record<string, CommandDefinition>;
  recentCommands: CommandUsage[];
  registerCommands: (commands: CommandDefinition[]) => void;
  unregisterCommands: (commandIds: string[]) => void;
  executeCommand: (commandId: string) => Promise<void>;
  getCommandsByCategory: (category: CommandCategory) => CommandDefinition[];
  getCommand: (commandId: string) => CommandDefinition | undefined;
  clearRecentCommands: () => void;
}

export const useCommandStore = create<CommandState>()(
  persist(
    (set, get) => ({
      commands: {},
      recentCommands: [],

      registerCommands: newCommands => {
        set(state => {
          const updated = { ...state.commands };
          newCommands.forEach(command => {
            updated[command.id] = command;
          });
          return { commands: updated };
        });
      },

      unregisterCommands: commandIds => {
        set(state => {
          const updated = { ...state.commands };
          commandIds.forEach(id => {
            delete updated[id];
          });

          return {
            commands: updated,
            recentCommands: state.recentCommands.filter(entry => !commandIds.includes(entry.commandId)),
          };
        });
      },

      executeCommand: async commandId => {
        const command = get().commands[commandId];
        if (!command) return;

        await command.action();

        set(state => {
          const existing = state.recentCommands.find(entry => entry.commandId === commandId);
          const now = Date.now();

          const updatedRecent = existing
            ? state.recentCommands
                .map(entry =>
                  entry.commandId === commandId
                    ? { commandId, lastUsed: now, count: entry.count + 1 }
                    : entry
                )
                .sort((a, b) => b.lastUsed - a.lastUsed)
            : [{ commandId, lastUsed: now, count: 1 }, ...state.recentCommands]
                .slice(0, 20);

          return { recentCommands: updatedRecent };
        });
      },

      getCommandsByCategory: category => {
        return Object.values(get().commands).filter(command => command.category === category);
      },

      getCommand: commandId => get().commands[commandId],

      clearRecentCommands: () => {
        set({ recentCommands: [] });
      },
    }),
    {
      name: 'command-registry',
      version: 1,
      partialize: state => ({
        recentCommands: state.recentCommands,
      }),
    }
  )
);
