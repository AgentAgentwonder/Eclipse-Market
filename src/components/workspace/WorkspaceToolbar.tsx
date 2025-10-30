import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, LayoutList, Monitor, X } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { layoutPresets } from '../../constants/layoutPresets';
import { MonitorLayoutEditor } from '../windowing/MonitorLayoutEditor';

export const WorkspaceToolbar = () => {
  const activeWorkspace = useWorkspaceStore(state => state.getActiveWorkspace());
  const saveWorkspace = useWorkspaceStore(state => state.saveWorkspace);
  const resetWorkspaceLayout = useWorkspaceStore(state => state.resetWorkspaceLayout);
  const loadPreset = useWorkspaceStore(state => state.loadPreset);
  const monitorConfig = useWorkspaceStore(state => state.currentMonitorConfig);

  const [selectedPreset, setSelectedPreset] = useState('');
  const [showMonitorEditor, setShowMonitorEditor] = useState(false);

  const presets = useMemo(() => layoutPresets, []);

  if (!activeWorkspace) {
    return null;
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 bg-slate-900/60 border-b border-purple-500/20">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => saveWorkspace(activeWorkspace.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
              activeWorkspace.isUnsaved
                ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                : 'bg-slate-800/70 hover:bg-slate-800/90 border border-purple-500/20'
            }`}
          >
            <Save className="w-4 h-4" />
            <span className="text-sm font-medium">
              {activeWorkspace.isUnsaved ? 'Save Changes' : 'Saved'}
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => resetWorkspaceLayout(activeWorkspace.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800/70 hover:bg-slate-800/90 border border-purple-500/20"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-sm font-medium">Reset</span>
          </motion.button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/70 border border-purple-500/20 rounded-lg px-3 py-2">
            <LayoutList className="w-4 h-4 text-purple-300" />
            <select
              value={selectedPreset}
              onChange={event => {
                const value = event.target.value;
                setSelectedPreset(value);
                if (value) {
                  loadPreset(value);
                }
              }}
              className="bg-transparent text-sm outline-none"
            >
              <option value="">Load Preset</option>
              {presets.map(preset => (
                <option key={preset.id} value={preset.id} className="text-black">
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          {monitorConfig && (
            <button
              onClick={() => setShowMonitorEditor(true)}
              className="flex items-center gap-2 bg-slate-800/70 border border-purple-500/20 hover:border-purple-400/40 rounded-lg px-3 py-2 text-xs text-gray-300 transition-colors"
            >
              <Monitor className="w-4 h-4 text-purple-300" />
              <span>
                {monitorConfig.count} display{monitorConfig.count > 1 ? 's' : ''} • {monitorConfig.width}×
                {monitorConfig.height} @ {monitorConfig.devicePixelRatio}x
              </span>
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showMonitorEditor && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative max-w-5xl w-full mx-4"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
            >
              <button
                onClick={() => setShowMonitorEditor(false)}
                className="absolute -top-10 right-0 text-white/60 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
              <MonitorLayoutEditor />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
