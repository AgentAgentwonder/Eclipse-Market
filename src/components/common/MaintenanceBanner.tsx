import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Clock } from 'lucide-react';
import { useMaintenanceStore } from '../../store/maintenanceStore';

export function MaintenanceBanner() {
  const { isMaintenanceMode, currentMaintenance, dismissNotification, notifications } =
    useMaintenanceStore();
  const [countdown, setCountdown] = useState<string>('');

  useEffect(() => {
    if (!currentMaintenance) return;

    const interval = setInterval(() => {
      const now = new Date();
      const endTime = new Date(currentMaintenance.endTime);
      const diff = endTime.getTime() - now.getTime();

      if (diff <= 0) {
        setCountdown('Ending soon...');
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setCountdown(`${hours}h ${minutes}m ${seconds}s remaining`);
    }, 1000);

    return () => clearInterval(interval);
  }, [currentMaintenance]);

  if (!isMaintenanceMode) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
            <div>
              <div className="font-semibold">Maintenance Mode Active</div>
              {currentMaintenance && (
                <div className="text-sm text-white/90">{currentMaintenance.message}</div>
              )}
            </div>
          </div>
          {countdown && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>{countdown}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {notifications.map(notification => (
          <motion.div
            key={notification.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`border-t ${
              notification.type === 'critical'
                ? 'bg-red-600'
                : notification.type === 'warning'
                ? 'bg-orange-600'
                : 'bg-blue-600'
            }`}
          >
            <div className="max-w-[1800px] mx-auto px-6 py-2 flex items-center justify-between">
              <div className="text-sm">{notification.message}</div>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
