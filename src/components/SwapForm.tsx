import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { ArrowDown, AlertCircle, ArrowRight, Loader2, Settings } from 'lucide-react';
import type { QuoteInput, QuoteResult, SwapInput } from '../hooks/useJupiter';
import type { useJupiter } from '../hooks/useJupiter';
import type { useWallet } from '../hooks/useWallet';
import { TradeConfirmationModal } from './TradeConfirmationModal';
import { useTradingSettingsStore } from '../store/tradingSettingsStore';

interface SwapFormProps {
  jupiter: ReturnType<typeof useJupiter>;
  wallet: ReturnType<typeof useWallet>;
}

const COMMON_TOKENS = [
  { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', decimals: 9 },
  { symbol: 'USDC', mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6 },
  { symbol: 'USDT', mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6 },
  { symbol: 'BONK', mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5 },
  { symbol: 'JUP', mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6 },
];

export function SwapForm({ jupiter, wallet }: SwapFormProps) {
  const [fromToken, setFromToken] = useState(COMMON_TOKENS[0]);
  const [toToken, setToToken] = useState(COMMON_TOKENS[1]);
  const [amount, setAmount] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [confirmationStep, setConfirmationStep] = useState(false);
  const [marketVolatility, setMarketVolatility] = useState(1);

  const {
    loadingQuote,
    loadingSwap,
    quoteError,
    swapError,
    currentQuote,
    fetchQuote,
    executeSwap,
    clearQuote,
  } = jupiter;

  const {
    slippage,
    mevProtection,
    gasOptimization,
    getPriorityFeeForPreset,
    addTradeToHistory,
    getRecommendedSlippage,
  } = useTradingSettingsStore();

  const slippageBps = slippage.tolerance;
  const effectiveSlippageBps = Math.max(
    1,
    Math.round(slippage.autoAdjust ? getRecommendedSlippage(marketVolatility) : slippage.tolerance)
  );
  const priorityFeeOption = getPriorityFeeForPreset(gasOptimization.priorityFeePreset);
  const priorityFee =
    gasOptimization.priorityFeePreset === 'custom' && gasOptimization.customPriorityFee
      ? gasOptimization.customPriorityFee
      : priorityFeeOption.microLamports;

  const handleFetchQuote = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0) return;

    const amountInSmallestUnit = Math.floor(parseFloat(amount) * Math.pow(10, fromToken.decimals));

    const input: QuoteInput = {
      inputMint: fromToken.mint,
      outputMint: toToken.mint,
      amount: amountInSmallestUnit,
      slippageBps: effectiveSlippageBps,
      priorityFeeConfig: priorityFee ? { computeUnitPriceMicroLamports: priorityFee } : undefined,
    };

    const result = await fetchQuote(input);
    if (result) {
      setMarketVolatility(Math.max(1, result.route.priceImpactPct || 1));
    }
  }, [
    amount,
    fromToken.decimals,
    fromToken.mint,
    toToken.mint,
    effectiveSlippageBps,
    priorityFee,
    fetchQuote,
  ]);

  useEffect(() => {
    if (amount && parseFloat(amount) > 0 && fromToken && toToken) {
      const timer = setTimeout(() => {
        handleFetchQuote();
      }, 800);
      return () => clearTimeout(timer);
    } else {
      clearQuote();
    }
  }, [amount, fromToken.mint, toToken.mint, effectiveSlippageBps, clearQuote, handleFetchQuote]);

  const handleSwapTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
    setAmount('');
    clearQuote();
  };

  const handleExecuteSwap = async () => {
    if (!currentQuote || !wallet.wallet) {
      return;
    }

    const input: SwapInput = {
      quote: currentQuote.quote,
      userPublicKey: wallet.wallet,
      wrapAndUnwrapSol: true,
      simulate: true,
      priorityFeeConfig: priorityFee ? { computeUnitPriceMicroLamports: priorityFee } : undefined,
    };

    const result = await executeSwap(input);
    if (result) {
      // Record trade in history
      const gasCost = priorityFee / 1e9 || 0.000005; // estimate
      const actualSlippage = currentQuote.route.priceImpactPct; // simplified

      // If MEV protection is enabled, submit with protection
      let mevProtected = false;
      let mevSavings = 0;

      if (mevProtection.enabled) {
        try {
          const mevConfig = {
            enabled: true,
            useJito: mevProtection.useJito,
            usePrivateRpc: mevProtection.usePrivateRPC,
          };

          const mevResult = await invoke<{
            protected: boolean;
            method?: string;
            bundleId?: string;
            estimatedSavings: number;
          }>('submit_with_mev_protection', {
            transactionBase64: result.transaction.base64,
            config: mevConfig,
          });

          mevProtected = mevResult.protected;
          mevSavings = mevResult.estimatedSavings;
        } catch (err) {
          console.error('MEV protection failed:', err);
        }
      }

      addTradeToHistory({
        slippage: actualSlippage,
        mevProtected,
        mevSavings,
        gasCost,
        priorityFeeMicroLamports: priorityFee,
        priceImpact: currentQuote.route.priceImpactPct,
        timestamp: Date.now(),
        txSignature: undefined, // Would be populated after transaction confirmation
        fromToken: fromToken.symbol,
        toToken: toToken.symbol,
        amount: amount,
      });

      setConfirmationStep(false);
      setAmount('');
      clearQuote();
      wallet.refresh();
    }
  };

  const formatAmount = (value: string, decimals: number): string => {
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toFixed(Math.min(decimals, 6));
  };

  const renderRouteDetails = (quote: QuoteResult) => {
    const { route } = quote;

    return (
      <div className="mt-4 p-3 bg-gray-700/50 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Price Impact</span>
          <span className={route.priceImpactPct > 5 ? 'text-red-400' : 'text-gray-200'}>
            {route.priceImpactPct.toFixed(2)}%
          </span>
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Total Fees</span>
          <span className="text-gray-200">{(route.totalFeeBps / 100).toFixed(2)}%</span>
        </div>

        {route.hops.length > 0 && (
          <div className="mt-3 border-t border-gray-600 pt-3">
            <div className="text-xs text-gray-400 mb-2">Route Path</div>
            <div className="space-y-2">
              {route.hops.map((hop, idx) => (
                <div key={idx} className="flex items-center text-xs">
                  <div className="flex items-center gap-1 bg-gray-800 px-2 py-1 rounded">
                    <span className="text-purple-400">{hop.dex || 'Unknown DEX'}</span>
                    {hop.percent < 100 && (
                      <span className="text-gray-500">({hop.percent.toFixed(0)}%)</span>
                    )}
                  </div>
                  {idx < route.hops.length - 1 && (
                    <ArrowRight className="w-3 h-3 mx-1 text-gray-600" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {quote.prioritizationFeeLamports && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Priority Fee</span>
            <span className="text-gray-200">
              {(parseInt(quote.prioritizationFeeLamports) / 1e9).toFixed(6)} SOL
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">Swap Tokens</h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {showSettings && (
        <div className="mb-4 p-3 bg-gray-700/50 rounded-lg space-y-3">
          <div className="text-sm text-gray-400">
            <p>Slippage: {(slippageBps / 100).toFixed(2)}%</p>
            <p>Priority Fee: {(priorityFee / 1e6).toFixed(4)} SOL</p>
            <p className="mt-2 text-xs text-gray-500">
              Configure these settings in Settings → Trading Execution
            </p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="bg-gray-700 p-3 rounded-lg">
          <label className="block text-xs text-gray-400 mb-2">From</label>
          <div className="flex gap-2">
            <select
              value={fromToken.symbol}
              onChange={e => {
                const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                if (token) setFromToken(token);
              }}
              className="bg-gray-800 p-2 rounded font-medium"
            >
              {COMMON_TOKENS.map(token => (
                <option key={token.mint} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="flex-1 bg-gray-800 p-2 rounded text-right"
              placeholder="0.0"
              step="any"
            />
          </div>
        </div>

        <div className="flex justify-center -my-1 relative z-10">
          <button
            onClick={handleSwapTokens}
            className="bg-gray-700 p-2 rounded-lg hover:bg-gray-600 transition-colors"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
        </div>

        <div className="bg-gray-700 p-3 rounded-lg">
          <label className="block text-xs text-gray-400 mb-2">To</label>
          <div className="flex gap-2">
            <select
              value={toToken.symbol}
              onChange={e => {
                const token = COMMON_TOKENS.find(t => t.symbol === e.target.value);
                if (token) setToToken(token);
              }}
              className="bg-gray-800 p-2 rounded font-medium"
            >
              {COMMON_TOKENS.map(token => (
                <option key={token.mint} value={token.symbol}>
                  {token.symbol}
                </option>
              ))}
            </select>
            <div className="flex-1 bg-gray-800 p-2 rounded text-right text-gray-400">
              {currentQuote
                ? formatAmount(currentQuote.quote.outputAmount, toToken.decimals)
                : '0.0'}
            </div>
          </div>
        </div>
      </div>

      {loadingQuote && (
        <div className="mt-4 flex items-center justify-center text-sm text-gray-400">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Fetching best route...
        </div>
      )}

      {quoteError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{quoteError}</span>
          </div>
        </div>
      )}

      {swapError && (
        <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <div className="flex items-start gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{swapError}</span>
          </div>
        </div>
      )}

      {currentQuote && !loadingQuote && renderRouteDetails(currentQuote)}

      <button
        onClick={() => {
          if (!wallet.connected) {
            wallet.connectWallet();
          } else if (currentQuote) {
            setConfirmationStep(true);
          }
        }}
        disabled={loadingQuote || (!currentQuote && amount !== '')}
        className={`w-full mt-4 py-3 rounded-lg font-medium transition-colors ${
          loadingQuote || (!currentQuote && amount !== '')
            ? 'bg-gray-600 cursor-not-allowed'
            : wallet.connected
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-blue-600 hover:bg-blue-700'
        }`}
      >
        {!wallet.connected ? 'Connect Wallet' : currentQuote ? 'Review Swap' : 'Enter Amount'}
      </button>

      {currentQuote && (
        <TradeConfirmationModal
          isOpen={confirmationStep}
          onClose={() => setConfirmationStep(false)}
          onConfirm={handleExecuteSwap}
          quote={currentQuote}
          fromToken={fromToken}
          toToken={toToken}
          amount={amount}
          loading={loadingSwap}
        />
      )}

      {wallet.balance !== null && (
        <div className="mt-4 text-xs text-gray-500 text-center">
          Balance: {(wallet.balance / 1e9).toFixed(4)} SOL
        </div>
      )}
    </div>
  );
}
