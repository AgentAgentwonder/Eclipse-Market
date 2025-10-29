import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  ExportSchedule,
  ExportConfig,
  ExportPreset,
  ExportFormat,
  DEFAULT_EXPORT_COLUMNS,
} from '../types/tradeReporting';
import { getColumnsForPreset } from '../utils/tradeExport';
import { initializeSchedule } from '../utils/tradeScheduling';

interface TradeReportingState {
  schedules: ExportSchedule[];
  addSchedule: (schedule: Omit<ExportSchedule, 'id' | 'createdAt'>) => void;
  updateSchedule: (id: string, schedule: Partial<ExportSchedule>) => void;
  deleteSchedule: (id: string) => void;
  toggleSchedule: (id: string) => void;
  getSchedule: (id: string) => ExportSchedule | undefined;
  createDefaultExportConfig: (preset: ExportPreset, format: ExportFormat) => ExportConfig;
  recordScheduleRun: (id: string, runDate: Date, nextRun?: Date | null) => void;
}

export const useTradeReportingStore = create<TradeReportingState>()(
  persist(
    (set, get) => ({
      schedules: [],

      addSchedule: scheduleData => {
        const generateId = () =>
          `${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;

        let newSchedule: ExportSchedule = {
          ...scheduleData,
          id: generateId(),
          createdAt: new Date().toISOString(),
        };

        newSchedule = initializeSchedule(newSchedule);

        set(state => ({
          schedules: [...state.schedules, newSchedule],
        }));
      },

      updateSchedule: (id, updates) => {
        set(state => ({
          schedules: state.schedules.map(schedule =>
            schedule.id === id ? { ...schedule, ...updates } : schedule
          ),
        }));
      },

      deleteSchedule: id => {
        set(state => ({
          schedules: state.schedules.filter(schedule => schedule.id !== id),
        }));
      },

      toggleSchedule: id => {
        set(state => ({
          schedules: state.schedules.map(schedule =>
            schedule.id === id ? { ...schedule, enabled: !schedule.enabled } : schedule
          ),
        }));
      },

      getSchedule: id => {
        return get().schedules.find(schedule => schedule.id === id);
      },

      createDefaultExportConfig: (preset, format) => {
        return {
          format,
          preset,
          columns: getColumnsForPreset(preset),
          includeHeaders: true,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        };
      },

      recordScheduleRun: (id, runDate, nextRun) => {
        set(state => ({
          schedules: state.schedules.map(schedule =>
            schedule.id === id
              ? {
                  ...schedule,
                  lastRun: runDate.toISOString(),
                  nextRun: nextRun?.toISOString(),
                }
              : schedule
          ),
        }));
      },
    }),
    {
      name: 'trade-reporting-storage',
    }
  )
);
