import { describe, it, expect, beforeEach } from 'vitest';
import { useShortcutStore, DEFAULT_SHORTCUTS } from '../store/shortcutStore';
import { useCommandStore } from '../store/commandStore';

describe('Shortcut Store', () => {
  beforeEach(() => {
    useShortcutStore.setState({ shortcuts: DEFAULT_SHORTCUTS });
  });

  it('should initialize with default shortcuts', () => {
    const { shortcuts } = useShortcutStore.getState();
    expect(shortcuts.length).toBeGreaterThan(0);
    expect(shortcuts).toEqual(DEFAULT_SHORTCUTS);
  });

  it('should update a customizable shortcut', () => {
    const { setShortcut, shortcuts } = useShortcutStore.getState();
    const shortcutId = 'quick-buy';
    const newKeys = 'Ctrl+Shift+B';

    setShortcut(shortcutId, newKeys);

    const updated = useShortcutStore.getState().shortcuts.find(s => s.id === shortcutId);
    expect(updated?.keys).toBe(newKeys);
  });

  it('should not update non-customizable shortcuts', () => {
    const { setShortcut } = useShortcutStore.getState();
    const shortcutId = 'command-palette';
    const originalShortcut = DEFAULT_SHORTCUTS.find(s => s.id === shortcutId);
    const originalKeys = originalShortcut?.keys;

    setShortcut(shortcutId, 'Ctrl+P');

    const updated = useShortcutStore.getState().shortcuts.find(s => s.id === shortcutId);
    expect(updated?.keys).toBe(originalKeys);
  });

  it('should reset a shortcut to default', () => {
    const { setShortcut, resetShortcut } = useShortcutStore.getState();
    const shortcutId = 'quick-buy';
    const originalKeys = DEFAULT_SHORTCUTS.find(s => s.id === shortcutId)?.keys;

    setShortcut(shortcutId, 'Ctrl+Shift+B');
    resetShortcut(shortcutId);

    const updated = useShortcutStore.getState().shortcuts.find(s => s.id === shortcutId);
    expect(updated?.keys).toBe(originalKeys);
  });

  it('should reset all shortcuts', () => {
    const { setShortcut, resetAllShortcuts } = useShortcutStore.getState();

    setShortcut('quick-buy', 'Ctrl+Shift+B');
    setShortcut('quick-sell', 'Ctrl+Shift+S');

    resetAllShortcuts();

    const { shortcuts } = useShortcutStore.getState();
    expect(shortcuts).toEqual(DEFAULT_SHORTCUTS);
  });

  it('should toggle shortcut enabled state', () => {
    const { toggleShortcut } = useShortcutStore.getState();
    const shortcutId = 'quick-buy';

    toggleShortcut(shortcutId, false);
    let updated = useShortcutStore.getState().shortcuts.find(s => s.id === shortcutId);
    expect(updated?.enabled).toBe(false);

    toggleShortcut(shortcutId, true);
    updated = useShortcutStore.getState().shortcuts.find(s => s.id === shortcutId);
    expect(updated?.enabled).toBe(true);
  });

  it('should detect conflicts', () => {
    const { setShortcut, getConflicts } = useShortcutStore.getState();

    setShortcut('quick-buy', 'Ctrl+B');
    setShortcut('quick-sell', 'Ctrl+B');

    const conflicts = getConflicts();
    expect(conflicts.length).toBeGreaterThan(0);
    expect(conflicts[0].keys).toBe('Ctrl+B');
    expect(conflicts[0].shortcuts.length).toBe(2);
  });

  it('should not detect conflicts when shortcuts are disabled', () => {
    const { setShortcut, toggleShortcut, getConflicts } = useShortcutStore.getState();

    setShortcut('quick-buy', 'Ctrl+B');
    setShortcut('quick-sell', 'Ctrl+B');
    toggleShortcut('quick-sell', false);

    const conflicts = getConflicts();
    const ctrlBConflict = conflicts.find(c => c.keys === 'Ctrl+B');
    expect(ctrlBConflict).toBeUndefined();
  });

  it('should get shortcut by action', () => {
    const { getShortcutByAction } = useShortcutStore.getState();
    const shortcut = getShortcutByAction('trading:quick-buy');
    expect(shortcut).toBeDefined();
    expect(shortcut?.action).toBe('trading:quick-buy');
  });

  it('should get shortcuts by category', () => {
    const { getShortcutsByCategory } = useShortcutStore.getState();
    const tradingShortcuts = getShortcutsByCategory('trading');
    expect(tradingShortcuts.length).toBeGreaterThan(0);
    expect(tradingShortcuts.every(s => s.category === 'trading')).toBe(true);
  });

  it('should export shortcuts as JSON', () => {
    const { exportShortcuts } = useShortcutStore.getState();
    const json = exportShortcuts();
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(DEFAULT_SHORTCUTS.length);
  });

  it('should import valid shortcuts', () => {
    const { importShortcuts, setShortcut } = useShortcutStore.getState();

    setShortcut('quick-buy', 'Ctrl+Shift+B');
    const exported = useShortcutStore.getState().exportShortcuts();

    useShortcutStore.setState({ shortcuts: DEFAULT_SHORTCUTS });
    importShortcuts(exported);

    const imported = useShortcutStore.getState().shortcuts.find(s => s.id === 'quick-buy');
    expect(imported?.keys).toBe('Ctrl+Shift+B');
  });

  it('should reject invalid import data', () => {
    const { importShortcuts } = useShortcutStore.getState();
    expect(() => importShortcuts('invalid json')).toThrow();
  });
});

describe('Command Store', () => {
  beforeEach(() => {
    useCommandStore.setState({ commands: {}, recentCommands: [] });
  });

  it('should register commands', () => {
    const { registerCommands, commands } = useCommandStore.getState();
    const testCommands = [
      {
        id: 'test-1',
        title: 'Test Command 1',
        category: 'system' as const,
        action: () => {},
      },
      {
        id: 'test-2',
        title: 'Test Command 2',
        category: 'navigation' as const,
        action: () => {},
      },
    ];

    registerCommands(testCommands);

    const state = useCommandStore.getState();
    expect(Object.keys(state.commands).length).toBe(2);
    expect(state.commands['test-1']).toBeDefined();
    expect(state.commands['test-2']).toBeDefined();
  });

  it('should unregister commands', () => {
    const { registerCommands, unregisterCommands } = useCommandStore.getState();
    const testCommands = [
      {
        id: 'test-1',
        title: 'Test Command 1',
        category: 'system' as const,
        action: () => {},
      },
    ];

    registerCommands(testCommands);
    unregisterCommands(['test-1']);

    const state = useCommandStore.getState();
    expect(state.commands['test-1']).toBeUndefined();
  });

  it('should track recent commands', async () => {
    const { registerCommands, executeCommand, recentCommands } = useCommandStore.getState();
    const testCommand = {
      id: 'test-cmd',
      title: 'Test Command',
      category: 'system' as const,
      action: async () => {},
    };

    registerCommands([testCommand]);
    await executeCommand('test-cmd');

    const state = useCommandStore.getState();
    expect(state.recentCommands.length).toBe(1);
    expect(state.recentCommands[0].commandId).toBe('test-cmd');
    expect(state.recentCommands[0].count).toBe(1);
  });

  it('should increment command usage count', async () => {
    const { registerCommands, executeCommand } = useCommandStore.getState();
    const testCommand = {
      id: 'test-cmd',
      title: 'Test Command',
      category: 'system' as const,
      action: async () => {},
    };

    registerCommands([testCommand]);
    await executeCommand('test-cmd');
    await executeCommand('test-cmd');

    const state = useCommandStore.getState();
    expect(state.recentCommands[0].count).toBe(2);
  });

  it('should get commands by category', () => {
    const { registerCommands, getCommandsByCategory } = useCommandStore.getState();
    const testCommands = [
      {
        id: 'nav-1',
        title: 'Nav Command 1',
        category: 'navigation' as const,
        action: () => {},
      },
      {
        id: 'nav-2',
        title: 'Nav Command 2',
        category: 'navigation' as const,
        action: () => {},
      },
      {
        id: 'sys-1',
        title: 'System Command',
        category: 'system' as const,
        action: () => {},
      },
    ];

    registerCommands(testCommands);
    const navCommands = getCommandsByCategory('navigation');

    expect(navCommands.length).toBe(2);
    expect(navCommands.every(cmd => cmd.category === 'navigation')).toBe(true);
  });

  it('should get command by id', () => {
    const { registerCommands, getCommand } = useCommandStore.getState();
    const testCommand = {
      id: 'test-cmd',
      title: 'Test Command',
      category: 'system' as const,
      action: () => {},
    };

    registerCommands([testCommand]);
    const command = getCommand('test-cmd');

    expect(command).toBeDefined();
    expect(command?.id).toBe('test-cmd');
  });

  it('should clear recent commands', async () => {
    const { registerCommands, executeCommand, clearRecentCommands } = useCommandStore.getState();
    const testCommand = {
      id: 'test-cmd',
      title: 'Test Command',
      category: 'system' as const,
      action: async () => {},
    };

    registerCommands([testCommand]);
    await executeCommand('test-cmd');

    clearRecentCommands();

    const state = useCommandStore.getState();
    expect(state.recentCommands.length).toBe(0);
  });

  it('should limit recent commands to 20', async () => {
    const { registerCommands, executeCommand } = useCommandStore.getState();
    const commands = Array.from({ length: 25 }, (_, i) => ({
      id: `cmd-${i}`,
      title: `Command ${i}`,
      category: 'system' as const,
      action: async () => {},
    }));

    registerCommands(commands);

    for (let i = 0; i < 25; i++) {
      await executeCommand(`cmd-${i}`);
    }

    const state = useCommandStore.getState();
    expect(state.recentCommands.length).toBe(20);
  });
});
