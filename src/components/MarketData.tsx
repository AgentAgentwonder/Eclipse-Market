import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';

type MarketData = {
  bid: number;
  ask: number;
  last: number;
  volume: number;
};

export function MarketData() {
  const [data, setData] = useState<MarketData | null>(null);

  useEffect(() => {
    const loadData = async () => {
      const result = await invoke<MarketData>('get_market_data');
      setData(result);
    };
    loadData();

    // TODO: Setup WebSocket subscription
  }, []);

  if (!data) return <div>Loading...</div>;

  return (
    <div className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Market Data</h2>
      <div className="grid grid-cols-4 gap-4 text-center">
        <div>
          <div className="text-sm text-gray-400">Bid</div>
          <div className="text-xl text-red-400">{data.bid.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Ask</div>
          <div className="text-xl text-green-400">{data.ask.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Last</div>
          <div className="text-xl">{data.last.toFixed(2)}</div>
        </div>
        <div>
          <div className="text-sm text-gray-400">Volume</div>
          <div className="text-xl">{data.volume.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
}
