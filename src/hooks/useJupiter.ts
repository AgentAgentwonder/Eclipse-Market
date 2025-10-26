import { invoke } from '@tauri-apps/api';
import { useState, useCallback } from 'react';

export type SwapMode = 'exact_in' | 'exact_out';

export interface PriorityFeeConfig {
  computeUnitPriceMicroLamports?: number;
  autoMultiplier?: number;
}

export interface QuoteInput {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
  swapMode?: SwapMode;
  platformFeeBps?: number;
  onlyDirectRoutes?: boolean;
  referralAccount?: string;
  asLegacyTransaction?: boolean;
  priorityFeeConfig?: PriorityFeeConfig;
}

export interface ParsedRouteHop {
  dex?: string;
  percent: number;
  inputMint: string;
  outputMint: string;
  inAmount: number;
  outAmount: number;
  feeBps?: number;
}

export interface ParsedRoutePlan {
  priceImpactPct: number;
  totalFeeBps: number;
  hops: ParsedRouteHop[];
}

export interface QuoteResponse {
  inputMint: string;
  outputMint: string;
  inputAmount: string;
  outputAmount: string;
  otherAmountThreshold: string;
  swapMode: SwapMode;
  slippageBps?: number;
  priceImpactPct: number;
  contextSlot: number;
  timeTaken?: number;
  routePlan: unknown[];
  prioritizationFeeLamports?: string;
}

export interface QuoteResult {
  quote: QuoteResponse;
  route: ParsedRoutePlan;
  contextSlot: number;
  prioritizationFeeLamports?: string;
}

export interface SwapInput {
  quote: QuoteResponse;
  userPublicKey: string;
  feeAccount?: string;
  wrapAndUnwrapSol?: boolean;
  asLegacyTransaction?: boolean;
  priorityFeeConfig?: PriorityFeeConfig;
  simulate?: boolean;
}

export interface EncodedTransaction {
  base64: string;
  version: string;
}

export interface SwapSimulationResult {
  logs: string[];
  computeUnitsConsumed?: number;
}

export interface SwapResult {
  transaction: EncodedTransaction;
  lastValidBlockHeight: number;
  prioritizationFeeLamports?: string;
  simulation?: SwapSimulationResult;
}

export function useJupiter() {
  const [loadingQuote, setLoadingQuote] = useState(false);
  const [loadingSwap, setLoadingSwap] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [swapError, setSwapError] = useState<string | null>(null);
  const [currentQuote, setCurrentQuote] = useState<QuoteResult | null>(null);

  const fetchQuote = useCallback(async (input: QuoteInput): Promise<QuoteResult | null> => {
    setLoadingQuote(true);
    setQuoteError(null);
    try {
      const result = await invoke<QuoteResult>('jupiter_quote', { input });
      setCurrentQuote(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setQuoteError(errorMessage);
      setCurrentQuote(null);
      return null;
    } finally {
      setLoadingQuote(false);
    }
  }, []);

  const executeSwap = useCallback(async (input: SwapInput): Promise<SwapResult | null> => {
    setLoadingSwap(true);
    setSwapError(null);
    try {
      const result = await invoke<SwapResult>('jupiter_swap', { input });
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setSwapError(errorMessage);
      return null;
    } finally {
      setLoadingSwap(false);
    }
  }, []);

  const clearQuote = useCallback(() => {
    setCurrentQuote(null);
    setQuoteError(null);
  }, []);

  const clearErrors = useCallback(() => {
    setQuoteError(null);
    setSwapError(null);
  }, []);

  return {
    loadingQuote,
    loadingSwap,
    quoteError,
    swapError,
    currentQuote,
    fetchQuote,
    executeSwap,
    clearQuote,
    clearErrors,
  };
}
