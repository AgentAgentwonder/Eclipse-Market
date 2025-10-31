import React, { useState } from 'react';
import { Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { PortfolioHolding } from '../../store/historicalReplayStore';

interface PortfolioImporterProps {
  onImport: (holdings: PortfolioHolding[]) => void;
}

export const PortfolioImporter: React.FC<PortfolioImporterProps> = ({ onImport }) => {
  const [importedHoldings, setImportedHoldings] = useState<PortfolioHolding[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!Array.isArray(data)) {
        throw new Error('Expected JSON array of holdings');
      }

      const holdings: PortfolioHolding[] = data.map((item) => ({
        symbol: item.symbol || '',
        quantity: Number(item.quantity) || 0,
        average_entry_price: Number(item.average_entry_price) || 0,
        first_purchase_time: Number(item.first_purchase_time) || Date.now() / 1000,
      }));

      setImportedHoldings(holdings);
      setError(null);
      setSuccess(true);
      onImport(holdings);

      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse file');
      setSuccess(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-6 border-2 border-dashed border-slate-700 rounded-lg hover:border-blue-500 transition-colors">
        <label className="flex flex-col items-center gap-3 cursor-pointer">
          <Upload className="w-12 h-12 text-slate-400" />
          <span className="text-slate-300 font-medium">Import Portfolio Holdings</span>
          <span className="text-sm text-slate-500">Upload JSON file with holdings data</span>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-400">Import Error</p>
            <p className="text-xs text-red-400/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/50 rounded-lg">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-green-400">Import Successful</p>
            <p className="text-xs text-green-400/80 mt-1">
              Loaded {importedHoldings.length} holdings
            </p>
          </div>
        </div>
      )}

      {importedHoldings.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-300">Imported Holdings</h4>
          <div className="space-y-2">
            {importedHoldings.map((holding, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200">{holding.symbol}</p>
                  <p className="text-xs text-slate-400">
                    Qty: {holding.quantity.toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-300">
                    ${holding.average_entry_price.toFixed(4)}
                  </p>
                  <p className="text-xs text-slate-500">avg. price</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
