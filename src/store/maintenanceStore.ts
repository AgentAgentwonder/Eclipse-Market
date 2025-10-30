import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MaintenanceSchedule {
  id: string;
  startTime: Date;
  endTime: Date;
  message: string;
  disableTrading: boolean;
  recurring?: 'daily' | 'weekly' | 'monthly';
}

export interface MaintenanceNotification {
  id: string;
  message: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'critical';
}

interface MaintenanceState {
  isMaintenanceMode: boolean;
  currentMaintenance: MaintenanceSchedule | null;
  schedules: MaintenanceSchedule[];
  notifications: MaintenanceNotification[];
  readOnlyMode: boolean;
  countdownStarted: boolean;

  setMaintenanceMode: (enabled: boolean, message?: string) => void;
  addSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => void;
  removeSchedule: (id: string) => void;
  updateSchedule: (id: string, schedule: Partial<MaintenanceSchedule>) => void;
  addNotification: (notification: Omit<MaintenanceNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  setReadOnlyMode: (enabled: boolean) => void;
  startCountdown: () => void;
  checkSchedules: () => void;
  endMaintenance: () => void;
}

const generateId = () => `maint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

export const useMaintenanceStore = create<MaintenanceState>()(
  persist(
    (set, get) => ({
      isMaintenanceMode: false,
      currentMaintenance: null,
      schedules: [],
      notifications: [],
      readOnlyMode: false,
      countdownStarted: false,

      setMaintenanceMode: (enabled, message) => {
        set({ isMaintenanceMode: enabled });
        if (enabled && message) {
          get().addNotification({
            message,
            type: 'warning',
          });
        } else if (!enabled) {
          set({ currentMaintenance: null, countdownStarted: false });
          get().addNotification({
            message: 'Maintenance completed. Normal operations resumed.',
            type: 'info',
          });
        }
      },

      addSchedule: schedule => {
        const newSchedule: MaintenanceSchedule = {
          ...schedule,
          id: generateId(),
          startTime: new Date(schedule.startTime),
          endTime: new Date(schedule.endTime),
        };
        set(state => ({ schedules: [...state.schedules, newSchedule] }));
      },

      removeSchedule: id => {
        set(state => ({ schedules: state.schedules.filter(s => s.id !== id) }));
      },

      updateSchedule: (id, updates) => {
        set(state => ({
          schedules: state.schedules.map(s =>
            s.id === id ? { ...s, ...updates } : s
          ),
        }));
      },

      addNotification: notification => {
        const newNotification: MaintenanceNotification = {
          ...notification,
          id: generateId(),
          timestamp: new Date(),
        };
        set(state => ({ notifications: [...state.notifications, newNotification] }));
      },

      dismissNotification: id => {
        set(state => ({ notifications: state.notifications.filter(n => n.id !== id) }));
      },

      setReadOnlyMode: enabled => {
        set({ readOnlyMode: enabled });
      },

      startCountdown: () => {
        set({ countdownStarted: true });
      },

      checkSchedules: () => {
        const now = new Date();
        const { schedules, isMaintenanceMode, currentMaintenance } = get();

        // Check if any scheduled maintenance should start
        const activeSchedule = schedules.find(schedule => {
          const start = new Date(schedule.startTime);
          const end = new Date(schedule.endTime);
          return now >= start && now <= end;
        });

        if (activeSchedule && !isMaintenanceMode) {
          set({
            isMaintenanceMode: true,
            currentMaintenance: activeSchedule,
            readOnlyMode: activeSchedule.disableTrading,
          });
          get().addNotification({
            message: activeSchedule.message || 'Scheduled maintenance in progress',
            type: 'warning',
          });
        }

        // Check if maintenance should end
        if (currentMaintenance && now > new Date(currentMaintenance.endTime)) {
          get().endMaintenance();
        }

        // Check for upcoming maintenance (5 minutes warning)
        const upcomingSchedule = schedules.find(schedule => {
          const start = new Date(schedule.startTime);
          const minutesUntilStart = (start.getTime() - now.getTime()) / 60000;
          return minutesUntilStart > 0 && minutesUntilStart <= 5;
        });

        if (upcomingSchedule && !get().countdownStarted) {
          get().startCountdown();
          get().addNotification({
            message: `Maintenance scheduled to start in ${Math.ceil((new Date(upcomingSchedule.startTime).getTime() - now.getTime()) / 60000)} minutes`,
            type: 'info',
          });
        }
      },

      endMaintenance: () => {
        set({
          isMaintenanceMode: false,
          currentMaintenance: null,
          readOnlyMode: false,
          countdownStarted: false,
        });
        get().addNotification({
          message: 'Maintenance completed successfully',
          type: 'info',
        });
      },
    }),
    {
      name: 'maintenance-store',
      version: 1,
      partialize: state => ({
        schedules: state.schedules,
      }),
    }
  )
);
