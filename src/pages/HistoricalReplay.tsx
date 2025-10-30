import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { TrendingUp, AlertCircle, Download, PlayCircle, Clock } from 'lucide-react';
import { useHistoricalReplayStore, type HistoricalDataSet, type SimulationResult, type CounterfactualResult } from '../store/historicalReplayStore';
import { PlaybackControls } from '../components/historical/PlaybackControls';
import { TimelineScrubber } from '../components/historical/TimelineScrubber';
import { PortfolioImporter } from '../components/historical/PortfolioImporter';
import { StrategyOverlay, type StrategyActionInput } from '../components/historical/StrategyOverlay';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export const HistoricalReplay: React.FC = () => {
  const {
    currentDataset,
    simulationResult,
    counterfactuals,
    setCurrentDataset,
    setSimulationResult,
    addCounterfactual,
    playbackState,
    setError,
  } = useHistoricalReplayStore();

  const [selectedSymbol, setSelectedSymbol] = useState<string>('SOL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [interval, setInterval] = useState<string>('1h');
  const [loading, setLoading] = useState(false);
  const [strategyActions, setStrategyActions] = useState<StrategyActionInput[]>([]);
  const [initialCapital, setInitialCapital] = useState<number>(10000);
  const [commissionRate, setCommissionRate] = useState<number>(0.1);
  const [slippageRate, setSlippageRate] = useState<number>(0.05);

  useEffect(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    setStartDate(thirtyDaysAgo.toISOString().slice(0, 16));
    setEndDate(now.toISOString().slice(0, 16));
  }, []);

  const fetchData = async () => {
    if (!selectedSymbol || !startDate || !endDate) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const start_time = Math.floor(new Date(startDate).getTime() / 1000);
      const end_time = Math.floor(new Date(endDate).getTime() / 1000);

      const dataset: HistoricalDataSet = await invoke('historical_fetch_dataset', {
        request: {
          symbol: selectedSymbol,
          interval,
          start_time,
          end_time,
        },
      });

      setCurrentDataset(dataset);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch historical data');
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!currentDataset) {
      setError('Please load a dataset first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const start_time = currentDataset.data[0]?.timestamp ?? 0;
      const end_time = currentDataset.data[currentDataset.data.length - 1]?.timestamp ?? 0;

      const actions = strategyActions.map((action) => ({
        timestamp: action.timestamp,
        action_type: {
          [action.type === 'buy' ? 'Buy' : 'Sell']: {
            symbol: action.symbol,
            quantity: action.quantity,
            price: action.price,
          },
        },
      }));

      const result: SimulationResult = await invoke('historical_run_simulation', {
        payload: {
          config: {
            start_time,
            end_time,
            initial_capital: initialCapital,
            commission_rate: commissionRate,
            slippage_rate: slippageRate,
            actions,
          },
          datasets: {
            [currentDataset.symbol]: currentDataset.data,
          },
        },
      });

      setSimulationResult(result);
    } catch (error) {
      console.error('Failed to run simulation:', error);
      setError(error instanceof Error ? error.message : 'Failed to run simulation');
    } finally {
      setLoading(false);
    }
  };

  const computeCounterfactual = async () => {
    if (!currentDataset) {
      setError('Please load a dataset first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const start_time = currentDataset.data[0]?.timestamp ?? 0;
      const end_time = currentDataset.data[currentDataset.data.length - 1]?.timestamp ?? 0;

      const result: CounterfactualResult | null = await invoke('historical_compute_counterfactual', {
        request: {
          symbol: selectedSymbol,
          quantity: 100,
          start_time,
          end_time,
        },
      });

      if (result) {
        addCounterfactual(result);
      }
    } catch (error) {
      console.error('Failed to compute counterfactual:', error);
      setError(error instanceof Error ? error.message : 'Failed to compute counterfactual');
    } finally {
      setLoading(false);
    }
  };

  const chartData = {
    labels: currentDataset?.data.map((point) => new Date(point.timestamp * 1000).toLocaleString()) ?? [],
    datasets: [
      {
        label: `${selectedSymbol} Price`,
        data: currentDataset?.data.map((point) => point.close) ?? [],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.2,
      },
    ],
  };

  const portfolioChartData = {
    labels: simulationResult?.snapshots.map((snap) => new Date(snap.timestamp * 1000).toLocaleString()) ?? [],
    datasets: [
      {
        label: 'Portfolio Value',
        data: simulationResult?.snapshots.map((snap) => snap.total_value) ?? [],
        borderColor: 'rgb(16, 185, 129)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.2,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-3xl font-bold text-slate-100">Historical Replay Simulator</h1>
              <p className="text-slate-400 text-sm mt-1">
                Simulate portfolio performance with historical data
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Download className="w-5 h-5" />
                Data Configuration
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Symbol</label>
                  <input
                    type="text"
                    value={selectedSymbol}
                    onChange={(e) => setSelectedSymbol(e.target.value.toUpperCase())}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                    placeholder="SOL"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Interval</label>
                  <select
                    value={interval}
                    onChange={(e) => setInterval(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  >
                    <option value="1m">1 Minute</option>
                    <option value="5m">5 Minutes</option>
                    <option value="15m">15 Minutes</option>
                    <option value="1h">1 Hour</option>
                    <option value="4h">4 Hours</option>
                    <option value="1d">1 Day</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">Start Date</label>
                  <input
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm text-slate-300">End Date</label>
                  <input
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                onClick={fetchData}
                disabled={loading}
                className="w-full py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
              >
                {loading ? 'Loading...' : 'Fetch Historical Data'}
              </button>
            </div>

            {currentDataset && (
              <>
                <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
                  <h3 className="text-lg font-semibold text-slate-100 mb-4">Price Chart</h3>
                  <Line data={chartData} options={{ responsive: true, maintainAspectRatio: true }} />
                </div>

                <PlaybackControls />
                <TimelineScrubber />
              </>
            )}

            {simulationResult && (
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Portfolio Performance</h3>
                <Line data={portfolioChartData} options={{ responsive: true, maintainAspectRatio: true }} />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Simulation Config
              </h2>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-300">Initial Capital ($)</label>
                  <input
                    type="number"
                    value={initialCapital}
                    onChange={(e) => setInitialCapital(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300">Commission Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={commissionRate}
                    onChange={(e) => setCommissionRate(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-sm text-slate-300">Slippage Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={slippageRate}
                    onChange={(e) => setSlippageRate(Number(e.target.value))}
                    className="w-full px-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3 border-t border-slate-700">
                <button
                  onClick={runSimulation}
                  disabled={!currentDataset || loading}
                  className="w-full py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  <PlayCircle className="w-4 h-4 inline mr-2" />
                  Run Simulation
                </button>

                <button
                  onClick={computeCounterfactual}
                  disabled={!currentDataset || loading}
                  className="w-full py-2.5 bg-purple-500 hover:bg-purple-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                >
                  What If Held Since Start?
                </button>
              </div>
            </div>

            <PortfolioImporter onImport={(holdings) => console.log('Imported:', holdings)} />

            {counterfactuals.length > 0 && (
              <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-6">
                <h3 className="text-lg font-semibold text-slate-100 mb-4">Counterfactual Analysis</h3>
                <div className="space-y-3">
                  {counterfactuals.map((cf, idx) => (
                    <div key={idx} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <p className="text-sm font-medium text-slate-200">{cf.symbol}</p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <p className="text-slate-400">Return</p>
                          <p className={`font-semibold ${cf.percent_return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {cf.percent_return.toFixed(2)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Final Value</p>
                          <p className="font-semibold text-slate-200">${cf.final_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <StrategyOverlay
          actions={strategyActions}
          onActionsChange={setStrategyActions}
          simulationResult={simulationResult}
        />
      </div>
    </div>
  );
};

export default HistoricalReplay;
