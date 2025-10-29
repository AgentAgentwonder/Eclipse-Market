import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2 } from 'lucide-react';
import {
  useWalletStore,
  WalletGroup,
  CreateGroupRequest,
  UpdateGroupRequest,
} from '../../store/walletStore';

interface GroupManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const modalVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
};

export function GroupManagementModal({ isOpen, onClose }: GroupManagementModalProps) {
  const wallets = useWalletStore(state => state.wallets);
  const groups = useWalletStore(state => state.groups);
  const createGroup = useWalletStore(state => state.createGroup);
  const updateGroup = useWalletStore(state => state.updateGroup);
  const deleteGroup = useWalletStore(state => state.deleteGroup);
  const listGroups = useWalletStore(state => state.listGroups);

  const [activeGroup, setActiveGroup] = useState<WalletGroup | null>(null);
  const [formState, setFormState] = useState<{
    name: string;
    description: string;
    walletIds: string[];
    autoRebalance: boolean;
    maxSlippage?: number | null;
    defaultPriorityFee?: number | null;
    riskLevel?: string | null;
  }>({
    name: '',
    description: '',
    walletIds: [],
    autoRebalance: false,
    maxSlippage: null,
    defaultPriorityFee: null,
    riskLevel: null,
  });

  const availableWallets = useMemo(() => wallets, [wallets]);

  const resetForm = () => {
    setActiveGroup(null);
    setFormState({
      name: '',
      description: '',
      walletIds: [],
      autoRebalance: false,
      maxSlippage: null,
      defaultPriorityFee: null,
      riskLevel: null,
    });
  };

  const handleEditGroup = (group: WalletGroup) => {
    setActiveGroup(group);
    setFormState({
      name: group.name,
      description: group.description ?? '',
      walletIds: group.walletIds,
      autoRebalance: group.sharedSettings.autoRebalance,
      maxSlippage: group.sharedSettings.maxSlippage ?? null,
      defaultPriorityFee: group.sharedSettings.defaultPriorityFee ?? null,
      riskLevel: group.sharedSettings.riskLevel ?? null,
    });
  };

  const handleSubmit = async () => {
    if (!formState.name.trim()) return;

    const payload: CreateGroupRequest | UpdateGroupRequest = activeGroup
      ? {
          groupId: activeGroup.id,
          name: formState.name,
          description: formState.description || null,
          walletIds: formState.walletIds,
          sharedSettings: {
            maxSlippage: formState.maxSlippage ?? null,
            defaultPriorityFee: formState.defaultPriorityFee ?? null,
            autoRebalance: formState.autoRebalance,
            riskLevel: formState.riskLevel ?? null,
          },
        }
      : {
          name: formState.name,
          description: formState.description || null,
          walletIds: formState.walletIds,
          sharedSettings: {
            maxSlippage: formState.maxSlippage ?? null,
            defaultPriorityFee: formState.defaultPriorityFee ?? null,
            autoRebalance: formState.autoRebalance,
            riskLevel: formState.riskLevel ?? null,
          },
        };

    try {
      if (activeGroup) {
        await updateGroup(payload as UpdateGroupRequest);
      } else {
        await createGroup(payload as CreateGroupRequest);
      }
      await listGroups();
      resetForm();
    } catch (error) {
      console.error('Failed to save group:', error);
    }
  };

  const handleDelete = async (groupId: string) => {
    try {
      await deleteGroup(groupId);
      await listGroups();
      resetForm();
    } catch (error) {
      console.error('Failed to delete group:', error);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="relative w-full max-w-4xl mx-4 bg-slate-900/95 border border-purple-500/20 rounded-2xl shadow-2xl overflow-hidden"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-purple-500/20">
              <div>
                <h2 className="text-2xl font-bold">Wallet Groups</h2>
                <p className="text-sm text-gray-400">
                  Organize wallets into groups with shared trading preferences.
                </p>
              </div>
              <button
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="p-2 rounded-full hover:bg-white/10 transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Existing Groups</h3>
                  <button
                    onClick={resetForm}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    New Group
                  </button>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {groups.map(group => (
                    <motion.div
                      key={group.id}
                      whileHover={{ scale: 1.01 }}
                      className={`p-4 rounded-xl border transition-all ${
                        activeGroup?.id === group.id
                          ? 'border-purple-500/50 bg-purple-500/10'
                          : 'border-purple-500/20 bg-white/5'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h4 className="text-lg font-semibold">{group.name}</h4>
                          {group.description && (
                            <p className="text-sm text-gray-400 mt-1">{group.description}</p>
                          )}
                          <div className="mt-3 flex flex-wrap gap-2">
                            {group.walletIds.map(walletId => {
                              const wallet = availableWallets.find(w => w.id === walletId);
                              if (!wallet) return null;
                              return (
                                <span
                                  key={wallet.id}
                                  className="px-2 py-1 text-xs rounded-full bg-purple-500/20 border border-purple-500/30"
                                >
                                  {wallet.label}
                                </span>
                              );
                            })}
                            {group.walletIds.length === 0 && (
                              <span className="text-xs text-gray-400">No wallets assigned</span>
                            )}
                          </div>
                          <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-400">
                            <span>
                              Max Slippage: {group.sharedSettings.maxSlippage ?? 'Default'}
                            </span>
                            <span>
                              Priority Fee: {group.sharedSettings.defaultPriorityFee ?? 'Default'}
                            </span>
                            <span>Risk Level: {group.sharedSettings.riskLevel ?? 'Not set'}</span>
                            <span>
                              Auto Rebalance:{' '}
                              {group.sharedSettings.autoRebalance ? 'Enabled' : 'Disabled'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <button
                            onClick={() => handleEditGroup(group)}
                            className="px-3 py-1 text-sm rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-all"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="px-3 py-1 text-sm rounded-lg bg-red-500/20 hover:bg-red-500/30 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  {groups.length === 0 && (
                    <div className="text-sm text-gray-400 border border-dashed border-purple-500/30 rounded-xl p-6 text-center">
                      No groups yet. Create a group to share trading preferences across wallets.
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-purple-500/20 bg-white/5">
                <h3 className="text-lg font-semibold mb-4">
                  {activeGroup ? 'Update Group' : 'Create New Group'}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-gray-300">Group Name</label>
                    <input
                      value={formState.name}
                      onChange={e => setFormState(state => ({ ...state, name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Trading group name"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Description</label>
                    <textarea
                      value={formState.description}
                      onChange={e =>
                        setFormState(state => ({ ...state, description: e.target.value }))
                      }
                      rows={3}
                      className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                      placeholder="Describe the group's purpose"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300">Assign Wallets</label>
                    <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
                      {availableWallets.map(wallet => {
                        const checked = formState.walletIds.includes(wallet.id);
                        return (
                          <label
                            key={wallet.id}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all ${
                              checked
                                ? 'border-purple-500/60 bg-purple-500/10'
                                : 'border-purple-500/20'
                            }`}
                          >
                            <div>
                              <div className="text-sm font-medium">{wallet.label}</div>
                              <div className="text-xs text-gray-400">
                                {wallet.publicKey.slice(0, 4)}...{wallet.publicKey.slice(-4)}
                              </div>
                            </div>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => {
                                setFormState(state => ({
                                  ...state,
                                  walletIds: checked
                                    ? state.walletIds.filter(id => id !== wallet.id)
                                    : [...state.walletIds, wallet.id],
                                }));
                              }}
                              className="h-4 w-4 text-purple-500 bg-slate-900 border-purple-500 rounded focus:ring-purple-500"
                            />
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300">Max Slippage (%)</label>
                      <input
                        type="number"
                        value={formState.maxSlippage ?? ''}
                        onChange={e =>
                          setFormState(state => ({
                            ...state,
                            maxSlippage: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="Default"
                        min={0}
                        step={0.01}
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-300">Priority Fee (microlamports)</label>
                      <input
                        type="number"
                        value={formState.defaultPriorityFee ?? ''}
                        onChange={e =>
                          setFormState(state => ({
                            ...state,
                            defaultPriorityFee: e.target.value ? Number(e.target.value) : null,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                        placeholder="Default"
                        min={0}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-300">Risk Level</label>
                      <select
                        value={formState.riskLevel ?? ''}
                        onChange={e =>
                          setFormState(state => ({
                            ...state,
                            riskLevel: e.target.value || null,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2 bg-slate-900 border border-purple-500/30 rounded-lg focus:outline-none focus:border-purple-500"
                      >
                        <option value="">Not Set</option>
                        <option value="conservative">Conservative</option>
                        <option value="balanced">Balanced</option>
                        <option value="aggressive">Aggressive</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={formState.autoRebalance}
                        onChange={e =>
                          setFormState(state => ({
                            ...state,
                            autoRebalance: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 text-purple-500 bg-slate-900 border-purple-500 rounded focus:ring-purple-500"
                      />
                      <label className="text-sm text-gray-300">Enable Auto Rebalancing</label>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
                    <button
                      onClick={resetForm}
                      className="px-4 py-2 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition-all"
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold"
                    >
                      {activeGroup ? 'Update Group' : 'Create Group'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
