import { describe, it, expect, beforeEach } from 'vitest';
import { useWorkspaceStore } from '../store/workspaceStore';
import { PanelType } from '../types/workspace';
import { createPanelDefinition } from '../utils/workspace';

describe('Workspace Store', () => {
  beforeEach(() => {
    const store = useWorkspaceStore.getState();
    store.workspaces = [];
    store.activeWorkspaceId = '';
    store.isWorkspaceSwitcherOpen = false;
  });

  it('should initialize with one default workspace', () => {
    const store = useWorkspaceStore.getState();
    store.addWorkspace('Test Workspace');
    
    const state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0].name).toBe('Test Workspace');
  });

  it('should add a new workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('New Workspace');
    let state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0].name).toBe('New Workspace');
    
    store.addWorkspace('Another Workspace');
    state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(2);
  });

  it('should set active workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Workspace 1');
    let state = useWorkspaceStore.getState();
    const ws1Id = state.workspaces[0].id;
    
    store.addWorkspace('Workspace 2');
    state = useWorkspaceStore.getState();
    const ws2Id = state.workspaces[1].id;
    
    store.setActiveWorkspace(ws1Id);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(ws1Id);
    
    store.setActiveWorkspace(ws2Id);
    expect(useWorkspaceStore.getState().activeWorkspaceId).toBe(ws2Id);
  });

  it('should duplicate workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Original');
    let state = useWorkspaceStore.getState();
    const originalId = state.workspaces[0].id;
    
    store.duplicateWorkspace(originalId);
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(2);
    expect(state.workspaces[1].name).toBe('Original (Copy)');
  });

  it('should rename workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Old Name');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    store.renameWorkspace(workspaceId, 'New Name');
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces[0].name).toBe('New Name');
  });

  it('should delete workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Workspace 1');
    store.addWorkspace('Workspace 2');
    let state = useWorkspaceStore.getState();
    
    const workspaceId = state.workspaces[0].id;
    store.deleteWorkspace(workspaceId);
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
    expect(state.workspaces[0].name).toBe('Workspace 2');
  });

  it('should not delete last workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Last One');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    store.deleteWorkspace(workspaceId);
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces).toHaveLength(1);
  });

  it('should mark workspace as unsaved', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    expect(state.workspaces[0].isUnsaved).toBe(false);
    
    store.markWorkspaceAsUnsaved(workspaceId);
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces[0].isUnsaved).toBe(true);
  });

  it('should save workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    store.markWorkspaceAsUnsaved(workspaceId);
    expect(useWorkspaceStore.getState().workspaces[0].isUnsaved).toBe(true);
    
    store.saveWorkspace(workspaceId);
    expect(useWorkspaceStore.getState().workspaces[0].isUnsaved).toBe(false);
  });

  it('should add panel to workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    const { panel, layout } = createPanelDefinition('coins' as PanelType);
    store.addPanel(workspaceId, panel, layout);
    
    state = useWorkspaceStore.getState();
    const workspace = state.workspaces.find(w => w.id === workspaceId);
    
    expect(workspace?.layout.panels.some(p => p.id === panel.id)).toBe(true);
    expect(workspace?.layout.layouts.some(l => l.i === layout.i)).toBe(true);
  });

  it('should remove panel from workspace', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    const { panel, layout } = createPanelDefinition('coins' as PanelType);
    store.addPanel(workspaceId, panel, layout);
    
    store.removePanel(workspaceId, panel.id);
    
    state = useWorkspaceStore.getState();
    const workspace = state.workspaces.find(w => w.id === workspaceId);
    
    expect(workspace?.layout.panels.some(p => p.id === panel.id)).toBe(false);
    expect(workspace?.layout.layouts.some(l => l.i === layout.i)).toBe(false);
  });

  it('should toggle panel lock', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    const { panel, layout } = createPanelDefinition('coins' as PanelType);
    store.addPanel(workspaceId, panel, layout);
    
    expect(panel.isLocked).toBe(false);
    
    store.togglePanelLock(workspaceId, panel.id);
    
    state = useWorkspaceStore.getState();
    const workspace = state.workspaces.find(w => w.id === workspaceId);
    const updatedPanel = workspace?.layout.panels.find(p => p.id === panel.id);
    
    expect(updatedPanel?.isLocked).toBe(true);
  });

  it('should toggle panel minimize', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('Test');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    
    const { panel, layout } = createPanelDefinition('coins' as PanelType);
    store.addPanel(workspaceId, panel, layout);
    
    expect(panel.isMinimized).toBe(false);
    
    store.togglePanelMinimize(workspaceId, panel.id);
    
    state = useWorkspaceStore.getState();
    const workspace = state.workspaces.find(w => w.id === workspaceId);
    const updatedPanel = workspace?.layout.panels.find(p => p.id === panel.id);
    
    expect(updatedPanel?.isMinimized).toBe(true);
  });

  it('should update monitor configuration', () => {
    const store = useWorkspaceStore.getState();
    
    const newConfig = {
      width: 1920,
      height: 1080,
      devicePixelRatio: 2,
      count: 2,
    };
    
    store.updateMonitorConfig(newConfig);
    
    const state = useWorkspaceStore.getState();
    expect(state.currentMonitorConfig).toEqual(newConfig);
  });

  it('should reorder workspaces', () => {
    const store = useWorkspaceStore.getState();
    
    store.addWorkspace('First');
    store.addWorkspace('Second');
    store.addWorkspace('Third');
    
    let state = useWorkspaceStore.getState();
    const ids = state.workspaces.map(w => w.id);
    const reordered = [ids[2], ids[0], ids[1]];
    
    store.reorderWorkspaces(reordered);
    
    state = useWorkspaceStore.getState();
    expect(state.workspaces[0].name).toBe('Third');
    expect(state.workspaces[1].name).toBe('First');
    expect(state.workspaces[2].name).toBe('Second');
  });

  it('should toggle workspace switcher', () => {
    const store = useWorkspaceStore.getState();
    
    expect(store.isWorkspaceSwitcherOpen).toBe(false);
    
    store.toggleWorkspaceSwitcher();
    expect(useWorkspaceStore.getState().isWorkspaceSwitcherOpen).toBe(true);
    
    store.toggleWorkspaceSwitcher();
    expect(useWorkspaceStore.getState().isWorkspaceSwitcherOpen).toBe(false);
  });
});

describe('Workspace Multi-Monitor Support', () => {
  beforeEach(() => {
    const store = useWorkspaceStore.getState();
    store.workspaces = [];
    store.activeWorkspaceId = '';
  });

  it('should associate monitor config with workspace layout', () => {
    const store = useWorkspaceStore.getState();
    
    const monitorConfig = {
      width: 2560,
      height: 1440,
      devicePixelRatio: 1.5,
      count: 3,
    };
    
    store.updateMonitorConfig(monitorConfig);
    
    store.addWorkspace('Multi-Monitor Workspace');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    const workspace = state.workspaces[0];
    
    store.updateWorkspaceLayout(workspaceId, workspace.layout);
    
    state = useWorkspaceStore.getState();
    const updatedWorkspace = state.workspaces.find(w => w.id === workspaceId);
    
    expect(updatedWorkspace?.layout.monitorConfig).toEqual(monitorConfig);
  });

  it('should persist workspace with monitor configuration', () => {
    const store = useWorkspaceStore.getState();
    
    const config = {
      width: 3840,
      height: 2160,
      devicePixelRatio: 2,
      count: 2,
    };
    
    store.updateMonitorConfig(config);
    
    store.addWorkspace('4K Workspace');
    let state = useWorkspaceStore.getState();
    const workspaceId = state.workspaces[0].id;
    const workspace = state.workspaces[0];
    
    store.updateWorkspaceLayout(workspaceId, {
      ...workspace.layout,
      monitorConfig: config,
    });
    
    state = useWorkspaceStore.getState();
    const savedWorkspace = state.workspaces.find(w => w.id === workspaceId);
    
    expect(savedWorkspace?.layout.monitorConfig?.width).toBe(3840);
    expect(savedWorkspace?.layout.monitorConfig?.height).toBe(2160);
    expect(savedWorkspace?.layout.monitorConfig?.count).toBe(2);
  });
});
