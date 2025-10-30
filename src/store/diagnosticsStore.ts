import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SessionRecording {
  id: string;
  timestamp: number;
  duration: number;
  events: any[];
  consoleLogs: ConsoleLog[];
  errors: ErrorLog[];
  userAgent: string;
  url: string;
}

export interface ConsoleLog {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  args: any[];
}

export interface ErrorLog {
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
}

export interface CrashReport {
  id: string;
  timestamp: number;
  message: string;
  stack?: string;
  componentStack?: string;
  userAgent: string;
  url: string;
  environment: {
    platform: string;
    language: string;
    screenResolution: string;
    viewport: string;
  };
  userComment?: string;
  sessionId?: string;
}

interface DiagnosticsState {
  // Session Recording Settings
  sessionRecordingEnabled: boolean;
  sessionRecordingConsented: boolean;
  privacyMaskingEnabled: boolean;
  maxRecordingDuration: number; // in minutes
  
  // Current Recording State
  isRecording: boolean;
  currentRecordingId: string | null;
  currentRecordingStart: number | null;
  recordingEvents: any[];
  consoleLogs: ConsoleLog[];
  errorLogs: ErrorLog[];
  
  // Stored Recordings
  recordings: SessionRecording[];
  
  // Crash Reporting Settings
  crashReportingEnabled: boolean;
  crashReportingConsented: boolean;
  autoRestartEnabled: boolean;
  includeEnvironmentInfo: boolean;
  
  // Crash Reports
  crashes: CrashReport[];
  
  // Analytics
  totalCrashes: number;
  lastCrashTimestamp: number | null;
  
  // Actions
  setSessionRecordingEnabled: (enabled: boolean) => void;
  setSessionRecordingConsent: (consented: boolean) => void;
  setPrivacyMaskingEnabled: (enabled: boolean) => void;
  startRecording: () => void;
  stopRecording: () => void;
  addRecordingEvent: (event: any) => void;
  addConsoleLog: (log: ConsoleLog) => void;
  addErrorLog: (error: ErrorLog) => void;
  saveCurrentRecording: () => void;
  getRecording: (id: string) => SessionRecording | undefined;
  deleteRecording: (id: string) => void;
  clearOldRecordings: () => void;
  exportRecording: (id: string) => void;
  
  setCrashReportingEnabled: (enabled: boolean) => void;
  setCrashReportingConsent: (consented: boolean) => void;
  setAutoRestartEnabled: (enabled: boolean) => void;
  addCrashReport: (report: Omit<CrashReport, 'id' | 'timestamp'>) => CrashReport | null;
  updateCrashReport: (id: string, updates: Partial<CrashReport>) => void;
  getCrashReport: (id: string) => CrashReport | undefined;
  deleteCrashReport: (id: string) => void;
  clearCrashReports: () => void;
  getCrashFrequency: (hours: number) => number;
}

export const useDiagnosticsStore = create<DiagnosticsState>()(
  persist(
    (set, get) => ({
      // Initial State
      sessionRecordingEnabled: false,
      sessionRecordingConsented: false,
      privacyMaskingEnabled: true,
      maxRecordingDuration: 30,
      
      isRecording: false,
      currentRecordingId: null,
      currentRecordingStart: null,
      recordingEvents: [],
      consoleLogs: [],
      errorLogs: [],
      
      recordings: [],
      
      crashReportingEnabled: false,
      crashReportingConsented: false,
      autoRestartEnabled: true,
      includeEnvironmentInfo: true,
      
      crashes: [],
      totalCrashes: 0,
      lastCrashTimestamp: null,
      
      // Session Recording Actions
      setSessionRecordingEnabled: (enabled: boolean) => {
        const consented = get().sessionRecordingConsented;
        if (enabled && !consented) {
          set({ sessionRecordingEnabled: false });
          return;
        }

        set({ sessionRecordingEnabled: enabled });
        if (enabled && consented) {
          get().startRecording();
        } else {
          get().stopRecording();
        }
      },
      
      setSessionRecordingConsent: (consented: boolean) => {
        set({ sessionRecordingConsented: consented });
        if (!consented) {
          get().stopRecording();
          set({ sessionRecordingEnabled: false });
        }
      },
      
      setPrivacyMaskingEnabled: (enabled: boolean) => {
        set({ privacyMaskingEnabled: enabled });
      },
      
      startRecording: () => {
        const recordingId = `rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set({
          isRecording: true,
          currentRecordingId: recordingId,
          currentRecordingStart: Date.now(),
          recordingEvents: [],
          consoleLogs: [],
          errorLogs: [],
        });
      },
      
      stopRecording: () => {
        if (get().isRecording) {
          get().saveCurrentRecording();
        }
        set({
          isRecording: false,
          currentRecordingId: null,
          currentRecordingStart: null,
        });
      },
      
      addRecordingEvent: (event: any) => {
        const state = get();
        if (!state.isRecording) return;
        
        const events = [...state.recordingEvents, event];
        set({ recordingEvents: events });
        
        // Check if recording duration exceeded
        const duration = Date.now() - (state.currentRecordingStart || 0);
        if (duration > state.maxRecordingDuration * 60 * 1000) {
          get().saveCurrentRecording();
          get().startRecording();
        }
      },
      
      addConsoleLog: (log: ConsoleLog) => {
        const state = get();
        if (!state.isRecording) return;
        set({ consoleLogs: [...state.consoleLogs, log] });
      },
      
      addErrorLog: (error: ErrorLog) => {
        const state = get();
        if (!state.isRecording) return;
        set({ errorLogs: [...state.errorLogs, error] });
      },
      
      saveCurrentRecording: () => {
        const state = get();
        if (!state.currentRecordingId || !state.currentRecordingStart) return;
        
        const recording: SessionRecording = {
          id: state.currentRecordingId,
          timestamp: state.currentRecordingStart,
          duration: Date.now() - state.currentRecordingStart,
          events: state.recordingEvents,
          consoleLogs: state.consoleLogs,
          errors: state.errorLogs,
          userAgent: navigator.userAgent,
          url: window.location.href,
        };
        
        set({
          recordings: [...state.recordings, recording],
          recordingEvents: [],
          consoleLogs: [],
          errorLogs: [],
        });
        
        // Cleanup old recordings
        get().clearOldRecordings();
      },
      
      getRecording: (id: string) => {
        return get().recordings.find(r => r.id === id);
      },
      
      deleteRecording: (id: string) => {
        set({ recordings: get().recordings.filter(r => r.id !== id) });
      },
      
      clearOldRecordings: () => {
        const cutoffTime = Date.now() - 30 * 60 * 1000; // 30 minutes
        set({ recordings: get().recordings.filter(r => r.timestamp > cutoffTime) });
      },
      
      exportRecording: (id: string) => {
        const recording = get().getRecording(id);
        if (!recording) return;
        
        const dataStr = JSON.stringify(recording, null, 2);
        const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
        
        const exportFileDefaultName = `session-recording-${id}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
      },
      
      // Crash Reporting Actions
      setCrashReportingEnabled: (enabled: boolean) => {
        if (enabled && !get().crashReportingConsented) {
          return;
        }
        set({ crashReportingEnabled: enabled });
      },
      
      setCrashReportingConsent: (consented: boolean) => {
        set({ crashReportingConsented: consented });
        if (!consented) {
          set({ crashReportingEnabled: false });
        }
      },
      
      setAutoRestartEnabled: (enabled: boolean) => {
        set({ autoRestartEnabled: enabled });
      },
      
      addCrashReport: (report: Omit<CrashReport, 'id' | 'timestamp'>) => {
        const crashId = `crash-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const crash: CrashReport = {
          ...report,
          id: crashId,
          timestamp: Date.now(),
        };
        
        set({
          crashes: [...get().crashes, crash],
          totalCrashes: get().totalCrashes + 1,
          lastCrashTimestamp: Date.now(),
        });
        
        // Keep only last 50 crash reports
        const crashes = get().crashes;
        if (crashes.length > 50) {
          set({ crashes: crashes.slice(-50) });
        }
        
        return crash;
      },
      
      updateCrashReport: (id: string, updates: Partial<CrashReport>) => {
        set({
          crashes: get().crashes.map(c => c.id === id ? { ...c, ...updates } : c)
        });
      },
      
      getCrashReport: (id: string) => {
        return get().crashes.find(c => c.id === id);
      },
      
      deleteCrashReport: (id: string) => {
        set({ crashes: get().crashes.filter(c => c.id !== id) });
      },
      
      clearCrashReports: () => {
        set({ crashes: [] });
      },
      
      getCrashFrequency: (hours: number) => {
        const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
        return get().crashes.filter(c => c.timestamp > cutoffTime).length;
      },
    }),
    {
      name: 'diagnostics-storage',
      partialize: (state) => ({
        sessionRecordingEnabled: state.sessionRecordingEnabled,
        sessionRecordingConsented: state.sessionRecordingConsented,
        privacyMaskingEnabled: state.privacyMaskingEnabled,
        maxRecordingDuration: state.maxRecordingDuration,
        recordings: state.recordings,
        crashReportingEnabled: state.crashReportingEnabled,
        crashReportingConsented: state.crashReportingConsented,
        autoRestartEnabled: state.autoRestartEnabled,
        includeEnvironmentInfo: state.includeEnvironmentInfo,
        crashes: state.crashes,
        totalCrashes: state.totalCrashes,
        lastCrashTimestamp: state.lastCrashTimestamp,
      }),
    }
  )
);
