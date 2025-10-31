import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Loader2 } from 'lucide-react';
import { OfferType } from '../../types/p2p';

interface OfferCreationModalProps {
  onClose: () => void;
  onSuccess: () => void;
  userAddress: string;
}

export function OfferCreationModal({ onClose, onSuccess, userAddress }: OfferCreationModalProps) {
  const [offerType, setOfferType] = useState<OfferType>('buy');
  const [tokenAddress, setTokenAddress] = useState('');
  const [tokenSymbol, setTokenSymbol] = useState('SOL');
  const [amount, setAmount] = useState(0);
  const [price, setPrice] = useState(0);
  const [fiatCurrency, setFiatCurrency] = useState('USD');
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['Bank Transfer']);
  const [minAmount, setMinAmount] = useState<number | undefined>(undefined);
  const [maxAmount, setMaxAmount] = useState<number | undefined>(undefined);
  const [terms, setTerms] = useState('');
  const [timeLimit, setTimeLimit] = useState(30);
  const [reputationRequired, setReputationRequired] = useState<number | undefined>(50);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const resetForm = () => {
    setTokenAddress('');
    setTokenSymbol('SOL');
    setAmount(0);
    setPrice(0);
    setFiatCurrency('USD');
    setPaymentMethods(['Bank Transfer']);
    setMinAmount(undefined);
    setMaxAmount(undefined);
    setTerms('');
    setTimeLimit(30);
    setReputationRequired(50);
    setErrors([]);
  };

  const validateForm = () => {
    const newErrors: string[] = [];

    if (!tokenSymbol.trim()) newErrors.push('Token symbol is required');
    if (!tokenAddress.trim()) newErrors.push('Token address is required');
    if (amount <= 0) newErrors.push('Amount must be greater than zero');
    if (price <= 0) newErrors.push('Price must be greater than zero');
    if (timeLimit < 5) newErrors.push('Time limit must be at least 5 minutes');
    if (minAmount && maxAmount && minAmount > maxAmount) {
      newErrors.push('Minimum amount cannot exceed maximum amount');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await invoke('create_p2p_offer', {
        request: {
          creator: userAddress,
          offerType,
          tokenAddress,
          tokenSymbol,
          amount,
          price,
          fiatCurrency,
          paymentMethods,
          minAmount,
          maxAmount,
          terms: terms || null,
          timeLimit,
          reputationRequired,
        },
      });

      resetForm();
      onSuccess();
    } catch (error: any) {
      console.error('Failed to create offer:', error);
      setErrors([error?.toString?.() ?? 'Failed to create offer']);
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setPaymentMethods(prev =>
      prev.includes(method)
        ? prev.filter(m => m !== method)
        : [...prev, method]
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-3xl bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
            <div>
              <h2 className="text-xl font-semibold text-white">Create P2P Offer</h2>
              <p className="text-sm text-purple-300">Set your terms for a secure escrow trade</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-purple-300 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-6 py-6 space-y-8">
            {/* Offer Type */}
            <div>
              <h3 className="text-sm font-semibold text-purple-200 uppercase tracking-wide mb-3">
                Offer Type
              </h3>
              <div className="flex gap-3">
                {(['buy', 'sell'] as OfferType[]).map(type => (
                  <button
                    key={type}
                    onClick={() => setOfferType(type)}
                    className={`flex-1 px-4 py-3 rounded-xl border transition-all ${
                      offerType === type
                        ? 'border-purple-500 bg-purple-500/20 text-white'
                        : 'border-white/10 text-purple-300 hover:border-purple-500/60'
                    }`}
                  >
                    <div className="text-sm font-medium capitalize">{type}</div>
                    <div className="text-xs text-purple-300/80">
                      {type === 'buy' ? 'You are buying tokens' : 'You are selling tokens'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Token Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Token Symbol
                </label>
                <input
                  type="text"
                  value={tokenSymbol}
                  onChange={e => setTokenSymbol(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Token Address
                </label>
                <input
                  type="text"
                  value={tokenAddress}
                  onChange={e => setTokenAddress(e.target.value)}
                  placeholder="Enter Solana token mint address"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Amount and Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Amount ({tokenSymbol})
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={e => setAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Price ({fiatCurrency})
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={e => setPrice(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Currency
                </label>
                <select
                  value={fiatCurrency}
                  onChange={e => setFiatCurrency(e.target.value)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                >
                  {['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY'].map(currency => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Limits */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Minimum Amount
                </label>
                <input
                  type="number"
                  value={minAmount ?? ''}
                  onChange={e => setMinAmount(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Maximum Amount
                </label>
                <input
                  type="number"
                  value={maxAmount ?? ''}
                  onChange={e => setMaxAmount(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Optional"
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-3">
                Payment Methods
              </label>
              <div className="flex flex-wrap gap-3">
                {['Bank Transfer', 'PayPal', 'Cash', 'Zelle', 'Revolut', 'Wise'].map(method => {
                  const isSelected = paymentMethods.includes(method);
                  return (
                    <button
                      key={method}
                      type="button"
                      onClick={() => togglePaymentMethod(method)}
                      className={`px-4 py-2 rounded-lg border text-sm transition-all ${
                        isSelected
                          ? 'border-purple-500 bg-purple-500/20 text-white shadow-lg shadow-purple-500/20'
                          : 'border-white/10 text-purple-300 hover:border-purple-500/60'
                      }`}
                    >
                      {method}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div>
              <label className="block text-sm font-medium text-purple-200 mb-2">
                Terms & Instructions
              </label>
              <textarea
                value={terms}
                onChange={e => setTerms(e.target.value)}
                rows={4}
                placeholder="Provide payment instructions, verification requirements, or other important notes"
                className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Security Settings */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Time Limit (minutes)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={e => setTimeLimit(Number(e.target.value))}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                  min={5}
                  max={1440}
                />
                <p className="text-xs text-purple-400 mt-1">
                  Time allowed for counterparty to complete payment before escrow expires.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-purple-200 mb-2">
                  Minimum Reputation
                </label>
                <input
                  type="number"
                  value={reputationRequired ?? 0}
                  onChange={e => setReputationRequired(e.target.value ? Number(e.target.value) : undefined)}
                  min={0}
                  max={100}
                  className="w-full px-4 py-2 bg-white/5 border border白/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-purple-400 mt-1">
                  Optional trust score requirement to engage with this offer.
                </p>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="p-4 bg-red-500/10 border border-red-500/40 rounded-xl">
                <h4 className="text-sm font-semibold text-red-200 mb-2">Please fix the following:</h4>
                <ul className="text-sm text-red-200 space-y-1">
                  {errors.map((error, idx) => (
                    <li key={idx}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-purple-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Offer
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
