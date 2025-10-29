import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileJson, FileSpreadsheet, Image, FileCode, type LucideIcon } from 'lucide-react';
import { useTokenFlowContext } from '../../contexts/TokenFlowContext';
import type { FlowExportFormat } from '../../types/tokenFlow';

interface FlowExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FlowExportModal({ isOpen, onClose }: FlowExportModalProps) {
  const { exportAnalysis, exporting } = useTokenFlowContext();
  const [selectedFormat, setSelectedFormat] = useState<FlowExportFormat>('json');
  const [includeGraph, setIncludeGraph] = useState(true);
  const [includeClusters, setIncludeClusters] = useState(true);
  const [includeAlerts, setIncludeAlerts] = useState(true);

  const formats: Array<{ value: FlowExportFormat; label: string; icon: LucideIcon }> = [
    { value: 'json', label: 'JSON', icon: FileJson },
    { value: 'csv', label: 'CSV', icon: FileSpreadsheet },
    { value: 'png', label: 'PNG Image', icon: Image },
    { value: 'svg', label: 'SVG Image', icon: FileCode },
  ];

  const handleExport = async () => {
    const filters: Record<string, any> = {
      includeGraph,
      includeClusters,
      includeAlerts,
    };

    const result = await exportAnalysis(selectedFormat, filters);
    if (result) {
      // Trigger download
      const dataStr = JSON.stringify(result, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `token-flow-export-${Date.now()}.${selectedFormat}`;
      link.click();
      URL.revokeObjectURL(url);
      
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-slate-800 border border-purple-500/20 rounded-2xl w-full max-w-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Export Flow Analysis</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-3">Export Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {formats.map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => setSelectedFormat(value)}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                          selectedFormat === value
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-3">Include Data</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeGraph}
                        onChange={e => setIncludeGraph(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm">Flow Graph</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeClusters}
                        onChange={e => setIncludeClusters(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm">Wallet Clusters</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg cursor-pointer hover:bg-slate-700/50 transition-colors">
                      <input
                        type="checkbox"
                        checked={includeAlerts}
                        onChange={e => setIncludeAlerts(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-600"
                      />
                      <span className="text-sm">Alerts</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleExport}
                    disabled={exporting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    {exporting ? 'Exporting...' : 'Export'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
