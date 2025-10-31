import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { AutoCompoundSettings, DeFiPosition } from '../../types/defi';

interface PositionManagerProps {
  wallet: string;
  positions: DeFiPosition[];
}

export function PositionManager({ wallet, positions }: PositionManagerProps) {
  const [recommendations, setRecommendations] = useState<AutoCompoundSettings[]>([]);
  const [enabledPositions, setEnabledPositions] = useState<Record<string, boolean>>({});
  const [applying, setApplying] = useState<string | null>(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const data = await invoke<AutoCompoundSettings[]>('get_auto_compound_recommendations', {
          wallet,
        });
        const list = Array.isArray(data) ? data : [];
        setRecommendations(list);

        const configMap: Record<string, boolean> = {};
        list.forEach(item => {
          if (item.enabled) {
            configMap[item.positionId] = true;
          }
        });
        setEnabledPositions(configMap);
      } catch (error) {
        console.error('Failed to fetch auto-compound recommendations', error);
      }
    };

    fetchRecommendations();
  }, [wallet]);

  const positionsByType = useMemo(() => {
    return positions.reduce<Record<string, DeFiPosition[]>>((acc, position) => {
      const key = position.positionType;
      acc[key] = acc[key] ? [...acc[key], position] : [position];
      return acc;
    }, {});
  }, [positions]);

  const handleApplyRecommendation = async (settings: AutoCompoundSettings) => {
    try {
      setApplying(settings.positionId);
      await invoke('configure_auto_compound', { settings });
      setEnabledPositions(prev => ({ ...prev, [settings.positionId]: true }));
    } catch (error) {
      console.error('Failed to apply auto-compound settings', error);
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold">Position Management</h2>
            <p className="text-sm text-gray-400">Monitor allocations and enable smart auto-compounding</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {Object.entries(positionsByType).map(([type, group]) => {
            const totalValue = group.reduce((sum, position) => sum + position.valueUsd, 0);
            const averageApy = group.reduce((sum, position) => sum + position.apy, 0) / group.length;

            return (
              <div key={type} className="bg-gray-800 rounded-xl p-4">
                <h3 className="text-sm font-medium text-gray-300 capitalize">{type}</h3>
                <p className="text-2xl font-bold mt-2">
                  ${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-gray-400 mt-1">Avg. APY {averageApy.toFixed(2)}%</p>
              </div>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="py-3">Position</th>
                <th className="py-3">Protocol</th>
                <th className="py-3">Value</th>
                <th className="py-3">APY</th>
                <th className="py-3">Rewards</th>
                <th className="py-3">Auto-Compound</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {positions.map(position => {
                const recommendation = recommendations.find(r => r.positionId === position.id);
                const hasRewards = position.rewards.length > 0;
                const isEnabled = enabledPositions[position.id];

                return (
                  <tr key={position.id}>
                    <td className="py-3">
                      <div className="flex flex-col">
                        <span className="font-medium">{position.asset}</span>
                        <span className="text-xs text-gray-400 capitalize">{position.positionType}</span>
                      </div>
                    </td>
                    <td className="py-3 uppercase">{position.protocol}</td>
                    <td className="py-3 text-green-400">
                      ${position.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3">{position.apy.toFixed(2)}%</td>
                    <td className="py-3 text-xs">
                      {position.rewards.length === 0 ? (
                        <span className="text-gray-400">No rewards</span>
                      ) : (
                        position.rewards.map((reward, idx) => (
                          <div key={idx} className="text-gray-300">
                            {reward.amount.toFixed(2)} {reward.token}
                          </div>
                        ))
                      )}
                    </td>
                    <td className="py-3">
                      {recommendation && hasRewards ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleApplyRecommendation(recommendation)}
                            disabled={isEnabled || applying === position.id}
                            className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                              isEnabled
                                ? 'bg-green-600/20 text-green-300 cursor-default'
                                : 'bg-purple-600 hover:bg-purple-700 text-white'
                            } ${applying === position.id ? 'opacity-60' : ''}`}
                          >
                            {isEnabled ? (
                              <span className="flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" /> Enabled
                              </span>
                            ) : applying === position.id ? (
                              'Applying…'
                            ) : (
                              `Enable (>${recommendation.threshold.toFixed(2)} USD)`
                            )}
                          </button>
                          <span className="text-xs text-gray-400">Every {(recommendation.frequency / 3600).toFixed(1)}h</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">No automation</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
