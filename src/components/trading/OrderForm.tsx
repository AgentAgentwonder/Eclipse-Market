import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AlertCircle, Info, Lightbulb } from 'lucide-react';
import { useTradingSettingsStore } from '../../store/tradingSettingsStore';
import { useOrderFormSuggestionStore } from '../../store/orderFormSuggestionStore';

interface OrderFormProps {
  fromToken: {
    symbol: string;
    mint: string;
    decimals: number;
  };
  toToken: {
    symbol: string;
    mint: string;
    decimals: number;
  };
  walletAddress?: string;
  onOrderCreated?: () => void;
}

type OrderType = 'limit' | 'stop_loss' | 'take_profit' | 'trailing_stop';

export function OrderForm({ fromToken, toToken, walletAddress, onOrderCreated }: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [trailingPercent, setTrailingPercent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestionInfo, setSuggestionInfo] = useState<{
    id: number;
    note?: string;
    source: string;
  } | null>(null);

  const { slippage, gasOptimization, getPriorityFeeForPreset } = useTradingSettingsStore();
  const { suggestion, consumeSuggestion } = useOrderFormSuggestionStore();

  useEffect(() => {
    if (suggestion && suggestionInfo?.id !== suggestion.id) {
      if (suggestion.amount !== undefined) setAmount(suggestion.amount.toString());
      if (suggestion.limitPrice !== undefined) setLimitPrice(suggestion.limitPrice.toString());
      if (suggestion.stopPrice !== undefined) setStopPrice(suggestion.stopPrice.toString());
      if (suggestion.side !== undefined) setSide(suggestion.side);
      if (suggestion.orderType !== undefined) setOrderType(suggestion.orderType);

      setSuggestionInfo({ id: suggestion.id, note: suggestion.note, source: suggestion.source });
      consumeSuggestion();
    }
  }, [suggestion, suggestionInfo, consumeSuggestion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!walletAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const priorityFee = getPriorityFeeForPreset(gasOptimization.priorityFeePreset);

      const request = {
        orderType,
        side,
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        inputSymbol: fromToken.symbol,
        outputSymbol: toToken.symbol,
        amount: parseFloat(amount),
        limitPrice: limitPrice ? parseFloat(limitPrice) : null,
        stopPrice: stopPrice ? parseFloat(stopPrice) : null,
        trailingPercent: trailingPercent ? parseFloat(trailingPercent) : null,
        linkedOrderId: null,
        slippageBps: slippage.tolerance,
        priorityFeeMicroLamports: priorityFee.microLamports,
        walletAddress,
      };

      await invoke('create_order', { request });

      setSuccess(true);
      setAmount('');
      setLimitPrice('');
      setStopPrice('');
      setTrailingPercent('');

      onOrderCreated?.();

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h2 className="text-lg font-semibold mb-4">Place Order</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {suggestionInfo && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3 text-sm">
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 mt-0.5 text-purple-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-purple-300">Calculator suggestion applied</p>
                {suggestionInfo.note && <p className="text-gray-400 mt-1">{suggestionInfo.note}</p>}
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-2">Order Type</label>
          <div className="grid grid-cols-2 gap-2">
            {(['limit', 'stop_loss', 'take_profit', 'trailing_stop'] as OrderType[]).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setOrderType(type)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  orderType === type ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {type === 'stop_loss'
                  ? 'Stop Loss'
                  : type === 'take_profit'
                    ? 'Take Profit'
                    : type === 'trailing_stop'
                      ? 'Trailing Stop'
                      : 'Limit'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Side</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setSide('buy')}
              className={`px-3 py-2 rounded font-medium transition-colors ${
                side === 'buy' ? 'bg-green-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Buy
            </button>
            <button
              type="button"
              onClick={() => setSide('sell')}
              className={`px-3 py-2 rounded font-medium transition-colors ${
                side === 'sell' ? 'bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              Sell
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Amount ({fromToken.symbol})</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            step="any"
            className="w-full bg-gray-700 px-3 py-2 rounded"
          />
        </div>

        {(orderType === 'limit' || orderType === 'take_profit') && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              {orderType === 'take_profit' ? 'Take Profit Price' : 'Limit Price'} (USD)
            </label>
            <input
              type="number"
              value={limitPrice}
              onChange={e => setLimitPrice(e.target.value)}
              placeholder="0.0"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded"
            />
          </div>
        )}

        {orderType === 'stop_loss' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Stop Price (USD)</label>
            <input
              type="number"
              value={stopPrice}
              onChange={e => setStopPrice(e.target.value)}
              placeholder="0.0"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              <Info className="w-3 h-3 inline mr-1" />
              Order triggers when price {side === 'sell' ? 'falls below' : 'rises above'} this level
            </p>
          </div>
        )}

        {orderType === 'trailing_stop' && (
          <div>
            <label className="block text-sm text-gray-400 mb-2">Trailing Percentage (%)</label>
            <input
              type="number"
              value={trailingPercent}
              onChange={e => setTrailingPercent(e.target.value)}
              placeholder="0.0"
              step="0.1"
              className="w-full bg-gray-700 px-3 py-2 rounded"
            />
            <p className="text-xs text-gray-500 mt-1">
              <Info className="w-3 h-3 inline mr-1" />
              Stop price adjusts automatically as market moves in your favor
            </p>
          </div>
        )}

        <div className="bg-gray-700/50 p-3 rounded space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Pair:</span>
            <span>
              {fromToken.symbol}/{toToken.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Slippage:</span>
            <span>{(slippage.tolerance / 100).toFixed(2)}%</span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
            <div className="flex items-start gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-500/10 border border-green-500/20 p-3 rounded text-sm text-green-400">
            Order created successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !walletAddress}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Creating Order...' : 'Create Order'}
        </button>
      </form>
    </div>
  );
}
