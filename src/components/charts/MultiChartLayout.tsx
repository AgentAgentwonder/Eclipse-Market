import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Grid, Plus, Trash2, Save, Settings2, Layout } from 'lucide-react';
import { useMultiChart } from '../../hooks/useMultiChart';
import { ChartPanel } from './ChartPanel';

export const MultiChartLayout: React.FC = () => {
  const {
    state,
    activeLayout,
    setActiveLayout,
    updatePanel,
    createLayout,
    deleteLayout,
    updateCrosshair,
    updateGlobalTimeframe,
  } = useMultiChart();

  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutRows, setNewLayoutRows] = useState(2);
  const [newLayoutCols, setNewLayoutCols] = useState(2);

  const handleCreateLayout = () => {
    if (!newLayoutName.trim()) return;
    createLayout(newLayoutName, newLayoutRows, newLayoutCols);
    setShowCreateModal(false);
    setNewLayoutName('');
  };

  if (!activeLayout) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        No active layout
      </div>
    );
  }

  const { rows, cols } = activeLayout.grid;

  return (
    <div className="h-full flex flex-col bg-slate-900 text-slate-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowLayoutMenu(!showLayoutMenu)}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Layout className="w-4 h-4" />
              <span className="text-sm font-medium">{activeLayout.name}</span>
            </button>

            <AnimatePresence>
              {showLayoutMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowLayoutMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full mt-2 left-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 min-w-[200px]"
                  >
                    {state.layouts.map(layout => (
                      <div
                        key={layout.id}
                        className="flex items-center justify-between px-3 py-2 hover:bg-slate-700/50 cursor-pointer group"
                      >
                        <button
                          onClick={() => {
                            setActiveLayout(layout.id);
                            setShowLayoutMenu(false);
                          }}
                          className="flex-1 text-left text-sm"
                        >
                          {layout.name}{' '}
                          {layout.id === state.activeLayout && '✓'}
                        </button>
                        {!['single', '2x2', '3x3'].includes(layout.id) && (
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              deleteLayout(layout.id);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <div className="border-t border-slate-700 px-3 py-2">
                      <button
                        onClick={() => {
                          setShowCreateModal(true);
                          setShowLayoutMenu(false);
                        }}
                        className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
                      >
                        <Plus className="w-4 h-4" />
                        Create New Layout
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="h-6 w-px bg-slate-700" />

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Timeframe:</span>
            <select
              value={state.globalTimeframe}
              onChange={e => updateGlobalTimeframe(e.target.value)}
              className="bg-slate-700/50 border border-slate-600 rounded px-2 py-1 text-sm"
            >
              <option value="1m">1m</option>
              <option value="5m">5m</option>
              <option value="15m">15m</option>
              <option value="1h">1h</option>
              <option value="4h">4h</option>
              <option value="1d">1d</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span>Grid: {rows}×{cols}</span>
          <span>·</span>
          <span>{activeLayout.panels.length} panels</span>
          {activeLayout.syncCrosshair && (
            <>
              <span>·</span>
              <span className="text-purple-400">Synced</span>
            </>
          )}
        </div>
      </div>

      {/* Chart Grid */}
      <div
        className="flex-1 grid gap-2 p-2 overflow-auto"
        style={{
          gridTemplateRows: `repeat(${rows}, 1fr)`,
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
        }}
      >
        {activeLayout.panels.map(panel => (
          <ChartPanel
            key={panel.id}
            panel={panel}
            updatePanel={updates => updatePanel(panel.id, updates)}
            syncCrosshair={activeLayout.syncCrosshair}
            globalCrosshair={state.crosshairPosition}
            onCrosshairMove={activeLayout.syncCrosshair ? updateCrosshair : undefined}
          />
        ))}
      </div>

      {/* Create Layout Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowCreateModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-bold mb-4">Create Chart Layout</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Layout Name</label>
                    <input
                      type="text"
                      value={newLayoutName}
                      onChange={e => setNewLayoutName(e.target.value)}
                      placeholder="My Custom Layout"
                      className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Rows</label>
                      <input
                        type="number"
                        min={1}
                        max={3}
                        value={newLayoutRows}
                        onChange={e => setNewLayoutRows(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-1">Columns</label>
                      <input
                        type="number"
                        min={1}
                        max={3}
                        value={newLayoutCols}
                        onChange={e => setNewLayoutCols(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>

                  <p className="text-xs text-slate-400">
                    Total panels: {newLayoutRows * newLayoutCols} (max 9)
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateLayout}
                    disabled={!newLayoutName.trim() || newLayoutRows * newLayoutCols > 9}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
