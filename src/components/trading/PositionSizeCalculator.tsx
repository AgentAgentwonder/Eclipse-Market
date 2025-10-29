import { useState } from 'react';
import { motion } from 'framer-motion';
import { Calculator, ArrowRight, Info, Zap } from 'lucide-react';
import { PositionSizeResult, RiskProfile, RiskProfilePreset } from '../../types/portfolio';
import { useOrderFormSuggestionStore } from '../../store/orderFormSuggestionStore';

const RISK_PROFILES: Record<RiskProfile, RiskProfilePreset> = {
  conservative: {
    name: 'Conservative',
    riskPercent: 1,
    maxPositionSize: 10,
    minRiskRewardRatio: 3,
  },
  moderate: {
    name: 'Moderate',
    riskPercent: 2,
    maxPositionSize: 20,
    minRiskRewardRatio: 2,
  },
  aggressive: {
    name: 'Aggressive',
    riskPercent: 5,
    maxPositionSize: 30,
    minRiskRewardRatio: 1.5,
  },
  custom: {
    name: 'Custom',
    riskPercent: 2,
    maxPositionSize: 20,
    minRiskRewardRatio: 2,
  },
};

export function PositionSizeCalculator() {
  const [accountSize, setAccountSize] = useState('10000');
  const [riskPercent, setRiskPercent] = useState('2');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLossPrice, setStopLossPrice] = useState('');
  const [leverage, setLeverage] = useState('1');
  const [useKelly, setUseKelly] = useState(false);
  const [winRate, setWinRate] = useState('60');
  const [avgWinLoss, setAvgWinLoss] = useState('2');
  const [selectedProfile, setSelectedProfile] = useState<RiskProfile>('moderate');
  const [result, setResult] = useState<PositionSizeResult | null>(null);

  const { setSuggestion } = useOrderFormSuggestionStore();

  const applyProfile = (profile: RiskProfile) => {
    setSelectedProfile(profile);
    if (profile !== 'custom') {
      setRiskPercent(RISK_PROFILES[profile].riskPercent.toString());
    }
  };

  const calculateKellyFraction = () => {
    const w = parseFloat(winRate) / 100;
    const r = parseFloat(avgWinLoss);
    const kelly = (w * r - (1 - w)) / r;
    return Math.max(0, Math.min(kelly, 0.25));
  };

  const calculate = () => {
    const account = parseFloat(accountSize);
    let risk = parseFloat(riskPercent);
    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLossPrice);
    const lev = parseFloat(leverage);

    if (!account || !risk || !entry || !stop) {
      return;
    }

    if (useKelly) {
      const kellyFraction = calculateKellyFraction();
      risk = kellyFraction * 100;
    }

    const riskAmount = account * (risk / 100);
    const priceRisk = Math.abs(entry - stop);
    const positionSize = (riskAmount / priceRisk) * lev;
    const positionValue = positionSize * entry;

    const calculatedResult: PositionSizeResult = {
      positionSize,
      positionValue,
      riskAmount,
      units: positionSize,
      kellyFraction: useKelly ? calculateKellyFraction() : undefined,
    };

    setResult(calculatedResult);
  };

  const applyToOrderForm = () => {
    if (!result) return;

    const entry = parseFloat(entryPrice);
    const stop = parseFloat(stopLossPrice);
    const side: 'buy' | 'sell' = entry >= stop ? 'buy' : 'sell';

    setSuggestion({
      amount: result.units,
      stopPrice: stop,
      limitPrice: entry,
      side,
      orderType: 'limit',
      source: 'position_size',
      note: `Position size: ${result.units.toFixed(4)} units, Risk: ${result.riskAmount.toFixed(2)}`,
    });
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-6">
        <Calculator className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold">Position Size Calculator</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Risk Profile</label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(RISK_PROFILES).map(([key, profile]) => (
              <button
                key={key}
                type="button"
                onClick={() => applyProfile(key as RiskProfile)}
                className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
                  selectedProfile === key ? 'bg-purple-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
              >
                {profile.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Account Size ($)</label>
            <input
              type="number"
              value={accountSize}
              onChange={e => setAccountSize(e.target.value)}
              placeholder="10000"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Risk Per Trade (%)</label>
            <input
              type="number"
              value={riskPercent}
              onChange={e => setRiskPercent(e.target.value)}
              placeholder="2"
              step="0.1"
              disabled={useKelly}
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Entry Price ($)</label>
            <input
              type="number"
              value={entryPrice}
              onChange={e => setEntryPrice(e.target.value)}
              placeholder="100"
              step="any"
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Leverage (optional)</label>
          <input
            type="number"
            value={leverage}
            onChange={e => setLeverage(e.target.value)}
            placeholder="1"
            step="0.1"
            min="1"
            className="w-full bg-gray-700 px-3 py-2 rounded outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>

        <div className="bg-gray-700/50 rounded p-4 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={useKelly}
                onChange={e => setUseKelly(e.target.checked)}
                className="rounded bg-gray-600"
              />
              <span>Use Kelly Criterion</span>
              <Info className="w-4 h-4 text-gray-400" />
            </label>
          </div>

          {useKelly && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Win Rate (%)</label>
                <input
                  type="number"
                  value={winRate}
                  onChange={e => setWinRate(e.target.value)}
                  placeholder="60"
                  step="1"
                  min="0"
                  max="100"
                  className="w-full bg-gray-600 px-2 py-1 rounded text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Avg Win/Loss Ratio</label>
                <input
                  type="number"
                  value={avgWinLoss}
                  onChange={e => setAvgWinLoss(e.target.value)}
                  placeholder="2"
                  step="0.1"
                  className="w-full bg-gray-600 px-2 py-1 rounded text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
            </div>
          )}

          <div className="text-xs text-gray-400">
            <Info className="w-3 h-3 inline mr-1" />
            Kelly Criterion optimizes position size based on win rate and risk/reward ratio
          </div>
        </div>

        <button
          onClick={calculate}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Calculator className="w-4 h-4" />
          Calculate
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 rounded-lg p-4 border border-purple-500/30"
          >
            <h3 className="font-semibold mb-3">Results</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Position Size:</span>
                <span className="font-medium">{result.units.toFixed(4)} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Position Value:</span>
                <span className="font-medium">
                  $
                  {result.positionValue.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Risk Amount:</span>
                <span className="font-medium text-red-400">${result.riskAmount.toFixed(2)}</span>
              </div>
              {result.kellyFraction !== undefined && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Kelly Fraction:</span>
                  <span className="font-medium">{(result.kellyFraction * 100).toFixed(2)}%</span>
                </div>
              )}
            </div>

            <button
              onClick={applyToOrderForm}
              className="w-full mt-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Apply to Order Form
            </button>
          </motion.div>
        )}

        <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3 text-xs text-gray-300">
          <strong>Formula:</strong> Position Size = (Account Size × Risk %) / (Entry Price - Stop
          Loss Price)
        </div>
      </div>
    </div>
  );
}
