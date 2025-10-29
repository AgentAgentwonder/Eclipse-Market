import { ExternalLink } from 'lucide-react';
import { LargeTransfer } from '../../types/holders';

interface Props {
  transfers: LargeTransfer[];
}

export function LargeTransfersTable({ transfers }: Props) {
  const formatAddress = (address: string) => {
    if (address.length < 16) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-3">
        Large Transfers
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-purple-500/20">
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Timestamp</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">From</th>
              <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">To</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Amount</th>
              <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">
                Supply %
              </th>
              <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">
                Signature
              </th>
            </tr>
          </thead>
          <tbody>
            {transfers.map(transfer => (
              <tr
                key={transfer.id}
                className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
              >
                <td className="py-3 px-4">
                  {new Date(transfer.timestamp).toLocaleString()}
                </td>
                <td className="py-3 px-4 font-mono text-sm">
                  {formatAddress(transfer.fromAddress)}
                </td>
                <td className="py-3 px-4 font-mono text-sm">
                  {formatAddress(transfer.toAddress)}
                </td>
                <td className="py-3 px-4 text-right font-mono">
                  {transfer.amount.toLocaleString(undefined, {
                    maximumFractionDigits: 2,
                  })}
                </td>
                <td className="py-3 px-4 text-right font-semibold text-purple-300">
                  {transfer.percentageOfSupply.toFixed(2)}%
                </td>
                <td className="py-3 px-4 text-center">
                  <a
                    href={`https://solscan.io/tx/${transfer.transactionSignature}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-purple-300 hover:text-purple-200"
                  >
                    View
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
