import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { ShoppingBag, TrendingUp, TrendingDown, Clock, Shield, AlertCircle } from 'lucide-react';
import { P2POffer, TraderProfile } from '../../types/p2p';

interface OfferCardProps {
  offer: P2POffer;
  onSelect: () => void;
  currentUserAddress: string;
}

export function OfferCard({ offer, onSelect, currentUserAddress }: OfferCardProps) {
  const [traderProfile, setTraderProfile] = useState<TraderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraderProfile();
  }, [offer.creator]);

  const loadTraderProfile = async () => {
    try {
      const profile = await invoke<TraderProfile>('get_trader_profile', {
        address: offer.creator,
      });
      setTraderProfile(profile);
    } catch (error) {
      console.error('Failed to load trader profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOwnOffer = offer.creator === currentUserAddress;
  const Icon = offer.offerType === 'buy' ? TrendingUp : TrendingDown;
  const colorClass = offer.offerType === 'buy' ? 'from-green-500 to-emerald-500' : 'from-red-500 to-pink-500';

  const reputationColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-blue-400';
    if (score >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const successRate = traderProfile
    ? traderProfile.totalTrades > 0
      ? ((traderProfile.successfulTrades / traderProfile.totalTrades) * 100).toFixed(1)
      : '0'
    : '0';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      className={`bg-white/5 backdrop-blur-lg rounded-lg border border-white/10 overflow-hidden ${
        isOwnOffer ? 'ring-2 ring-purple-500' : ''
      }`}
    >
      <div className={`bg-gradient-to-r ${colorClass} p-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="w-5 h-5 text-white" />
            <span className="font-bold text-white uppercase">{offer.offerType}</span>
            <span className="text-white font-semibold">{offer.tokenSymbol}</span>
          </div>
          {isOwnOffer && (
            <span className="px-2 py-1 bg-white/20 rounded text-xs text-white font-medium">
              Your Offer
            </span>
          )}
        </div>
      </div>

      <div className="p-4">
        {/* Amount and Price */}
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-purple-300 text-sm">Amount</p>
              <p className="text-white font-bold text-xl">{offer.amount.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-purple-300 text-sm">Price</p>
              <p className="text-white font-bold text-xl">
                ${offer.price.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-purple-400">Total</span>
            <span className="text-white font-medium">
              ${(offer.amount * offer.price).toLocaleString()} {offer.fiatCurrency}
            </span>
          </div>
        </div>

        {/* Limits */}
        {(offer.minAmount || offer.maxAmount) && (
          <div className="mb-4 p-2 bg-white/5 rounded">
            <p className="text-purple-300 text-xs mb-1">Trade Limits</p>
            <div className="flex justify-between text-sm">
              <span className="text-purple-400">Min</span>
              <span className="text-white">{offer.minAmount?.toLocaleString() || 'None'}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-purple-400">Max</span>
              <span className="text-white">{offer.maxAmount?.toLocaleString() || 'None'}</span>
            </div>
          </div>
        )}

        {/* Payment Methods */}
        <div className="mb-4">
          <p className="text-purple-300 text-sm mb-2">Payment Methods</p>
          <div className="flex flex-wrap gap-1">
            {offer.paymentMethods.map((method, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-purple-500/20 text-purple-300 rounded text-xs"
              >
                {method}
              </span>
            ))}
          </div>
        </div>

        {/* Trader Info */}
        {!loading && traderProfile && (
          <div className="mb-4 p-2 bg-white/5 rounded">
            <div className="flex items-center justify-between mb-1">
              <span className="text-purple-300 text-xs">Trader Reputation</span>
              <span className={`font-bold ${reputationColor(traderProfile.reputationScore)}`}>
                {traderProfile.reputationScore.toFixed(1)}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400">Success Rate</span>
              <span className="text-white">{successRate}%</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-purple-400">Total Trades</span>
              <span className="text-white">{traderProfile.totalTrades}</span>
            </div>
          </div>
        )}

        {/* Time Limit */}
        <div className="flex items-center gap-2 text-sm text-purple-300 mb-4">
          <Clock className="w-4 h-4" />
          <span>Time limit: {offer.timeLimit} minutes</span>
        </div>

        {/* Terms */}
        {offer.terms && (
          <div className="mb-4 p-2 bg-white/5 rounded">
            <p className="text-purple-300 text-xs mb-1">Terms</p>
            <p className="text-white text-sm">{offer.terms}</p>
          </div>
        )}

        {/* Reputation Required */}
        {offer.reputationRequired && (
          <div className="flex items-center gap-2 text-sm text-yellow-400 mb-4">
            <Shield className="w-4 h-4" />
            <span>Min. reputation: {offer.reputationRequired}</span>
          </div>
        )}

        {/* Action Button */}
        <button
          onClick={onSelect}
          disabled={isOwnOffer}
          className={`w-full py-2 rounded-lg font-medium transition-all ${
            isOwnOffer
              ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
              : `bg-gradient-to-r ${colorClass} text-white hover:shadow-lg`
          }`}
        >
          {isOwnOffer ? 'Your Offer' : 'Trade Now'}
        </button>
      </div>
    </motion.div>
  );
}
