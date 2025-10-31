import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  Download,
  Settings,
  Info,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import type {
  TaxCenterSummary,
  TaxJurisdiction,
  TaxSettings,
  HarvestingRecommendation,
  WashSaleWarning,
  TaxAlert,
} from '../../types/tax';

export function TaxCenter() {
  const [summary, setSummary] = useState<TaxCenterSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'harvesting' | 'warnings' | 'settings'>('overview');
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<'cointracker' | 'koinly' | 'csv'>('cointracker');
  const [exporting, setExporting] = useState(false);

  const fetchTaxSummary = async () => {
    try {
      const data = await invoke<TaxCenterSummary>('get_tax_center_summary', {
        taxYear: new Date().getFullYear(),
      });
      setSummary(data);
    } catch (error) {
      console.error('Failed to fetch tax summary:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxSummary();
  }, []);

  const handleExport = async () => {
    if (!summary) return;

    setExporting(true);
    try {
      const result = await invoke<{ data: string; filename: string }>('export_tax_center_report', {
        format: exportFormat,
        params: { taxYear: summary.projection.taxYear },
      });

      const blob = new Blob([result.data], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export tax report:', error);
    } finally {
      setExporting(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/10';
      case 'high':
        return 'text-orange-500 bg-orange-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      case 'low':
        return 'text-blue-500 bg-blue-500/10';
      default:
        return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getPriorityColor = (priority: string) => {
    return getSeverityColor(priority);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="flex items-center justify-center h-96 text-gray-400">
        <p>Failed to load tax data</p>
      </div>
    );
  }

  const { projection, harvestingRecommendations, washSaleWarnings, alerts } = summary;

  return (
    <div className="space-y-6">
      {/* Legal Disclaimer */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
      >
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="flex-1 text-sm">
            <p className="text-yellow-200 font-medium mb-1">Tax Disclaimer</p>
            <p className="text-yellow-300/80">
              This tax information is provided for educational purposes only and should not be considered as
              professional tax advice. Always consult with a qualified tax professional for your specific situation.
              Tax laws vary by jurisdiction and are subject to change.
            </p>
          </div>
        </div>
      </motion.div>

      {/* Tax Projection Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-gray-400">Total Tax Owed</span>
          </div>
          <p className="text-2xl font-bold text-purple-200">
            ${projection.totalTaxOwed.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Effective rate: {(projection.effectiveTaxRate * 100).toFixed(2)}%
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Net Gains</span>
          </div>
          <p className="text-2xl font-bold text-green-200">
            ${((projection.totalShortTermGains + projection.totalLongTermGains) - (projection.totalShortTermLosses + projection.totalLongTermLosses)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            ST: ${projection.netShortTerm.toFixed(0)} / LT: ${projection.netLongTerm.toFixed(0)}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Unrealized Losses</span>
          </div>
          <p className="text-2xl font-bold text-blue-200">
            ${projection.unrealizedLosses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Harvestable opportunities
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20 rounded-lg p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-gray-400">Potential Savings</span>
          </div>
          <p className="text-2xl font-bold text-orange-200">
            ${projection.potentialSavingsFromHarvesting.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            From tax-loss harvesting
          </p>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-700">
        <div className="flex gap-4">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'harvesting', label: `Harvesting (${harvestingRecommendations.length})` },
            { id: 'warnings', label: `Wash Sales (${washSaleWarnings.length})` },
            { id: 'settings', label: 'Settings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-2 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-purple-500 text-purple-400'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {selectedTab === 'overview' && (
        <div className="space-y-4">
          {/* Alerts */}
          {alerts.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-200">Active Alerts</h3>
              {alerts.slice(0, 5).map((alert) => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-lg p-4 ${getSeverityColor(alert.severity).replace('text-', 'border-')}/30`}
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className={`h-5 w-5 ${getSeverityColor(alert.severity).split(' ')[0]} mt-0.5`} />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-200">{alert.title}</h4>
                      <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
                      {alert.recommendations.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {alert.recommendations.map((rec, idx) => (
                            <li key={idx} className="text-xs text-gray-500 flex items-center gap-2">
                              <span className="h-1 w-1 rounded-full bg-gray-600" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Export Section */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-200 mb-4">Export Tax Report</h3>
            <div className="flex items-center gap-4">
              <select
                value={exportFormat}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-gray-200"
              >
                <option value="cointracker">CoinTracker</option>
                <option value="koinly">Koinly</option>
                <option value="csv">CSV</option>
              </select>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-white transition-colors"
              >
                <Download className="h-4 w-4" />
                {exporting ? 'Exporting...' : 'Export Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'harvesting' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-200">Tax-Loss Harvesting Recommendations</h3>
          {harvestingRecommendations.length === 0 ? (
            <p className="text-gray-400">No harvesting opportunities available at this time.</p>
          ) : (
            harvestingRecommendations.map((rec) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-gray-200">{rec.asset}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${getPriorityColor(rec.priority)}`}>
                        {rec.priority.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-3">{rec.reason}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Unrealized Loss</span>
                        <p className="text-red-400 font-medium">${rec.unrealizedLoss.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tax Savings</span>
                        <p className="text-green-400 font-medium">${rec.taxSavings.toFixed(2)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Amount</span>
                        <p className="text-gray-300">{rec.amount.toFixed(4)} {rec.asset}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Holding Period</span>
                        <p className="text-gray-300">{rec.holdingPeriodDays} days</p>
                      </div>
                    </div>
                    {rec.washSaleRisk && (
                      <div className="mt-3 flex items-center gap-2 text-xs text-yellow-400">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Wash sale risk detected</span>
                      </div>
                    )}
                    {rec.alternativeAssets.length > 0 && (
                      <div className="mt-2 text-xs text-gray-500">
                        Alternative assets: {rec.alternativeAssets.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'warnings' && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-200">Wash Sale Warnings</h3>
          {washSaleWarnings.length === 0 ? (
            <p className="text-gray-400">No wash sale warnings detected.</p>
          ) : (
            washSaleWarnings.map((warning, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4"
              >
                <div className="flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-yellow-200">{warning.asset} - Wash Sale Detected</h4>
                    <p className="text-sm text-yellow-300/80 mt-1">
                      ${warning.disallowedLoss.toFixed(2)} loss disallowed due to repurchase on{' '}
                      {new Date(warning.repurchaseDate).toLocaleDateString()}
                    </p>
                    <p className="text-xs text-yellow-400 mt-2">{warning.recommendation}</p>
                    <div className="mt-3 grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-gray-500">Sale Date</span>
                        <p className="text-gray-300">{new Date(warning.saleDate).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Sale Amount</span>
                        <p className="text-gray-300">{warning.saleAmount.toFixed(4)}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Repurchase Amount</span>
                        <p className="text-gray-300">{warning.repurchaseAmount.toFixed(4)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-200">Tax Settings</h3>
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Tax Jurisdiction</label>
              <p className="text-gray-200 font-medium">{summary.settings.jurisdiction.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                Short-term rate: {(summary.settings.jurisdiction.shortTermRate * 100).toFixed(1)}% | Long-term rate:{' '}
                {(summary.settings.jurisdiction.longTermRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Cost Basis Method</label>
              <p className="text-gray-200">{summary.settings.defaultCostBasisMethod}</p>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-5 w-5 ${summary.settings.enableWashSaleDetection ? 'text-green-500' : 'text-gray-600'}`}
              />
              <span className="text-gray-300">Wash Sale Detection Enabled</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2
                className={`h-5 w-5 ${summary.settings.enableTaxLossHarvesting ? 'text-green-500' : 'text-gray-600'}`}
              />
              <span className="text-gray-300">Tax-Loss Harvesting Enabled</span>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              To modify tax settings, please consult with your tax advisor and update through the secure settings panel.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
