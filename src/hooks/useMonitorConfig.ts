import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/workspaceStore';
import { MonitorConfig } from '../types/workspace';

const getFallbackConfig = (): MonitorConfig => {
  if (typeof window === 'undefined') {
    return {
      width: 0,
      height: 0,
      devicePixelRatio: 1,
      count: 1,
    };
  }

  return {
    width: window.screen.width,
    height: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    count: 1,
  };
};

export const useMonitorConfig = () => {
  const updateMonitorConfig = useWorkspaceStore(state => state.updateMonitorConfig);

  useEffect(() => {
    let cancelled = false;

    const collectMonitorInfo = async () => {
      let config = getFallbackConfig();

      if (typeof window !== 'undefined' && '__TAURI__' in window) {
        try {
          const { availableMonitors } = await import('@tauri-apps/api/window');
          const monitors = await availableMonitors();

          if (monitors && monitors.length > 0) {
            const primary = monitors.find(monitor => monitor.position?.x === 0 && monitor.position?.y === 0);
            const referenceMonitor = primary || monitors[0];

            config = {
              width: referenceMonitor.size?.width ?? window.screen.width,
              height: referenceMonitor.size?.height ?? window.screen.height,
              devicePixelRatio: referenceMonitor.scaleFactor ?? (window.devicePixelRatio || 1),
              count: monitors.length,
            };
          }
        } catch (error) {
          console.warn('Failed to detect monitor configuration via Tauri', error);
        }
      }

      if (!cancelled) {
        updateMonitorConfig(config);
      }
    };

    collectMonitorInfo();

    const handleResize = () => {
      updateMonitorConfig(getFallbackConfig());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [updateMonitorConfig]);
};
