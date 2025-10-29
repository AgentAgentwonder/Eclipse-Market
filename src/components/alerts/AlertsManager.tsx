import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Play, Pause, Bell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAlertStore, PriceAlert } from '../../store/alertStore';
import CreateAlertModal from './CreateAlertModal';

interface AlertsManagerProps {
  isOpen: boolean;
  onClose: () => void;
  prefilledSymbol?: string;
  prefilledMint?: string;
}

const AlertsManager = ({ isOpen, onClose, prefilledSymbol, prefilledMint }: AlertsManagerProps) => {
  const { alerts, fetchAlerts, deleteAlert, updateAlert, testAlert } = useAlertStore();
  const [isCreating, setIsCreating] = useState(false);
  const [testingAlertId, setTestingAlertId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts().catch(console.error);
    }
  }, [isOpen, fetchAlerts]);

  useEffect(() => {
    if (prefilledSymbol && prefilledMint) {
      setIsCreating(true);
    }
  }, [prefilledSymbol, prefilledMint]);

  const handleToggleState = async (alert: PriceAlert) => {
    try {
      const newState = alert.state === 'active' ? 'disabled' : 'active';
      await updateAlert(alert.id, { state: newState });
    } catch (error) {
      console.error('Failed to toggle alert:', error);
      alert('Failed to toggle alert: ' + error);
    }
  };

  const handleTest = async (alert: PriceAlert) => {
    setTestingAlertId(alert.id);
    try {
      const result = await testAlert(alert.id, 100, 95, 1000000);
      alert(
        `Alert Test Result:\n\nWould trigger: ${result.wouldTrigger ? 'YES' : 'NO'}\nCurrent price: $${result.currentPrice}\n\n${result.message}`
      );
    } catch (error) {
      console.error('Failed to test alert:', error);
      alert('Failed to test alert: ' + error);
    } finally {
      setTestingAlertId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return;

    try {
      await deleteAlert(id);
    } catch (error) {
      console.error('Failed to delete alert:', error);
      alert('Failed to delete alert: ' + error);
    }
  };

  const getStateColor = (state: string) => {
    switch (state) {
      case 'active':
        return 'text-emerald-400 bg-emerald-500/20';
      case 'triggered':
        return 'text-yellow-400 bg-yellow-500/20';
      case 'cooldown':
        return 'text-blue-400 bg-blue-500/20';
      case 'disabled':
        return 'text-slate-400 bg-slate-500/20';
      default:
        return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getConditionText = (alert: PriceAlert) => {
    const { conditions, operator } = alert.compoundCondition;
    if (conditions.length === 1) {
      const c = conditions[0];
      switch (c.conditionType) {
        case 'above':
          return `Price above $${c.value}`;
        case 'below':
          return `Price below $${c.value}`;
        case 'percent_change':
          return `Price change ±${c.value}%`;
        case 'volume_spike':
          return `Volume above $${c.value}`;
        default:
          return 'Custom condition';
      }
    }
    return `${conditions.length} conditions (${operator.toUpperCase()})`;
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          className="bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Price Alerts</h2>
              <p className="text-sm text-slate-400">{alerts.length} total alerts</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 flex items-center gap-2 transition"
                onClick={() => setIsCreating(true)}
              >
                <Plus className="w-4 h-4" />
                Create Alert
              </button>
              <button className="p-2 rounded-full hover:bg-slate-800 transition" onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-4">
              {alerts.map(alert => (
                <motion.div
                  key={alert.id}
                  className="bg-slate-800/60 border border-purple-500/10 rounded-2xl p-6 hover:border-purple-500/30 transition"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{alert.name}</h3>
                        <span
                          className={`px-2 py-1 rounded-lg text-xs font-medium uppercase ${getStateColor(
                            alert.state
                          )}`}
                        >
                          {alert.state}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 mb-2">
                        {alert.symbol} • {alert.mint.slice(0, 12)}...
                      </p>
                      <p className="text-sm text-purple-300">{getConditionText(alert)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        className={`p-2 rounded-lg transition ${
                          alert.state === 'active'
                            ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30'
                            : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                        }`}
                        onClick={() => handleToggleState(alert)}
                        title={alert.state === 'active' ? 'Disable' : 'Enable'}
                      >
                        {alert.state === 'active' ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 transition"
                        onClick={() => handleTest(alert)}
                        disabled={testingAlertId === alert.id}
                        title="Test alert"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                      <button
                        className="p-2 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                        onClick={() => handleDelete(alert.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-1">Notification Channels</p>
                      <div className="flex gap-2 flex-wrap">
                        {alert.notificationChannels.map(channel => (
                          <span
                            key={channel}
                            className="px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 text-xs"
                          >
                            {channel.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-1">Cooldown</p>
                      <p className="text-white">{alert.cooldownMinutes} minutes</p>
                    </div>
                    {alert.lastTriggeredAt && (
                      <div>
                        <p className="text-slate-400 mb-1">Last Triggered</p>
                        <p className="text-white">
                          {new Date(alert.lastTriggeredAt).toLocaleString()}
                        </p>
                      </div>
                    )}
                    {alert.cooldownUntil && (
                      <div>
                        <p className="text-slate-400 mb-1">Cooldown Until</p>
                        <p className="text-white">
                          {new Date(alert.cooldownUntil).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {alerts.length === 0 && (
                <div className="text-center py-12">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                  <p className="text-slate-400 mb-4">No alerts configured yet</p>
                  <button
                    className="px-6 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition"
                    onClick={() => setIsCreating(true)}
                  >
                    Create your first alert
                  </button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {isCreating && (
          <CreateAlertModal
            isOpen={isCreating}
            onClose={() => setIsCreating(false)}
            prefilledSymbol={prefilledSymbol}
            prefilledMint={prefilledMint}
          />
        )}
      </div>
    </AnimatePresence>
  );
};

export default AlertsManager;
