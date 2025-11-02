import { Panel, PanelLayout, PanelType, WorkspaceLayout, SplitConfig, FloatingWindowState, MonitorLayoutAssignment } from '../types/workspace';

export const SPLIT_PLACEHOLDER_PREFIX = 'split-empty-';

export const createSplitPlaceholderId = () =>
  `${SPLIT_PLACEHOLDER_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

export const isSplitPlaceholder = (value: string) => value.startsWith(SPLIT_PLACEHOLDER_PREFIX);

export const cloneSplitConfig = (split?: SplitConfig): SplitConfig | undefined => {
  if (!split) return undefined;

  return {
    direction: split.direction,
    sizes: [...split.sizes],
    minSizes: split.minSizes ? [...split.minSizes] : undefined,
    children: split.children.map(child =>
      typeof child === 'string' ? child : (cloneSplitConfig(child) as SplitConfig)
    ),
  };
};

export const cloneFloatingWindows = (windows?: FloatingWindowState[]) => {
  if (!windows) return undefined;
  return windows.map(window => ({ ...window }));
};

export const cloneMonitorAssignments = (assignments?: MonitorLayoutAssignment[]) => {
  if (!assignments) return undefined;
  return assignments.map(assignment => ({
    monitorId: assignment.monitorId,
    panelIds: [...assignment.panelIds],
    split: cloneSplitConfig(assignment.split),
  }));
};

export const cloneWorkspaceLayout = (layout: WorkspaceLayout): WorkspaceLayout => ({
  panels: layout.panels.map(panel => ({ ...panel })),
  layouts: layout.layouts.map(layoutItem => ({ ...layoutItem })),
  splits: cloneSplitConfig(layout.splits),
  floatingWindows: cloneFloatingWindows(layout.floatingWindows),
  monitorAssignments: cloneMonitorAssignments(layout.monitorAssignments),
  monitorConfig: layout.monitorConfig ? { ...layout.monitorConfig } : undefined,
});

const panelTitles: Record<PanelType, string> = {
  dashboard: 'Overview',
  coins: 'Coins',
  stocks: 'Stocks',
  insiders: 'Insiders',
  trading: 'Trading',
  portfolio: 'Portfolio',
  'portfolio-analytics': 'Portfolio Analytics',
  multisig: 'Multisig',
  'api-health': 'API Health',
  'pro-charts': 'Pro Charts',
  'token-flow': 'Token Flow',
  surveillance: 'Market Surveillance',
  'social-intelligence': 'Social Intelligence',
  'paper-trading': 'Paper Trading',
  'ai-analysis': 'AI Assistant',
  'prediction-markets': 'Prediction Markets',
  defi: 'DeFi Hub',
  'historical-replay': 'Historical Replay',
  troubleshooter: 'Troubleshooter',
  settings: 'Settings',
  'dev-console': 'Developer Console',
  'launch-predictor': 'Launch Predictor AI',
  'social-intelligence': 'Social Intelligence',
};

export const createPanelDefinition = (type: PanelType, width = 6, height = 8) => {
  const panelId = `panel-${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const panel: Panel = {
    id: panelId,
    type,
    title: panelTitles[type] ?? type,
    isMinimized: false,
    isLocked: false,
  };

  const layout: PanelLayout = {
    i: panelId,
    x: 0,
    y: Infinity,
    w: width,
    h: height,
    minW: 3,
    minH: 4,
  };

  return { panel, layout };
};
