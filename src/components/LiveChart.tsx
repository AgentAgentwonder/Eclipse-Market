import { useState } from 'react';
import RealtimeChart from './RealtimeChart';

const DEFAULT_SYMBOLS = ['SOL', 'BONK', 'JUP', 'WIF'];

export function LiveChart() {
  const [symbol, setSymbol] = useState('SOL');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Real-time Market Chart</h2>
        <div className="flex items-center gap-3">
          <label htmlFor="chart-symbol" className="text-sm text-gray-400">
            Symbol
          </label>
          <select
            id="chart-symbol"
            value={symbol}
            onChange={event => setSymbol(event.target.value)}
            className="bg-slate-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-400 transition-colors"
          >
            {DEFAULT_SYMBOLS.map(item => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <RealtimeChart symbol={symbol} title={`${symbol} Live Price`} />
    </div>
  );
}
