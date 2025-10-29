import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { useAlertStore } from '../../store/alertStore';
import { EnhancedAlertNotification } from '../../types/alertNotifications';
import EnhancedAlertNotificationComponent from './EnhancedAlertNotification';

interface AlertNotificationContainerProps {
  onOpenChart: (symbol: string, timestamp: string) => void;
}

const AlertNotificationContainer: React.FC<AlertNotificationContainerProps> = ({ onOpenChart }) => {
  const { enhancedNotifications, dismissNotification } = useAlertStore();

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md space-y-3 z-50 pointer-events-none">
      <div className="space-y-3 pointer-events-auto">
        <AnimatePresence>
          {enhancedNotifications.map(notification => (
            <EnhancedAlertNotificationComponent
              key={notification.alertId}
              notification={notification}
              onDismiss={() => dismissNotification(notification.alertId)}
              onOpenChart={onOpenChart}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AlertNotificationContainer;
