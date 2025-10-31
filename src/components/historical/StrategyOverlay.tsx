import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { SimulationResult } from '../../store/historicalReplayStore';

export interface StrategyActionInput {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  timestamp: number;
}

interface StrategyOverlayProps {
  actions: StrategyActionInput[];
  onActionsChange: (actions: StrategyActionInput[]) => void;
  simulationResult: SimulationResult | null;
}

export const StrategyOverlay: React.FC<StrategyOverlayProps> = ({
  actions,
  onActionsChange,
  simulationResult,
}) => {
  const [newAction, setNewAction] = useState<Omit<StrategyActionInput, 'id'>>({
    symbol: '',
    type: 'buy',
    quantity: 0,
    price: 0,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const addAction = () => {
    if (!newAction.symbol || newAction.quantity <= 0) return;
    const action: StrategyActionInput = {
      id: crypto.randomUUID(),
      ...newAction,
    };
    onActionsChange([...actions, action]);
    setNewAction({ ...newAction, symbol: '', quantity: 0 });
  };

  const removeAction = (id: string) => {
    onActionsChange(actions.filter((action) => action.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">Strategy Actions</h3>
        </div>

        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-slate-400">Symbol</label>
              <input
                type="text"
                value={newAction.symbol}
                onChange={(event) => setNewAction((prev) => ({ ...prev, symbol: event.target.value.toUpperCase() }))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
                placeholder="SOL"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Type</label>
              <select
                value={newAction.type}
                onChange={(event) => setNewAction((prev) => ({ ...prev, type: event.target.value as 'buy' | 'sell' }))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              >
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Quantity</label>
              <input
                type="number"
                min={0}
                step="any"
                value={newAction.quantity}
                onChange={(event) => setNewAction((prev) => ({ ...prev, quantity: Number(event.target.value) }))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Price</label>
              <input
                type="number"
                min={0}
                step="any"
                value={newAction.price}
                onChange={(event) => setNewAction((prev) => ({ ...prev, price: Number(event.target.value) }))}
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs text-slate-400">Timestamp</label>
              <input
                type="datetime-local"
                value={new Date(newAction.timestamp * 1000).toISOString().slice(0, 16)}
                onChange={(event) =>
                  setNewAction((prev) => ({
                    ...prev,
                    timestamp: Math.floor(new Date(event.target.value).getTime() / 1000),
                  }))
                }
                className="w-full px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            onClick={addAction}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 bg-blue-500 hover:bg-blue-600 text-sm font-medium text-white rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </button>

          <div className="space-y-2">
            {actions.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-3">
                No actions configured yet. Add buy/sell events to test strategies.
              </p>
            ) : (
              actions.map((action) => (
                <div
                  key={action.id}
                  className="flex items-center justify-between gap-4 px-3 py-2 bg-slate-800/70 border border-slate-700 rounded-lg"
                >
                  <div className="flex flex-col text-sm text-slate-200">
                    <span className="font-semibold">{action.symbol}</span>
                    <span className="text-xs text-slate-400">
                      {action.type.toUpperCase()} {action.quantity.toLocaleString()} @ ${action.price.toFixed(4)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(action.timestamp * 1000).toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAction(action.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg text-red-400 transition-colors"
                    title="Remove action"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {simulationResult && (
        <div className="bg-slate-900/60 rounded-xl border border-slate-800">
          <div className="px-4 py-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">Simulation Metrics</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4">
            <MetricCard label="Final Value" value={`$${simulationResult.final_value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`} />
            <MetricCard label="Total Return" value={`${simulationResult.total_return_percent.toFixed(2)}%`} trend={simulationResult.total_return_percent >= 0 ? 'up' : 'down'} />
            <MetricCard label="Sharpe Ratio" value={simulationResult.sharpe_ratio.toFixed(2)} />
            <MetricCard label="Max Drawdown" value={`${simulationResult.max_drawdown.toFixed(2)}%`} trend="down" />
            <MetricCard label="Trades Executed" value={simulationResult.num_trades.toString()} />
            <MetricCard label="Fees Paid" value={`$${simulationResult.total_fees.toFixed(2)}`} />
          </div>
        </div>
      )}
    </div>
  );
};

const MetricCard: React.FC<{ label: string; value: string; trend?: 'up' | 'down' }> = ({ label, value, trend }) => (
  <div className="p-4 bg-slate-800/40 border border-slate-700 rounded-lg">
    <p className="text-xs text-slate-400">{label}</p>
    <p className={`mt-2 text-lg font-semibold ${trend === 'down' ? 'text-red-400' : trend === 'up' ? 'text-green-400' : 'text-slate-100'}`}>
      {value}
    </p>
  </div>
);
