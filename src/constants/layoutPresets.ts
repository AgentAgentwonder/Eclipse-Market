import { LayoutPreset, WorkspaceLayout, Panel } from '../types/workspace';

const defaultPanels: Panel[] = [
  { id: 'panel-dashboard', type: 'dashboard', title: 'Overview', isMinimized: false, isLocked: false },
  { id: 'panel-coins', type: 'coins', title: 'Coins', isMinimized: false, isLocked: false },
  { id: 'panel-stocks', type: 'stocks', title: 'Stocks', isMinimized: false, isLocked: false },
  { id: 'panel-trading', type: 'trading', title: 'Trading', isMinimized: false, isLocked: false },
  { id: 'panel-portfolio', type: 'portfolio', title: 'Portfolio', isMinimized: false, isLocked: false },
  { id: 'panel-alerts', type: 'surveillance', title: 'Market Surveillance', isMinimized: false, isLocked: false },
];

const defaultLayouts = [
  { i: 'panel-dashboard', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'panel-coins', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6 },
  { i: 'panel-stocks', x: 0, y: 8, w: 6, h: 10, minW: 4, minH: 6 },
  { i: 'panel-trading', x: 6, y: 8, w: 6, h: 10, minW: 4, minH: 6 },
  { i: 'panel-portfolio', x: 0, y: 18, w: 6, h: 9, minW: 4, minH: 6 },
  { i: 'panel-alerts', x: 6, y: 18, w: 6, h: 9, minW: 4, minH: 6 },
];

export const defaultWorkspaceLayout: WorkspaceLayout = {
  panels: defaultPanels,
  layouts: defaultLayouts,
};

export const layoutPresets: LayoutPreset[] = [
  {
    id: 'trading-focus',
    name: 'Trading Focus',
    description: 'Prioritize trading and portfolio panels',
    layout: {
      panels: [
        { id: 'panel-dashboard', type: 'dashboard', title: 'Overview', isMinimized: false, isLocked: false },
        { id: 'panel-trading', type: 'trading', title: 'Trading', isMinimized: false, isLocked: false },
        { id: 'panel-portfolio', type: 'portfolio', title: 'Portfolio', isMinimized: false, isLocked: false },
        { id: 'panel-coins', type: 'coins', title: 'Coins', isMinimized: false, isLocked: false },
      ],
      layouts: [
        { i: 'panel-dashboard', x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 5 },
        { i: 'panel-trading', x: 4, y: 0, w: 8, h: 12, minW: 5, minH: 6 },
        { i: 'panel-portfolio', x: 0, y: 6, w: 4, h: 12, minW: 3, minH: 6 },
        { i: 'panel-coins', x: 4, y: 12, w: 8, h: 8, minW: 4, minH: 5 },
      ],
    },
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Balanced analytics with coins and stocks',
    layout: {
      panels: [
        { id: 'panel-dashboard', type: 'dashboard', title: 'Overview', isMinimized: false, isLocked: false },
        { id: 'panel-coins', type: 'coins', title: 'Coins', isMinimized: false, isLocked: false },
        { id: 'panel-stocks', type: 'stocks', title: 'Stocks', isMinimized: false, isLocked: false },
        { id: 'panel-surveillance', type: 'surveillance', title: 'Surveillance', isMinimized: false, isLocked: false },
        { id: 'panel-api', type: 'api-health', title: 'API Health', isMinimized: false, isLocked: false },
      ],
      layouts: [
        { i: 'panel-dashboard', x: 0, y: 0, w: 12, h: 6, minW: 6, minH: 5 },
        { i: 'panel-coins', x: 0, y: 6, w: 6, h: 10, minW: 4, minH: 6 },
        { i: 'panel-stocks', x: 6, y: 6, w: 6, h: 10, minW: 4, minH: 6 },
        { i: 'panel-surveillance', x: 0, y: 16, w: 6, h: 8, minW: 4, minH: 6 },
        { i: 'panel-api', x: 6, y: 16, w: 6, h: 8, minW: 4, minH: 5 },
      ],
    },
  },
];
