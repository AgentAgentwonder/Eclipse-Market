import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { ArrowDownUp, Loader2, Clock, DollarSign, Info } from 'lucide-react';
import type { ChainConfig } from './ChainSelector';

interface BridgeQuote {
  provider: string;
  from_chain: string;
  to_chain: string;
  amount_in: number;
  amount_out: number;
  estimated_time_seconds: number;
  fee_amount: number;
  fee_currency: string;
  route_info: string;
}

interface BridgeInterfaceProps {
  walletAddress?: string;
}

export function BridgeInterface({ walletAddress }: BridgeInterfaceProps) {
  const [chains, setChains] = useState<ChainConfig[]>([]);
  const [fromChain, setFromChain] = useState<string>('solana');
  const [toChain, setToChain] = useState<string>('ethereum');
  const [amount, setAmount] = useState<string>('');
  const [tokenAddress, setTokenAddress] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>(walletAddress || '');
  const [quotes, setQuotes] = useState<BridgeQuote[]>([]);
  const [selectedQuote, setSelectedQuote] = useState<BridgeQuote | null>(null);
  const [loading, setLoading] = useState(false);
  const [bridging, setBridging] = useState(false);

  useEffect(() => {
    loadChains();
  }, []);

  useEffect(() => {
    if (walletAddress) {
      setRecipientAddress(walletAddress);
    }
  }, [walletAddress]);

  const loadChains = async () => {
    try {
      const chainsList = await invoke<ChainConfig[]>('chain_list_enabled');
      setChains(chainsList);
    } catch (error) {
      console.error('Failed to load chains:', error);
    }
  };

  const handleGetQuotes = async () => {
    if (!amount || !tokenAddress || !recipientAddress) return;

    try {
      setLoading(true);
      const request = {
        from_chain: fromChain,
        to_chain: toChain,
        token_address: tokenAddress,
        amount: parseFloat(amount),
        recipient_address: recipientAddress,
      };

      const quotesResponse = await invoke<BridgeQuote[]>('bridge_get_quote', { request });
      setQuotes(quotesResponse);
      if (quotesResponse.length > 0) {
        setSelectedQuote(quotesResponse[0]);
      }
    } catch (error) {
      console.error('Failed to get quotes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBridge = async () => {
    if (!selectedQuote || !walletAddress) return;

    try {
      setBridging(true);
      const request = {
        provider: selectedQuote.provider,
        from_chain: fromChain,
        to_chain: toChain,
        token_address: tokenAddress,
        amount: parseFloat(amount),
        recipient_address: recipientAddress,
        sender_address: walletAddress,
      };

      const transaction = await invoke('bridge_create_transaction', { request });
      console.log('Bridge transaction created:', transaction);
      // TODO: Show success message and track transaction
    } catch (error) {
      console.error('Failed to create bridge transaction:', error);
    } finally {
      setBridging(false);
    }
  };

  const swapChains = () => {
    const temp = fromChain;
    setFromChain(toChain);
    setToChain(temp);
    setQuotes([]);
    setSelectedQuote(null);
  };

  return (
    <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700">
      <h2 className="text-2xl font-bold mb-6">Cross-Chain Bridge</h2>

      <div className="space-y-4">
        {/* From Chain */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">From Chain</label>
          <select
            value={fromChain}
            onChange={e => {
              setFromChain(e.target.value);
              setQuotes([]);
              setSelectedQuote(null);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white capitalize focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {chains.map(chain => (
              <option key={chain.chain_id} value={chain.chain_id}>
                {chain.chain_id} ({chain.native_token})
              </option>
            ))}
          </select>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <button
            onClick={swapChains}
            className="p-3 bg-slate-700 hover:bg-slate-600 rounded-full transition-colors"
          >
            <ArrowDownUp className="w-5 h-5" />
          </button>
        </div>

        {/* To Chain */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">To Chain</label>
          <select
            value={toChain}
            onChange={e => {
              setToChain(e.target.value);
              setQuotes([]);
              setSelectedQuote(null);
            }}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white capitalize focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            {chains.map(chain => (
              <option key={chain.chain_id} value={chain.chain_id}>
                {chain.chain_id} ({chain.native_token})
              </option>
            ))}
          </select>
        </div>

        {/* Token Address */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Token Address</label>
          <input
            type="text"
            value={tokenAddress}
            onChange={e => setTokenAddress(e.target.value)}
            placeholder="Enter token address"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Recipient Address */}
        <div>
          <label className="block text-sm text-slate-400 mb-2">Recipient Address</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={e => setRecipientAddress(e.target.value)}
            placeholder="Enter recipient address"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        {/* Get Quotes Button */}
        <button
          onClick={handleGetQuotes}
          disabled={loading || !amount || !tokenAddress || !recipientAddress}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Getting Quotes...
            </>
          ) : (
            'Get Bridge Quotes'
          )}
        </button>

        {/* Quotes */}
        {quotes.length > 0 && (
          <div className="space-y-3 mt-6">
            <h3 className="text-lg font-semibold">Available Routes</h3>
            {quotes.map((quote, index) => (
              <motion.button
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                onClick={() => setSelectedQuote(quote)}
                className={`w-full p-4 rounded-xl border transition-colors text-left ${
                  selectedQuote?.provider === quote.provider
                    ? 'bg-purple-500/20 border-purple-500'
                    : 'bg-slate-900 border-slate-700 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold capitalize">{quote.provider}</span>
                  <span className="text-green-400 font-medium">
                    {quote.amount_out.toFixed(4)}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-400">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>~{Math.round(quote.estimated_time_seconds / 60)}m</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    <span>Fee: {quote.fee_amount.toFixed(4)} {quote.fee_currency}</span>
                  </div>
                </div>
                <div className="flex items-start gap-1 mt-2 text-xs text-slate-500">
                  <Info className="w-3 h-3 mt-0.5" />
                  <span>{quote.route_info}</span>
                </div>
              </motion.button>
            ))}

            {selectedQuote && (
              <button
                onClick={handleBridge}
                disabled={bridging || !walletAddress}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl py-3 font-medium transition-colors flex items-center justify-center gap-2 mt-4"
              >
                {bridging ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Initiating Bridge...
                  </>
                ) : (
                  'Bridge Tokens'
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
