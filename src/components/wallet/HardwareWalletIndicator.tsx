import { motion } from 'framer-motion';
import { Usb, AlertTriangle } from 'lucide-react';
import { useWalletStore } from '../../store/walletStore';

interface HardwareWalletIndicatorProps {
  onClick: () => void;
}

function HardwareWalletIndicator({ onClick }: HardwareWalletIndicatorProps) {
  const { activeHardwareDevice, signingMethod } = useWalletStore();

  const isConnected = Boolean(activeHardwareDevice?.connected);
  const label = activeHardwareDevice
    ? `${activeHardwareDevice.deviceType === 'ledger' ? 'Ledger' : 'Trezor'}${
        isConnected ? '' : ' (disconnected)'
      }`
    : 'No device';

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
        isConnected
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-purple-500/30 bg-slate-800 text-white/70'
      }`}
    >
      {isConnected ? (
        <Usb className="w-4 h-4" />
      ) : (
        <AlertTriangle className="w-4 h-4 text-yellow-400" />
      )}
      <span>{label}</span>
      <span className="text-xs uppercase tracking-wide bg-black/30 px-2 py-0.5 rounded-lg">
        {signingMethod === 'hardware' ? 'HW' : 'SW'}
      </span>
    </motion.button>
  );
}

export default HardwareWalletIndicator;
