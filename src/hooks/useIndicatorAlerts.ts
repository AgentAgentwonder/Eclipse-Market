import { useEffect, useRef } from 'react';
import { useIndicatorStore } from '../store/indicatorStore';
import { useAlertNotifications } from './useAlertNotifications';
import type { IndicatorValue } from '../types/indicators';

/**
 * Hook to monitor indicator values and trigger alerts based on configured thresholds
 */
export function useIndicatorAlerts(indicatorValues: Record<string, IndicatorValue[]>) {
  const { alerts, indicators } = useIndicatorStore();
  const { showAlert } = useAlertNotifications();
  const previousValuesRef = useRef<Record<string, number | null>>({});

  useEffect(() => {
    const enabledAlerts = alerts.filter(a => a.enabled);

    enabledAlerts.forEach(alert => {
      const indicator = indicators.find(i => i.id === alert.indicatorId);
      if (!indicator || !indicator.enabled) return;

      const values = indicatorValues[alert.indicatorId];
      if (!values || values.length === 0) return;

      const latestValue = values[values.length - 1];
      if (latestValue.value === null) return;

      const currentValue = latestValue.value;
      const previousValue = previousValuesRef.current[alert.id];

      let shouldAlert = false;
      let alertMessage = '';

      switch (alert.condition) {
        case 'above':
          if (currentValue > alert.threshold) {
            shouldAlert = true;
            alertMessage = `${indicator.type} is above ${alert.threshold.toFixed(2)} (current: ${currentValue.toFixed(2)})`;
          }
          break;

        case 'below':
          if (currentValue < alert.threshold) {
            shouldAlert = true;
            alertMessage = `${indicator.type} is below ${alert.threshold.toFixed(2)} (current: ${currentValue.toFixed(2)})`;
          }
          break;

        case 'crosses_above':
          if (previousValue !== null && previousValue <= alert.threshold && currentValue > alert.threshold) {
            shouldAlert = true;
            alertMessage = `${indicator.type} crossed above ${alert.threshold.toFixed(2)}`;
          }
          break;

        case 'crosses_below':
          if (previousValue !== null && previousValue >= alert.threshold && currentValue < alert.threshold) {
            shouldAlert = true;
            alertMessage = `${indicator.type} crossed below ${alert.threshold.toFixed(2)}`;
          }
          break;
      }

      if (shouldAlert) {
        showAlert({
          type: 'info',
          title: 'Indicator Alert',
          message: alertMessage,
          timestamp: new Date().toISOString(),
        });
      }

      previousValuesRef.current[alert.id] = currentValue;
    });
  }, [indicatorValues, alerts, indicators, showAlert]);

  return { alerts };
}
