import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, AlertTriangle } from 'lucide-react';
import { useAlertStore } from '../../store/alertStore';

const AlertSettings = () => {
  const { alerts, fetchAlerts } = useAlertStore();
  const [notificationPermission, setNotificationPermission] =
    useState<NotificationPermission>('default');

  useEffect(() => {
    fetchAlerts().catch(console.error);
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, [fetchAlerts]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
    }
  };

  const activeAlerts = alerts.filter(a => a.state === 'active').length;
  const cooldownAlerts = alerts.filter(a => a.state === 'cooldown').length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Alert Settings</h2>
        <p className="text-slate-400">Configure notification preferences and alert behavior</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <motion.div
          className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Total Alerts</p>
            <Bell className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-bold">{alerts.length}</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/60 border border-emerald-500/20 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">Active</p>
            <CheckCircle className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{activeAlerts}</p>
        </motion.div>

        <motion.div
          className="bg-slate-800/60 border border-blue-500/20 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-slate-400">In Cooldown</p>
            <AlertTriangle className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-bold text-blue-400">{cooldownAlerts}</p>
        </motion.div>
      </div>

      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">System Notifications</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-slate-400">
                Receive desktop notifications when alerts are triggered
              </p>
            </div>
            <div className="flex items-center gap-3">
              {notificationPermission === 'granted' ? (
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm">Enabled</span>
                </div>
              ) : notificationPermission === 'denied' ? (
                <div className="flex items-center gap-2 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm">Denied</span>
                </div>
              ) : (
                <button
                  onClick={requestNotificationPermission}
                  className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition"
                >
                  Enable
                </button>
              )}
            </div>
          </div>

          {notificationPermission === 'denied' && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-sm text-red-300">
                Notifications are blocked. Please enable them in your browser settings.
              </p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div
        className="bg-slate-800/60 border border-purple-500/20 rounded-2xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold mb-4">Alert Guidelines</h3>
        <div className="space-y-3 text-sm text-slate-300">
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <p>Alerts are checked every minute for active price conditions</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <p>Cooldown period prevents alerts from triggering repeatedly</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <p>Compound conditions support AND/OR logic for complex triggers</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <p>Dry-run testing allows you to validate conditions before activation</p>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-purple-400 font-bold">•</span>
            <p>Alerts can be triggered for individual tokens or entire watchlists</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AlertSettings;
