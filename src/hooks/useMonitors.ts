import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Monitor } from '../types/workspace';

export const useMonitors = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await invoke<Monitor[]>('get_monitors');
      setMonitors(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get monitors');
      console.error('Failed to get monitors:', err);
      setMonitors([{
        id: 'monitor-0',
        name: 'Primary Monitor',
        width: window.screen.width,
        height: window.screen.height,
        x: 0,
        y: 0,
        scaleFactor: window.devicePixelRatio || 1,
        isPrimary: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitors();
  }, []);

  return { monitors, loading, error, refetch: fetchMonitors };
};
