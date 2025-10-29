import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, ArrowRight, AlertTriangle, Target, Info } from 'lucide-react';
import { RiskRewardResult } from '../../types/portfolio';
import { useOrderFormSuggestionStore } from '../../store/orderFormSuggestionStore';

export function RiskRewardCalculator() {
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [takeProfitPrice, setTakeProfitPrice] = useState('');
  const [positionSize, setPositionSize] = useState('');
  const [winRate, setWinRate] = useState('55');
  const [result, setResult] = useState<RiskRewardResult | null>(null);

  const { setSuggestion } = useOrderFormSuggestionStore();

  const calculate = () => {
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLossPrice);
    const takeProfit = parseFloat(takeProfitPrice);
    const size = parseFloat(positionSize);
    const win = parseFloat(winRate) / 100;

    if (!entry || !stop || !takeProfit || !size) {
      return;
    }

    const riskAmount = Math.abs(entry - stop) * size;
    const rewardAmount = Math.abs(takeProfit - entry) * size;
    const riskRewardRatio = rewardAmount / riskAmount;
    const breakEvenWinRate = 1 / (riskRewardRatio + 1);
    const expectedValue = win * rewardAmount - (1 - win) * riskAmount;

    const calculatedResult: RiskRewardResult = {
      riskAmount,
      rewardAmount,
      riskRewardRatio,
      expectedValue,
      breakEvenWinRate,
    };

    setResult(calculatedResult);
  };

  const applyToOrderForm = () => {
    if (!result) return;

    setSuggestion({
      limitPrice: parseFloat(entryPrice),
      stopPrice: parseFloat(stopLossPrice),
      amount: parseFloat(positionSize),
      orderType: 'limit',
      source: 'risk_reward',
      note: `Risk/Reward ${result.riskRewardRatio.toFixed(2)}R, Target $${parseFloat(takeProfitPrice).toFixed(2)}`,
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-5 h-5 text-green-400" />
        <h2 className="text-xl font-semibold">Risk/Reward Calculator</h2>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Entry Price ($)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              placeholder="100"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Stop Loss Price ($)</label>
            <input
              type="number"
              value={stopLossPrice}
              onChange={e => setStopLossPrice(e.target.value)}
              placeholder="95"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Take Profit Price ($)</label>
            <input
              type="number"
              value={takeProfitPrice}
              onChange={e => setTakeProfitPrice(e.target.value)}
              placeholder="120"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Position Size (units)</label>
            <input
              type="number"
              value={positionSize}
              onChange={e => setPositionSize(e.target.value)}
              placeholder="10"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Win Rate (%)</label>
          <input
            type="number"
            value={winRate}
            onChange={e => setWinRate(e.target.value)}
            placeholder="55"
            step="0.1"
            min="0"
            max="100"
            className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <button
          onClick={calculate}
          className="w-full py-3 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Target className="w-4 h-4" />
          Calculate
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-green-500/10 border border-green-500/20 rounded-lg p-4"
          >
            <h3 className="font-semibold mb-3">Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Amount:</span>
                <span className="font-medium text-red-400">-${result.riskAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Reward Amount:</span>
                <span className="font-medium text-green-400">
                  +${result.rewardAmount.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk/Reward Ratio:</span>
                <span className="font-medium">{result.riskRewardRatio.toFixed(2)}R</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Break-even Win Rate:</span>
                <span className="font-medium">{(result.breakEvenWinRate * 100).toFixed(2)}%</span>
              </div>
              {result.expectedValue !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Expected Value:</span>
                  <span
                    className={`font-medium ${result.expectedValue >= 0 ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {result.expectedValue >= 0 ? '+' : ''}${result.expectedValue.toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={applyToOrderForm}
              className="w-full mt-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" />
              Apply to Order Form
            </button>
          </motion.div>
        )}

        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3 text-xs text-gray-300">
          <AlertTriangle className="w-3 h-3 inline mr-1" />
          <strong>Formula:</strong> Risk/Reward Ratio = (Take Profit - Entry) ÷ (Entry - Stop Loss)
        </div>
      </div>
    </div>
  );
}
