import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Zap, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface QuickTradeButtonProps {
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
  side: 'buy' | 'sell';
  amount?: number;
  walletAddress?: string;
  onComplete?: () => void;
  className?: string;
}

const PRESET_AMOUNTS = [10, 50, 100, 500];

export function QuickTradeButton({
  fromToken,
  toToken,
  side,
  amount,
  walletAddress,
  onComplete,
  className,
}: QuickTradeButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(amount || null);
  const [useMax, setUseMax] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickTrade = () => {
    if (!walletAddress) {
      setErrorMessage('Please connect your wallet first');
      return;
    }
    setShowModal(true);
    setStatus('idle');
    setErrorMessage(null);
  };

  const executeTrade = async () => {
    if (!selectedAmount && !useMax) {
      setErrorMessage('Please select an amount');
      return;
    }

    setLoading(true);
    setStatus('idle');
    setErrorMessage(null);

    try {
      const request = {
        inputMint: fromToken.mint,
        outputMint: toToken.mint,
        inputSymbol: fromToken.symbol,
        outputSymbol: toToken.symbol,
        amount: selectedAmount || 0,
        side,
        walletAddress: walletAddress!,
        useMax,
      };

      await invoke('create_order', {
        request: {
          orderType: 'market',
          side,
          inputMint: fromToken.mint,
          outputMint: toToken.mint,
          inputSymbol: fromToken.symbol,
          outputSymbol: toToken.symbol,
          amount: selectedAmount || 0,
          limitPrice: null,
          stopPrice: null,
          trailingPercent: null,
          linkedOrderId: null,
          slippageBps: 50,
          priorityFeeMicroLamports: 5000,
          walletAddress: walletAddress!,
        },
      });

      setStatus('success');
      setTimeout(() => {
        setShowModal(false);
        onComplete?.();
      }, 2000);
    } catch (error) {
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleQuickTrade}
        className={`flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors ${
          className || ''
        }`}
        disabled={!walletAddress}
      >
        <Zap className="w-4 h-4" />
        Quick {side === 'buy' ? 'Buy' : 'Sell'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-xl font-bold mb-4">
              Quick {side === 'buy' ? 'Buy' : 'Sell'} {toToken.symbol}
            </h2>

            <div className="space-y-4">
              {status === 'idle' && (
                <>
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">
                      Select Amount ({fromToken.symbol})
                    </label>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      {PRESET_AMOUNTS.map(preset => (
                        <button
                          key={preset}
                          onClick={() => {
                            setSelectedAmount(preset);
                            setUseMax(false);
                          }}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            selectedAmount === preset
                              ? 'bg-purple-600'
                              : 'bg-gray-700 hover:bg-gray-600'
                          }`}
                        >
                          {preset} {fromToken.symbol}
                        </button>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={selectedAmount || ''}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          setSelectedAmount(val || null);
                          setUseMax(false);
                        }}
                        placeholder="Custom amount"
                        className="flex-1 bg-gray-700 px-4 py-2 rounded-lg"
                      />
                      <button
                        onClick={() => {
                          setUseMax(true);
                          setSelectedAmount(null);
                        }}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          useMax ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        Max
                      </button>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 p-3 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">From:</span>
                      <span>
                        {useMax ? 'Max' : selectedAmount || 0} {fromToken.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">To:</span>
                      <span>{toToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Type:</span>
                      <span>Market Order</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Slippage:</span>
                      <span>0.5%</span>
                    </div>
                  </div>

                  {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm text-red-400">
                      {errorMessage}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg font-medium transition-colors"
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeTrade}
                      disabled={loading || (!selectedAmount && !useMax)}
                      className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Executing...
                        </>
                      ) : (
                        'Confirm Trade'
                      )}
                    </button>
                  </div>
                </>
              )}

              {status === 'success' && (
                <div className="text-center py-6">
                  <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Trade Submitted!</h3>
                  <p className="text-gray-400 text-sm">Your order has been placed successfully</p>
                </div>
              )}

              {status === 'error' && (
                <div className="text-center py-6">
                  <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-lg font-bold mb-2">Trade Failed</h3>
                  <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
                  >
                    Try Again
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
