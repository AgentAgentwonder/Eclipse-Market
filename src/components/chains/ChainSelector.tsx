import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { Check, ChevronDown, Loader2 } from 'lucide-react';

export interface ChainConfig {
  chain_id: string;
  rpc_url: string;
  explorer_url: string;
  native_token: string;
  enabled: boolean;
}

interface ChainSelectorProps {
  onChainChange?: (chainId: string) => void;
}

const CHAIN_ICONS: Record<string, string> = {
  solana: '◎',
  ethereum: 'Ξ',
  base: '🔷',
  polygon: '🟣',
  arbitrum: '🔵',
};

const CHAIN_COLORS: Record<string, string> = {
  solana: 'from-purple-500 to-pink-500',
  ethereum: 'from-blue-500 to-indigo-500',
  base: 'from-blue-400 to-blue-600',
  polygon: 'from-purple-400 to-purple-600',
  arbitrum: 'from-blue-500 to-cyan-500',
};

export function ChainSelector({ onChainChange }: ChainSelectorProps) {
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [activeChain, setActiveChain] = useState<string>('solana');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    loadChains();
  }, []);

  const loadChains = async () => {
    try {
      setLoading(true);
      const [chainsList, active] = await Promise.all([
        invoke<ChainConfig[]>('chain_list_enabled'),
        invoke<string>('chain_get_active'),
      ]);
      setChains(chainsList);
      setActiveChain(active);
    } catch (error) {
      console.error('Failed to load chains:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChainSelect = async (chainId: string) => {
    try {
      await invoke('chain_set_active', { chain_id: chainId });
      setActiveChain(chainId);
      setOpen(false);
      onChainChange?.(chainId);
    } catch (error) {
      console.error('Failed to set active chain:', error);
    }
  };

  const activeConfig = chains.find(c => c.chain_id === activeChain);

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm">Loading...</span>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-3 px-4 py-2 rounded-xl bg-gradient-to-r ${
          CHAIN_COLORS[activeChain] || 'from-purple-500 to-pink-500'
        } hover:opacity-90 transition-opacity`}
      >
        <span className="text-xl">{CHAIN_ICONS[activeChain] || '⚡'}</span>
        <div className="flex flex-col items-start">
          <span className="text-xs opacity-75">Chain</span>
          <span className="text-sm font-medium capitalize">{activeChain}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-full mt-2 right-0 w-64 bg-slate-800 rounded-xl shadow-2xl border border-slate-700 overflow-hidden z-50"
            >
              <div className="p-2">
                <div className="text-xs text-slate-400 px-3 py-2 font-medium">
                  Select Chain
                </div>
                {chains.map(chain => (
                  <button
                    key={chain.chain_id}
                    onClick={() => handleChainSelect(chain.chain_id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      chain.chain_id === activeChain
                        ? 'bg-slate-700 text-white'
                        : 'hover:bg-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                        CHAIN_COLORS[chain.chain_id] || 'from-gray-500 to-gray-600'
                      } flex items-center justify-center text-lg`}
                    >
                      {CHAIN_ICONS[chain.chain_id] || '⚡'}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-medium capitalize">{chain.chain_id}</div>
                      <div className="text-xs text-slate-400">{chain.native_token}</div>
                    </div>
                    {chain.chain_id === activeChain && (
                      <Check className="w-4 h-4 text-green-400" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
