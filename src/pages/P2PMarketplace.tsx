import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Users,
  Search,
  Filter,
  Plus,
} from 'lucide-react';
import { OfferCreationModal } from '../components/p2p/OfferCreationModal';
import { OfferCard } from '../components/p2p/OfferCard';
import { EscrowFlow } from '../components/p2p/EscrowFlow';
import { SettlementDashboard } from '../components/p2p/SettlementDashboard';
import { ComplianceWarnings } from '../components/p2p/ComplianceWarnings';
import { DisputePanel } from '../components/p2p/DisputePanel';
import { P2PChat } from '../components/p2p/P2PChat';
import { TraderProfile } from '../components/p2p/TraderProfile';

interface P2POffer {
  id: string;
  creator: string;
  offerType: 'buy' | 'sell';
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  fiatCurrency: string;
  paymentMethods: string[];
  minAmount?: number;
  maxAmount?: number;
  terms?: string;
  timeLimit: number;
  createdAt: string;
  isActive: boolean;
  completedTrades: number;
  reputationRequired?: number;
}

interface P2PStats {
  totalOffers: number;
  activeOffers: number;
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  totalDisputes: number;
  openDisputes: number;
  totalVolume: number;
}

export default function P2PMarketplace() {
  const [activeTab, setActiveTab] = useState<'buy' | 'sell' | 'my-trades'>('buy');
  const [offers, setOffers] = useState<P2POffer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<P2POffer[]>([]);
  const [stats, setStats] = useState<P2PStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tokenFilter, setTokenFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<P2POffer | null>(null);
  const [showEscrowFlow, setShowEscrowFlow] = useState(false);
  const [showSettlement, setShowSettlement] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');

  useEffect(() => {
    loadData();
    loadUserAddress();
  }, []);

  useEffect(() => {
    filterOffers();
  }, [offers, searchQuery, tokenFilter, activeTab]);

  const loadUserAddress = async () => {
    try {
      const address = await invoke<string>('get_current_wallet_address');
      setUserAddress(address);
    } catch (error) {
      console.error('Failed to load user address:', error);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [offersData, statsData] = await Promise.all([
        invoke<P2POffer[]>('list_p2p_offers', {
          offerType: null,
          tokenAddress: null,
          activeOnly: true,
        }),
        invoke<P2PStats>('get_p2p_stats'),
      ]);
      
      setOffers(offersData);
      setStats(statsData);
    } catch (error) {
      console.error('Failed to load P2P data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterOffers = () => {
    let filtered = offers;

    if (activeTab === 'buy') {
      filtered = filtered.filter(o => o.offerType === 'sell');
    } else if (activeTab === 'sell') {
      filtered = filtered.filter(o => o.offerType === 'buy');
    } else if (activeTab === 'my-trades') {
      filtered = filtered.filter(o => o.creator === userAddress);
    }

    if (searchQuery) {
      filtered = filtered.filter(o =>
        o.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        o.creator.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (tokenFilter) {
      filtered = filtered.filter(o => o.tokenAddress === tokenFilter);
    }

    setFilteredOffers(filtered);
  };

  const handleOfferSelect = (offer: P2POffer) => {
    setSelectedOffer(offer);
    setShowEscrowFlow(true);
  };

  const handleOfferCreated = async () => {
    setShowCreateModal(false);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                P2P Marketplace
              </h1>
              <p className="text-purple-300">
                Trade directly with other users using secure escrow
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Offer
            </button>
          </div>

          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Active Offers</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stats.activeOffers}
                    </p>
                  </div>
                  <ShoppingBag className="w-8 h-8 text-purple-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Active Trades</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stats.activeEscrows}
                    </p>
                  </div>
                  <ShoppingCart className="w-8 h-8 text-blue-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Total Volume</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      ${stats.totalVolume.toLocaleString()}
                    </p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400" />
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-lg rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-300 text-sm">Open Disputes</p>
                    <p className="text-2xl font-bold text-white mt-1">
                      {stats.openDisputes}
                    </p>
                  </div>
                  <Shield className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Tabs and Filters */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('buy')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'buy'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setActiveTab('sell')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'sell'
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                Sell
              </button>
              <button
                onClick={() => setActiveTab('my-trades')}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'my-trades'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                    : 'bg-white/5 text-purple-300 hover:bg-white/10'
                }`}
              >
                My Trades
              </button>
            </div>

            <button
              onClick={() => setShowSettlement(true)}
              className="ml-auto px-4 py-2 bg-white/5 text-purple-300 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              Active Trades
            </button>
          </div>

          {/* Search and Filter */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-purple-400" />
              <input
                type="text"
                placeholder="Search by token or trader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-purple-400 focus:outline-none focus:border-purple-500"
              />
            </div>
            <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-purple-300 hover:bg-white/10 transition-all flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {/* Offers Grid */}
        <AnimatePresence mode="wait">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500" />
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-20">
              <ShoppingBag className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <p className="text-xl text-purple-300 mb-2">No offers found</p>
              <p className="text-purple-400">Try adjusting your filters or create a new offer</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOffers.map((offer) => (
                <OfferCard
                  key={offer.id}
                  offer={offer}
                  onSelect={() => handleOfferSelect(offer)}
                  currentUserAddress={userAddress}
                />
              ))}
            </div>
          )}
        </AnimatePresence>

        {/* Modals */}
        {showCreateModal && (
          <OfferCreationModal
            onClose={() => setShowCreateModal(false)}
            onSuccess={handleOfferCreated}
            userAddress={userAddress}
          />
        )}

        {showEscrowFlow && selectedOffer && (
          <EscrowFlow
            offer={selectedOffer}
            userAddress={userAddress}
            onClose={() => {
              setShowEscrowFlow(false);
              setSelectedOffer(null);
            }}
            onSuccess={() => {
              loadData();
              setShowEscrowFlow(false);
              setSelectedOffer(null);
            }}
          />
        )}

        {showSettlement && (
          <SettlementDashboard
            userAddress={userAddress}
            onClose={() => setShowSettlement(false)}
          />
        )}
      </div>
    </div>
  );
}
