import { useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { RecordTradeRequest, Trade } from '../types/performance';

export function useTradeRecording() {
  const recordTrade = useCallback(async (request: RecordTradeRequest): Promise<Trade> => {
    try {
      const trade = await invoke<Trade>('record_trade', { request });
      
      // Automatically recalculate performance score after recording a sell trade
      if (request.side === 'sell') {
        // Fire and forget - don't block on score calculation
        invoke('calculate_wallet_performance', {
          walletAddress: request.walletAddress,
        }).catch((err) => {
          console.error('Failed to update performance score:', err);
        });
      }
      
      return trade;
    } catch (error) {
      console.error('Failed to record trade:', error);
      throw error;
    }
  }, []);

  return { recordTrade };
}
