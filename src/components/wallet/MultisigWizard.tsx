import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, CheckCircle, Users, Shield } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'

interface MultisigWizardProps {
  onClose: () => void
  onCreated: () => void
}

export function MultisigWizard({ onClose, onCreated }: MultisigWizardProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [members, setMembers] = useState<string[]>([''])
  const [threshold, setThreshold] = useState(2)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const addMember = () => {
    setMembers([...members, ''])
  }

  const removeMember = (index: number) => {
    setMembers(members.filter((_, i) => i !== index))
  }

  const updateMember = (index: number, value: string) => {
    const updated = [...members]
    updated[index] = value
    setMembers(updated)
  }

  const validateStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        setError('Please enter a wallet name')
        return false
      }
    } else if (step === 2) {
      const validMembers = members.filter(m => m.trim())
      if (validMembers.length < 2) {
        setError('At least 2 members are required')
        return false
      }
      const unique = new Set(validMembers)
      if (unique.size !== validMembers.length) {
        setError('Duplicate member addresses found')
        return false
      }
    } else if (step === 3) {
      const validMembers = members.filter(m => m.trim())
      if (threshold < 1 || threshold > validMembers.length) {
        setError('Invalid threshold')
        return false
      }
    }
    setError(null)
    return true
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setError(null)
    setStep(step - 1)
  }

  const handleCreate = async () => {
    if (!validateStep()) return

    setCreating(true)
    setError(null)

    try {
      const validMembers = members.filter(m => m.trim())
      await invoke('create_multisig_wallet', {
        name,
        members: validMembers,
        threshold,
      })
      onCreated()
      onClose()
    } catch (err) {
      setError(String(err))
    } finally {
      setCreating(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h3 className="text-xl font-bold">Wallet Name</h3>
              <p className="text-white/60 text-sm mt-2">
                Choose a name for your multisig wallet
              </p>
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Team Treasury"
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        )

      case 2:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Users className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h3 className="text-xl font-bold">Add Members</h3>
              <p className="text-white/60 text-sm mt-2">
                Add wallet addresses of all members
              </p>
            </div>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {members.map((member, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={member}
                    onChange={(e) => updateMember(index, e.target.value)}
                    placeholder={`Member ${index + 1} address`}
                    className="flex-1 px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                  />
                  {members.length > 1 && (
                    <button
                      onClick={() => removeMember(index)}
                      className="px-4 py-3 bg-red-500/20 border border-red-500/30 rounded-xl text-red-400 hover:bg-red-500/30 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addMember}
              className="w-full py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Member
            </button>
          </div>
        )

      case 3:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="w-16 h-16 mx-auto text-purple-400 mb-4" />
              <h3 className="text-xl font-bold">Approval Threshold</h3>
              <p className="text-white/60 text-sm mt-2">
                How many signatures are required to execute transactions?
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setThreshold(Math.max(1, threshold - 1))}
                className="w-12 h-12 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white hover:bg-slate-800 transition-colors"
              >
                -
              </button>
              <div className="flex-1 text-center">
                <div className="text-4xl font-bold text-purple-400">{threshold}</div>
                <div className="text-white/60 text-sm mt-1">
                  of {members.filter(m => m.trim()).length} signatures required
                </div>
              </div>
              <button
                onClick={() => setThreshold(Math.min(members.filter(m => m.trim()).length, threshold + 1))}
                className="w-12 h-12 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white hover:bg-slate-800 transition-colors"
              >
                +
              </button>
            </div>
            <div className="space-y-2 mt-6">
              <div
                className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                  threshold === 2 ? 'bg-purple-500/20 border-purple-500/50' : 'bg-slate-900/50 border-purple-500/20 hover:bg-slate-800'
                }`}
                onClick={() => setThreshold(2)}
              >
                <div className="font-semibold">2-of-{members.filter(m => m.trim()).length}</div>
                <div className="text-sm text-white/60">Standard multisig</div>
              </div>
              {members.filter(m => m.trim()).length >= 3 && (
                <div
                  className={`p-3 border rounded-xl cursor-pointer transition-colors ${
                    threshold === 3 ? 'bg-purple-500/20 border-purple-500/50' : 'bg-slate-900/50 border-purple-500/20 hover:bg-slate-800'
                  }`}
                  onClick={() => setThreshold(3)}
                >
                  <div className="font-semibold">3-of-{members.filter(m => m.trim()).length}</div>
                  <div className="text-sm text-white/60">High security</div>
                </div>
              )}
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <CheckCircle className="w-16 h-16 mx-auto text-green-400 mb-4" />
              <h3 className="text-xl font-bold">Review & Create</h3>
              <p className="text-white/60 text-sm mt-2">
                Please review your multisig wallet configuration
              </p>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Name</div>
                <div className="font-semibold">{name}</div>
              </div>
              <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Members</div>
                <div className="space-y-2 mt-2">
                  {members.filter(m => m.trim()).map((member, index) => (
                    <div key={index} className="text-sm font-mono truncate">
                      {index + 1}. {member}
                    </div>
                  ))}
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                <div className="text-sm text-white/60 mb-1">Threshold</div>
                <div className="font-semibold text-purple-400">
                  {threshold} of {members.filter(m => m.trim()).length} signatures required
                </div>
              </div>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Create Multisig Wallet</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    step >= i
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                      : 'bg-slate-700'
                  }`}
                >
                  {i}
                </div>
                {i < 4 && (
                  <div
                    className={`flex-1 h-1 mx-2 ${
                      step > i
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500'
                        : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-4 mt-6">
          {step > 1 && (
            <button
              onClick={prevStep}
              disabled={creating}
              className="flex-1 py-3 bg-slate-700 rounded-xl font-semibold hover:bg-slate-600 transition-colors disabled:opacity-50"
            >
              Back
            </button>
          )}
          {step < 4 ? (
            <button
              onClick={nextStep}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              Next
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {creating ? 'Creating...' : 'Create Wallet'}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}
