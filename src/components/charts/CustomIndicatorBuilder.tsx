import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Trash2,
  Save,
  Upload,
  Download,
  Play,
  X,
  TrendingUp,
  GitBranch,
  Hash,
} from 'lucide-react';
import { CustomIndicator, IndicatorNode, CandleData } from '../../types/indicators';
import { useCustomIndicators } from '../../hooks/useCustomIndicators';
import { runSimpleBacktest } from '../../utils/indicatorEngine';

export const CustomIndicatorBuilder: React.FC<{ candles?: CandleData[] }> = ({ candles = [] }) => {
  const {
    indicators,
    addIndicator,
    deleteIndicator,
    importIndicators,
    exportIndicators,
  } = useCustomIndicators();

  const [showBuilder, setShowBuilder] = useState(false);
  const [currentIndicator, setCurrentIndicator] = useState<CustomIndicator | null>(null);
  const [testResults, setTestResults] = useState<any>(null);

  const createNewIndicator = () => {
    const newIndicator: CustomIndicator = {
      id: `indicator-${Date.now()}`,
      name: 'New Indicator',
      description: '',
      nodes: [],
      outputNodeId: '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentIndicator(newIndicator);
    setShowBuilder(true);
  };

  const addNode = (type: IndicatorNode['type']) => {
    if (!currentIndicator) return;

    const newNode: IndicatorNode = {
      id: `node-${Date.now()}`,
      type,
      value: type === 'constant' ? 0 : undefined,
      indicator: type === 'indicator' ? 'sma' : undefined,
      operator: type === 'operator' ? '+' : type === 'condition' ? '>' : undefined,
      params: type === 'indicator' ? { period: 20 } : undefined,
      inputs: [],
    };

    setCurrentIndicator({
      ...currentIndicator,
      nodes: [...currentIndicator.nodes, newNode],
      outputNodeId: currentIndicator.outputNodeId || newNode.id,
    });
  };

  const updateNode = (nodeId: string, updates: Partial<IndicatorNode>) => {
    if (!currentIndicator) return;

    setCurrentIndicator({
      ...currentIndicator,
      nodes: currentIndicator.nodes.map(node =>
        node.id === nodeId ? { ...node, ...updates } : node
      ),
    });
  };

  const deleteNode = (nodeId: string) => {
    if (!currentIndicator) return;

    setCurrentIndicator({
      ...currentIndicator,
      nodes: currentIndicator.nodes.filter(n => n.id !== nodeId),
      outputNodeId:
        currentIndicator.outputNodeId === nodeId ? '' : currentIndicator.outputNodeId,
    });
  };

  const saveIndicator = () => {
    if (!currentIndicator) return;
    addIndicator(currentIndicator);
    setShowBuilder(false);
    setCurrentIndicator(null);
  };

  const testIndicator = () => {
    if (!currentIndicator || candles.length === 0) return;
    const result = runSimpleBacktest(currentIndicator, candles);
    setTestResults(result);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target?.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          importIndicators(event.target?.result as string);
        } catch (err) {
          alert('Failed to import: ' + (err as Error).message);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = () => {
    const json = exportIndicators();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `indicators-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Custom Indicators</h2>
        <div className="flex gap-2">
          <button
            onClick={handleImport}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            onClick={handleExport}
            disabled={indicators.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            onClick={createNewIndicator}
            className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </button>
        </div>
      </div>

      {/* Indicator List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {indicators.map(indicator => (
          <motion.div
            key={indicator.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 border border-slate-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold">{indicator.name}</h3>
                <p className="text-xs text-slate-400">{indicator.description}</p>
              </div>
              <button
                onClick={() => deleteIndicator(indicator.id)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <GitBranch className="w-3 h-3" />
              <span>{indicator.nodes.length} nodes</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Builder Modal */}
      <AnimatePresence>
        {showBuilder && currentIndicator && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowBuilder(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-4 z-50 bg-slate-900 border border-slate-700 rounded-xl overflow-auto"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Build Indicator</h2>
                  <button
                    onClick={() => setShowBuilder(false)}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Name</label>
                    <input
                      type="text"
                      value={currentIndicator.name}
                      onChange={e =>
                        setCurrentIndicator({ ...currentIndicator, name: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                    <input
                      type="text"
                      value={currentIndicator.description}
                      onChange={e =>
                        setCurrentIndicator({ ...currentIndicator, description: e.target.value })
                      }
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2"
                    />
                  </div>
                </div>

                {/* Node Builder */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Nodes</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => addNode('constant')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                      >
                        + Constant
                      </button>
                      <button
                        onClick={() => addNode('indicator')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                      >
                        + Indicator
                      </button>
                      <button
                        onClick={() => addNode('operator')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                      >
                        + Operator
                      </button>
                      <button
                        onClick={() => addNode('condition')}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-sm"
                      >
                        + Condition
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentIndicator.nodes.map(node => (
                      <div
                        key={node.id}
                        className="bg-slate-800 border border-slate-700 rounded-lg p-3"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-mono text-purple-400">{node.type}</span>
                          <button
                            onClick={() => deleteNode(node.id)}
                            className="text-slate-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        {node.type === 'constant' && (
                          <input
                            type="number"
                            value={node.value}
                            onChange={e =>
                              updateNode(node.id, { value: Number(e.target.value) })
                            }
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                          />
                        )}

                        {node.type === 'indicator' && (
                          <div className="space-y-2">
                            <select
                              value={node.indicator}
                              onChange={e => updateNode(node.id, { indicator: e.target.value as any })}
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                            >
                              <option value="sma">SMA</option>
                              <option value="ema">EMA</option>
                              <option value="rsi">RSI</option>
                              <option value="volume">Volume</option>
                            </select>
                            <input
                              type="number"
                              placeholder="Period"
                              value={node.params?.period ?? 20}
                              onChange={e =>
                                updateNode(node.id, {
                                  params: { ...node.params, period: Number(e.target.value) },
                                })
                              }
                              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                            />
                          </div>
                        )}

                        {(node.type === 'operator' || node.type === 'condition') && (
                          <select
                            value={node.operator}
                            onChange={e => updateNode(node.id, { operator: e.target.value as any })}
                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm"
                          >
                            {node.type === 'operator' && (
                              <>
                                <option value="+">Add (+)</option>
                                <option value="-">Subtract (-)</option>
                                <option value="*">Multiply (*)</option>
                                <option value="/">Divide (/)</option>
                              </>
                            )}
                            {node.type === 'condition' && (
                              <>
                                <option value=">">Greater Than (&gt;)</option>
                                <option value="<">Less Than (&lt;)</option>
                                <option value="==">Equal (==)</option>
                                <option value="&&">And (&amp;&amp;)</option>
                                <option value="||">Or (||)</option>
                              </>
                            )}
                          </select>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={testIndicator}
                    disabled={candles.length === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    Test
                  </button>
                  <button
                    onClick={saveIndicator}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 rounded-lg"
                  >
                    <Save className="w-4 h-4" />
                    Save
                  </button>
                </div>

                {testResults && (
                  <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Backtest Results</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-slate-400">Total Trades</div>
                        <div className="font-semibold">{testResults.performance.totalTrades}</div>
                      </div>
                      <div>
                        <div className="text-slate-400">Profitable</div>
                        <div className="font-semibold text-green-400">
                          {testResults.performance.profitableTrades}
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Total Return</div>
                        <div className={testResults.performance.totalReturn >= 0 ? 'font-semibold text-green-400' : 'font-semibold text-red-400'}>
                          {(testResults.performance.totalReturn * 100).toFixed(2)}%
                        </div>
                      </div>
                      <div>
                        <div className="text-slate-400">Max Drawdown</div>
                        <div className="font-semibold text-red-400">
                          {(testResults.performance.maxDrawdown * 100).toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
