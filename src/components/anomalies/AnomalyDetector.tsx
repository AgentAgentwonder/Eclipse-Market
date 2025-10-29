import { useEffect, useState } from 'react';
import { useAnomalyStore } from '../../store/anomalyStore';
import { AlertTriangle, ShieldAlert, Info, X, BarChart3, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import type { Anomaly } from '../../types/anomalies';

interface Props {
  tokenAddress: string;
}

export function AnomalyDetector({ tokenAddress }: Props) {
  const {
    anomalies,
    activeAnomalies,
    statistics,
    loading,
    fetchAnomalies,
    fetchActiveAnomalies,
    fetchStatistics,
    dismissAnomaly,
    generateMockData,
  } = useAnomalyStore();

  const [selectedAnomaly, setSelectedAnomaly] = useState<Anomaly | null>(null);
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetchAnomalies(tokenAddress);
    fetchActiveAnomalies();
    fetchStatistics(tokenAddress);
  }, [tokenAddress, fetchAnomalies, fetchActiveAnomalies, fetchStatistics]);

  const handleGenerateMockData = async () => {
    await generateMockData(tokenAddress);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-900/20 border-red-600';
      case 'high':
        return 'text-orange-500 bg-orange-900/20 border-orange-600';
      case 'medium':
        return 'text-yellow-500 bg-yellow-900/20 border-yellow-600';
      default:
        return 'text-blue-500 bg-blue-900/20 border-blue-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <ShieldAlert className="w-5 h-5" />;
      default:
        return <AlertTriangle className="w-5 h-5" />;
    }
  };

  const getAnomalyTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      price_zscore: 'Price Z-Score',
      price_iqr: 'Price IQR',
      volume_spike: 'Volume Spike',
      wash_trading: 'Wash Trading',
    };
    return labels[type] || type;
  };

  const filteredAnomalies = filterType
    ? anomalies.filter((a) => a.anomaly_type === filterType)
    : anomalies;

  const stats = statistics[tokenAddress];
  const types = stats ? Object.keys(stats.by_type) : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Anomaly Detection
        </h2>
        <button
          onClick={handleGenerateMockData}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
        >
          Generate Test Data
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 mb-2">Total Anomalies</div>
            <div className="text-3xl font-bold">{stats.total_anomalies}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 mb-2">Active Anomalies</div>
            <div className="text-3xl font-bold text-red-400">{stats.active_anomalies}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 mb-2">By Severity</div>
            <div className="space-y-1 text-sm">
              {Object.entries(stats.by_severity).map(([severity, count]) => (
                <div key={severity} className="flex justify-between">
                  <span className="capitalize">{severity}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="text-gray-400 mb-2">By Type</div>
            <div className="space-y-1 text-sm">
              {Object.entries(stats.by_type).slice(0, 3).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span className="truncate">{getAnomalyTypeLabel(type)}:</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterType(undefined)}
          className={`px-4 py-2 rounded-lg ${!filterType ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
        >
          All
        </button>
        {types.map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg ${filterType === type ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
          >
            {getAnomalyTypeLabel(type)} ({stats?.by_type[type] || 0})
          </button>
        ))}
      </div>

      {/* Active Anomalies */}
      {activeAnomalies.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Active Anomalies ({activeAnomalies.length})
          </h3>
          <div className="space-y-2">
            {activeAnomalies.slice(0, 5).map((anomaly) => (
              <div
                key={anomaly.id}
                className={`rounded-lg p-4 border flex justify-between items-start ${getSeverityColor(anomaly.severity)}`}
              >
                <div className="flex gap-3 flex-1">
                  <div className="mt-1">{getSeverityIcon(anomaly.severity)}</div>
                  <div className="flex-1">
                    <div className="font-semibold capitalize">{getAnomalyTypeLabel(anomaly.anomaly_type)}</div>
                    <div className="text-sm mt-1 opacity-90">{anomaly.explanation.substring(0, 150)}...</div>
                    <div className="text-xs opacity-75 mt-2">
                      {format(new Date(anomaly.timestamp * 1000), 'PPp')}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className="p-2 hover:bg-white/10 rounded"
                  >
                    <Info className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dismissAnomaly(anomaly.id)}
                    className="p-2 hover:bg-white/10 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Anomalies List */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">
          Anomaly History ({filteredAnomalies.length})
        </h3>
        {loading && filteredAnomalies.length === 0 ? (
          <div className="text-gray-400 text-center py-8">Loading anomalies...</div>
        ) : filteredAnomalies.length === 0 ? (
          <div className="text-gray-400 text-center py-8">
            No anomalies detected. Generate test data to see examples.
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredAnomalies.map((anomaly) => (
              <div
                key={anomaly.id}
                className={`border rounded-lg p-4 ${anomaly.is_active ? getSeverityColor(anomaly.severity) : 'bg-gray-700/50 border-gray-600 opacity-60'}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex gap-3 flex-1">
                    <div className="mt-1">{getSeverityIcon(anomaly.severity)}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{getAnomalyTypeLabel(anomaly.anomaly_type)}</span>
                        <span className="text-xs px-2 py-1 rounded bg-gray-900/50 capitalize">
                          {anomaly.severity}
                        </span>
                        {!anomaly.is_active && (
                          <span className="text-xs px-2 py-1 rounded bg-gray-700">Dismissed</span>
                        )}
                      </div>
                      <div className="text-sm mt-2">Value: {anomaly.value.toFixed(6)}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {format(new Date(anomaly.timestamp * 1000), 'PPp')}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAnomaly(anomaly)}
                    className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                  >
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Anomaly Detail Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-700 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-bold">{getAnomalyTypeLabel(selectedAnomaly.anomaly_type)}</h3>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-sm px-2 py-1 rounded capitalize ${getSeverityColor(selectedAnomaly.severity)}`}>
                    {selectedAnomaly.severity}
                  </span>
                  <span className="text-sm text-gray-400">
                    {format(new Date(selectedAnomaly.timestamp * 1000), 'PPpp')}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAnomaly(null)}
                className="p-2 hover:bg-gray-700 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Explanation</h4>
                <p className="text-sm text-gray-300">{selectedAnomaly.explanation}</p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Details</h4>
                <div className="bg-gray-900 rounded-lg p-4 space-y-2">
                  {Object.entries(selectedAnomaly.details).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Detected Value</div>
                  <div className="text-lg font-semibold">{selectedAnomaly.value.toFixed(6)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Threshold</div>
                  <div className="text-lg font-semibold">{selectedAnomaly.threshold.toFixed(2)}</div>
                </div>
              </div>
              {selectedAnomaly.is_active && (
                <button
                  onClick={() => {
                    dismissAnomaly(selectedAnomaly.id);
                    setSelectedAnomaly(null);
                  }}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg"
                >
                  Dismiss Anomaly
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
