import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Home, TrendingUp, BarChart3, Users, Bell, Settings, Briefcase, Gamepad2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { PhantomConnect } from './components/wallet/PhantomConnect'
import { LockScreen } from './components/auth/LockScreen'
import { ConnectionStatus } from './components/common/ConnectionStatus'
import Dashboard from './pages/Dashboard'
import Coins from './pages/Coins'
import Stocks from './pages/Stocks'
import Insiders from './pages/Insiders'
import Trading from './pages/Trading'
import Portfolio from './pages/Portfolio'
import PaperTrading from './pages/PaperTrading'
import SettingsPage from './pages/Settings'
import { BIOMETRIC_STATUS_EVENT } from './constants/events'
import { usePaperTradingStore } from './store/paperTradingStore'

type BiometricStatus = {
  available: boolean
  enrolled: boolean
  fallbackConfigured: boolean
  platform: 'WindowsHello' | 'TouchId' | 'PasswordOnly'
}

function App() {
  const paperEnabled = usePaperTradingStore((state) => state.enabled)
  const checkPaperStatus = usePaperTradingStore((state) => state.checkStatus)

  const [currentPage, setCurrentPage] = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [lockVisible, setLockVisible] = useState(false)
  const [initializingLock, setInitializingLock] = useState(true)

  useEffect(() => {
    const hydrate = async () => {
      try {
        const status = await invoke<BiometricStatus>('biometric_get_status')
        setLockVisible(Boolean(status.enrolled))
      } catch (error) {
        console.error('Failed to hydrate biometric status', error)
        setLockVisible(false)
      } finally {
        setInitializingLock(false)
      }
    }

    hydrate()
    checkPaperStatus()
  }, [checkPaperStatus])

  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const status = await invoke<BiometricStatus>('biometric_get_status')
        if (status.enrolled) {
          setLockVisible(true)
        }
      } catch (error) {
        console.error('Failed to refresh biometric status on resume', error)
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<BiometricStatus>).detail
      if (detail) {
        setLockVisible(detail.enrolled)
      }
    }

    window.addEventListener(BIOMETRIC_STATUS_EVENT, handler as EventListener)
    return () => {
      window.removeEventListener(BIOMETRIC_STATUS_EVENT, handler as EventListener)
    }
  }, [])

  const pages = useMemo(
    () => [
      { id: 'dashboard', label: 'Dashboard', icon: Home, component: Dashboard },
      { id: 'coins', label: 'Coins', icon: TrendingUp, component: Coins },
      { id: 'portfolio', label: 'Portfolio', icon: Briefcase, component: Portfolio },
      { id: 'stocks', label: 'Stocks', icon: BarChart3, component: Stocks },
      { id: 'insiders', label: 'Insiders', icon: Users, component: Insiders },
      { id: 'trading', label: 'Trading', icon: Bell, component: Trading },
      { id: 'paper-trading', label: 'Paper Trading', icon: Gamepad2, component: PaperTrading },
      { id: 'settings', label: 'Settings', icon: Settings, component: SettingsPage },
    ],
    []
  )

  const CurrentPageComponent = pages.find(p => p.id === currentPage)?.component || Dashboard

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-900/80 border-b border-purple-500/20">
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
              {paperEnabled && (
                <div className="px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">
                    Paper Mode
                  </span>
                </div>
              )}
              <PhantomConnect />
              <ConnectionStatus />
            </div>
          </div>

          {paperEnabled && (
            <div className="mt-4 flex items-center gap-3 px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-green-100">
              <Gamepad2 className="w-4 h-4" />
              <span>Paper trading mode is active. All orders are simulated until you switch back to live trading.</span>
            </div>
          )}
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
                  {pages.map((page) => (
                    <button
                      key={page.id}
                      onClick={() => {
                        setCurrentPage(page.id)
                        setSidebarOpen(false)
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
      {!initializingLock && lockVisible && (
        <LockScreen onUnlock={() => setLockVisible(false)} />
      )}
    </div>
  )
}

export default App