import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { usePerformanceStore } from '../store/performanceStore';
import { useMaintenanceStore } from '../store/maintenanceStore';
import { useDevConsoleStore } from '../store/devConsoleStore';

describe('Performance Monitoring', () => {
  beforeEach(() => {
    usePerformanceStore.getState().updateMetrics({
      fps: 60,
      frameTime: 16.67,
      cpuLoad: 50,
      gpuLoad: 40,
      memoryUsed: 500000000,
      memoryTotal: 8000000000,
      networkDownlink: 10,
      networkType: '4g',
      drawCalls: 100,
      triangles: 1000,
      timestamp: Date.now(),
    });
  });

  afterEach(() => {
    usePerformanceStore.setState({
      metrics: {
        fps: 0,
        frameTime: 0,
        cpuLoad: 0,
        gpuLoad: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        networkDownlink: 0,
        networkType: 'unknown',
        drawCalls: 0,
        triangles: 0,
        timestamp: Date.now(),
      },
      alerts: [],
      history: [],
    });
  });

  it('should track performance metrics', () => {
    const { metrics } = usePerformanceStore.getState();
    expect(metrics.fps).toBe(60);
    expect(metrics.cpuLoad).toBe(50);
    expect(metrics.memoryUsed).toBeGreaterThan(0);
  });

  it('should generate alerts when thresholds exceeded', () => {
    const store = usePerformanceStore.getState();
    
    // Trigger high CPU alert
    store.updateMetrics({
      cpuLoad: 95,
    });

    const { alerts } = usePerformanceStore.getState();
    const cpuAlerts = alerts.filter(a => a.metric === 'cpuLoad');
    expect(cpuAlerts.length).toBeGreaterThan(0);
    if (cpuAlerts.length > 0) {
      expect(cpuAlerts[0].level).toBe('warning');
    }
  });

  it('should track performance history', () => {
    const store = usePerformanceStore.getState();
    
    store.updateMetrics({ fps: 55 });
    store.updateMetrics({ fps: 58 });
    store.updateMetrics({ fps: 60 });

    const { history } = usePerformanceStore.getState();
    expect(history.length).toBeGreaterThan(0);
  });

  it('should limit history size', () => {
    const store = usePerformanceStore.getState();
    const { historyLimit } = store;

    // Add more entries than the limit
    for (let i = 0; i < historyLimit + 50; i++) {
      store.updateMetrics({ fps: 60 });
    }

    const { history } = usePerformanceStore.getState();
    expect(history.length).toBeLessThanOrEqual(historyLimit);
  });

  it('should clear specific alerts', () => {
    const store = usePerformanceStore.getState();
    
    store.updateMetrics({ cpuLoad: 95 });
    const { alerts } = usePerformanceStore.getState();
    const alertId = alerts[0]?.id;

    if (alertId) {
      store.clearAlert(alertId);
      const newAlerts = usePerformanceStore.getState().alerts;
      expect(newAlerts.find(a => a.id === alertId)).toBeUndefined();
    }
  });

  it('should enable/disable GPU acceleration', () => {
    const store = usePerformanceStore.getState();
    
    store.setGpuEnabled(true);
    expect(usePerformanceStore.getState().gpuEnabled).toBe(true);

    store.setGpuEnabled(false);
    expect(usePerformanceStore.getState().gpuEnabled).toBe(false);
  });

  it('should handle low memory mode', () => {
    const store = usePerformanceStore.getState();
    
    store.setLowMemoryMode(true);
    expect(usePerformanceStore.getState().lowMemoryMode).toBe(true);

    store.setLowMemoryMode(false);
    expect(usePerformanceStore.getState().lowMemoryMode).toBe(false);
  });
});

describe('Maintenance Mode', () => {
  beforeEach(() => {
    useMaintenanceStore.setState({
      isMaintenanceMode: false,
      currentMaintenance: null,
      schedules: [],
      notifications: [],
      readOnlyMode: false,
      countdownStarted: false,
    });
  });

  it('should enable maintenance mode', () => {
    const store = useMaintenanceStore.getState();
    store.setMaintenanceMode(true, 'System maintenance in progress');

    const { isMaintenanceMode, notifications } = useMaintenanceStore.getState();
    expect(isMaintenanceMode).toBe(true);
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('should disable maintenance mode', () => {
    const store = useMaintenanceStore.getState();
    store.setMaintenanceMode(true, 'Maintenance');
    store.setMaintenanceMode(false);

    const { isMaintenanceMode, currentMaintenance } = useMaintenanceStore.getState();
    expect(isMaintenanceMode).toBe(false);
    expect(currentMaintenance).toBeNull();
  });

  it('should add maintenance schedule', () => {
    const store = useMaintenanceStore.getState();
    const startTime = new Date(Date.now() + 3600000); // 1 hour from now
    const endTime = new Date(Date.now() + 7200000); // 2 hours from now

    store.addSchedule({
      startTime,
      endTime,
      message: 'Scheduled maintenance',
      disableTrading: true,
    });

    const { schedules } = useMaintenanceStore.getState();
    expect(schedules.length).toBe(1);
    expect(schedules[0].message).toBe('Scheduled maintenance');
  });

  it('should remove maintenance schedule', () => {
    const store = useMaintenanceStore.getState();
    store.addSchedule({
      startTime: new Date(),
      endTime: new Date(),
      message: 'Test',
      disableTrading: false,
    });

    const { schedules } = useMaintenanceStore.getState();
    const scheduleId = schedules[0].id;

    store.removeSchedule(scheduleId);
    const newSchedules = useMaintenanceStore.getState().schedules;
    expect(newSchedules.length).toBe(0);
  });

  it('should disable trading during maintenance', () => {
    const store = useMaintenanceStore.getState();
    store.setMaintenanceMode(true);
    store.setReadOnlyMode(true);

    const { readOnlyMode } = useMaintenanceStore.getState();
    expect(readOnlyMode).toBe(true);
  });

  it('should check and activate scheduled maintenance', () => {
    const store = useMaintenanceStore.getState();
    const now = Date.now();
    
    // Schedule maintenance that should be active now
    store.addSchedule({
      startTime: new Date(now - 1000), // started 1 second ago
      endTime: new Date(now + 3600000), // ends in 1 hour
      message: 'Active maintenance',
      disableTrading: true,
    });

    store.checkSchedules();

    const { isMaintenanceMode, currentMaintenance } = useMaintenanceStore.getState();
    expect(isMaintenanceMode).toBe(true);
    expect(currentMaintenance).not.toBeNull();
  });

  it('should dismiss notifications', () => {
    const store = useMaintenanceStore.getState();
    store.addNotification({
      message: 'Test notification',
      type: 'info',
    });

    const { notifications } = useMaintenanceStore.getState();
    const notificationId = notifications[0].id;

    store.dismissNotification(notificationId);
    const newNotifications = useMaintenanceStore.getState().notifications;
    expect(newNotifications.find(n => n.id === notificationId)).toBeUndefined();
  });
});

describe('Developer Console', () => {
  beforeEach(() => {
    useDevConsoleStore.setState({
      isOpen: false,
      isEnabled: false,
      wsLogs: [],
      apiLogs: [],
      debugCommands: [],
      activeProfile: null,
      profiles: [],
      selectedTab: 'state',
    });
  });

  it('should toggle console', () => {
    const store = useDevConsoleStore.getState();
    
    store.setEnabled(true);
    expect(useDevConsoleStore.getState().isEnabled).toBe(true);

    store.toggle();
    expect(useDevConsoleStore.getState().isOpen).toBe(true);

    store.toggle();
    expect(useDevConsoleStore.getState().isOpen).toBe(false);
  });

  it('should log WebSocket events', () => {
    const store = useDevConsoleStore.getState();
    
    store.addWsLog({
      provider: 'birdeye',
      type: 'received',
      message: { type: 'price_update', data: {} },
    });

    const { wsLogs } = useDevConsoleStore.getState();
    expect(wsLogs.length).toBe(1);
    expect(wsLogs[0].provider).toBe('birdeye');
  });

  it('should log API calls', () => {
    const store = useDevConsoleStore.getState();
    
    store.addApiLog({
      method: 'GET',
      url: '/api/price',
      status: 200,
      duration: 150,
    });

    const { apiLogs } = useDevConsoleStore.getState();
    expect(apiLogs.length).toBe(1);
    expect(apiLogs[0].method).toBe('GET');
    expect(apiLogs[0].status).toBe(200);
  });

  it('should clear logs', () => {
    const store = useDevConsoleStore.getState();
    
    store.addWsLog({ provider: 'test', type: 'sent', message: {} });
    store.addApiLog({ method: 'GET', url: '/test' });

    store.clearAllLogs();

    const { wsLogs, apiLogs } = useDevConsoleStore.getState();
    expect(wsLogs.length).toBe(0);
    expect(apiLogs.length).toBe(0);
  });

  it('should register and execute commands', async () => {
    const store = useDevConsoleStore.getState();
    const mockExecute = vi.fn().mockResolvedValue('success');

    store.registerCommand({
      id: 'test-command',
      name: 'Test Command',
      description: 'A test command',
      execute: mockExecute,
      category: 'system',
    });

    const { debugCommands } = useDevConsoleStore.getState();
    expect(debugCommands.length).toBe(1);

    await store.executeCommand('test-command');
    expect(mockExecute).toHaveBeenCalled();
  });

  it('should start and end performance profiles', () => {
    const store = useDevConsoleStore.getState();
    
    store.startProfile('test-profile');
    expect(useDevConsoleStore.getState().activeProfile).not.toBeNull();
    expect(useDevConsoleStore.getState().activeProfile?.name).toBe('test-profile');

    store.endProfile();
    const { activeProfile, profiles } = useDevConsoleStore.getState();
    expect(activeProfile).toBeNull();
    expect(profiles.length).toBe(1);
  });

  it('should add performance marks and measures', () => {
    const store = useDevConsoleStore.getState();
    
    store.startProfile('test-profile');
    store.addMark('start');
    store.addMark('end');

    const { activeProfile } = useDevConsoleStore.getState();
    expect(activeProfile?.marks.length).toBe(2);
  });

  it('should limit logs to max size', () => {
    const store = useDevConsoleStore.getState();
    const { maxLogs } = store;

    // Add more logs than the limit
    for (let i = 0; i < maxLogs + 100; i++) {
      store.addWsLog({ provider: 'test', type: 'sent', message: {} });
    }

    const { wsLogs } = useDevConsoleStore.getState();
    expect(wsLogs.length).toBeLessThanOrEqual(maxLogs);
  });
});
