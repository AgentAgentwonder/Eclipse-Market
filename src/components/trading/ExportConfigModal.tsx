import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, FileText, Calendar, Settings, CheckSquare, Square } from 'lucide-react';
import {
  ExportConfig,
  ExportPreset,
  ExportFormat,
  ExportColumn,
  EnhancedTradeMetrics,
} from '../../types/tradeReporting';
import { getColumnsForPreset, exportTrades } from '../../utils/tradeExport';

interface ExportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  trades: EnhancedTradeMetrics[];
}

export function ExportConfigModal({ isOpen, onClose, trades }: ExportConfigModalProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [preset, setPreset] = useState<ExportPreset>('custom');
  const [columns, setColumns] = useState<ExportColumn[]>([]);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  useEffect(() => {
    setColumns(getColumnsForPreset(preset));
  }, [preset]);

  const handleToggleColumn = (key: string) => {
    setColumns(prev =>
      prev.map(col => (col.key === key ? { ...col, enabled: !col.enabled } : col))
    );
  };

  const handleExport = () => {
    const config: ExportConfig = {
      format,
      preset,
      columns,
      includeHeaders: true,
      timezone,
      dateRange: {
        start: dateRange.start ? new Date(dateRange.start) : null,
        end: dateRange.end ? new Date(dateRange.end) : null,
      },
    };

    let filteredTrades = trades;

    if (dateRange.start) {
      filteredTrades = filteredTrades.filter(
        t => new Date(t.timestamp) >= new Date(dateRange.start)
      );
    }

    if (dateRange.end) {
      filteredTrades = filteredTrades.filter(t => new Date(t.timestamp) <= new Date(dateRange.end));
    }

    exportTrades(filteredTrades, config);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-slate-800/95 backdrop-blur-xl border-b border-purple-500/20 p-6 flex items-center justify-between z-10">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <FileText className="w-6 h-6" />
                  Export Configuration
                </h2>
                <p className="text-white/60 text-sm mt-1">Configure your trade export settings</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setFormat('csv')}
                    className={`p-4 rounded-xl border transition-all ${
                      format === 'csv'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-slate-900/50 border-purple-500/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="font-semibold">CSV</div>
                    <div className="text-xs text-white/60 mt-1">Comma-separated values</div>
                  </button>
                  <button
                    onClick={() => setFormat('xlsx')}
                    className={`p-4 rounded-xl border transition-all ${
                      format === 'xlsx'
                        ? 'bg-purple-500/20 border-purple-500/50'
                        : 'bg-slate-900/50 border-purple-500/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="font-semibold">XLSX</div>
                    <div className="text-xs text-white/60 mt-1">Microsoft Excel format</div>
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Export Preset
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {(['tax_report', 'performance', 'trade_journal', 'custom'] as ExportPreset[]).map(
                    p => (
                      <button
                        key={p}
                        onClick={() => setPreset(p)}
                        className={`p-3 rounded-xl border text-sm transition-all ${
                          preset === p
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-slate-900/50 border-purple-500/10 hover:border-purple-500/30'
                        }`}
                      >
                        {p.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </button>
                    )
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Date Range (Optional)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">Start Date</label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={e => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 mb-1 block">End Date</label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={e => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">Timezone</label>
                <select
                  value={timezone}
                  onChange={e => setTimezone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                  <option value="Asia/Shanghai">Shanghai</option>
                  <option value={Intl.DateTimeFormat().resolvedOptions().timeZone}>
                    Local ({Intl.DateTimeFormat().resolvedOptions().timeZone})
                  </option>
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-semibold">
                  Columns ({columns.filter(c => c.enabled).length} selected)
                </label>
                <div className="max-h-60 overflow-y-auto space-y-2 p-3 bg-slate-900/30 rounded-xl">
                  {columns.map(col => (
                    <button
                      key={col.key}
                      onClick={() => handleToggleColumn(col.key)}
                      className="w-full flex items-center gap-3 p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      {col.enabled ? (
                        <CheckSquare className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Square className="w-5 h-5 text-white/40" />
                      )}
                      <span className={col.enabled ? 'text-white' : 'text-white/60'}>
                        {col.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-purple-500/20">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 bg-slate-700/50 hover:bg-slate-700/70 rounded-xl transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  disabled={columns.filter(c => c.enabled).length === 0}
                  className="flex-1 px-4 py-3 bg-purple-500 hover:bg-purple-600 rounded-xl transition-colors font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download className="w-5 h-5" />
                  Export ({trades.length} trades)
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
