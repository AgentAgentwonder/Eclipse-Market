import { useState } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useAlertStore,
  AlertConditionType,
  LogicalOperator,
  NotificationChannel,
} from '../../store/alertStore';
import ConditionBuilder from './ConditionBuilder';

interface CreateAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSymbol?: string;
  prefilledMint?: string;
}

const defaultCondition = {
  conditionType: 'above' as AlertConditionType,
  value: 100,
  timeframeMinutes: null,
};

const channelOptions: NotificationChannel[] = [
  'in_app',
  'system',
  'email',
  'webhook',
  'telegram',
  'slack',
  'discord',
];

const CreateAlertModal = ({
  isOpen,
  onClose,
  prefilledSymbol,
  prefilledMint,
}: CreateAlertModalProps) => {
  const { createAlert } = useAlertStore();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState(prefilledSymbol || '');
  const [mint, setMint] = useState(prefilledMint || '');
  const [compoundCondition, setCompoundCondition] = useState({
    conditions: [defaultCondition],
    operator: 'and' as LogicalOperator,
  });
  const [notificationChannels, setNotificationChannels] = useState<NotificationChannel[]>([
    'in_app',
  ]);
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [isLoading, setIsLoading] = useState(false);

  const toggleChannel = (channel: NotificationChannel) => {
    setNotificationChannels(prev =>
      prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]
    );
  };

  const handleSubmit = async () => {
    if (!name.trim() || !symbol.trim() || !mint.trim()) {
      alert('Name, symbol, and mint are required');
      return;
    }

    try {
      setIsLoading(true);
      await createAlert({
        id: '',
        name,
        symbol,
        mint,
        watchlistId: null,
        compoundCondition,
        notificationChannels,
        cooldownMinutes,
        state: 'active',
        lastTriggeredAt: null,
        cooldownUntil: null,
        createdAt: '',
        updatedAt: '',
      } as never);
      onClose();
    } catch (error) {
      console.error('Failed to create alert:', error);
      alert('Failed to create alert: ' + error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <motion.div
          className="bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl w-full max-w-3xl p-6"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">Create Price Alert</h3>
              <p className="text-sm text-slate-400">Build compound conditions with cooldowns</p>
            </div>
            <button className="p-2 rounded-full hover:bg-slate-800 transition" onClick={onClose}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Alert Name</label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Solana breakout"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Cool Down (minutes)</label>
                <input
                  type="number"
                  min={1}
                  value={cooldownMinutes}
                  onChange={e => setCooldownMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Symbol</label>
                <input
                  value={symbol}
                  onChange={e => setSymbol(e.target.value)}
                  placeholder="SOL"
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
              <div>
                <label className="text-sm text-slate-400 mb-1 block">Mint</label>
                <input
                  value={mint}
                  onChange={e => setMint(e.target.value)}
                  placeholder="So1111..."
                  className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                />
              </div>
            </div>

            <ConditionBuilder value={compoundCondition} onChange={setCompoundCondition} />

            <div>
              <p className="text-sm text-slate-400 mb-2">Notification Channels</p>
              <div className="flex flex-wrap gap-2">
                {channelOptions.map(channel => (
                  <button
                    key={channel}
                    className={`px-3 py-1.5 rounded-xl border transition text-sm capitalize ${
                      notificationChannels.includes(channel)
                        ? 'bg-purple-500 text-white border-purple-400'
                        : 'bg-slate-800/60 text-slate-300 border-transparent hover:bg-slate-800'
                    }`}
                    onClick={() => toggleChannel(channel)}
                    type="button"
                  >
                    {channel.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 transition"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 flex items-center gap-2 transition"
                onClick={handleSubmit}
                disabled={isLoading}
                type="button"
              >
                Create
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CreateAlertModal;
