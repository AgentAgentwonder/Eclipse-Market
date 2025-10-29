import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, TrendingUp, BarChart3, Users, Bell, Settings, Briefcase, Loader2, FileText, Shield, Activity } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { PhantomConnect } from './components/wallet/PhantomConnect'
import { WalletSwitcher } from './components/wallet/WalletSwitcher'
import { AddWalletModal } from './components/wallet/AddWalletModal'
import { GroupManagementModal } from './components/wallet/GroupManagementModal'
import { WalletSettingsModal } from './components/wallet/WalletSettingsModal'
import { LockScreen } from './components/auth/LockScreen'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import { PaperModeIndicator } from './components/trading/PaperModeIndicator'
import { PaperTradingTutorial } from './components/trading/PaperTradingTutorial'
import ProposalNotification from './components/wallet/ProposalNotification'
import Dashboard from './pages/Dashboard'
import Coins from './pages/Coins'
import Stocks from './pages/Stocks'
import Insiders from './pages/Insiders'
import Trading from './pages/Trading'
import Portfolio from './pages/Portfolio'
import Multisig from './pages/Multisig'
import ApiHealth from './pages/ApiHealth'
import { PaperTradingDashboard } from './pages/PaperTrading/Dashboard'
import SettingsPage from './pages/Settings'
import { BIOMETRIC_STATUS_EVENT } from './constants/events'
import { useWalletStore } from './store/walletStore'
import { usePaperTradingStore } from './store/paperTradingStore'
import { useAlertNotifications } from './hooks/useAlertNotifications'
import { useEffect, useMemo, useState } from 'react';
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
  Loader2,
  FileText,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { PhantomConnect } from './components/wallet/PhantomConnect';
import { WalletSwitcher } from './components/wallet/WalletSwitcher';
import { AddWalletModal } from './components/wallet/AddWalletModal';
import { GroupManagementModal } from './components/wallet/GroupManagementModal';
import { WalletSettingsModal } from './components/wallet/WalletSettingsModal';
import { LockScreen } from './components/auth/LockScreen';
import { ConnectionStatus } from './components/common/ConnectionStatus';
import { PaperModeIndicator } from './components/trading/PaperModeIndicator';
import { PaperTradingTutorial } from './components/trading/PaperTradingTutorial';
import Dashboard from './pages/Dashboard';
import Coins from './pages/Coins';
import Stocks from './pages/Stocks';
import Insiders from './pages/Insiders';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import { PaperTradingDashboard } from './pages/PaperTrading/Dashboard';
import SettingsPage from './pages/Settings';
import { BIOMETRIC_STATUS_EVENT } from './constants/events';
import { useWalletStore } from './store/walletStore';
import { usePaperTradingStore } from './store/paperTradingStore';
import { useAlertNotifications } from './hooks/useAlertNotifications';

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

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lockVisible, setLockVisible] = useState(false)
  const [initializingLock, setInitializingLock] = useState(true)
  const [addWalletModalOpen, setAddWalletModalOpen] = useState(false)
  const [groupsModalOpen, setGroupsModalOpen] = useState(false)
  const [walletSettingsModalOpen, setWalletSettingsModalOpen] = useState(false)
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)

  const wallets = useWalletStore((state) => state.wallets)
  const refreshMultiWallet = useWalletStore((state) => state.refreshMultiWallet)
  const { isPaperMode, togglePaperMode } = usePaperTradingStore()
  const proposalNotifications = useWalletStore((state) => state.proposalNotifications)
  const dismissProposalNotification = useWalletStore((state) => state.dismissProposalNotification)
  const wallets = useWalletStore(state => state.wallets);
  const refreshMultiWallet = useWalletStore(state => state.refreshMultiWallet);
  const { isPaperMode, togglePaperMode } = usePaperTradingStore();

  useAlertNotifications();

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

  const pages = useMemo(() => {
    const basePages = [
      { id: 'dashboard', label: 'Dashboard', icon: Home, component: Dashboard },
      { id: 'coins', label: 'Coins', icon: TrendingUp, component: Coins },
      { id: 'portfolio', label: 'Portfolio', icon: Briefcase, component: Portfolio },
      { id: 'multisig', label: 'Multisig', icon: Shield, component: Multisig },
      { id: 'stocks', label: 'Stocks', icon: BarChart3, component: Stocks },
      { id: 'insiders', label: 'Insiders', icon: Users, component: Insiders },
      {
        id: 'trading',
        label: isPaperMode ? 'Live Trading' : 'Trading',
        icon: Bell,
        component: Trading,
      },
      { id: 'api-health', label: 'API Health', icon: Activity, component: ApiHealth },
      { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPage },
    ];

    if (isPaperMode) {
      basePages.splice(5, 0, {
        id: 'paper-trading',
        label: 'Paper Trading',
        icon: FileText,
        component: PaperTradingDashboard,
      });
    }

    return basePages;
  }, [isPaperMode]);

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard;

  const handleSwitchToLive = () => {
    setCurrentPage('settings');
    // Let the user switch in Settings
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Paper Mode Indicator Banner */}
      <PaperModeIndicator onSwitchToLive={handleSwitchToLive} />

      {/* Top Bar */}
      <header
        className={`sticky z-40 backdrop-blur-xl bg-slate-900/80 border-b border-purple-500/20 ${isPaperMode ? 'top-[52px]' : 'top-0'}`}
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
                  className="w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50"
                >
                  {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
                <span className="text-xl font-bold">Eclipse Market Pro</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              <WalletSwitcher
                onAddWallet={() => setAddWalletModalOpen(true)}
                onManageGroups={() => setGroupsModalOpen(true)}
                onWalletSettings={walletId => {
                  setSelectedWalletId(walletId);
                  setWalletSettingsModalOpen(true);
                }}
              />
              <PhantomConnect />
              <ConnectionStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar */}
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
              className="fixed left-0 top-0 bottom-0 w-80 z-50 bg-slate-900/95 backdrop-blur-xl border-r border-purple-500/20 shadow-2xl overflow-y-auto"
            >
              <div className="p-6">
                <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Navigation</h2>
                  <div className="h-px bg-gradient-to-r from-purple-500/50 to-transparent"></div>
                </div>

                <nav className="space-y-2">
                  {pages.map(page => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setCurrentPage(page.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${
                        currentPage === page.id
                          ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <page.icon className="w-5 h-5" />
                      <span className="font-medium">{page.label}</span>
                    </button>
                  ))}
                </nav>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="max-w-[1800px] mx-auto px-6 py-8">
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

      {/* Lock Screen */}
      {!initializingLock && lockVisible && <LockScreen onUnlock={() => setLockVisible(false)} />}

      {/* Paper Trading Tutorial */}
      <PaperTradingTutorial />

      {/* Multi-Wallet Modals */}
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
        onOpenProposal={(id) => {
          setCurrentPage('multisig')
          dismissProposalNotification(id)
        }}
      />
    </div>
  );
}

export default App;
