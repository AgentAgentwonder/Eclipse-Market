import { create } from 'zustand';

export interface WebSocketLog {
  id: string;
  timestamp: Date;
  provider: string;
  type: 'sent' | 'received' | 'error' | 'connected' | 'disconnected';
  message: any;
  size?: number;
}

export interface ApiLog {
  id: string;
  timestamp: Date;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  request?: any;
  response?: any;
  error?: string;
}

export interface DebugCommand {
  id: string;
  name: string;
  description: string;
  execute: () => Promise<any> | any;
  category: 'system' | 'network' | 'state' | 'performance' | 'cache';
}

export interface PerformanceProfile {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
}

interface PerformanceMark {
  name: string;
  timestamp: number;
}

interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  endTime: number;
}

interface DevConsoleState {
  isOpen: boolean;
  isEnabled: boolean;
  wsLogs: WebSocketLog[];
  apiLogs: ApiLog[];
  maxLogs: number;
  debugCommands: DebugCommand[];
  activeProfile: PerformanceProfile | null;
  profiles: PerformanceProfile[];
  selectedTab: 'state' | 'websocket' | 'api' | 'commands' | 'performance';

  open: () => void;
  close: () => void;
  toggle: () => void;
  setEnabled: (enabled: boolean) => void;
  addWsLog: (log: Omit<WebSocketLog, 'id' | 'timestamp'>) => void;
  addApiLog: (log: Omit<ApiLog, 'id' | 'timestamp'>) => void;
  clearWsLogs: () => void;
  clearApiLogs: () => void;
  clearAllLogs: () => void;
  registerCommand: (command: DebugCommand) => void;
  unregisterCommand: (id: string) => void;
  executeCommand: (id: string) => Promise<any>;
  startProfile: (name: string) => void;
  endProfile: () => void;
  addMark: (name: string) => void;
  addMeasure: (name: string, startMark: string, endMark: string) => void;
  setSelectedTab: (tab: DevConsoleState['selectedTab']) => void;
}

const generateId = () => `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useDevConsoleStore = create<DevConsoleState>((set, get) => ({
  isOpen: false,
  isEnabled: false,
  wsLogs: [],
  apiLogs: [],
  maxLogs: 1000,
  debugCommands: [],
  activeProfile: null,
  profiles: [],
  selectedTab: 'state',

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set(state => ({ isOpen: !state.isOpen })),

  setEnabled: enabled => set({ isEnabled: enabled }),

  addWsLog: log => {
    set(state => {
      const newLog: WebSocketLog = {
        ...log,
        id: generateId(),
        timestamp: new Date(),
      };
      const logs = [...state.wsLogs, newLog];
      if (logs.length > state.maxLogs) {
        logs.shift();
      }
      return { wsLogs: logs };
    });
  },

  addApiLog: log => {
    set(state => {
      const newLog: ApiLog = {
        ...log,
        id: generateId(),
        timestamp: new Date(),
      };
      const logs = [...state.apiLogs, newLog];
      if (logs.length > state.maxLogs) {
        logs.shift();
      }
      return { apiLogs: logs };
    });
  },

  clearWsLogs: () => set({ wsLogs: [] }),
  clearApiLogs: () => set({ apiLogs: [] }),
  clearAllLogs: () => set({ wsLogs: [], apiLogs: [] }),

  registerCommand: command => {
    set(state => ({
      debugCommands: [...state.debugCommands.filter(c => c.id !== command.id), command],
    }));
  },

  unregisterCommand: id => {
    set(state => ({
      debugCommands: state.debugCommands.filter(c => c.id !== id),
    }));
  },

  executeCommand: async id => {
    const command = get().debugCommands.find(c => c.id === id);
    if (!command) {
      throw new Error(`Command ${id} not found`);
    }
    return await command.execute();
  },

  startProfile: name => {
    const profile: PerformanceProfile = {
      id: generateId(),
      name,
      startTime: new Date(),
      marks: [],
      measures: [],
    };
    set({ activeProfile: profile });
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(`${name}-start`);
    }
  },

  endProfile: () => {
    const { activeProfile } = get();
    if (!activeProfile) return;

    const endTime = new Date();
    const duration = endTime.getTime() - activeProfile.startTime.getTime();

    if (typeof performance !== 'undefined' && performance.mark && performance.measure) {
      performance.mark(`${activeProfile.name}-end`);
      try {
        performance.measure(
          activeProfile.name,
          `${activeProfile.name}-start`,
          `${activeProfile.name}-end`
        );
      } catch (e) {
        console.warn('Failed to measure performance', e);
      }
    }

    const completedProfile: PerformanceProfile = {
      ...activeProfile,
      endTime,
      duration,
    };

    set(state => ({
      activeProfile: null,
      profiles: [...state.profiles, completedProfile].slice(-20),
    }));
  },

  addMark: name => {
    const { activeProfile } = get();
    if (!activeProfile) return;

    const mark: PerformanceMark = {
      name,
      timestamp: Date.now(),
    };

    set(state => ({
      activeProfile: state.activeProfile
        ? {
            ...state.activeProfile,
            marks: [...state.activeProfile.marks, mark],
          }
        : null,
    }));

    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  addMeasure: (name, startMark, endMark) => {
    const { activeProfile } = get();
    if (!activeProfile) return;

    const startMarkObj = activeProfile.marks.find(m => m.name === startMark);
    const endMarkObj = activeProfile.marks.find(m => m.name === endMark);

    if (!startMarkObj || !endMarkObj) return;

    const measure: PerformanceMeasure = {
      name,
      duration: endMarkObj.timestamp - startMarkObj.timestamp,
      startTime: startMarkObj.timestamp,
      endTime: endMarkObj.timestamp,
    };

    set(state => ({
      activeProfile: state.activeProfile
        ? {
            ...state.activeProfile,
            measures: [...state.activeProfile.measures, measure],
          }
        : null,
    }));

    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        performance.measure(name, startMark, endMark);
      } catch (e) {
        console.warn('Failed to add performance measure', e);
      }
    }
  },

  setSelectedTab: tab => set({ selectedTab: tab }),
}));
