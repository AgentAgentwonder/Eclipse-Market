import { useState } from 'react'
import { Wallet, Usb, X } from 'lucide-react'
import { motion } from 'framer-motion'
import { PhantomConnect } from './PhantomConnect'
import { HardwareWalletWizard } from './HardwareWalletWizard'
import { HardwareWalletStatus } from './HardwareWalletStatus'
import { useWalletStore } from '../../store/walletStore'

export function WalletSelector() {
  const [showWalletOptions, setShowWalletOptions] = useState(false)
  const [showHardwareWizard, setShowHardwareWizard] = useState(false)
  const {
    status,
    hardwareStatus,
    walletType,
    setWalletType,
  } = useWalletStore((state) => ({
    status: state.status,
    hardwareStatus: state.hardwareStatus,
    walletType: state.walletType,
    setWalletType: state.setWalletType,
  }))

  const isPhantomConnected = status === 'connected'

  if (walletType === 'ledger' || walletType === 'trezor') {
    return <HardwareWalletStatus />
  }

  if (walletType === 'phantom' || isPhantomConnected) {
    return <PhantomConnect />
  }

  if (showHardwareWizard) {
    return (
      <HardwareWalletWizard
        onComplete={() => {
          setShowHardwareWizard(false)
          setShowWalletOptions(false)
        }}
        onCancel={() => setShowHardwareWizard(false)}
      />
    )
  }

  return (
    <>
      {!showWalletOptions ? (
        <button
          onClick={() => setShowWalletOptions(true)}
          className="px-6 py-2 rounded-xl font-medium transition-all shadow-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-purple-500/30"
        >
          Connect Wallet
        </button>
      ) : (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-40 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-900 rounded-2xl border border-gray-700 max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Choose Wallet</h2>
              <button
                onClick={() => setShowWalletOptions(false)}
                className="p-2 hover:bg-gray-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <motion.button
                onClick={() => {
                  setWalletType('phantom')
                  setShowWalletOptions(false)
                }}
                className="w-full p-4 rounded-xl border-2 border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-all">
                    <Wallet className="w-6 h-6 text-purple-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Phantom Wallet</div>
                    <div className="text-sm text-gray-400">Browser extension wallet</div>
                  </div>
                </div>
              </motion.button>

              <motion.button
                onClick={() => {
                  setShowHardwareWizard(true)
                  setShowWalletOptions(false)
                }}
                className="w-full p-4 rounded-xl border-2 border-gray-600 hover:border-purple-500 hover:bg-purple-500/10 transition-all text-left group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-all">
                    <Usb className="w-6 h-6 text-green-400" />
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">Hardware Wallet</div>
                    <div className="text-sm text-gray-400">Ledger or Trezor device</div>
                  </div>
                </div>
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
