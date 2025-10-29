import { invoke } from '@tauri-apps/api';
import { useState, useEffect } from 'react';

export function Diagnostics() {
  const [status, setStatus] = useState<'ok' | 'warning' | 'error'>('ok');

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const health = await invoke('check_health');
        setStatus(health ? 'ok' : 'warning');
      } catch {
        setStatus('error');
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className={`px-3 py-1 rounded-full text-xs ${
        status === 'ok' ? 'bg-green-500' : status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
      }`}
    >
      {status.toUpperCase()}
    </div>
  );
}
