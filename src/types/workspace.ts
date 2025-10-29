export interface PanelLayout {
  i: string; // panel id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
  static?: boolean; // locked
  isDraggable?: boolean;
  isResizable?: boolean;
}

export interface Panel {
  id: string;
  type: PanelType;
  title: string;
  isMinimized: boolean;
  isLocked: boolean;
}

export type PanelType =
  | 'dashboard'
  | 'coins'
  | 'stocks'
  | 'insiders'
  | 'trading'
  | 'portfolio'
  | 'multisig'
  | 'api-health'
  | 'pro-charts'
  | 'token-flow'
  | 'surveillance'
  | 'paper-trading'
  | 'settings';

export interface MonitorConfig {
  width: number;
  height: number;
  devicePixelRatio: number;
  count: number; // number of monitors
}

export interface WorkspaceLayout {
  panels: Panel[];
  layouts: PanelLayout[];
  monitorConfig?: MonitorConfig;
}

export interface Workspace {
  id: string;
  name: string;
  layout: WorkspaceLayout;
  isUnsaved: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface LayoutPreset {
  id: string;
  name: string;
  description: string;
  layout: WorkspaceLayout;
}
