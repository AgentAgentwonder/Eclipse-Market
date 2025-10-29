import { describe, it, expect } from 'vitest';
import {
  computeNextRunDate,
  isScheduleDue,
  getDueSchedules,
  advanceSchedule,
  initializeSchedule,
} from '../utils/tradeScheduling';
import { ExportSchedule, ScheduleCadence } from '../types/tradeReporting';
import { DEFAULT_EXPORT_COLUMNS } from '../types/tradeReporting';

const createMockSchedule = (overrides?: Partial<ExportSchedule>): ExportSchedule => ({
  id: 'schedule-1',
  name: 'Test Schedule',
  enabled: true,
  cadence: 'daily',
  exportConfig: {
    format: 'csv',
    preset: 'custom',
    columns: DEFAULT_EXPORT_COLUMNS,
    includeHeaders: true,
  },
  deliveryConfig: {
    method: 'email',
    email: 'test@example.com',
  },
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('computeNextRunDate', () => {
  it('should compute daily next run', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const next = computeNextRunDate('daily', now);
    expect(next.toISOString()).toBe('2024-01-02T12:00:00.000Z');
  });

  it('should compute weekly next run', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const next = computeNextRunDate('weekly', now);
    expect(next.toISOString()).toBe('2024-01-08T12:00:00.000Z');
  });

  it('should compute monthly next run', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    const next = computeNextRunDate('monthly', now);
    expect(next.toISOString()).toBe('2024-02-15T12:00:00.000Z');
  });

  it('should compute custom interval next run', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const next = computeNextRunDate('custom', now, 30);
    expect(next.toISOString()).toBe('2024-01-01T12:30:00.000Z');
  });

  it('should default to 60 minutes for custom without interval', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const next = computeNextRunDate('custom', now);
    expect(next.toISOString()).toBe('2024-01-01T13:00:00.000Z');
  });
});

describe('isScheduleDue', () => {
  it('should return false for disabled schedules', () => {
    const schedule = createMockSchedule({ enabled: false, nextRun: new Date().toISOString() });
    expect(isScheduleDue(schedule)).toBe(false);
  });

  it('should return true if nextRun is not set', () => {
    const schedule = createMockSchedule({ nextRun: undefined });
    expect(isScheduleDue(schedule)).toBe(true);
  });

  it('should return true if nextRun is in the past', () => {
    const past = new Date(Date.now() - 60000).toISOString();
    const schedule = createMockSchedule({ nextRun: past });
    expect(isScheduleDue(schedule)).toBe(true);
  });

  it('should return false if nextRun is in the future', () => {
    const future = new Date(Date.now() + 60000).toISOString();
    const schedule = createMockSchedule({ nextRun: future });
    expect(isScheduleDue(schedule)).toBe(false);
  });

  it('should return true if nextRun is exactly now', () => {
    const now = new Date();
    const schedule = createMockSchedule({ nextRun: now.toISOString() });
    expect(isScheduleDue(schedule, now)).toBe(true);
  });
});

describe('getDueSchedules', () => {
  it('should filter due schedules', () => {
    const now = new Date();
    const past = new Date(now.getTime() - 60000).toISOString();
    const future = new Date(now.getTime() + 60000).toISOString();

    const schedules = [
      createMockSchedule({ id: 'schedule-1', nextRun: past }),
      createMockSchedule({ id: 'schedule-2', nextRun: future }),
      createMockSchedule({ id: 'schedule-3', nextRun: past }),
      createMockSchedule({ id: 'schedule-4', enabled: false, nextRun: past }),
    ];

    const due = getDueSchedules(schedules, now);
    expect(due).toHaveLength(2);
    expect(due.map(s => s.id)).toEqual(['schedule-1', 'schedule-3']);
  });

  it('should return empty array if no schedules are due', () => {
    const now = new Date();
    const future = new Date(now.getTime() + 60000).toISOString();

    const schedules = [
      createMockSchedule({ id: 'schedule-1', nextRun: future }),
      createMockSchedule({ id: 'schedule-2', nextRun: future }),
    ];

    const due = getDueSchedules(schedules, now);
    expect(due).toHaveLength(0);
  });
});

describe('advanceSchedule', () => {
  it('should advance schedule with new lastRun and nextRun', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const schedule = createMockSchedule({ cadence: 'daily' });

    const advanced = advanceSchedule(schedule, now);

    expect(advanced.lastRun).toBe('2024-01-01T12:00:00.000Z');
    expect(advanced.nextRun).toBe('2024-01-02T12:00:00.000Z');
  });

  it('should advance weekly schedule correctly', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const schedule = createMockSchedule({ cadence: 'weekly' });

    const advanced = advanceSchedule(schedule, now);
    expect(advanced.nextRun).toBe('2024-01-08T12:00:00.000Z');
  });

  it('should advance custom schedule with interval', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const schedule = createMockSchedule({ cadence: 'custom', customIntervalMinutes: 30 });

    const advanced = advanceSchedule(schedule, now);
    expect(advanced.nextRun).toBe('2024-01-01T12:30:00.000Z');
  });
});

describe('initializeSchedule', () => {
  it('should initialize schedule without nextRun', () => {
    const now = new Date('2024-01-01T12:00:00Z');
    const schedule = createMockSchedule({ cadence: 'daily', nextRun: undefined });

    const initialized = initializeSchedule(schedule, now);
    expect(initialized.nextRun).toBe('2024-01-02T12:00:00.000Z');
  });

  it('should not change schedule with existing nextRun', () => {
    const existingNextRun = '2024-01-15T12:00:00.000Z';
    const schedule = createMockSchedule({ nextRun: existingNextRun });

    const initialized = initializeSchedule(schedule);
    expect(initialized.nextRun).toBe(existingNextRun);
  });
});
