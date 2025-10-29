import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AlertTriangle, ArrowRight, Clock, ExternalLink } from 'lucide-react';
import type { BridgeProvider } from '../../types/wallet';

export function BridgeView() {
  const [providers, setProviders] = useState<BridgeProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<BridgeProvider | null>(null);
  const [sourceChain, setSourceChain] = useState('solana');
  const [destinationChain, setDestinationChain] = useState('ethereum');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const result = await invoke<BridgeProvider[]>('wallet_get_bridge_providers');
      setProviders(result);
      if (result.length > 0) {
        setSelectedProvider(result[0]);
      }
    } catch (err) {
      console.error('Failed to load bridge providers:', err);
    } finally {
      setLoading(false);
    }
  };

  const availableChains = selectedProvider
    ? ['solana', ...selectedProvider.supportedChains]
    : ['solana', 'ethereum', 'bsc', 'polygon'];

  return (
    <div className="space-y-6">
      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-yellow-400">
          <p className="font-semibold mb-1">Bridge Operations</p>
          <p>
            Bridging transfers assets between blockchains. Always verify the destination address and
            be aware of bridge fees and estimated times.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Bridge Provider</label>
            <select
              value={selectedProvider?.id || ''}
              onChange={e => {
                const provider = providers.find(p => p.id === e.target.value);
                setSelectedProvider(provider || null);
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              {providers.map(provider => (
                <option key={provider.id} value={provider.id}>
                  {provider.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">From Chain</label>
            <select
              value={sourceChain}
              onChange={e => setSourceChain(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              {availableChains.map(chain => (
                <option key={chain} value={chain}>
                  {chain.charAt(0).toUpperCase() + chain.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <ArrowRight className="w-5 h-5" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">To Chain</label>
            <select
              value={destinationChain}
              onChange={e => setDestinationChain(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            >
              {availableChains
                .filter(chain => chain !== sourceChain)
                .map(chain => (
                  <option key={chain} value={chain}>
                    {chain.charAt(0).toUpperCase() + chain.slice(1)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.0"
              step="any"
              className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            disabled={!selectedProvider || !amount || parseFloat(amount) <= 0}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Continue to Bridge Provider
          </button>
        </div>

        <div className="bg-gray-700/50 rounded-2xl p-6 space-y-4">
          <h3 className="text-lg font-semibold">Bridge Details</h3>

          {selectedProvider ? (
            <>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Provider</span>
                  <span className="font-medium">{selectedProvider.name}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Fee</span>
                  <span className="font-medium">
                    {selectedProvider.fees.percentage}%
                    {selectedProvider.fees.fixed > 0 && ` + ${selectedProvider.fees.fixed}`}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Est. Time
                  </span>
                  <span className="font-medium">{selectedProvider.estimatedTime}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Supported Chains</span>
                  <span className="font-medium">
                    {selectedProvider.supportedChains.length + 1}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-600">
                <p className="text-xs text-gray-400 mb-2">
                  Transfers are processed by {selectedProvider.name}. Please verify all details
                  before proceeding.
                </p>
                <a
                  href="#"
                  className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"
                >
                  Visit {selectedProvider.name}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500">Select a bridge provider</div>
          )}
        </div>
      </div>

      <div className="bg-gray-700/30 border border-gray-600 rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">CEX Transfer Helper</h3>
        <div className="space-y-4">
          <p className="text-sm text-gray-400">
            Transfer to/from centralized exchanges (CEX) with automatic validation and tracking.
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
              Binance
            </button>
            <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
              Coinbase
            </button>
            <button className="py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors">
              Kraken
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Coming soon: Direct CEX integration with address validation and memo support
          </p>
        </div>
      </div>
    </div>
  );
}
