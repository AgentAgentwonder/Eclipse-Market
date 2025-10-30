import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api';
import {
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
} from 'lucide-react';

interface VouchRecord {
  id: number;
  voucherAddress: string;
  targetAddress: string;
  targetType: string;
  comment?: string;
  timestamp: string;
  isActive: boolean;
}

interface VouchingWorkflowProps {
  targetAddress: string;
  targetType: 'wallet' | 'token';
  currentUserAddress?: string;
  className?: string;
  onVouchAdded?: () => void;
  onVouchRemoved?: () => void;
}

export const VouchingWorkflow: React.FC<VouchingWorkflowProps> = ({
  targetAddress,
  targetType,
  currentUserAddress,
  className = '',
  onVouchAdded,
  onVouchRemoved,
}) => {
  const [vouches, setVouches] = useState<VouchRecord[]>([]);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [userHasVouched, setUserHasVouched] = useState(false);

  useEffect(() => {
    loadVouches();
  }, [targetAddress]);

  const loadVouches = async () => {
    try {
      const data = await invoke<VouchRecord[]>('get_vouches', { targetAddress });
      setVouches(data);
      
      if (currentUserAddress) {
        const hasVouched = data.some(
          (v) => v.voucherAddress === currentUserAddress && v.isActive
        );
        setUserHasVouched(hasVouched);
      }
    } catch (err) {
      console.error('Failed to load vouches:', err);
    }
  };

  const handleAddVouch = async () => {
    if (!currentUserAddress) {
      setError('Please connect your wallet first');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await invoke('add_vouch', {
        voucherAddress: currentUserAddress,
        targetAddress,
        targetType,
        comment: comment.trim() || null,
      });

      setSuccess('Vouch added successfully!');
      setComment('');
      setUserHasVouched(true);
      await loadVouches();
      onVouchAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add vouch');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveVouch = async () => {
    if (!currentUserAddress) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await invoke('remove_vouch', {
        voucherAddress: currentUserAddress,
        targetAddress,
        targetType,
      });

      setSuccess('Vouch removed successfully!');
      setUserHasVouched(false);
      await loadVouches();
      onVouchRemoved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove vouch');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const shortenAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-2">Community Vouches</h3>
        <p className="text-sm text-gray-400">
          {vouches.length} {vouches.length === 1 ? 'person has' : 'people have'} vouched for this{' '}
          {targetType}
        </p>
      </div>

      {currentUserAddress && (
        <div className="p-6 border-b border-gray-700">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p>{success}</p>
            </div>
          )}

          {!userHasVouched ? (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add Your Vouch
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Optional: Add a comment about why you're vouching..."
                className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                rows={3}
                maxLength={500}
              />
              <button
                onClick={handleAddVouch}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
                {loading ? 'Adding Vouch...' : 'Vouch for this ' + targetType}
              </button>
            </div>
          ) : (
            <div>
              <div className="mb-4 flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <p>You have vouched for this {targetType}</p>
              </div>
              <button
                onClick={handleRemoveVouch}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
                {loading ? 'Removing Vouch...' : 'Remove Your Vouch'}
              </button>
            </div>
          )}
        </div>
      )}

      {vouches.length > 0 && (
        <div className="p-6">
          <div className="space-y-3">
            {vouches.map((vouch) => (
              <div
                key={vouch.id}
                className="bg-gray-900/50 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white font-mono">
                        {shortenAddress(vouch.voucherAddress)}
                      </p>
                      <span className="text-xs text-gray-500">
                        {formatDate(vouch.timestamp)}
                      </span>
                    </div>
                    {vouch.comment && (
                      <div className="flex items-start gap-2 mt-2">
                        <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <p className="text-sm text-gray-300">{vouch.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {vouches.length === 0 && (
        <div className="p-6 text-center text-gray-400 text-sm">
          No vouches yet. Be the first to vouch!
        </div>
      )}
    </div>
  );
};
