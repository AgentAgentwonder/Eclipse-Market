import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Command, X } from 'lucide-react';
import { useShortcutStore } from '../../store/shortcutStore';

interface ShortcutCheatSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const categoryTitles: Record<string, string> = {
  trading: 'Trading',
  navigation: 'Navigation',
  general: 'General',
  windows: 'Workspace & Windows',
  tools: 'Tools',
};

export function ShortcutCheatSheet({ isOpen, onClose }: ShortcutCheatSheetProps) {
  const { shortcuts } = useShortcutStore();

  const groupedShortcuts = useMemo(() => {
    const groups: Record<string, typeof shortcuts> = {};
    shortcuts.forEach(shortcut => {
      if (!shortcut.enabled) return;
      if (!groups[shortcut.category]) {
        groups[shortcut.category] = [];
      }
      groups[shortcut.category].push(shortcut);
    });

    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [shortcuts]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-4xl mx-6 bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <div className="flex items-center justify-between px-8 py-6 border-b border-purple-500/20">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                  <Command className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Keyboard Shortcuts</h2>
                  <p className="text-sm text-white/60">Boost your efficiency with personalized shortcuts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-white/10 transition-colors"
                aria-label="Close shortcut cheat sheet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 max-h-[70vh] overflow-y-auto">
              {groupedShortcuts.map(([category, shortcuts]) => (
                <div key={category} className="bg-slate-900/60 rounded-2xl border border-purple-500/20">
                  <div className="px-4 py-3 border-b border-purple-500/20 text-sm font-semibold text-white/70 uppercase tracking-wide">
                    {categoryTitles[category] || category}
                  </div>
                  <div className="divide-y divide-purple-500/10">
                    {shortcuts.map(shortcut => (
                      <div key={shortcut.id} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div>
                          <div className="text-sm font-medium text-white">{shortcut.name}</div>
                          <div className="text-xs text-white/50">{shortcut.description}</div>
                        </div>
                        <KeyboardBadge keys={shortcut.keys} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function KeyboardBadge({ keys }: { keys: string }) {
  const parts = keys.split('+');
  return (
    <div className="flex items-center gap-2">
      {parts.map((part, index) => (
        <kbd
          key={`${part}-${index}`}
          className="px-2 py-1 text-xs bg-slate-800/60 rounded border border-purple-500/20 text-white/70"
        >
          {part}
        </kbd>
      ))}
    </div>
  );
}
