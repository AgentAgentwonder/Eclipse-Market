import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Command, Search, Layout } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';

export const WorkspaceSwitcher = () => {
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
  const isOpen = useWorkspaceStore(state => state.isWorkspaceSwitcherOpen);
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
  const setWorkspaceSwitcherOpen = useWorkspaceStore(state => state.setWorkspaceSwitcherOpen);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return workspaces;
    
    const query = searchQuery.toLowerCase();
    return workspaces.filter(workspace =>
      workspace.name.toLowerCase().includes(query)
    );
  }, [workspaces, searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to open switcher
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setWorkspaceSwitcherOpen(!isOpen);
      }

      // Cmd/Ctrl + 1-9 for quick switching
      if ((e.metaKey || e.ctrlKey) && /^[1-9]$/.test(e.key)) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (workspaces[index]) {
          setActiveWorkspace(workspaces[index].id);
        }
      }

      if (!isOpen) return;

      // Navigation within switcher
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredWorkspaces.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selected = filteredWorkspaces[selectedIndex];
        if (selected) {
          setActiveWorkspace(selected.id);
          setWorkspaceSwitcherOpen(false);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setWorkspaceSwitcherOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, workspaces, filteredWorkspaces, selectedIndex, setActiveWorkspace, setWorkspaceSwitcherOpen]);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center"
        onClick={() => setWorkspaceSwitcherOpen(false)}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-slate-800 rounded-2xl shadow-2xl border border-purple-500/30 w-full max-w-2xl mx-4"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-purple-500/20">
            <div className="flex items-center gap-3">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search workspaces..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent text-white outline-none text-lg"
                autoFocus
              />
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <kbd className="px-2 py-1 bg-slate-700 rounded">
                  {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}
                </kbd>
                <span>+</span>
                <kbd className="px-2 py-1 bg-slate-700 rounded">K</kbd>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {filteredWorkspaces.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No workspaces found
              </div>
            ) : (
              <div className="p-2">
                {filteredWorkspaces.map((workspace, index) => (
                  <motion.div
                    key={workspace.id}
                    whileHover={{ scale: 1.01 }}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all ${
                      index === selectedIndex
                        ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                        : workspace.id === activeWorkspaceId
                          ? 'bg-slate-700/50'
                          : 'hover:bg-slate-700/30'
                    }`}
                    onClick={() => {
                      setActiveWorkspace(workspace.id);
                      setWorkspaceSwitcherOpen(false);
                    }}
                  >
                    <Layout className="w-5 h-5 text-purple-400" />
                    <div className="flex-1">
                      <div className="font-medium">{workspace.name}</div>
                      <div className="text-xs text-gray-400">
                        {workspace.layout.panels.length} panels
                        {workspace.isUnsaved && ' • Unsaved changes'}
                      </div>
                    </div>
                    {workspace.id === activeWorkspaceId && (
                      <div className="px-2 py-1 bg-purple-500/20 text-purple-300 text-xs rounded">
                        Active
                      </div>
                    )}
                    {index < 9 && (
                      <kbd className="px-2 py-1 bg-slate-700 text-gray-400 text-xs rounded">
                        {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'} {index + 1}
                      </kbd>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-purple-500/20 bg-slate-900/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↑↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">↵</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-slate-700 rounded">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
