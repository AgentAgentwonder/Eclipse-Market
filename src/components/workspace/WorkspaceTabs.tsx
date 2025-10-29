import { useState, useRef, useEffect } from 'react';
import { motion, Reorder } from 'framer-motion';
import { Plus, X, MoreVertical, Copy, Edit2, Trash2, Circle } from 'lucide-react';
import { useWorkspaceStore } from '../../store/workspaceStore';

interface ContextMenuState {
  workspaceId: string;
  x: number;
  y: number;
}

export const WorkspaceTabs = () => {
  const workspaces = useWorkspaceStore(state => state.workspaces);
  const activeWorkspaceId = useWorkspaceStore(state => state.activeWorkspaceId);
  const setActiveWorkspace = useWorkspaceStore(state => state.setActiveWorkspace);
  const addWorkspace = useWorkspaceStore(state => state.addWorkspace);
  const duplicateWorkspace = useWorkspaceStore(state => state.duplicateWorkspace);
  const deleteWorkspace = useWorkspaceStore(state => state.deleteWorkspace);
  const renameWorkspace = useWorkspaceStore(state => state.renameWorkspace);
  const reorderWorkspaces = useWorkspaceStore(state => state.reorderWorkspaces);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renamingValue, setRenamingValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renamingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [renamingId]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [contextMenu]);

  const handleContextMenu = (e: React.MouseEvent, workspaceId: string) => {
    e.preventDefault();
    setContextMenu({
      workspaceId,
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleRename = (workspaceId: string, currentName: string) => {
    setRenamingId(workspaceId);
    setRenamingValue(currentName);
    setContextMenu(null);
  };

  const submitRename = () => {
    if (renamingId && renamingValue.trim()) {
      renameWorkspace(renamingId, renamingValue.trim());
    }
    setRenamingId(null);
    setRenamingValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      submitRename();
    } else if (e.key === 'Escape') {
      setRenamingId(null);
      setRenamingValue('');
    }
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 backdrop-blur-sm border-b border-purple-500/20 overflow-x-auto">
      <Reorder.Group
        axis="x"
        values={workspaces.map(w => w.id)}
        onReorder={reorderWorkspaces}
        className="flex items-center gap-2"
      >
        {workspaces.map(workspace => (
          <Reorder.Item
            key={workspace.id}
            value={workspace.id}
            className="relative flex items-center"
          >
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`relative flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer ${
                activeWorkspaceId === workspace.id
                  ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30'
                  : 'bg-slate-800/50 hover:bg-slate-800/70 border border-transparent'
              }`}
              onClick={() => setActiveWorkspace(workspace.id)}
              onContextMenu={e => handleContextMenu(e, workspace.id)}
            >
              {renamingId === workspace.id ? (
                <input
                  ref={inputRef}
                  type="text"
                  value={renamingValue}
                  onChange={e => setRenamingValue(e.target.value)}
                  onBlur={submitRename}
                  onKeyDown={handleKeyDown}
                  className="bg-slate-700 text-white px-2 py-1 rounded text-sm outline-none w-32"
                  onClick={e => e.stopPropagation()}
                />
              ) : (
                <>
                  {workspace.isUnsaved && (
                    <Circle className="w-2 h-2 fill-yellow-400 text-yellow-400" />
                  )}
                  <span className="text-sm font-medium">{workspace.name}</span>
                </>
              )}

              {workspaces.length > 1 && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    deleteWorkspace(workspace.id);
                  }}
                  className="p-1 hover:bg-red-500/20 rounded transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
              )}

              <button
                onClick={e => {
                  e.stopPropagation();
                  handleContextMenu(e as any, workspace.id);
                }}
                className="p-1 hover:bg-slate-700/50 rounded transition-all"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </motion.div>
          </Reorder.Item>
        ))}
      </Reorder.Group>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => addWorkspace()}
        className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg text-sm font-medium transition-all"
      >
        <Plus className="w-4 h-4" />
        New
      </motion.button>

      {contextMenu && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="fixed z-50 bg-slate-800 border border-purple-500/30 rounded-lg shadow-xl overflow-hidden"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const workspace = workspaces.find(w => w.id === contextMenu.workspaceId);
              if (workspace) {
                handleRename(workspace.id, workspace.name);
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 text-sm transition-all text-left"
          >
            <Edit2 className="w-4 h-4" />
            Rename
          </button>
          <button
            onClick={() => {
              duplicateWorkspace(contextMenu.workspaceId);
              setContextMenu(null);
            }}
            className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-700/50 text-sm transition-all text-left"
          >
            <Copy className="w-4 h-4" />
            Duplicate
          </button>
          {workspaces.length > 1 && (
            <button
              onClick={() => {
                deleteWorkspace(contextMenu.workspaceId);
                setContextMenu(null);
              }}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-red-500/20 text-red-400 text-sm transition-all text-left"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </button>
          )}
        </motion.div>
      )}
    </div>
  );
};
