import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet as WalletIcon,
  Send,
  Download,
  ArrowLeftRight,
  Link2,
  BookOpen,
  RefreshCw,
} from 'lucide-react';
import { useWalletStore } from '../store/walletStore';
import { useTokenBalances } from '../hooks/useTokenBalances';
import { SendFlow } from '../components/wallet/SendFlow';
import { ReceiveView } from '../components/wallet/ReceiveView';
import { SwapView } from '../components/wallet/SwapView';
import { BridgeView } from '../components/wallet/BridgeView';
import { AddressBookView } from '../components/wallet/AddressBookView';

type TabType = 'balances' | 'send' | 'receive' | 'swap' | 'bridge' | 'addressBook';

export default function Wallet() {
  const [activeTab, setActiveTab] = useState<TabType>('balances');
  const { publicKey, balance } = useWalletStore();
  const { balances, loading, refresh } = useTokenBalances(publicKey);

  const tabs = [
    { id: 'balances' as const, label: 'Balances', icon: WalletIcon },
    { id: 'send' as const, label: 'Send', icon: Send },
    { id: 'receive' as const, label: 'Receive', icon: Download },
    { id: 'swap' as const, label: 'Swap', icon: ArrowLeftRight },
    { id: 'bridge' as const, label: 'Bridge', icon: Link2 },
    { id: 'addressBook' as const, label: 'Address Book', icon: BookOpen },
  ];

  const totalUsdValue = balances.reduce((sum, token) => sum + token.usdValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
          Wallet
        </h1>
      </div>

      {publicKey && (
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400 mb-1">Total Balance</p>
              <h2 className="text-4xl font-bold">${totalUsdValue.toFixed(2)}</h2>
            </div>
            <button
              onClick={() => refresh()}
              disabled={loading}
              className="p-3 bg-purple-500/20 hover:bg-purple-500/30 rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="text-sm text-gray-400">
            <p className="font-mono">{publicKey}</p>
          </div>
        </div>
      )}

      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl overflow-hidden">
        <div className="flex border-b border-gray-700 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-500'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'balances' && (
              <div className="space-y-4">
                {loading && balances.length === 0 ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-purple-400" />
                    <p className="text-gray-400">Loading balances...</p>
                  </div>
                ) : balances.length === 0 ? (
                  <div className="text-center py-12">
                    <WalletIcon className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No tokens found</p>
                  </div>
                ) : (
                  balances.map(token => (
                    <div
                      key={token.mint}
                      className="bg-gray-700/50 rounded-xl p-4 hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {token.logoUri && (
                            <img
                              src={token.logoUri}
                              alt={token.symbol}
                              className="w-10 h-10 rounded-full"
                              onError={e => {
                                (e.target as HTMLImageElement).style.display = 'none';
                              }}
                            />
                          )}
                          <div>
                            <p className="font-semibold">{token.symbol}</p>
                            <p className="text-sm text-gray-400">{token.name}</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="font-semibold">
                            {token.balance.toFixed(token.decimals > 6 ? 6 : token.decimals)}
                          </p>
                          <p className="text-sm text-gray-400">${token.usdValue.toFixed(2)}</p>
                          {token.change24h !== 0 && (
                            <p
                              className={`text-xs ${token.change24h > 0 ? 'text-green-400' : 'text-red-400'}`}
                            >
                              {token.change24h > 0 ? '+' : ''}
                              {token.change24h.toFixed(2)}%
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'send' && <SendFlow onSuccess={() => refresh()} />}

            {activeTab === 'receive' && <ReceiveView address={publicKey} />}

            {activeTab === 'swap' && <SwapView onSuccess={() => refresh()} />}

            {activeTab === 'bridge' && <BridgeView />}

            {activeTab === 'addressBook' && <AddressBookView />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
