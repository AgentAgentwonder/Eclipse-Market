import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Settings,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Bell,
  Save,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useIndicatorStore } from '../../store/indicatorStore';
import type { IndicatorType } from '../../types/indicators';
import { INDICATOR_DESCRIPTIONS } from '../../types/indicators';

interface IndicatorPanelProps {
  onClose?: () => void;
}

const IndicatorPanel: React.FC<IndicatorPanelProps> = ({ onClose }) => {
  const {
    indicators,
    addIndicator,
    removeIndicator,
    updateIndicator,
    toggleIndicator,
    duplicateIndicator,
    savePreset,
    loadPreset,
    presets,
    addAlert,
  } = useIndicatorStore();

  const [showAddIndicator, setShowAddIndicator] = useState(false);
  const [expandedIndicator, setExpandedIndicator] = useState<string | null>(null);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [presetName, setPresetName] = useState('');

  const indicatorTypes: IndicatorType[] = [
    'SMA',
    'EMA',
    'RSI',
    'MACD',
    'BollingerBands',
    'Stochastic',
    'ATR',
    'OBV',
    'CCI',
    'Williams',
    'MFI',
    'ParabolicSAR',
    'Ichimoku',
    'VWAP',
  ];

  const handleAddIndicator = (type: IndicatorType) => {
    addIndicator(type);
    setShowAddIndicator(false);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    try {
      await savePreset(presetName.trim());
      setPresetName('');
      setShowPresetDialog(false);
    } catch (error) {
      console.error('Failed to save preset:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="w-80 h-full bg-slate-800/95 backdrop-blur-xl border-r border-purple-500/20 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
        <h2 className="text-lg font-bold">Indicators</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddIndicator(!showAddIndicator)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            title="Add Indicator"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowPresetDialog(true)}
            className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            title="Save Preset"
          >
            <Save className="w-5 h-5" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Add Indicator Dropdown */}
      <AnimatePresence>
        {showAddIndicator && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-purple-500/20 overflow-hidden"
          >
            <div className="p-4 max-h-64 overflow-y-auto">
              <div className="space-y-2">
                {indicatorTypes.map(type => (
                  <button
                    key={type}
                    onClick={() => handleAddIndicator(type)}
                    className="w-full text-left px-3 py-2 bg-slate-700/50 hover:bg-purple-500/20 rounded-lg transition-colors"
                  >
                    <div className="font-semibold">{type}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      {INDICATOR_DESCRIPTIONS[type]}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Indicators List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {indicators.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <p>No indicators added</p>
            <p className="text-sm mt-2">Click + to add an indicator</p>
          </div>
        ) : (
          indicators.map(indicator => (
            <div
              key={indicator.id}
              className="bg-slate-700/30 rounded-lg overflow-hidden border border-slate-600/30"
            >
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={() =>
                    setExpandedIndicator(expandedIndicator === indicator.id ? null : indicator.id)
                  }
                  className="flex items-center gap-2 flex-1"
                >
                  {expandedIndicator === indicator.id ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: indicator.color }}
                  />
                  <span className="font-semibold">{indicator.type}</span>
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => toggleIndicator(indicator.id)}
                    className="p-1.5 hover:bg-purple-500/20 rounded transition-colors"
                    title={indicator.enabled ? 'Hide' : 'Show'}
                  >
                    {indicator.enabled ? (
                      <Eye className="w-4 h-4" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                  <button
                    onClick={() => duplicateIndicator(indicator.id)}
                    className="p-1.5 hover:bg-purple-500/20 rounded transition-colors"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => removeIndicator(indicator.id)}
                    className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {expandedIndicator === indicator.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-slate-600/30"
                  >
                    <div className="p-3 space-y-3">
                      {/* Parameters */}
                      <div className="space-y-2">
                        {Object.entries(indicator.params).map(([key, value]) => (
                          <div key={key}>
                            <label className="text-xs text-gray-400 capitalize">{key}</label>
                            <input
                              type="number"
                              value={value as number}
                              onChange={e =>
                                updateIndicator(indicator.id, {
                                  params: { ...indicator.params, [key]: Number(e.target.value) },
                                })
                              }
                              className="w-full px-2 py-1 bg-slate-800 border border-slate-600/30 rounded text-sm"
                            />
                          </div>
                        ))}
                      </div>

                      {/* Color */}
                      <div>
                        <label className="text-xs text-gray-400">Color</label>
                        <input
                          type="color"
                          value={indicator.color}
                          onChange={e =>
                            updateIndicator(indicator.id, { color: e.target.value })
                          }
                          className="w-full h-8 rounded cursor-pointer"
                        />
                      </div>

                      {/* Line Width */}
                      <div>
                        <label className="text-xs text-gray-400">Line Width</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={indicator.lineWidth}
                          onChange={e =>
                            updateIndicator(indicator.id, { lineWidth: Number(e.target.value) })
                          }
                          className="w-full"
                        />
                      </div>

                      {/* Add Alert */}
                      <button
                        onClick={() => {
                          // Default alert: RSI below 30
                          addAlert(indicator.id, 'below', 30);
                        }}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        <span className="text-sm">Add Alert</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {/* Presets Section */}
      {presets.length > 0 && (
        <div className="border-t border-purple-500/20 p-4">
          <h3 className="text-sm font-semibold mb-2">Presets</h3>
          <div className="space-y-2">
            {presets.slice(0, 3).map(preset => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset.id)}
                className="w-full text-left px-3 py-2 bg-slate-700/30 hover:bg-purple-500/20 rounded-lg transition-colors text-sm"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save Preset Dialog */}
      <AnimatePresence>
        {showPresetDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPresetDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              className="bg-slate-800 rounded-xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-bold mb-4">Save Indicator Preset</h3>
              <input
                type="text"
                value={presetName}
                onChange={e => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600/30 rounded-lg mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowPresetDialog(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSavePreset}
                  className="flex-1 px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-colors"
                  disabled={!presetName.trim()}
                >
                  Save
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default IndicatorPanel;
