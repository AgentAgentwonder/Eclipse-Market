import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Keyboard,
  AlertTriangle,
  Download,
  Upload,
  RotateCcw,
  CheckCircle,
  Edit2,
  X,
  Check,
} from 'lucide-react';
import { useShortcutStore, KeyboardShortcut, ShortcutConflict } from '../../store/shortcutStore';

export function ShortcutSettings() {
  const {
    shortcuts,
    setShortcut,
    resetShortcut,
    resetAllShortcuts,
    toggleShortcut,
    getConflicts,
    exportShortcuts,
    importShortcuts,
  } = useShortcutStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingKeys, setEditingKeys] = useState('');
  const [recordingKeys, setRecordingKeys] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  const conflicts = useMemo(() => getConflicts(), [getConflicts, shortcuts]);

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, KeyboardShortcut[]> = {};
    shortcuts.forEach(shortcut => {
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });
    return groups;
  }, [shortcuts]);

  const handleExport = () => {
    const json = exportShortcuts();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyboard-shortcuts-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = event.target?.result as string;
        importShortcuts(json);
        setImportSuccess(true);
        setImportError(null);
        setTimeout(() => setImportSuccess(false), 3000);
      } catch (error) {
        setImportError('Failed to import shortcuts: Invalid file format');
        setImportSuccess(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const startEditing = (shortcut: KeyboardShortcut) => {
    if (!shortcut.customizable) return;
    setEditingId(shortcut.id);
    setEditingKeys(shortcut.keys);
    setRecordingKeys(false);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingKeys('');
    setRecordingKeys(false);
  };

  const saveEdit = (id: string) => {
    if (editingKeys.trim()) {
      setShortcut(id, editingKeys.trim());
    }
    cancelEditing();
  };

  const handleKeyRecord = (e: React.KeyboardEvent) => {
    e.preventDefault();

    const modifiers: string[] = [];
    if (e.ctrlKey || e.metaKey) {
      modifiers.push(e.metaKey ? 'Cmd' : 'Ctrl');
    }
    if (e.shiftKey) modifiers.push('Shift');
    if (e.altKey) modifiers.push('Alt');

    const keyMap: Record<string, string> = {
      Control: '',
      Meta: '',
      Shift: '',
      Alt: '',
      ' ': 'Space',
    };

    const key = keyMap[e.key] !== undefined ? keyMap[e.key] : e.key;

    if (key) {
      const combo = [...modifiers, key].filter(Boolean).join('+');
      setEditingKeys(combo);
      setRecordingKeys(false);
    }
  };

  const hasConflict = (shortcutId: string): ShortcutConflict | undefined => {
    const shortcut = shortcuts.find(s => s.id === shortcutId);
    if (!shortcut) return undefined;
    return conflicts.find(c => c.shortcuts.some(s => s.id === shortcutId));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Keyboard Shortcuts</h3>
          <p className="text-sm text-white/60 mt-1">Customize keyboard shortcuts to match your workflow</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg border border-purple-500/20 transition-colors text-sm"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <label className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg border border-purple-500/20 transition-colors cursor-pointer text-sm">
            <Upload className="w-4 h-4" />
            Import
            <input type="file" accept=".json" onChange={handleImport} className="hidden" />
          </label>
          <button
            onClick={resetAllShortcuts}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors text-sm text-red-400"
          >
            <RotateCcw className="w-4 h-4" />
            Reset All
          </button>
        </div>
      </div>

      {importError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Import Failed</p>
            <p className="text-red-400/80 text-sm mt-1">{importError}</p>
          </div>
        </motion.div>
      )}

      {importSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 text-sm font-medium">Import Successful</p>
            <p className="text-green-400/80 text-sm mt-1">Shortcuts have been imported successfully</p>
          </div>
        </motion.div>
      )}

      {conflicts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 text-sm font-medium mb-2">Shortcut Conflicts Detected</p>
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-sm text-yellow-400/80 mb-1">
                  <kbd className="px-2 py-1 bg-slate-800/50 rounded border border-yellow-500/20">
                    {conflict.keys}
                  </kbd>{' '}
                  is used by: {conflict.shortcuts.map(s => s.name).join(', ')}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div
            key={category}
            className="bg-slate-900/50 rounded-2xl border border-purple-500/20 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-purple-500/20 bg-slate-800/30">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-white/70">
                {category.replace('-', ' ')}
              </h4>
            </div>
            <div className="divide-y divide-purple-500/10">
              {shortcuts.map(shortcut => {
                const conflict = hasConflict(shortcut.id);
                const isEditing = editingId === shortcut.id;

                return (
                  <div
                    key={shortcut.id}
                    className={`px-4 py-3 ${conflict ? 'bg-yellow-500/5' : ''}`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-white">{shortcut.name}</span>
                          {!shortcut.customizable && (
                            <span className="text-xs px-2 py-0.5 bg-slate-700/50 rounded text-white/50">
                              System
                            </span>
                          )}
                          {conflict && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400">
                              Conflict
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-white/50 mt-1">{shortcut.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            {recordingKeys ? (
                              <div className="px-4 py-2 bg-purple-500/20 rounded-lg border border-purple-500/30 text-sm text-purple-400">
                                Press keys...
                              </div>
                            ) : (
                              <input
                                type="text"
                                value={editingKeys}
                                onChange={e => setEditingKeys(e.target.value)}
                                onKeyDown={handleKeyRecord}
                                onFocus={() => setRecordingKeys(true)}
                                className="px-3 py-2 bg-slate-800/50 border border-purple-500/30 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500/50 w-32"
                                placeholder="Type keys..."
                              />
                            )}
                            <button
                              onClick={() => saveEdit(shortcut.id)}
                              className="p-2 bg-green-500/20 hover:bg-green-500/30 rounded-lg border border-green-500/30 transition-colors text-green-400"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg border border-red-500/30 transition-colors text-red-400"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        ) : (
                          <>
                            <kbd className="px-3 py-2 text-sm bg-slate-800/50 rounded-lg border border-purple-500/20 text-white/70 min-w-[80px] text-center">
                              {shortcut.keys}
                            </kbd>
                            {shortcut.customizable && (
                              <>
                                <button
                                  onClick={() => startEditing(shortcut)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  title="Edit shortcut"
                                >
                                  <Edit2 className="w-4 h-4 text-white/60" />
                                </button>
                                <button
                                  onClick={() => resetShortcut(shortcut.id)}
                                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                  title="Reset to default"
                                >
                                  <RotateCcw className="w-4 h-4 text-white/60" />
                                </button>
                              </>
                            )}
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={shortcut.enabled}
                                onChange={e => toggleShortcut(shortcut.id, e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-purple-500 peer-checked:to-pink-500"></div>
                            </label>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
