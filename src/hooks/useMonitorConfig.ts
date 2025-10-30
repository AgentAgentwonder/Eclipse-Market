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
          const { invoke } = await import('@tauri-apps/api/tauri');
          const monitorsData = await invoke<any[]>('get_monitors');

          if (monitorsData && monitorsData.length > 0) {
            const primary = monitorsData.find(m => m.is_primary);
            const referenceMonitor = primary || monitorsData[0];

            config = {
              width: referenceMonitor.width ?? window.screen.width,
              height: referenceMonitor.height ?? window.screen.height,
              devicePixelRatio: referenceMonitor.scale_factor ?? (window.devicePixelRatio || 1),
              count: monitorsData.length,
              monitors: monitorsData.map((m: any, idx: number) => ({
                id: m.id || `monitor-${idx}`,
                name: m.name || `Monitor ${idx + 1}`,
                width: m.width,
                height: m.height,
                x: m.x,
                y: m.y,
                scaleFactor: m.scale_factor,
                isPrimary: m.is_primary || false,
              })),
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
      collectMonitorInfo();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelled = true;
      window.removeEventListener('resize', handleResize);
    };
  }, [updateMonitorConfig]);
};
