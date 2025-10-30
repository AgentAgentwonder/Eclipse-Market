import { useState, useMemo, useCallback, ComponentType, useEffect, useRef } from 'react';
import GridLayout from 'react-grid-layout';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { PanelLayout } from '../../types/workspace';
import { PanelWrapper } from './PanelWrapper';
import Dashboard from '../../pages/Dashboard';
import Coins from '../../pages/Coins';
import Stocks from '../../pages/Stocks';
import Insiders from '../../pages/Insiders';
import Trading from '../../pages/Trading';
import Portfolio from '../../pages/Portfolio';
import Multisig from '../../pages/Multisig';
import ApiHealth from '../../pages/ApiHealth';
import ProCharts from '../../pages/ProCharts';
import TokenFlow from '../../pages/TokenFlow';
import { MarketSurveillance } from '../../pages/MarketSurveillance';
import { PaperTradingDashboard } from '../../pages/PaperTrading/Dashboard';
import { AIAnalysis } from '../../pages/AIAnalysis';
import PredictionMarkets from '../../pages/PredictionMarkets';
import DeFi from '../../pages/DeFi';
import SettingsPage from '../../pages/Settings';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const componentMap: Record<string, ComponentType> = {
  dashboard: Dashboard,
  coins: Coins,
  stocks: Stocks,
  insiders: Insiders,
  trading: Trading,
  portfolio: Portfolio,
  multisig: Multisig,
  'api-health': ApiHealth,
  'pro-charts': ProCharts,
  'token-flow': TokenFlow,
  surveillance: MarketSurveillance,
  'paper-trading': PaperTradingDashboard,
  'ai-analysis': AIAnalysis,
  'prediction-markets': PredictionMarkets,
  defi: DeFi,
  settings: SettingsPage,
};

export const GridLayoutContainer = () => {
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const updateWorkspaceLayout = useWorkspaceStore(state => state.updateWorkspaceLayout);
  const togglePanelLock = useWorkspaceStore(state => state.togglePanelLock);
  const togglePanelMinimize = useWorkspaceStore(state => state.togglePanelMinimize);
  const removePanel = useWorkspaceStore(state => state.removePanel);

  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const element = containerRef.current;
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      if (entry && entry.contentRect) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(element);

    setContainerWidth(element.clientWidth || 1200);

    return () => {
      observer.disconnect();
    };
  }, []);

  const handleLayoutChange = useCallback(
    (newLayout: PanelLayout[]) => {
      if (!activeWorkspace) return;

      updateWorkspaceLayout(activeWorkspace.id, {
        ...activeWorkspace.layout,
        layouts: newLayout,
      });
    },
    [activeWorkspace, updateWorkspaceLayout]
  );

  const layouts = useMemo(() => {
    if (!activeWorkspace) return [];

    return activeWorkspace.layout.layouts.map(layout => ({
      ...layout,
      isDraggable: layout.isDraggable ?? !layout.static,
      isResizable: layout.isResizable ?? !layout.static,
    }));
  }, [activeWorkspace]);

  if (!activeWorkspace) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        No active workspace
      </div>
    );
  }

  return (
    <div className="w-full" ref={containerRef}>
      <GridLayout
        className="layout"
        layout={layouts}
        cols={12}
        rowHeight={30}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        isDraggable
        isResizable
        compactType="vertical"
        preventCollision={false}
        margin={[16, 16]}
        containerPadding={[0, 0]}
        useCSSTransforms
      >
        {activeWorkspace.layout.panels.map(panel => {
          const Component = componentMap[panel.type];
          if (!Component) return null;

          return (
            <div key={panel.id}>
              <PanelWrapper
                panel={panel}
                workspaceId={activeWorkspace.id}
                onToggleLock={() => togglePanelLock(activeWorkspace.id, panel.id)}
                onToggleMinimize={() => togglePanelMinimize(activeWorkspace.id, panel.id)}
                onClose={() => removePanel(activeWorkspace.id, panel.id)}
              >
                {!panel.isMinimized && <Component />}
              </PanelWrapper>
            </div>
          );
        })}
      </GridLayout>
    </div>
  );
};
