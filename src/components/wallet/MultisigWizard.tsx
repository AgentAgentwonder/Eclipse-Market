import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { X, Check, Plus, Trash2, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MultisigWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (wallet: MultisigWallet) => void;
}

interface MultisigWallet {
  id: string;
  name: string;
  address: string;
  threshold: number;
  members: string[];
  createdAt: string;
  balance: number;
}

type Step = 'name' | 'members' | 'threshold' | 'review';

const MultisigWizard: React.FC<MultisigWizardProps> = ({ isOpen, onClose, onSuccess }) => {
  const [currentStep, setCurrentStep] = useState<Step>('name');
  const [walletName, setWalletName] = useState('');
  const [members, setMembers] = useState<string[]>(['']);
  const [threshold, setThreshold] = useState(2);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const steps: Step[] = ['name', 'members', 'threshold', 'review'];
  const stepIndex = steps.indexOf(currentStep);

  const validateAddress = (address: string): boolean => {
    // Basic Solana address validation (32-44 chars, base58)
    const solanaRegex = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
    return solanaRegex.test(address.trim());
  };

  const addMember = () => {
    setMembers([...members, '']);
  };

  const removeMember = (index: number) => {
    if (members.length > 1) {
      setMembers(members.filter((_, i) => i !== index));
      if (threshold > members.length - 1) {
        setThreshold(members.length - 1);
      }
    }
  };

  const updateMember = (index: number, value: string) => {
    const newMembers = [...members];
    newMembers[index] = value;
    setMembers(newMembers);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'name':
        return walletName.trim().length > 0;
      case 'members':
        const validMembers = members.filter(m => m.trim() !== '');
        if (validMembers.length < 2) return false;
        return validMembers.every(m => validateAddress(m));
      case 'threshold':
        const memberCount = members.filter(m => m.trim() !== '').length;
        return threshold >= 1 && threshold <= memberCount;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
      setError(null);
    }
  };

  const handleBack = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
      setError(null);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    setError(null);

    try {
      const validMembers = members.filter(m => m.trim() !== '');

      const wallet = await invoke<MultisigWallet>('create_multisig_wallet', {
        request: {
          name: walletName,
          members: validMembers,
          threshold,
        },
      });

      if (onSuccess) {
        onSuccess(wallet);
      }

      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentStep('name');
    setWalletName('');
    setMembers(['']);
    setThreshold(2);
    setError(null);
    setLoading(false);
    onClose();
  };

  const getThresholdPresets = () => {
    const memberCount = members.filter(m => m.trim() !== '').length;
    const presets = [];

    if (memberCount >= 2) presets.push({ label: '1-of-2', value: 1 });
    if (memberCount >= 2) presets.push({ label: '2-of-2', value: 2 });
    if (memberCount >= 3) presets.push({ label: '2-of-3', value: 2 });
    if (memberCount >= 3) presets.push({ label: '3-of-3', value: 3 });
    if (memberCount >= 5) presets.push({ label: '3-of-5', value: 3 });
    if (memberCount >= 5) presets.push({ label: '4-of-5', value: 4 });
    if (memberCount >= 5) presets.push({ label: '5-of-5', value: 5 });

    return presets;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold text-white">Create Multisig Wallet</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 180px)' }}>
          {/* Progress indicator */}
          <div className="flex items-center justify-between mb-8">
            {steps.map((step, index) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      index <= stepIndex
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'border-gray-600 text-gray-400'
                    }`}
                  >
                    {index < stepIndex ? <Check size={20} /> : index + 1}
                  </div>
                  <span className="text-xs mt-2 text-gray-400 capitalize">{step}</span>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      index < stepIndex ? 'bg-blue-600' : 'bg-gray-600'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Step content */}
          <AnimatePresence mode="wait">
            {currentStep === 'name' && (
              <motion.div
                key="name"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Wallet Name</h3>
                <p className="text-gray-400 mb-4">Choose a name for your multisig wallet</p>
                <input
                  type="text"
                  value={walletName}
                  onChange={e => setWalletName(e.target.value)}
                  placeholder="e.g., Team Treasury"
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  autoFocus
                />
              </motion.div>
            )}

            {currentStep === 'members' && (
              <motion.div
                key="members"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Add Members</h3>
                <p className="text-gray-400 mb-4">
                  Add wallet addresses of all members (minimum 2)
                </p>

                <div className="space-y-3">
                  {members.map((member, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={member}
                          onChange={e => updateMember(index, e.target.value)}
                          placeholder="Solana wallet address"
                          className={`w-full px-4 py-2 bg-gray-900 border rounded-lg text-white focus:outline-none ${
                            member.trim() && !validateAddress(member)
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-gray-700 focus:border-blue-500'
                          }`}
                        />
                        {member.trim() && !validateAddress(member) && (
                          <p className="text-red-500 text-xs mt-1">Invalid Solana address</p>
                        )}
                      </div>
                      {members.length > 1 && (
                        <button
                          onClick={() => removeMember(index)}
                          className="text-red-500 hover:text-red-400 p-2"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={addMember}
                  className="mt-4 flex items-center gap-2 text-blue-500 hover:text-blue-400"
                >
                  <Plus size={20} />
                  Add Member
                </button>
              </motion.div>
            )}

            {currentStep === 'threshold' && (
              <motion.div
                key="threshold"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Set Threshold</h3>
                <p className="text-gray-400 mb-4">
                  How many signatures are required to approve a transaction?
                </p>

                <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4 mb-6 flex items-start gap-3">
                  <Info size={20} className="text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-blue-300">
                    The threshold determines how many members must sign a transaction before it can
                    be executed. For example, 3-of-5 means 3 out of 5 members must approve.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                  {getThresholdPresets().map(preset => (
                    <button
                      key={preset.label}
                      onClick={() => setThreshold(preset.value)}
                      className={`px-4 py-3 rounded-lg font-medium transition-colors ${
                        threshold === preset.value
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-900 text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-4">
                  <label className="text-gray-300">Custom:</label>
                  <input
                    type="number"
                    min="1"
                    max={members.filter(m => m.trim() !== '').length}
                    value={threshold}
                    onChange={e => setThreshold(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-24 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  />
                  <span className="text-gray-400">
                    of {members.filter(m => m.trim() !== '').length} members
                  </span>
                </div>
              </motion.div>
            )}

            {currentStep === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <h3 className="text-lg font-medium text-white mb-4">Review & Create</h3>
                <p className="text-gray-400 mb-6">
                  Please review your multisig wallet configuration
                </p>

                <div className="space-y-4">
                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="text-gray-400 text-sm">Wallet Name</label>
                    <p className="text-white font-medium">{walletName}</p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="text-gray-400 text-sm">Threshold</label>
                    <p className="text-white font-medium">
                      {threshold} of {members.filter(m => m.trim() !== '').length} signatures
                      required
                    </p>
                  </div>

                  <div className="bg-gray-900 rounded-lg p-4">
                    <label className="text-gray-400 text-sm mb-2 block">Members</label>
                    <div className="space-y-2">
                      {members
                        .filter(m => m.trim() !== '')
                        .map((member, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs">
                              {index + 1}
                            </div>
                            <p className="text-white font-mono text-sm truncate">{member}</p>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <div className="mt-4 p-3 bg-red-900/20 border border-red-700 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-gray-700">
          <button
            onClick={handleBack}
            disabled={stepIndex === 0}
            className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex gap-3">
            <button onClick={handleClose} className="px-4 py-2 text-gray-400 hover:text-white">
              Cancel
            </button>
            {currentStep !== 'review' ? (
              <button
                onClick={handleNext}
                disabled={!canProceed()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleCreate}
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Wallet'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MultisigWizard;
