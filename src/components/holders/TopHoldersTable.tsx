import { Award, Copy } from 'lucide-react';
import { HolderInfo } from '../../types/holders';
import { useState } from 'react';

interface Props {
  holders: HolderInfo[];
}

export function TopHoldersTable({ holders }: Props) {
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const copyToClipboard = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  const formatAddress = (address: string) => {
    if (address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Top 20 Holders</h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-purple-500/20">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Rank</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Address</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Balance</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                Percentage
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {holders.map(holder => (
              <tr
                key={holder.address}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3 px-4">
                  <span className="font-semibold text-purple-400">#{holder.rank}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{formatAddress(holder.address)}</span>
                    {holder.isKnownWallet && holder.walletLabel && (
                      <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs">
                        <Award className="w-3 h-3" />
                        {holder.walletLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {holder.balance.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="py-3 px-4 text-right font-semibold">
                  {holder.percentage.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => copyToClipboard(holder.address)}
                    className="p-2 hover:bg-slate-600/50 rounded transition-colors"
                    title="Copy address"
                  >
                    {copiedAddress === holder.address ? (
                      <span className="text-green-500 text-xs">✓</span>
                    ) : (
                      <Copy className="w-4 h-4 text-gray-400" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
