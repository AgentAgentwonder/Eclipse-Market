import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

interface QuickActionsProps {
  deviceId: string;
  sessionToken: string;
}

interface QuickTradeRequest {
  session_token: string;
  symbol: string;
  side: 'buy' | 'sell';
  amount: number;
  biometric_signature: string;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  deviceId,
  sessionToken,
}) => {
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('SOL');
  const [amount, setAmount] = useState('');
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const executeTrade = async () => {
    try {
      setLoading(true);
      setError(null);

      // In a real implementation, this would trigger biometric authentication
      // and get a signature from the device's secure enclave
      const biometricSignature = 'mock_signature_' + Date.now();

      const tradeRequest: QuickTradeRequest = {
        session_token: sessionToken,
        symbol: selectedSymbol,
        side: tradeSide,
        amount: parseFloat(amount),
        biometric_signature: biometricSignature,
      };

      await invoke('mobile_execute_quick_trade', { trade: tradeRequest });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setShowTradeModal(false);
        setAmount('');
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Trade failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
        <h2 className="text-lg font-semibold mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => {
              setTradeSide('buy');
              setShowTradeModal(true);
            }}
            className="flex flex-col items-center justify-center bg-emerald-600 hover:bg-emerald-700 rounded-xl p-4 transition-colors"
          >
            <svg
              className="w-6 h-6 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            <span className="text-sm font-semibold">Quick Buy</span>
          </button>

          <button
            onClick={() => {
              setTradeSide('sell');
              setShowTradeModal(true);
            }}
            className="flex flex-col items-center justify-center bg-red-600 hover:bg-red-700 rounded-xl p-4 transition-colors"
          >
            <svg
              className="w-6 h-6 mb-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
            <span className="text-sm font-semibold">Quick Sell</span>
          </button>
        </div>
      </div>

      {/* Trade Modal */}
      {showTradeModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">
              Quick {tradeSide === 'buy' ? 'Buy' : 'Sell'}
            </h3>

            {success ? (
              <div className="text-center py-8">
                <svg
                  className="w-16 h-16 text-green-500 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-lg font-semibold">Trade Executed!</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Asset</label>
                    <select
                      value={selectedSymbol}
                      onChange={(e) => setSelectedSymbol(e.target.value)}
                      className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    >
                      <option value="SOL">SOL</option>
                      <option value="USDC">USDC</option>
                      <option value="BONK">BONK</option>
                      <option value="JUP">JUP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Amount ($)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full bg-gray-700 rounded-lg px-4 py-2"
                    />
                  </div>

                  {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-300 rounded-lg p-3 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowTradeModal(false)}
                      disabled={loading}
                      className="flex-1 bg-gray-700 hover:bg-gray-600 rounded-lg py-3 font-semibold transition-colors disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={executeTrade}
                      disabled={loading || !amount}
                      className={`flex-1 ${
                        tradeSide === 'buy'
                          ? 'bg-emerald-600 hover:bg-emerald-700'
                          : 'bg-red-600 hover:bg-red-700'
                      } rounded-lg py-3 font-semibold transition-colors disabled:opacity-50`}
                    >
                      {loading ? 'Processing...' : 'Confirm'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
