import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Network, ArrowRightLeft, History, Settings as SettingsIcon } from 'lucide-react';
import { ChainSelector } from '../components/chains/ChainSelector';
import { BridgeInterface } from '../components/chains/BridgeInterface';
import { CrossChainPortfolioSummary } from '../components/chains/CrossChainPortfolioSummary';
import { useWalletStore } from '../store/walletStore';
import { invoke } from '@tauri-apps/api/tauri';

interface BridgeTransaction {
  id: string;
  provider: string;
  from_chain: string;
  to_chain: string;
  token_address: string;
  amount: number;
  recipient_address: string;
  sender_address: string;
  status: string;
  source_tx_hash?: string | null;
  destination_tx_hash?: string | null;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
}

type Tab = 'bridge' | 'portfolio' | 'history' | 'settings';

function MultiChain() {
  const [activeTab, setActiveTab] = useState<Tab>('bridge');
  const [transactions, setTransactions] = useState<BridgeTransaction[]>([]);
  const publicKey = useWalletStore(state => state.publicKey);
  const wallets = useWalletStore(state => state.wallets);

  useEffect(() => {
    if (activeTab === 'history') {
      loadTransactions();
    }
  }, [activeTab]);

  const loadTransactions = async () => {
    try {
      const txs = await invoke<BridgeTransaction[]>('bridge_list_transactions');
      setTransactions(txs);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    }
  };

  const getWalletMap = () => {
    const map: Record<string, string> = {};
    if (publicKey) {
      map['solana'] = publicKey;
    }
    wallets.forEach(wallet => {
      if (wallet.publicKey) {
        const chainId = wallet.chainId || wallet.network.toLowerCase();
        map[chainId] = wallet.publicKey;
      }
    });
    return map;
  };

  const tabs = [
    { id: 'bridge' as Tab, label: 'Bridge', icon: ArrowRightLeft },
    { id: 'portfolio' as Tab, label: 'Portfolio', icon: Network },
    { id: 'history' as Tab, label: 'History', icon: History },
    { id: 'settings' as Tab, label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Multi-Chain</h1>
          <p className="text-slate-400">
            Bridge assets and manage portfolios across multiple blockchains
          </p>
        </div>
        <ChainSelector />
      </div>

      <div className="flex gap-2 bg-slate-900/50 p-1 rounded-xl border border-slate-800">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span className="font-medium">{tab.label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'bridge' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BridgeInterface walletAddress={publicKey || undefined} />
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
              <h3 className="text-xl font-bold mb-4">Bridge Information</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Supported Providers</h4>
                  <ul className="space-y-2 text-slate-300">
                    <li>• Wormhole - Multi-chain bridge with guardian network</li>
                    <li>• AllBridge - Fast liquidity pools across chains</li>
                    <li>• Synapse - Low-fee optimistic bridge protocol</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-purple-300 mb-2">Supported Chains</h4>
                  <ul className="space-y-1 text-slate-300">
                    <li>• Solana</li>
                    <li>• Ethereum</li>
                    <li>• Base</li>
                    <li>• Polygon</li>
                    <li>• Arbitrum</li>
                  </ul>
                </div>
                <div className="pt-4 border-t border-slate-700">
                  <h4 className="font-semibold text-purple-300 mb-2">Tips</h4>
                  <ul className="space-y-2 text-slate-400 text-xs">
                    <li>✓ Always verify recipient address matches destination chain format</li>
                    <li>✓ Bridge times vary - Synapse is fastest, Wormhole most secure</li>
                    <li>✓ Gas fees paid on source chain, consider peak hours</li>
                    <li>✓ Test with small amounts first on new bridge routes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'portfolio' && (
          <CrossChainPortfolioSummary walletMap={getWalletMap()} />
        )}

        {activeTab === 'history' && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Bridge Transaction History</h2>
              <button
                onClick={loadTransactions}
                className="px-3 py-1.5 text-sm font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
              >
                Refresh
              </button>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bridge transactions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map(tx => (
                  <div
                    key={tx.id}
                    className="bg-slate-900/60 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium capitalize">{tx.from_chain}</span>
                          <ArrowRightLeft className="w-4 h-4 text-slate-500" />
                          <span className="font-medium capitalize">{tx.to_chain}</span>
                        </div>
                        <div className="text-sm text-slate-400">
                          {tx.amount} · via {tx.provider}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-2 py-1 rounded-lg text-xs font-medium ${
                            tx.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : tx.status === 'failed'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-yellow-500/20 text-yellow-400'
                          }`}
                        >
                          {tx.status}
                        </span>
                        <div className="text-xs text-slate-500 mt-1">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {tx.source_tx_hash && (
                      <div className="text-xs text-slate-500 mt-2">
                        Source TX: {tx.source_tx_hash.slice(0, 16)}...
                      </div>
                    )}
                    {tx.destination_tx_hash && (
                      <div className="text-xs text-slate-500">
                        Dest TX: {tx.destination_tx_hash.slice(0, 16)}...
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
            <h2 className="text-xl font-bold mb-6">Chain Settings</h2>
            <div className="space-y-4">
              <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-4">
                <h3 className="font-semibold mb-3">Default Settings</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Auto-refresh balances</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Show test networks</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/60 rounded-xl border border-slate-700 p-4">
                <h3 className="font-semibold mb-3">RPC Endpoints</h3>
                <p className="text-sm text-slate-400 mb-4">
                  Configure custom RPC endpoints for better performance
                </p>
                <div className="space-y-3">
                  {['Solana', 'Ethereum', 'Base', 'Polygon', 'Arbitrum'].map(chain => (
                    <div key={chain}>
                      <label className="block text-xs text-slate-400 mb-1">{chain}</label>
                      <input
                        type="text"
                        placeholder={`${chain} RPC URL`}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default MultiChain;
