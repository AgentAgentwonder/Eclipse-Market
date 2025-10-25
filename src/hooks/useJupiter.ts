import { invoke } from '@tauri-apps/api';
import { useState } from 'react';

type SwapRequest = {
  from: string;
  to: string;
  amount: number;
};

export function useSwap() {
  const [loading, setLoading] = useState(false);

  const executeSwap = async (from: string, to: string, amount: number) => {
    setLoading(true);
    try {
      await invoke('execute_swap', {
        request: { input_mint: from, output_mint: to, amount }
      });
    } finally {
      setLoading(false);
    }
  };

  return { executeSwap, loading };
}
