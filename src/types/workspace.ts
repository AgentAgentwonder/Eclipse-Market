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
  isFloating?: boolean;
  floatingWindowId?: string;
  monitorId?: string;
  splitConfig?: SplitConfig;
}

export interface SplitConfig {
  direction: 'horizontal' | 'vertical';
  sizes: number[];
  children: (string | SplitConfig)[];
  minSizes?: number[];
}

export type PanelType =
  | 'dashboard'
  | 'coins'
  | 'stocks'
  | 'insiders'
  | 'trading'
  | 'portfolio'
  | 'portfolio-analytics'
  | 'multisig'
  | 'api-health'
  | 'pro-charts'
  | 'token-flow'
  | 'surveillance'
  | 'paper-trading'
  | 'ai-analysis'
  | 'prediction-markets'
  | 'defi'
  | 'historical-replay'
  | 'troubleshooter'
  | 'social-momentum'
  | 'settings'
  | 'dev-console';

export interface Monitor {
  id: string;
  name: string;
  width: number;
  height: number;
  x: number;
  y: number;
  scaleFactor: number;
  isPrimary: boolean;
}

export interface MonitorConfig {
  width: number;
  height: number;
  devicePixelRatio: number;
  count: number;
  monitors?: Monitor[];
}

export interface FloatingWindowState {
  id: string;
  panelId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  monitorId?: string;
  alwaysOnTop?: boolean;
  transparent?: boolean;
  snappedEdge?: 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export interface MonitorLayoutAssignment {
  monitorId: string;
  panelIds: string[];
  split?: SplitConfig;
}

export interface WorkspaceLayout {
  panels: Panel[];
  layouts: PanelLayout[];
  splits?: SplitConfig;
  floatingWindows?: FloatingWindowState[];
  monitorAssignments?: MonitorLayoutAssignment[];
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
