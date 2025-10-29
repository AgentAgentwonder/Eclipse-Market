import { ExportSchedule, ScheduleCadence } from '../types/tradeReporting';

const MINUTE = 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export function computeNextRunDate(
  cadence: ScheduleCadence,
  fromDate: Date,
  customIntervalMinutes?: number
): Date {
  const next = new Date(fromDate.getTime());

  switch (cadence) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'custom':
      next.setTime(next.getTime() + (customIntervalMinutes ?? 60) * MINUTE);
      break;
    default:
      next.setDate(next.getDate() + 1);
  }

  return next;
}

export function isScheduleDue(schedule: ExportSchedule, now: Date = new Date()): boolean {
  if (!schedule.enabled) return false;
  if (!schedule.nextRun) return true;

  const nextRunDate = new Date(schedule.nextRun);
  return nextRunDate.getTime() <= now.getTime();
}

export function getDueSchedules(
  schedules: ExportSchedule[],
  now: Date = new Date()
): ExportSchedule[] {
  return schedules.filter(schedule => isScheduleDue(schedule, now));
}

export function advanceSchedule(
  schedule: ExportSchedule,
  runDate: Date = new Date()
): ExportSchedule {
  const nextRun = computeNextRunDate(schedule.cadence, runDate, schedule.customIntervalMinutes);

  return {
    ...schedule,
    lastRun: runDate.toISOString(),
    nextRun: nextRun.toISOString(),
  };
}

export function initializeSchedule(
  schedule: ExportSchedule,
  now: Date = new Date()
): ExportSchedule {
  if (schedule.nextRun) {
    return schedule;
  }

  return {
    ...schedule,
    nextRun: computeNextRunDate(
      schedule.cadence,
      now,
      schedule.customIntervalMinutes
    ).toISOString(),
  };
}
