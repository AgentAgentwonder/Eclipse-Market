import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingUp, TrendingDown, Shield } from 'lucide-react';
import { DeFiPosition, LendingPool, RiskLevel } from '../../types/defi';

interface MarginfiBank {
  address: string;
  symbol: string;
  lendingApy: number;
  borrowingApy: number;
  totalDeposits: number;
  totalLoans: number;
  utilization: number;
  riskTier: RiskLevel;
}

interface LendingDashboardProps {
  wallet: string;
}

export function LendingDashboard({ wallet }: LendingDashboardProps) {
  const [solendPools, setSolendPools] = useState<LendingPool[]>([]);
  const [marginfiBanks, setMarginfiBanks] = useState<MarginfiBank[]>([]);
  const [positions, setPositions] = useState<DeFiPosition[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [solend, marginfi, userSolendPositions, userMarginfiPositions] = await Promise.all([
          invoke<LendingPool[]>('get_solend_pools'),
          invoke<MarginfiBank[]>('get_marginfi_banks'),
          invoke<DeFiPosition[]>('get_solend_positions', { wallet }),
          invoke<DeFiPosition[]>('get_marginfi_positions', { wallet }),
        ]);

        setSolendPools(solend);
        setMarginfiBanks(marginfi);
        setPositions([...userSolendPositions, ...userMarginfiPositions]);
      } catch (error) {
        console.error('Failed to fetch lending data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [wallet]);

  const lendingPositions = useMemo(
    () => positions.filter(position => position.positionType === 'lending'),
    [positions]
  );

  const borrowingPositions = useMemo(
    () => positions.filter(position => position.positionType === 'borrowing'),
    [positions]
  );

  const totalSupply = useMemo(() => solendPools.reduce((sum, pool) => sum + pool.totalSupply, 0), [
    solendPools,
  ]);

  const totalBorrow = useMemo(
    () => solendPools.reduce((sum, pool) => sum + pool.totalBorrow, 0),
    [solendPools]
  );

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
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-gray-200">Total Supplied</h3>
          </div>
          <p className="text-2xl font-bold">
            ${totalSupply.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h3 className="text-sm font-medium text-gray-200">Total Borrowed</h3>
          </div>
          <p className="text-2xl font-bold">
            ${totalBorrow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-medium text-gray-200">Active Positions</h3>
          </div>
          <p className="text-2xl font-bold">{positions.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">Solend Pools</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-3">Asset</th>
                  <th className="py-3">Supply APY</th>
                  <th className="py-3">Borrow APY</th>
                  <th className="py-3">Utilization</th>
                  <th className="py-3">Liquidity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {solendPools.map(pool => (
                  <tr key={pool.id} className="text-sm text-gray-200">
                    <td className="py-3">{pool.asset}</td>
                    <td className="py-3 text-green-400">{pool.supplyApy.toFixed(2)}%</td>
                    <td className="py-3 text-red-400">{pool.borrowApy.toFixed(2)}%</td>
                    <td className="py-3">{(pool.utilizationRate * 100).toFixed(1)}%</td>
                    <td className="py-3">
                      ${pool.availableLiquidity.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-4">MarginFi Banks</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-3">Asset</th>
                  <th className="py-3">Lending APY</th>
                  <th className="py-3">Borrowing APY</th>
                  <th className="py-3">Utilization</th>
                  <th className="py-3">Risk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {marginfiBanks.map(bank => (
                  <tr key={bank.address} className="text-sm text-gray-200">
                    <td className="py-3">{bank.symbol}</td>
                    <td className="py-3 text-green-400">{bank.lendingApy.toFixed(2)}%</td>
                    <td className="py-3 text-red-400">{bank.borrowingApy.toFixed(2)}%</td>
                    <td className="py-3">{(bank.utilization * 100).toFixed(1)}%</td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          bank.riskTier === 'low'
                            ? 'bg-green-500/20 text-green-300'
                            : bank.riskTier === 'medium'
                              ? 'bg-yellow-500/20 text-yellow-200'
                              : 'bg-red-500/20 text-red-300'
                        }`}
                      >
                        {bank.riskTier.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Your Lending & Borrowing</h2>
        {positions.length === 0 ? (
          <p className="text-gray-400 text-sm">No active positions detected.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-800">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-400">
                  <th className="py-3">Type</th>
                  <th className="py-3">Protocol</th>
                  <th className="py-3">Asset</th>
                  <th className="py-3">Value</th>
                  <th className="py-3">APY</th>
                  <th className="py-3">Health</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800 text-sm">
                {lendingPositions.map(position => (
                  <tr key={position.id}>
                    <td className="py-3 capitalize">{position.positionType}</td>
                    <td className="py-3 uppercase">{position.protocol}</td>
                    <td className="py-3">{position.asset}</td>
                    <td className="py-3 text-green-400">
                      ${position.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-green-400">{position.apy.toFixed(2)}%</td>
                    <td className="py-3 text-xs text-gray-300">
                      {position.healthFactor ? position.healthFactor.toFixed(2) : 'N/A'}
                    </td>
                  </tr>
                ))}
                {borrowingPositions.map(position => (
                  <tr key={position.id}>
                    <td className="py-3 capitalize text-red-400">{position.positionType}</td>
                    <td className="py-3 uppercase">{position.protocol}</td>
                    <td className="py-3">{position.asset}</td>
                    <td className="py-3 text-red-400">
                      ${position.valueUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </td>
                    <td className="py-3 text-red-400">{Math.abs(position.apy).toFixed(2)}%</td>
                    <td className="py-3 text-xs text-gray-300">
                      {position.healthFactor ? position.healthFactor.toFixed(2) : 'N/A'}
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
