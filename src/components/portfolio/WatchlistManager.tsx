import { useState, useEffect, useRef } from 'react';
import { X, Plus, Trash2, Edit2, Download, Upload, GripVertical } from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useWatchlistStore, Watchlist, WatchlistItem } from '../../store/watchlistStore';

interface WatchlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateAlert: (symbol: string, mint: string) => void;
}

const WatchlistManager = ({ isOpen, onClose, onCreateAlert }: WatchlistManagerProps) => {
  const {
    watchlists,
    fetchWatchlists,
    createWatchlist,
    updateWatchlist,
    deleteWatchlist,
    addItem,
    removeItem,
    exportWatchlist,
    importWatchlist,
  } = useWatchlistStore();

  const [selectedWatchlist, setSelectedWatchlist] = useState<Watchlist | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newItemSymbol, setNewItemSymbol] = useState('');
  const [newItemMint, setNewItemMint] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchWatchlists().catch(console.error);
    }
  }, [isOpen, fetchWatchlists]);

  useEffect(() => {
    if (!selectedWatchlist && watchlists.length > 0) {
      setSelectedWatchlist(watchlists[0]);
    }
  }, [watchlists, selectedWatchlist]);

  const handleCreate = async () => {
    if (!newWatchlistName.trim()) return;

    try {
      const watchlist = await createWatchlist(newWatchlistName);
      setSelectedWatchlist(watchlist);
      setNewWatchlistName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Failed to create watchlist:', error);
      alert('Failed to create watchlist: ' + error);
    }
  };

  const handleUpdate = async () => {
    if (!selectedWatchlist || !editedName.trim()) return;

    try {
      const updated = await updateWatchlist(selectedWatchlist.id, editedName);
      setSelectedWatchlist(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update watchlist:', error);
      alert('Failed to update watchlist: ' + error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this watchlist?')) return;

    try {
      await deleteWatchlist(id);
      if (selectedWatchlist?.id === id) {
        setSelectedWatchlist(null);
      }
    } catch (error) {
      console.error('Failed to delete watchlist:', error);
      alert('Failed to delete watchlist: ' + error);
    }
  };

  const handleAddItem = async () => {
    if (!selectedWatchlist || !newItemSymbol.trim() || !newItemMint.trim()) return;

    try {
      const updated = await addItem(selectedWatchlist.id, newItemSymbol, newItemMint);
      setSelectedWatchlist(updated);
      setNewItemSymbol('');
      setNewItemMint('');
      setIsAddingItem(false);
    } catch (error) {
      console.error('Failed to add item:', error);
      alert('Failed to add item: ' + error);
    }
  };

  const handleRemoveItem = async (mint: string) => {
    if (!selectedWatchlist) return;

    try {
      const updated = await removeItem(selectedWatchlist.id, mint);
      setSelectedWatchlist(updated);
    } catch (error) {
      console.error('Failed to remove item:', error);
      alert('Failed to remove item: ' + error);
    }
  };

  const handleExport = async () => {
    if (!selectedWatchlist) return;

    try {
      const data = await exportWatchlist(selectedWatchlist.id);
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedWatchlist.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export watchlist:', error);
      alert('Failed to export watchlist: ' + error);
    }
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async e => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        await importWatchlist(text);
      } catch (error) {
        console.error('Failed to import watchlist:', error);
        alert('Failed to import watchlist: ' + error);
      }
    };
    input.click();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          className="bg-slate-900 border border-purple-500/30 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          {/* Left sidebar - Watchlists */}
          <div className="w-80 border-r border-purple-500/20 flex flex-col">
            <div className="p-6 border-b border-purple-500/20">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Watchlists</h3>
                <div className="flex items-center gap-2">
                  <button
                    className="p-2 rounded-full hover:bg-slate-800 transition"
                    onClick={handleImport}
                    title="Import"
                  >
                    <Upload className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-full hover:bg-slate-800 transition"
                    onClick={() => setIsCreating(true)}
                    title="Create"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isCreating && (
                <div className="space-y-2 mb-4">
                  <input
                    type="text"
                    placeholder="Watchlist name"
                    value={newWatchlistName}
                    onChange={e => setNewWatchlistName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                  />
                  <div className="flex gap-2">
                    <button
                      className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-sm transition"
                      onClick={handleCreate}
                    >
                      Create
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
                      onClick={() => {
                        setIsCreating(false);
                        setNewWatchlistName('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {watchlists.map(watchlist => (
                <div
                  key={watchlist.id}
                  className={`p-4 rounded-2xl cursor-pointer transition ${
                    selectedWatchlist?.id === watchlist.id
                      ? 'bg-purple-500/20 border border-purple-500/40'
                      : 'bg-slate-800/60 border border-purple-500/10 hover:bg-slate-800'
                  }`}
                  onClick={() => setSelectedWatchlist(watchlist)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{watchlist.name}</h4>
                    <button
                      className="p-1 rounded-lg hover:bg-red-500/20 hover:text-red-400 transition"
                      onClick={e => {
                        e.stopPropagation();
                        handleDelete(watchlist.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-400">{watchlist.items.length} assets</p>
                </div>
              ))}
            </div>
          </div>

          {/* Main content - Items */}
          <div className="flex-1 flex flex-col">
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editedName}
                      onChange={e => setEditedName(e.target.value)}
                      className="px-3 py-1.5 bg-slate-800/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <button
                      className="px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-600 text-sm transition"
                      onClick={handleUpdate}
                    >
                      Save
                    </button>
                    <button
                      className="px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm transition"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold">
                      {selectedWatchlist?.name || 'Select a watchlist'}
                    </h2>
                    {selectedWatchlist && (
                      <button
                        className="p-2 rounded-lg hover:bg-slate-800 transition"
                        onClick={() => {
                          setEditedName(selectedWatchlist.name);
                          setIsEditing(true);
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
                {selectedWatchlist && (
                  <p className="text-sm text-slate-400">
                    {selectedWatchlist.items.length} tracked assets
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {selectedWatchlist && (
                  <>
                    <button
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center gap-2 transition"
                      onClick={handleExport}
                    >
                      <Download className="w-4 h-4" />
                      Export
                    </button>
                    <button
                      className="px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 flex items-center gap-2 transition"
                      onClick={() => setIsAddingItem(true)}
                    >
                      <Plus className="w-4 h-4" />
                      Add Asset
                    </button>
                  </>
                )}
                <button
                  className="p-2 rounded-full hover:bg-slate-800 transition"
                  onClick={onClose}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {isAddingItem && selectedWatchlist && (
                <div className="mb-6 p-4 bg-slate-800/60 border border-purple-500/20 rounded-2xl">
                  <h4 className="font-medium mb-3">Add Asset</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Symbol (e.g., SOL)"
                      value={newItemSymbol}
                      onChange={e => setNewItemSymbol(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <input
                      type="text"
                      placeholder="Mint address"
                      value={newItemMint}
                      onChange={e => setNewItemMint(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    />
                    <div className="flex gap-2">
                      <button
                        className="flex-1 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 transition"
                        onClick={handleAddItem}
                      >
                        Add
                      </button>
                      <button
                        className="px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 transition"
                        onClick={() => {
                          setIsAddingItem(false);
                          setNewItemSymbol('');
                          setNewItemMint('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {selectedWatchlist ? (
                <div className="space-y-3">
                  {selectedWatchlist.items.map(item => (
                    <div
                      key={item.mint}
                      className="flex items-center justify-between bg-slate-800/60 border border-purple-500/10 rounded-2xl p-4 hover:border-purple-500/30 transition group"
                    >
                      <div className="flex items-center gap-4">
                        <GripVertical className="w-4 h-4 text-slate-600 cursor-move" />
                        <div>
                          <h4 className="font-medium">{item.symbol}</h4>
                          <p className="text-xs text-slate-400">{item.mint}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          className="px-3 py-1.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-sm transition"
                          onClick={() => onCreateAlert(item.symbol, item.mint)}
                        >
                          Create Alert
                        </button>
                        <button
                          className="p-2 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-400 transition"
                          onClick={() => handleRemoveItem(item.mint)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedWatchlist.items.length === 0 && (
                    <div className="text-center py-12 text-slate-400">
                      No assets yet. Click "Add Asset" to start tracking.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-400">
                  Select a watchlist or create a new one to get started
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WatchlistManager;
