import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Send, AlertCircle, Check, QrCode, Shield } from 'lucide-react';
import type { TransactionFeeEstimate, SendTransactionInput, AddressBookContact } from '../../types/wallet';
import { useWalletStore } from '../../store/walletStore';
import { useAddressBook } from '../../hooks/useAddressBook';

interface SendFlowProps {
  onSuccess?: () => void;
}

export function SendFlow({ onSuccess }: SendFlowProps) {
  const { publicKey, balance, signingMethod, activeHardwareDevice } = useWalletStore(state => ({
    publicKey: state.publicKey,
    balance: state.balance,
    signingMethod: state.signingMethod,
    activeHardwareDevice: state.activeHardwareDevice,
  }));
  const isHardwareSigning = signingMethod === 'hardware';
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feeEstimate, setFeeEstimate] = useState<TransactionFeeEstimate | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [showAddressBook, setShowAddressBook] = useState(false);
  const { contacts } = useAddressBook();

  const solBalance = balance ? balance / 1e9 : 0;

  useEffect(() => {
    if (recipient && amount && parseFloat(amount) > 0) {
      const timer = setTimeout(() => {
        estimateFee();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setFeeEstimate(null);
    }
  }, [recipient, amount]);

  const estimateFee = async () => {
    try {
      const estimate = await invoke<TransactionFeeEstimate>('wallet_estimate_fee', {
        recipient,
        amount: parseFloat(amount),
        tokenMint: null,
      });
      setFeeEstimate(estimate);
    } catch (err) {
      console.error('Failed to estimate fee:', err);
    }
  };

  const handleMaxClick = () => {
    if (solBalance > 0) {
      const maxAmount = Math.max(0, solBalance - 0.001);
      setAmount(maxAmount.toFixed(6));
    }
  };

  const handleSend = async () => {
    if (!publicKey || !recipient || !amount) return;

    const amountNum = parseFloat(amount);
    if (amountNum <= 0 || amountNum > solBalance) {
      setError('Invalid amount');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: SendTransactionInput = {
        recipient,
        amount: amountNum,
        memo: memo || undefined,
      };

      const signature = await invoke<string>('wallet_send_transaction', {
        input,
        walletAddress: publicKey,
      });

      setTxSignature(signature);
      setShowConfirmation(false);
      onSuccess?.();

      setTimeout(() => {
        setTxSignature(null);
        setRecipient('');
        setAmount('');
        setMemo('');
      }, 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const selectContact = (contact: AddressBookContact) => {
    setRecipient(contact.address);
    setShowAddressBook(false);
  };

  if (txSignature) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-400" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Transaction Sent!</h3>
        <p className="text-gray-400 text-sm mb-4">Your transaction has been submitted</p>
        <p className="text-xs text-gray-500 font-mono break-all">{txSignature}</p>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Confirm Transaction</h3>
          <p className="text-gray-400 text-sm">Please review the details before sending</p>
          {isHardwareSigning && activeHardwareDevice && (
            <div className="mt-4 bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-left">
                <p className="text-purple-300 font-semibold mb-1">Hardware Wallet Signing</p>
                <p className="text-gray-400">
                  Approve this transaction on your {activeHardwareDevice.deviceType} device
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="bg-gray-700/50 rounded-xl p-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">To</span>
            <span className="font-mono text-sm">{recipient.slice(0, 8)}...{recipient.slice(-8)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Amount</span>
            <span className="font-semibold">{amount} SOL</span>
          </div>
          {memo && (
            <div className="flex justify-between">
              <span className="text-gray-400">Memo</span>
              <span className="text-sm">{memo}</span>
            </div>
          )}
          {feeEstimate && (
            <div className="flex justify-between">
              <span className="text-gray-400">Network Fee</span>
              <span className="text-sm">{feeEstimate.totalFee.toFixed(6)} SOL</span>
            </div>
          )}
          <div className="pt-3 border-t border-gray-600 flex justify-between">
            <span className="text-gray-400 font-semibold">Total</span>
            <span className="font-bold">
              {(parseFloat(amount) + (feeEstimate?.totalFee || 0)).toFixed(6)} SOL
            </span>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <span className="text-red-400 text-sm">{error}</span>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmation(false)}
            disabled={loading}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-xl font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={loading}
            className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Confirm Send
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Recipient Address</label>
        <div className="relative">
          <input
            type="text"
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
            placeholder="Enter Solana address"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-10 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={() => setShowAddressBook(!showAddressBook)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {showAddressBook && contacts.length > 0 && (
          <div className="mt-2 bg-gray-700 border border-gray-600 rounded-xl max-h-48 overflow-y-auto">
            {contacts.slice(0, 5).map(contact => (
              <button
                key={contact.id}
                onClick={() => selectContact(contact)}
                className="w-full px-4 py-2 text-left hover:bg-gray-600 first:rounded-t-xl last:rounded-b-xl transition-colors"
              >
                <p className="font-medium">{contact.label}</p>
                <p className="text-xs text-gray-400 font-mono">{contact.address}</p>
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.0"
            step="any"
            className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 pr-20 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleMaxClick}
            className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
          >
            MAX
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Balance: {solBalance.toFixed(6)} SOL</p>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Memo (Optional)</label>
        <input
          type="text"
          value={memo}
          onChange={e => setMemo(e.target.value)}
          placeholder="Add a note"
          className="w-full bg-gray-700 border border-gray-600 rounded-xl px-4 py-3 focus:outline-none focus:border-purple-500"
        />
      </div>

      {feeEstimate && (
        <div className="bg-gray-700/50 rounded-xl p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Network Fee</span>
            <span>{feeEstimate.totalFee.toFixed(6)} SOL</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">Estimated Units</span>
            <span>{feeEstimate.estimatedUnits.toLocaleString()}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <span className="text-red-400 text-sm">{error}</span>
        </div>
      )}

      <button
        onClick={() => {
          if (recipient && amount && parseFloat(amount) > 0) {
            setShowConfirmation(true);
          }
        }}
        disabled={!recipient || !amount || parseFloat(amount) <= 0 || loading}
        className="w-full py-3 bg-purple-600 hover:bg-purple-700 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        Review Transaction
      </button>
    </div>
  );
}
