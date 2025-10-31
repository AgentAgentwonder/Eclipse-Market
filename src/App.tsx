import { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Home,
  TrendingUp,
  BarChart3,
  Users,
  Bell,
  Settings,
  Briefcase,
  Activity,
  FileText,
  Shield,
  AlertTriangle,
  LineChart,
  Network,
  Banknote as BanknoteIcon,
  Wallet as WalletIcon,
  LayoutGrid,
  ArrowRightLeft,
  GraduationCap,
  Keyboard,
  Command,
  MessageSquare,
  PieChart,
  Clock,
  } from 'lucide-react';

import { ShortcutCheatSheet } from './components/common/ShortcutCheatSheet';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useCommandStore } from './store/commandStore';
import { invoke } from '@tauri-apps/api/tauri';
import { PhantomConnect } from './components/wallet/PhantomConnect';
import { WalletSwitcher } from './components/wallet/WalletSwitcher';
import { AddWalletModal } from './components/wallet/AddWalletModal';
import { GroupManagementModal } from './components/wallet/GroupManagementModal';
import { WalletSettingsModal } from './components/wallet/WalletSettingsModal';
import { ChainSelector } from './components/chains/ChainSelector';
import { LockScreen } from './components/auth/LockScreen';
import { NetworkStatusIndicator } from './components/common/NetworkStatusIndicator';
import { PaperModeIndicator } from './components/trading/PaperModeIndicator';
import { PaperTradingTutorial } from './components/trading/PaperTradingTutorial';
import ProposalNotification from './components/wallet/ProposalNotification';
import AlertNotificationContainer from './components/alerts/AlertNotificationContainer';
import AlertChartModal from './components/alerts/AlertChartModal';
import { WorkspaceTabs, WorkspaceSwitcher, GridLayoutContainer, WorkspaceToolbar, FloatingWindowManager } from './components/workspace';
import Dashboard from './pages/Dashboard';
import Coins from './pages/Coins';
import Stocks from './pages/Stocks';
import Insiders from './pages/Insiders';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import PortfolioAnalytics from './pages/PortfolioAnalytics';
import Multisig from './pages/Multisig';
import ApiHealth from './pages/ApiHealth';
import ProCharts from './pages/ProCharts';
import TokenFlow from './pages/TokenFlow';
import Wallet from './pages/Wallet';
import { MarketSurveillance } from './pages/MarketSurveillance';
import { PaperTradingDashboard } from './pages/PaperTrading/Dashboard';
import { AIAnalysis } from './pages/AIAnalysis';
import SettingsPage from './pages/Settings';
import AdvancedSettings from './pages/Settings/AdvancedSettings';
import MultiChain from './pages/MultiChain';
import PredictionMarkets from './pages/PredictionMarkets';
import DeFi from './pages/DeFi';
import HistoricalReplay from './pages/HistoricalReplay';
import { BIOMETRIC_STATUS_EVENT } from './constants/events';
import { useWalletStore } from './store/walletStore';
import { usePaperTradingStore } from './store/paperTradingStore';
import { useWorkspaceStore } from './store/workspaceStore';
import { useAlertNotifications } from './hooks/useAlertNotifications';
import { useMonitorConfig } from './hooks/useMonitorConfig';
import { useDevConsoleCommands } from './hooks/useDevConsoleCommands';
import { createPanelDefinition } from './utils/workspace';
import { PanelType } from './types/workspace';
import { useThemeStore } from './store/themeStore';
import { useAccessibilityStore } from './store/accessibilityStore';
import { useUpdateStore } from './store/updateStore';
import { useMaintenanceStore } from './store/maintenanceStore';
import { UpdateNotificationModal } from './components/UpdateNotificationModal';
import { PerformanceMonitor } from './components/common/PerformanceMonitor';
import { TutorialEngine } from './components/tutorials/TutorialEngine';
import { TutorialMenu } from './components/tutorials/TutorialMenu';
import { HelpButton } from './components/help/HelpButton';
import { HelpPanel } from './components/help/HelpPanel';
import { WhatsThisMode } from './components/help/WhatsThisMode';
import { ChangelogViewer } from './components/changelog/ChangelogViewer';
import { WhatsNewModal } from './components/changelog/WhatsNewModal';
import { useTutorialStore } from './store/tutorialStore';
import { useChangelogStore } from './store/changelogStore';
import packageJson from '../package.json';
import { MaintenanceBanner } from './components/common/MaintenanceBanner';
import { DeveloperConsole } from './components/common/DeveloperConsole';
import { VoiceTradingOverlay } from './components/voice/VoiceTradingOverlay';
import { VoiceNotificationRouter } from './components/voice/VoiceNotificationRouter';

type BiometricStatus = {
  available: boolean;
  enrolled: boolean;
  fallbackConfigured: boolean;
  platform: 'WindowsHello' | 'TouchId' | 'PasswordOnly';
};

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);
  const [initializingLock, setInitializingLock] = useState(true);
  const [addWalletModalOpen, setAddWalletModalOpen] = useState(false);
  const [groupsModalOpen, setGroupsModalOpen] = useState(false);
  const [walletSettingsModalOpen, setWalletSettingsModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [chartTimestamp, setChartTimestamp] = useState<string | null>(null);
  const [useWorkspaceMode, setUseWorkspaceMode] = useState(true);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [cheatSheetOpen, setCheatSheetOpen] = useState(false);
  const [tutorialMenuOpen, setTutorialMenuOpen] = useState(false);

  const currentVersion = packageJson.version ?? '1.0.0';
  const {
    autoStart: tutorialAutoStart,
    getAvailableTutorials,
    startTutorial,
    progress: tutorialProgress,
    isPlaying: tutorialPlaying,
  } = useTutorialStore(state => ({
    autoStart: state.autoStart,
    getAvailableTutorials: state.getAvailableTutorials,
    startTutorial: state.startTutorial,
    progress: state.progress,
    isPlaying: state.isPlaying,
  }));
  const { openWhatsNew, isWhatsNewOpen, hasUnseenChanges } = useChangelogStore(state => ({
    openWhatsNew: state.openWhatsNew,
    isWhatsNewOpen: state.isWhatsNewOpen,
    hasUnseenChanges: state.hasUnseenChanges,
  }));

  const wallets = useWalletStore(state => state.wallets);
  const refreshMultiWallet = useWalletStore(state => state.refreshMultiWallet);
  const { isPaperMode } = usePaperTradingStore();
  const proposalNotifications = useWalletStore(state => state.proposalNotifications);
  const dismissProposalNotification = useWalletStore(state => state.dismissProposalNotification);
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const addPanelToWorkspace = useWorkspaceStore(state => state.addPanel);
  const setPanelMinimized = useWorkspaceStore(state => state.setPanelMinimized);
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
  const registerCommands = useCommandStore(state => state.registerCommands);
  const unregisterCommands = useCommandStore(state => state.unregisterCommands);

  const activeWorkspace = useMemo(
    () => workspaces.find(workspace => workspace.id === activeWorkspaceId),
    [workspaces, activeWorkspaceId]
  );

  useAlertNotifications();
  useMonitorConfig();
  useDevConsoleCommands();

  useKeyboardShortcuts({
    onCommandPalette: () => setCommandPaletteOpen(true),
    onHelp: () => setCheatSheetOpen(true),
    onEscape: () => {
      if (commandPaletteOpen) {
        setCommandPaletteOpen(false);
      } else if (cheatSheetOpen) {
        setCheatSheetOpen(false);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    },
    onAction: handleShortcutAction,
  });
  const currentTheme = useThemeStore(state => state.currentTheme);
  const applyThemeColors = useThemeStore(state => state.applyThemeColors);
  const applyAccessibilitySettings = useAccessibilityStore(state => state.applyAccessibilitySettings);
  const setupEventListeners = useUpdateStore(state => state.setupEventListeners);
  const loadSettings = useUpdateStore(state => state.loadSettings);
  const checkForUpdates = useUpdateStore(state => state.checkForUpdates);

  useEffect(() => {
    applyThemeColors();
    applyAccessibilitySettings();
  }, [applyThemeColors, applyAccessibilitySettings, currentTheme]);

  useEffect(() => {
    setupEventListeners();
    loadSettings();
    
    // Check for updates on startup (after a delay)
    setTimeout(() => {
      checkForUpdates().catch(console.error);
    }, 5000);
  }, [setupEventListeners, loadSettings, checkForUpdates]);

  useEffect(() => {
    const hydrate = async () => {
      try {
        const status = await invoke<BiometricStatus>('biometric_get_status');
        setLockVisible(Boolean(status.enrolled));
      } catch (error) {
        console.error('Failed to hydrate biometric status', error);
        setLockVisible(false);
      } finally {
        setInitializingLock(false);
      }
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!tutorialAutoStart || tutorialPlaying) {
      return;
    }

    const availableTutorials = getAvailableTutorials(currentPage);
    const nextTutorial = availableTutorials.find(tutorial => {
      const progress = tutorialProgress[tutorial.id];
      if (!progress) return true;
      if (progress.skipped) return false;
      return !progress.completed;
    });

    if (nextTutorial) {
      startTutorial(nextTutorial.id);
    }
  }, [
    currentPage,
    tutorialAutoStart,
    getAvailableTutorials,
    tutorialProgress,
    startTutorial,
    tutorialPlaying,
  ]);

  useEffect(() => {
    if (!isWhatsNewOpen && hasUnseenChanges(currentVersion)) {
      const timer = setTimeout(() => {
        openWhatsNew();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [currentVersion, hasUnseenChanges, isWhatsNewOpen, openWhatsNew]);

  useEffect(() => {
    const commands = [
      {
        id: 'nav-dashboard',
        title: 'Dashboard',
        description: 'Navigate to Dashboard',
        category: 'navigation' as const,
        action: () => setCurrentPage('dashboard'),
        shortcutId: 'nav:dashboard',
        keywords: ['home', 'main', 'overview'],
      },
      {
        id: 'nav-coins',
        title: 'Coins',
        description: 'View cryptocurrency list',
        category: 'navigation' as const,
        action: () => setCurrentPage('coins'),
        shortcutId: 'nav:coins',
        keywords: ['crypto', 'tokens', 'market'],
      },
      {
        id: 'nav-portfolio',
        title: 'Portfolio',
        description: 'View your portfolio',
        category: 'navigation' as const,
        action: () => setCurrentPage('portfolio'),
        shortcutId: 'nav:portfolio',
        keywords: ['holdings', 'assets', 'balance'],
      },
      {
        id: 'nav-trading',
        title: 'Trading',
        description: 'Open trading interface',
        category: 'navigation' as const,
        action: () => setCurrentPage('trading'),
        shortcutId: 'nav:trading',
        keywords: ['trade', 'buy', 'sell', 'swap'],
      },
      {
        id: 'nav-defi',
        title: 'DeFi Hub',
        description: 'Navigate to DeFi control center',
        category: 'navigation' as const,
        action: () => setCurrentPage('defi'),
        shortcutId: 'nav:defi',
        keywords: ['lending', 'yield', 'defi'],
      },
      {
        id: 'nav-settings',
        title: 'Settings',
        description: 'Open application settings',
        category: 'system' as const,
        action: () => setCurrentPage('settings'),
        shortcutId: 'nav:settings',
        keywords: ['preferences', 'config', 'configuration'],
      },
      {
        id: 'nav-advanced-settings',
        title: 'Advanced Settings',
        description: 'Configure all application settings',
        category: 'system' as const,
        action: () => setCurrentPage('advanced-settings'),
        shortcutId: 'nav:advanced-settings',
        keywords: ['preferences', 'config', 'configuration', 'advanced', 'universal'],
      },
      {
        id: 'nav-stocks',
        title: 'Stocks',
        description: 'View stocks and equities',
        category: 'navigation' as const,
        action: () => setCurrentPage('stocks'),
        keywords: ['equities', 'shares', 'market'],
      },
      {
        id: 'nav-insiders',
        title: 'Insiders',
        description: 'View insider trading data',
        category: 'analytics' as const,
        action: () => setCurrentPage('insiders'),
        keywords: ['insider', 'executives'],
      },
      {
        id: 'nav-token-flow',
        title: 'Token Flow',
        description: 'View token flow analysis',
        category: 'analytics' as const,
        action: () => setCurrentPage('token-flow'),
        keywords: ['flow', 'tokens', 'transfers'],
      },
      {
        id: 'nav-surveillance',
        title: 'Market Surveillance',
        description: 'View market surveillance',
        category: 'analytics' as const,
        action: () => setCurrentPage('surveillance'),
        keywords: ['anomaly', 'alerts', 'monitoring'],
      },
      {
        id: 'nav-pro-charts',
        title: 'Pro Charts',
        description: 'Advanced charting tools',
        category: 'analytics' as const,
        action: () => setCurrentPage('pro-charts'),
        keywords: ['charts', 'technical', 'analysis'],
      },
      {
        id: 'nav-ai-analysis',
        title: 'AI Assistant',
        description: 'AI trading assistant and analysis',
        category: 'analytics' as const,
        action: () => setCurrentPage('ai-analysis'),
        keywords: ['ai', 'assistant', 'chat', 'analysis'],
      },
      {
        id: 'nav-prediction-markets',
        title: 'Prediction Markets',
        description: 'View prediction markets dashboard',
        category: 'analytics' as const,
        action: () => setCurrentPage('prediction-markets'),
        shortcutId: 'nav:prediction-markets',
        keywords: ['prediction', 'markets', 'polymarket', 'drift'],
      },
      {
        id: 'nav-historical-replay',
        title: 'Historical Replay',
        description: 'Simulate historical trading scenarios',
        category: 'analytics' as const,
        action: () => setCurrentPage('historical-replay'),
        shortcutId: 'nav:historical-replay',
        keywords: ['historical', 'replay', 'backtest', 'time machine'],
      },
      {
        id: 'toggle-sidebar',
        title: 'Toggle Sidebar',
        description: 'Show or hide the navigation sidebar',
        category: 'workspace' as const,
        action: () => setSidebarOpen(prev => !prev),
        shortcutId: 'window:toggle-sidebar',
        keywords: ['menu', 'navigation'],
      },
      {
        id: 'toggle-workspace-mode',
        title: 'Toggle Workspace Mode',
        description: 'Switch between page and workspace mode',
        category: 'workspace' as const,
        action: () => setUseWorkspaceMode(prev => !prev),
        keywords: ['layout', 'view', 'mode'],
      },
      {
        id: 'next-workspace',
        title: 'Next Workspace',
        description: 'Switch to next workspace',
        category: 'workspace' as const,
        action: () => {
          const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
          const nextIndex = (currentIndex + 1) % workspaces.length;
          setActiveWorkspace(workspaces[nextIndex].id);
        },
        shortcutId: 'window:next-workspace',
        keywords: ['workspace', 'switch'],
      },
      {
        id: 'prev-workspace',
        title: 'Previous Workspace',
        description: 'Switch to previous workspace',
        category: 'workspace' as const,
        action: () => {
          const currentIndex = workspaces.findIndex(w => w.id === activeWorkspaceId);
          const prevIndex = (currentIndex - 1 + workspaces.length) % workspaces.length;
          setActiveWorkspace(workspaces[prevIndex].id);
        },
        shortcutId: 'window:prev-workspace',
        keywords: ['workspace', 'switch'],
      },
      {
        id: 'refresh-page',
        title: 'Refresh Page',
        description: 'Reload the current page',
        category: 'system' as const,
        action: () => window.location.reload(),
        shortcutId: 'general:refresh',
        keywords: ['reload', 'refresh'],
      },
    ];

    registerCommands(commands);

    return () => {
      unregisterCommands(commands.map(cmd => cmd.id));
    };
  }, [registerCommands, unregisterCommands, workspaces, activeWorkspaceId, setActiveWorkspace]);

  useEffect(() => {
    refreshMultiWallet().catch(error => {
      console.error('Failed to refresh multi-wallet state', error);
    });
  }, [refreshMultiWallet]);

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const status = await invoke<BiometricStatus>('biometric_get_status');
        if (status.enrolled) {
          setLockVisible(true);
        }
      } catch (error) {
        console.error('Failed to refresh biometric status on resume', error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<BiometricStatus>).detail;
      if (detail) {
        setLockVisible(detail.enrolled);
      }
    };

    window.addEventListener(BIOMETRIC_STATUS_EVENT, handler as EventListener);
    return () => {
      window.removeEventListener(BIOMETRIC_STATUS_EVENT, handler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!isPaperMode && currentPage === 'paper-trading') {
      setCurrentPage('trading');
    }
  }, [isPaperMode, currentPage]);

  const handleOpenChart = (symbol: string, timestamp: string) => {
    setChartSymbol(symbol);
    setChartTimestamp(timestamp);
  };

  const handleCloseChart = () => {
    setChartSymbol(null);
    setChartTimestamp(null);
  };

  const handleQuickTrade = (symbol: string) => {
    setCurrentPage('trading');
    handleCloseChart();
  };

  const pages = useMemo(() => {
    const basePages = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, component: Dashboard, panelType: 'dashboard' as PanelType },
      { id: 'coins', label: 'Coins', icon: TrendingUp, component: Coins, panelType: 'coins' as PanelType },
      { id: 'portfolio', label: 'Portfolio', icon: Briefcase, component: Portfolio, panelType: 'portfolio' as PanelType },
      {
        id: 'portfolio-analytics',
        label: 'Portfolio Analytics',
        icon: Activity,
        component: PortfolioAnalytics,
        panelType: 'portfolio-analytics' as PanelType,
      },
      { id: 'multisig', label: 'Multisig', icon: Shield, component: Multisig, panelType: 'multisig' as PanelType },
      { id: 'stocks', label: 'Stocks', icon: BarChart3, component: Stocks, panelType: 'stocks' as PanelType },
      { id: 'insiders', label: 'Insiders', icon: Users, component: Insiders, panelType: 'insiders' as PanelType },
      { id: 'token-flow', label: 'Token Flow', icon: Network, component: TokenFlow, panelType: 'token-flow' as PanelType },
      {
        id: 'surveillance',
        label: 'Market Surveillance',
        icon: AlertTriangle,
        component: MarketSurveillance,
        panelType: 'surveillance' as PanelType,
      },
      { id: 'dashboard', label: 'Dashboard', icon: Home, component: Dashboard },
      { id: 'coins', label: 'Coins', icon: TrendingUp, component: Coins },
      { id: 'portfolio', label: 'Portfolio', icon: Briefcase, component: Portfolio },
      { id: 'portfolio-analytics', label: 'Portfolio Analytics', icon: Activity, component: PortfolioAnalytics },
      { id: 'wallet', label: 'Wallet', icon: WalletIcon, component: Wallet },
      { id: 'multi-chain', label: 'Multi-Chain', icon: ArrowRightLeft, component: MultiChain },
      { id: 'multisig', label: 'Multisig', icon: Shield, component: Multisig },
      { id: 'stocks', label: 'Stocks', icon: BarChart3, component: Stocks },
      { id: 'insiders', label: 'Insiders', icon: Users, component: Insiders },
      { id: 'token-flow', label: 'Token Flow', icon: Network, component: TokenFlow },
      { id: 'surveillance', label: 'Market Surveillance', icon: AlertTriangle, component: MarketSurveillance },
      {
        id: 'trading',
        label: isPaperMode ? 'Live Trading' : 'Trading',
        icon: Bell,
        component: Trading,
        panelType: 'trading' as PanelType,
      },
      { id: 'pro-charts', label: 'Pro Charts', icon: LineChart, component: ProCharts, panelType: 'pro-charts' as PanelType },
      { id: 'ai-analysis', label: 'AI Assistant', icon: MessageSquare, component: AIAnalysis, panelType: 'ai-analysis' as PanelType },
      { id: 'prediction-markets', label: 'Prediction Markets', icon: PieChart, component: PredictionMarkets, panelType: 'prediction-markets' as PanelType },
      { id: 'defi', label: 'DeFi', icon: BanknoteIcon, component: DeFi, panelType: 'defi' as PanelType },
      { id: 'historical-replay', label: 'Historical Replay', icon: Clock, component: HistoricalReplay, panelType: 'historical-replay' as PanelType },
      { id: 'api-health', label: 'API Health', icon: Activity, component: ApiHealth, panelType: 'api-health' as PanelType },
      { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPage, panelType: 'settings' as PanelType },
      { id: 'advanced-settings', label: 'Advanced Settings', icon: LayoutGrid, component: AdvancedSettings, panelType: 'settings' as PanelType },
    ];

    if (isPaperMode) {
      basePages.splice(6, 0, {
        id: 'paper-trading',
        label: 'Paper Trading',
        icon: FileText,
        component: PaperTradingDashboard,
        panelType: 'paper-trading' as PanelType,
      });
    }

    return basePages;
  }, [isPaperMode]);

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard;

  const navigateToPage = useCallback(
    (pageId: string) => {
      const target = pages.find(page => page.id === pageId);
      if (!target) return;

      setCurrentPage(pageId);
      if (useWorkspaceMode && target.panelType) {
        ensurePanelForPage(target.panelType);
      }
      setSidebarOpen(false);
    },
    [pages, useWorkspaceMode, ensurePanelForPage]
  );

  const cycleWorkspace = useCallback(
    (direction: 'next' | 'prev') => {
      if (!workspaces.length) return;

      const currentIndex = Math.max(workspaces.findIndex(w => w.id === activeWorkspaceId), 0);
      const offset = direction === 'next' ? 1 : -1;
      const nextIndex = (currentIndex + offset + workspaces.length) % workspaces.length;
      const target = workspaces[nextIndex];
      if (target) {
        setActiveWorkspace(target.id);
      }
    },
    [workspaces, activeWorkspaceId, setActiveWorkspace]
  );

  const emitShortcutAction = useCallback((action: string, payload?: Record<string, unknown>) => {
    window.dispatchEvent(new CustomEvent('app:shortcut-action', { detail: { action, payload } }));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (typeof document === 'undefined') return;
    const doc: any = document;
    const docEl: any = document.documentElement;

    if (!docEl) return;

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) {
        doc.exitFullscreen().catch(() => undefined);
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
      emitShortcutAction('window:fullscreen', { enabled: false });
    } else {
      const request = docEl.requestFullscreen || docEl.webkitRequestFullscreen;
      if (request) {
        Promise.resolve(request.call(docEl)).catch(() => undefined);
        emitShortcutAction('window:fullscreen', { enabled: true });
      }
    }
  }, [emitShortcutAction]);

  const handleShortcutAction = useCallback(
    (action: string) => {
      switch (action) {
        case 'nav:dashboard':
        case 'nav:coins':
        case 'nav:portfolio':
        case 'nav:trading':
        case 'nav:defi':
        case 'nav:settings':
          navigateToPage(action.split(':')[1]);
          emitShortcutAction(action);
          break;
        case 'window:toggle-sidebar':
          setSidebarOpen(prev => {
            const next = !prev;
            emitShortcutAction(action, { open: next });
            return next;
          });
          break;
        case 'window:next-workspace':
          cycleWorkspace('next');
          emitShortcutAction(action);
          break;
        case 'window:prev-workspace':
          cycleWorkspace('prev');
          emitShortcutAction(action);
          break;
        case 'window:fullscreen':
          toggleFullscreen();
          break;
        case 'general:refresh':
          emitShortcutAction(action);
          window.location.reload();
          break;
        case 'general:search':
          emitShortcutAction(action);
          break;
        case 'tools:calculator':
          setCommandPaletteOpen(true);
          emitShortcutAction(action);
          break;
        case 'tools:export':
          emitShortcutAction(action);
          break;
        case 'trading:quick-buy':
        case 'trading:quick-sell':
        case 'trading:swap':
        case 'trading:limit-order':
        case 'trading:cancel-all':
          navigateToPage('trading');
          emitShortcutAction(action);
          break;
        default:
          emitShortcutAction(action);
          break;
      }
    },
    [navigateToPage, emitShortcutAction, setCommandPaletteOpen, cycleWorkspace, toggleFullscreen, sidebarOpen]
  );

  const handleSwitchToLive = () => {
    setCurrentPage('settings');
  };

  const handleAddPanelToWorkspace = useCallback(
    (panelType: PanelType) => {
      if (!activeWorkspaceId) return;

      const { panel, layout } = createPanelDefinition(panelType);
      addPanelToWorkspace(activeWorkspaceId, panel, layout);
      setSidebarOpen(false);
    },
    [activeWorkspaceId, addPanelToWorkspace]
  );

  const ensurePanelForPage = useCallback(
    (panelType: PanelType) => {
      if (!useWorkspaceMode || !activeWorkspace) return;

      const existingPanel = activeWorkspace.layout.panels.find(panel => panel.type === panelType);
      if (existingPanel) {
        setPanelMinimized(activeWorkspace.id, existingPanel.id, false);
        return;
      }

      handleAddPanelToWorkspace(panelType);
    },
    [useWorkspaceMode, activeWorkspace, setPanelMinimized, handleAddPanelToWorkspace]
  );

  return (
    <div
      className="min-h-screen eclipse-gradient text-[var(--color-text)]"
      data-theme={currentTheme.id}
    >
      <a href="#main-content" className="skip-link" aria-label="Skip to main content">
        Skip to main content
      </a>

      <PaperModeIndicator onSwitchToLive={handleSwitchToLive} />

      <header
        className={`glass-header sticky z-40 backdrop-blur-xl border-b ${isPaperMode ? 'top-[52px]' : 'top-0'}`}
        style={{
          backgroundColor: 'var(--color-background-secondary-80)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="flex items-center gap-3 hover:opacity-80 transition-all group"
              >
                <motion.div
                  animate={{ rotate: sidebarOpen ? 180 : 0 }}
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-[var(--color-background)] lunar-glow"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.92), rgba(255, 140, 66, 0.85))',
                    boxShadow: '0 0 30px rgba(255, 107, 53, var(--effect-glow-strength))',
                  }}
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
                <span className="text-xl font-bold">Eclipse Market Pro</span>
              </button>
            </div>

            <div className="flex items-center gap-4" data-help="header-controls">
              <button
                onClick={() => setTutorialMenuOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/60 border border-purple-500/20 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:border-purple-400/30 transition"
                data-tutorial="tutorials-menu"
              >
                <GraduationCap className="w-4 h-4" aria-hidden="true" />
                Tutorials
              </button>
              <button
                onClick={() => setCommandPaletteOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-800/60 border border-purple-500/20 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:border-purple-400/30 transition"
                data-tutorial="command-palette"
              >
                <Command className="w-4 h-4" aria-hidden="true" />
                Command
              </button>
              <HelpButton />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUseWorkspaceMode(!useWorkspaceMode)}
                className={`p-2 rounded-lg transition-all ${
                  useWorkspaceMode
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                    : 'bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20'
                }`}
                title={useWorkspaceMode ? 'Switch to Page Mode' : 'Switch to Workspace Mode'}
                data-tutorial="workspace-mode"
              >
                <LayoutGrid className="w-5 h-5" />
              </motion.button>
              <div data-tutorial="chain-selector">
                <ChainSelector />
              </div>
              <div data-tutorial="wallet-connect" data-help="wallet-connect">
                <WalletSwitcher
                  onAddWallet={() => setAddWalletModalOpen(true)}
                  onManageGroups={() => setGroupsModalOpen(true)}
                  onWalletSettings={walletId => {
                    setSelectedWalletId(walletId);
                    setWalletSettingsModalOpen(true);
                  }}
                />
              </div>
              <PhantomConnect />
              <NetworkStatusIndicator />
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.aside
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 25 }}
              className="glass-panel fixed left-0 top-0 bottom-0 w-80 z-50 backdrop-blur-xl border-r shadow-2xl overflow-y-auto"
              style={{
                borderColor: 'rgba(255, 140, 66, 0.2)',
              }}
              data-tutorial="sidebar"
            >
              <div className="p-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2 text-moonlight-silver">Navigation</h2>
                  <div className="h-px bg-gradient-to-r from-[rgba(255,140,66,0.45)] via-[rgba(78,205,196,0.25)] to-transparent"></div>
                </div>

                <div className="space-y-4 mb-8">
                  <button
                    onClick={() => {
                      setTutorialMenuOpen(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl glass-card transition-all group hover:-translate-y-0.5"
                  >
                    <GraduationCap className="w-5 h-5 text-[var(--color-eclipse-orange)] group-hover:opacity-80 transition" />
                    <span className="font-medium text-moonlight-silver">Tutorials</span>
                  </button>
                  <button
                    onClick={() => {
                      setCommandPaletteOpen(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl glass-panel transition-all group hover:-translate-y-0.5"
                    data-tutorial="command-palette"
                  >
                    <Command className="w-5 h-5 text-[var(--color-info)] group-hover:opacity-80 transition" />
                    <span className="font-medium text-moonlight-silver">Command Palette</span>
                  </button>
                  <button
                    onClick={() => {
                      setCheatSheetOpen(true);
                      setSidebarOpen(false);
                    }}
                    className="w-full flex items-center gap-4 px-4 py-3 rounded-xl glass-panel transition-all group hover:-translate-y-0.5"
                  >
                    <Keyboard className="w-5 h-5 text-[var(--color-info)] group-hover:opacity-80 transition" />
                    <span className="font-medium text-moonlight-silver">Keyboard Shortcuts</span>
                  </button>
                </div>

                <nav className="space-y-2">
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => {
                        if (useWorkspaceMode) {
                          setCurrentPage(page.id);
                          ensurePanelForPage(page.panelType);
                          setSidebarOpen(false);
                        } else {
                          setCurrentPage(page.id);
                          setSidebarOpen(false);
                        }
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        currentPage === page.id
                          ? 'glass-card lunar-glow'
                          : 'glass-panel hover:-translate-y-0.5'
                      }`}
                      style={
                        currentPage === page.id
                          ? { borderColor: 'rgba(255, 140, 66, 0.45)' }
                          : undefined
                      }
                    >
                      <page.icon className={`w-5 h-5 ${currentPage === page.id ? 'text-[var(--color-eclipse-orange)]' : 'text-moonlight-silver'}`} />
                      <span className={`font-medium ${currentPage === page.id ? 'text-[var(--color-eclipse-orange)]' : 'text-moonlight-silver'}`}>{page.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {useWorkspaceMode ? (
        <div id="main-content" className="max-w-[1800px] mx-auto px-6 py-8 space-y-6 relative" role="main">
          <WorkspaceTabs />
          <WorkspaceToolbar />
          <GridLayoutContainer />
          <FloatingWindowManager />
        </div>
      ) : (
        <main id="main-content" className="max-w-[1800px] mx-auto px-6 py-8" role="main">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <CurrentPageComponent />
            </motion.div>
          </AnimatePresence>
        </main>
      )}

      {!initializingLock && lockVisible && <LockScreen onUnlock={() => setLockVisible(false)} />}

      <PaperTradingTutorial />

      <AddWalletModal isOpen={addWalletModalOpen} onClose={() => setAddWalletModalOpen(false)} />
      <GroupManagementModal isOpen={groupsModalOpen} onClose={() => setGroupsModalOpen(false)} />
      <WalletSettingsModal
        isOpen={walletSettingsModalOpen}
        onClose={() => {
          setWalletSettingsModalOpen(false);
          setSelectedWalletId(null);
        }}
        walletId={selectedWalletId}
      />

      <ProposalNotification
        notifications={proposalNotifications}
        onDismiss={dismissProposalNotification}
        onOpenProposal={id => {
          setCurrentPage('multisig');
          dismissProposalNotification(id);
        }}
      />

      <AlertNotificationContainer onOpenChart={handleOpenChart} />

      {chartSymbol && (
        <AlertChartModal
          isOpen={true}
          symbol={chartSymbol}
          timestamp={chartTimestamp || undefined}
          onClose={handleCloseChart}
          onQuickTrade={handleQuickTrade}
        />
      )}

      <WorkspaceSwitcher />

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
      <ShortcutCheatSheet isOpen={cheatSheetOpen} onClose={() => setCheatSheetOpen(false)} />

      <UpdateNotificationModal />
      <PerformanceMonitor />
      
      <TutorialEngine />
      <TutorialMenu
        currentPage={currentPage}
        isOpen={tutorialMenuOpen}
        onClose={() => setTutorialMenuOpen(false)}
      />
      <HelpPanel />
      <WhatsThisMode />
      <ChangelogViewer />
      <WhatsNewModal currentVersion={currentVersion} />
      <MaintenanceBanner />
      <DeveloperConsole />
      <VoiceNotificationRouter />
      <VoiceTradingOverlay />
    </div>
  );
}

export default App;
