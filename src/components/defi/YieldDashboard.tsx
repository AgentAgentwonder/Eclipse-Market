import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingUp, Droplet, AlertCircle } from 'lucide-react';
import { YieldFarm, FarmingOpportunity, DeFiPosition } from '../../types/defi';

interface YieldDashboardProps {
  wallet: string;
}

export function YieldDashboard({ wallet }: YieldDashboardProps) {
  const [farms, setFarms] = useState<YieldFarm[]>([]);
  const [opportunities, setOpportunities] = useState<FarmingOpportunity[]>([]);
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [minApy, setMinApy] = useState(10);
  const [maxRisk, setMaxRisk] = useState(70);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allFarms, userPositions, userOpportunities] = await Promise.all([
          invoke<YieldFarm[]>('get_yield_farms'),
          invoke<DeFiPosition[]>('get_farming_positions', { wallet }),
          invoke<FarmingOpportunity[]>('get_farming_opportunities', {
            minApy,
            maxRisk,
          }),
        ]);

        setFarms(allFarms);
        setPositions(userPositions);
        setOpportunities(userOpportunities);
      } catch (error) {
        console.error('Failed to fetch yield farming data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallet, minApy, maxRisk]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Droplet className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-200">Available Farms</h3>
          </div>
          <p className="text-2xl font-bold">{farms.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-gray-200">Your Positions</h3>
          </div>
          <p className="text-2xl font-bold">{positions.length}</p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h3 className="text-sm font-medium text-gray-200">Best Opportunities</h3>
          </div>
          <p className="text-2xl font-bold">{opportunities.length}</p>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Filter Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Min APY: {minApy}%</label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={minApy}
              onChange={e => setMinApy(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Max Risk: {maxRisk}</label>
            <input
              type="range"
              min="0"
              max="100"
              step="10"
              value={maxRisk}
              onChange={e => setMaxRisk(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Top Yield Opportunities</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-800">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                <th className="py-3">Farm</th>
                <th className="py-3">Protocol</th>
                <th className="py-3">APY</th>
                <th className="py-3">Risk-Adj APY</th>
                <th className="py-3">TVL</th>
                <th className="py-3">Risk Score</th>
                <th className="py-3">Rewards</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {opportunities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-gray-400">
                    No opportunities match your filters
                  </td>
                </tr>
              ) : (
                opportunities.map(opp => (
                  <tr key={opp.farm.id} className="text-sm text-gray-200">
                    <td className="py-3">{opp.farm.name}</td>
                    <td className="py-3 uppercase">{opp.farm.protocol}</td>
                    <td className="py-3 text-green-400">{opp.farm.apy.toFixed(2)}%</td>
                    <td className="py-3 text-blue-400">{opp.riskAdjustedApy.toFixed(2)}%</td>
                    <td className="py-3">
                      ${opp.farm.tvl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${
                              opp.farm.riskScore < 40
                                ? 'bg-green-500'
                                : opp.farm.riskScore < 70
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${opp.farm.riskScore}%` }}
                          />
                        </div>
                        <span className="text-xs">{opp.farm.riskScore}</span>
                      </div>
                    </td>
                    <td className="py-3 text-xs">{opp.farm.rewardsToken.join(', ')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Your Active Farms</h2>
        {positions.length === 0 ? (
          <p className="text-gray-400 text-sm">No active farming positions.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-3">Asset</th>
                  <th className="py-3">Protocol</th>
                  <th className="py-3">Value</th>
                  <th className="py-3">APY</th>
                  <th className="py-3">Pending Rewards</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {positions.map(position => (
                  <tr key={position.id}>
                    <td className="py-3">{position.asset}</td>
                    <td className="py-3 uppercase">{position.protocol}</td>
                    <td className="py-3 text-green-400">
                      ${position.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-green-400">{position.apy.toFixed(2)}%</td>
                    <td className="py-3">
                      {position.rewards.map((reward, idx) => (
                        <div key={idx} className="text-xs text-gray-300">
                          {reward.amount.toFixed(2)} {reward.token} (${reward.valueUsd.toFixed(2)})
                        </div>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
