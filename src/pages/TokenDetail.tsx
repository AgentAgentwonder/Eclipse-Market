import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  AlertTriangle,
  TrendingUp,
  Download,
  ExternalLink,
  Shield,
  CheckCircle,
  XCircle,
  Info,
  Activity,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { HolderDistributionChart } from '../components/holders/HolderDistributionChart';
import { HolderTrendsChart } from '../components/holders/HolderTrendsChart';
import { TopHoldersTable } from '../components/holders/TopHoldersTable';
import { LargeTransfersTable } from '../components/holders/LargeTransfersTable';
import { MetadataViewer } from '../components/holders/MetadataViewer';
import { VerificationBadges } from '../components/holders/VerificationBadges';
import { RiskAnalysisPanel } from '../components/risk/RiskAnalysisPanel';
import {
  HolderDistribution,
  HolderTrend,
  LargeTransfer,
  TokenMetadata,
  VerificationStatus,
} from '../types/holders';

interface TokenDetailProps {
  tokenAddress: string;
  onBack: () => void;
}

export default function TokenDetail({ tokenAddress, onBack }: TokenDetailProps) {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'holders' | 'metadata' | 'verification'>('holders');
  const [distribution, setDistribution] = useState<HolderDistribution | null>(null);
  const [trends, setTrends] = useState<HolderTrend[]>([]);
  const [transfers, setTransfers] = useState<LargeTransfer[]>([]);
  const [metadata, setMetadata] = useState<TokenMetadata | null>(null);
  const [verification, setVerification] = useState<VerificationStatus | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    loadTokenData();
  }, [tokenAddress]);

  const loadTokenData = async () => {
    setLoading(true);
    try {
      const [distData, trendsData, transfersData, metaData, verifyData] = await Promise.all([
        invoke<HolderDistribution>('get_holder_distribution', { tokenAddress }),
        invoke<HolderTrend[]>('get_holder_trends', { tokenAddress, days: 30 }),
        invoke<LargeTransfer[]>('get_large_transfers', { tokenAddress, days: 30 }),
        invoke<TokenMetadata>('get_token_metadata', { tokenAddress }),
        invoke<VerificationStatus>('get_verification_status', { tokenAddress }),
      ]);

      setDistribution(distData);
      setTrends(trendsData);
      setTransfers(transfersData);
      setMetadata(metaData);
      setVerification(verifyData);
    } catch (error) {
      console.error('Failed to load token data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportHolderData = async () => {
    setExporting(true);
    try {
      const data = await invoke('export_holder_data', { tokenAddress, days: 30 });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tokenAddress}-holder-data-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export holder data:', error);
    } finally {
      setExporting(false);
    }
  };

  const handleExportMetadata = async () => {
    setExporting(true);
    try {
      const data = await invoke('export_metadata_snapshot', { tokenAddress });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tokenAddress}-metadata-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export metadata:', error);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading token data...</p>
        </div>
      </div>
    );
  }

  if (!distribution || !metadata || !verification) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400">Failed to load token data</p>
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const riskColor =
    distribution.concentrationRisk === 'Critical'
      ? 'text-red-500'
      : distribution.concentrationRisk === 'High'
        ? 'text-orange-500'
        : distribution.concentrationRisk === 'Medium'
          ? 'text-yellow-500'
          : 'text-green-500';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              {metadata.logoUri && (
                <img
                  src={metadata.logoUri}
                  alt={metadata.name}
                  className="w-12 h-12 rounded-full"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold">{metadata.name}</h1>
                <p className="text-gray-400">{metadata.symbol}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <VerificationBadges verification={verification} />
          <button
            onClick={activeTab === 'metadata' ? handleExportMetadata : handleExportHolderData}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500 rounded-lg hover:bg-purple-600 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-400">
            <Users className="h-4 w-4" />
            <span className="text-sm">Total Holders</span>
          </div>
          <p className="text-2xl font-bold">{distribution.totalHolders.toLocaleString()}</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-400">
            <Activity className="h-4 w-4" />
            <span className="text-sm">Gini Coefficient</span>
          </div>
          <p className="text-2xl font-bold">{distribution.giniCoefficient.toFixed(3)}</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm">Concentration Risk</span>
          </div>
          <p className={`text-2xl font-bold ${riskColor}`}>{distribution.concentrationRisk}</p>
        </div>

        <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 p-4 backdrop-blur-sm">
          <div className="mb-2 flex items-center gap-2 text-gray-400">
            <TrendingUp className="h-4 w-4" />
            <span className="text-sm">Top 10 Holdings</span>
          </div>
          <p className="text-2xl font-bold">{distribution.top10Percentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* ML Risk Analysis */}
      <div className="rounded-2xl border border-purple-500/20 bg-slate-900/40 p-6">
        <RiskAnalysisPanel tokenAddress={tokenAddress} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-purple-500/20">
        {[
          { id: 'holders', label: 'Holder Analysis', icon: Users },
          { id: 'metadata', label: 'Token Metadata', icon: Info },
          { id: 'verification', label: 'Verification', icon: Shield },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-6 py-3 font-medium transition-all flex items-center gap-2 border-b-2 ${
              activeTab === tab.id
                ? 'text-purple-300 border-purple-500'
                : 'text-gray-400 border-transparent hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'holders' && (
          <div className="space-y-6">
            {/* Holder Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <HolderDistributionChart distribution={distribution} />
              <HolderTrendsChart trends={trends} />
            </div>

            {/* Top Holders Table */}
            <TopHoldersTable holders={distribution.topHolders.slice(0, 20)} />

            {/* Large Transfers */}
            {transfers.length > 0 && <LargeTransfersTable transfers={transfers} />}
          </div>
        )}

        {activeTab === 'metadata' && <MetadataViewer metadata={metadata} />}

        {activeTab === 'verification' && (
          <div className="space-y-6">
            {/* Verification Status */}
            <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4">Verification Status</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {verification.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span>Verified Token</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verification.verifiedOnSolanaExplorer ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                    <span>Solana Explorer Verified</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {verification.auditStatus === 'Audited' ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-500" />
                    )}
                    <span>{verification.auditStatus}</span>
                    {verification.auditProvider && (
                      <span className="text-sm text-gray-400">by {verification.auditProvider}</span>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-gray-400 text-sm mb-1">Risk Score</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            verification.riskScore > 0.7
                              ? 'bg-red-500'
                              : verification.riskScore > 0.4
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                          }`}
                          style={{ width: `${verification.riskScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{(verification.riskScore * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-400 text-sm mb-1">Community Trust</p>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-green-500">↑ {verification.communityVotes.upvotes}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-red-500">↓ {verification.communityVotes.downvotes}</span>
                      </div>
                      <div className="flex-1 bg-slate-700 rounded-full h-2">
                        <div
                          className="h-2 rounded-full bg-purple-500"
                          style={{
                            width: `${verification.communityVotes.trustScore * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vulnerabilities */}
            {verification.vulnerabilities.length > 0 && (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-red-500/20 rounded-xl p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Known Vulnerabilities
                </h3>
                <div className="space-y-3">
                  {verification.vulnerabilities.map((vuln, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-slate-900/50 rounded-lg"
                    >
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          vuln.severity === 'High'
                            ? 'bg-red-500/20 text-red-500'
                            : vuln.severity === 'Medium'
                              ? 'bg-yellow-500/20 text-yellow-500'
                              : 'bg-blue-500/20 text-blue-500'
                        }`}
                      >
                        {vuln.severity}
                      </span>
                      <div className="flex-1">
                        <p>{vuln.description}</p>
                        <p className="text-sm text-gray-400 mt-1">
                          Discovered {new Date(vuln.discoveredAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
