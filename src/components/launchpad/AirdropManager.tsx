import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Gift, Upload } from 'lucide-react';

interface AirdropManagerProps {
  launchId: string | null;
}

export default function AirdropManager({ launchId }: AirdropManagerProps) {
  const [tokenMint, setTokenMint] = useState('');
  const [recipients, setRecipients] = useState<Array<{ address: string; amount: number }>>([]);
  const [csvInput, setCsvInput] = useState('');

  const handleParseCsv = () => {
    const lines = csvInput.split('\n').filter(line => line.trim());
    const parsed = lines.map(line => {
      const [address, amount] = line.split(',');
      return { address: address.trim(), amount: Number(amount) };
    }).filter(item => item.address && item.amount > 0);
    setRecipients(parsed);
  };

  const handleCreate = async () => {
    try {
      await invoke('create_airdrop', {
        request: {
          tokenMint,
          recipients: recipients.map(r => ({
            address: r.address,
            amount: r.amount,
            claimed: false,
            claimDate: null,
          })),
          startDate: new Date().toISOString(),
          endDate: null,
          claimType: 'immediate',
        },
      });
    } catch (err) {
      console.error('Failed to create airdrop:', err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Gift className="w-5 h-5 text-purple-500" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Airdrop Manager
        </h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Token Mint</label>
          <input
            type="text"
            value={tokenMint}
            onChange={(e) => setTokenMint(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Recipients CSV (address,amount)
          </label>
          <textarea
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            rows={8}
            className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-2"
            placeholder="address1,1000&#10;address2,2000&#10;address3,3000"
          />
          <button
            onClick={handleParseCsv}
            className="mt-2 inline-flex items-center gap-2 rounded-lg border border-purple-600 px-3 py-1 text-sm text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20"
          >
            <Upload className="w-4 h-4" />
            Parse CSV
          </button>
        </div>

        {recipients.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipients ({recipients.length})
            </h3>
            <div className="max-h-40 overflow-auto space-y-1">
              {recipients.map((recipient, idx) => (
                <div key={idx} className="flex justify-between text-sm text-gray-600 dark:text-gray-400 px-2">
                  <span className="font-mono">{recipient.address.slice(0, 8)}...</span>
                  <span>{recipient.amount.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={handleCreate}
          disabled={recipients.length === 0}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
        >
          Create Airdrop
        </button>
      </div>
    </div>
  );
}
