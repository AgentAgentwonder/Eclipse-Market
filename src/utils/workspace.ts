import { Panel, PanelLayout, PanelType, WorkspaceLayout } from '../types/workspace';

export const cloneWorkspaceLayout = (layout: WorkspaceLayout): WorkspaceLayout => ({
  panels: layout.panels.map(panel => ({ ...panel })),
  layouts: layout.layouts.map(layoutItem => ({ ...layoutItem })),
  monitorConfig: layout.monitorConfig ? { ...layout.monitorConfig } : undefined,
});

const panelTitles: Record<PanelType, string> = {
  dashboard: 'Overview',
  coins: 'Coins',
  stocks: 'Stocks',
  insiders: 'Insiders',
  trading: 'Trading',
  portfolio: 'Portfolio',
  multisig: 'Multisig',
  'api-health': 'API Health',
  'pro-charts': 'Pro Charts',
  'token-flow': 'Token Flow',
  surveillance: 'Market Surveillance',
  'paper-trading': 'Paper Trading',
  settings: 'Settings',
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
