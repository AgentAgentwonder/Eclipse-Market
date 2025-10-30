import { invoke } from '@tauri-apps/api/tauri';
import { useState, useCallback } from 'react';
import type {
  SafetyCheckRequest,
  SafetyCheckResult,
  CooldownStatus,
  InsuranceProvider,
  InsuranceQuote,
  InsuranceSelection,
} from '../types/safety';

export function useSafety() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkTradeSafety = useCallback(
    async (request: SafetyCheckRequest): Promise<SafetyCheckResult | null> => {
      setLoading(true);
      setError(null);
      try {
        const result = await invoke<SafetyCheckResult>('check_trade_safety', { request });
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const approveTrade = useCallback(async (walletAddress: string): Promise<boolean> => {
    try {
      await invoke('approve_trade', { walletAddress });
      return true;
    } catch (err) {
      console.error('Failed to approve trade:', err);
      return false;
    }
  }, []);

  const getCooldownStatus = useCallback(async (walletAddress: string): Promise<CooldownStatus | null> => {
    try {
      const status = await invoke<CooldownStatus | null>('get_cooldown_status', {
        walletAddress,
      });
      return status;
    } catch (err) {
      console.error('Failed to get cooldown status:', err);
      return null;
    }
  }, []);

  const getInsuranceQuote = useCallback(
    async (
      providerId: string,
      tradeAmountUsd: number,
      priceImpactPercent: number,
      mevRiskLevel: number
    ): Promise<InsuranceQuote | null> => {
      try {
        const quote = await invoke<InsuranceQuote>('get_insurance_quote', {
          providerId,
          tradeAmountUsd,
          priceImpactPercent,
          mevRiskLevel,
        });
        return quote;
      } catch (err) {
        console.error('Failed to get insurance quote:', err);
        return null;
      }
    },
    []
  );

  const selectInsurance = useCallback(
    async (
      providerId: string,
      tradeAmountUsd: number,
      priceImpactPercent: number,
      mevRiskLevel: number
    ): Promise<InsuranceSelection | null> => {
      try {
        const selection = await invoke<InsuranceSelection>('select_insurance', {
          providerId,
          tradeAmountUsd,
          priceImpactPercent,
          mevRiskLevel,
        });
        return selection;
      } catch (err) {
        console.error('Failed to select insurance:', err);
        return null;
      }
    },
    []
  );

  const listInsuranceProviders = useCallback(async (): Promise<InsuranceProvider[]> => {
    try {
      const providers = await invoke<InsuranceProvider[]>('list_insurance_providers');
      return providers;
    } catch (err) {
      console.error('Failed to list insurance providers:', err);
      return [];
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    loading,
    error,
    checkTradeSafety,
    approveTrade,
    getCooldownStatus,
    getInsuranceQuote,
    selectInsurance,
    listInsuranceProviders,
    clearError,
  };
}
