import { useState } from 'react';

type SwapFormProps = {
  onSubmit: (from: string, to: string, amount: number) => Promise<void>;
  loading: boolean;
};

export function SwapForm({ onSubmit, loading }: SwapFormProps) {
  const [fromToken, setFromToken] = useState('SOL');
  const [toToken, setToToken] = useState('USDC');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(fromToken, toToken, parseFloat(amount));
  };

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 p-4 rounded-lg">
      <h2 className="text-lg font-semibold mb-4">Swap Tokens</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm mb-1">From</label>
          <select 
            value={fromToken} 
            onChange={(e) => setFromToken(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
          >
            <option>SOL</option>
            <option>USDC</option>
            <option>BTC</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">To</label>
          <select 
            value={toToken} 
            onChange={(e) => setToToken(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
          >
            <option>USDC</option>
            <option>SOL</option>
            <option>BTC</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Amount</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-700 p-2 rounded"
            placeholder="0.0"
            step="any"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading}
          className={`w-full py-2 rounded ${
            loading ? 'bg-gray-600' : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </form>
  );
}
