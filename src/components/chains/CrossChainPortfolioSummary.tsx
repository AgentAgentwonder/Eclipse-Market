import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { PieChart, Wallet, Coins, TrendingUp } from 'lucide-react';

interface ChainBalance {
  native_balance: number;
  tokens: TokenBalance[];
  total_usd_value: number;
}

interface TokenBalance {
  mint: string;
  symbol: string;
  amount: number;
  usd_value: number;
  decimals: number;
}

interface WalletInfo {
  public_key: string;
  label?: string | null;
  chain_id: string;
}

interface ChainPortfolioSnapshot {
  chain_id: string;
  balances: ChainBalance;
}

interface WalletPortfolioBreakdown {
  wallet: WalletInfo;
  total_value_usd: number;
  tokens: TokenBalance[];
}

interface CrossChainPortfolioSummary {
  total_value_usd: number;
  per_chain: ChainPortfolioSnapshot[];
  per_wallet: WalletPortfolioBreakdown[];
}

interface CrossChainPortfolioSummaryProps {
  walletMap: Record<string, string>;
}

const COLORS = ['#a855f7', '#06b6d4', '#22c55e', '#f97316', '#eab308', '#6366f1'];

export function CrossChainPortfolioSummary({ walletMap }: CrossChainPortfolioSummaryProps) {
  const [summary, setSummary] = useState<CrossChainPortfolioSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (walletMap) {
      loadSummary();
    }
  }, [JSON.stringify(walletMap)]);

  const loadSummary = async () => {
    try {
      setLoading(true);
      const result = await invoke<CrossChainPortfolioSummary>('chain_get_cross_chain_portfolio', {
        wallet_addresses: walletMap,
      });
      setSummary(result);
    } catch (error) {
      console.error('Failed to load cross-chain portfolio', error);
    } finally {
      setLoading(false);
    }
  };

  if (!summary) {
    return (
      <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700 text-slate-400">
        {loading ? 'Loading cross-chain portfolio...' : 'No cross-chain data available'}
      </div>
    );
  }

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
      <div className="flex items-center gap-3 mb-6">
        <PieChart className="w-6 h-6 text-purple-400" />
        <div>
          <h2 className="text-xl font-bold">Cross-Chain Portfolio</h2>
          <p className="text-sm text-slate-400">Aggregated balances across all connected chains</p>
        </div>
        <button
          onClick={loadSummary}
          disabled={loading}
          className="ml-auto px-3 py-1.5 text-xs font-medium bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/60 rounded-xl border border-slate-700 p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="w-5 h-5 text-slate-300" />
            <div>
              <p className="text-xs text-slate-400">Total Value</p>
              <p className="text-2xl font-semibold">
                ${summary.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Combined USD value across all connected chains and wallets
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/60 rounded-xl border border-slate-700 p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <Coins className="w-5 h-5 text-slate-300" />
            <div>
              <p className="text-xs text-slate-400">Chains</p>
              <p className="text-2xl font-semibold">{summary.per_chain.length}</p>
            </div>
          </div>
          <div className="space-y-2">
            {summary.per_chain.map((chain, index) => (
              <div key={chain.chain_id} className="flex items-center justify-between text-sm">
                <span className="capitalize flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {chain.chain_id}
                </span>
                <span className="text-slate-300">
                  ${chain.balances.total_usd_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-slate-900/60 rounded-xl border border-slate-700 p-4"
        >
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-5 h-5 text-slate-300" />
            <div>
              <p className="text-xs text-slate-400">Top Wallet</p>
              <p className="text-lg font-semibold">
                {summary.per_wallet[0]?.wallet.label || summary.per_wallet[0]?.wallet.public_key.slice(0, 6) + '...'}
              </p>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            {summary.per_wallet[0]?.wallet.chain_id.toUpperCase()} · $
            {summary.per_wallet[0]?.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Includes all tracked tokens on {summary.per_wallet[0]?.wallet.chain_id} network.
          </p>
        </motion.div>
      </div>

      {summary.per_wallet.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-semibold text-slate-300 mb-3">Wallet Breakdown</h3>
          <div className="space-y-3">
            {summary.per_wallet.map((wallet, index) => (
              <div
                key={`${wallet.wallet.chain_id}-${wallet.wallet.public_key}`}
                className="bg-slate-900/40 rounded-xl border border-slate-800 p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-medium text-white capitalize">
                      {wallet.wallet.label || wallet.wallet.public_key.slice(0, 6) + '...'}
                    </p>
                    <p className="text-xs text-slate-400 uppercase">{wallet.wallet.chain_id}</p>
                  </div>
                  <p className="text-lg font-semibold text-purple-300">
                    ${wallet.total_value_usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                {wallet.tokens.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs text-slate-400">
                    {wallet.tokens.slice(0, 6).map(token => (
                      <div key={token.mint} className="bg-slate-900/60 rounded-lg px-3 py-2">
                        <p className="font-medium text-white">{token.symbol}</p>
                        <p>{token.amount.toFixed(4)}</p>
                        <p className="text-[11px] text-slate-500">
                          ${token.usd_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
