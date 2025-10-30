import React, { useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { X, AlertTriangle, Flag, FileText, Link as LinkIcon } from 'lucide-react';

interface ReportModalProps {
  targetAddress: string;
  targetType: 'wallet' | 'token';
  reporterAddress?: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  targetAddress,
  targetType,
  reporterAddress,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reportType, setReportType] = useState<string>('scam');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reportTypes = [
    { value: 'scam', label: 'Scam', icon: AlertTriangle, color: 'text-red-400' },
    { value: 'rugpull', label: 'Rug Pull', icon: Flag, color: 'text-orange-400' },
    { value: 'suspicious', label: 'Suspicious Activity', icon: AlertTriangle, color: 'text-yellow-400' },
    { value: 'other', label: 'Other', icon: FileText, color: 'text-gray-400' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reporterAddress) {
      setError('Please connect your wallet first');
      return;
    }

    if (description.trim().length < 10) {
      setError('Please provide a detailed description (at least 10 characters)');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await invoke('submit_reputation_report', {
        report: {
          reporterAddress,
          targetAddress,
          targetType,
          reportType,
          description: description.trim(),
          evidence: evidence.trim() || null,
          timestamp: new Date().toISOString(),
        },
      });

      onSuccess?.();
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setReportType('scam');
    setDescription('');
    setEvidence('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-white">Report {targetType}</h2>
            <p className="text-sm text-gray-400 mt-1 font-mono">{targetAddress}</p>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <p>{error}</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Report Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              {reportTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = reportType === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setReportType(type.value)}
                    className={`
                      flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-blue-500 bg-blue-500/10'
                        : 'border-gray-600 bg-gray-900 hover:border-gray-500'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : type.color}`} />
                    <span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                      {type.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of the issue..."
              className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={5}
              maxLength={1000}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/1000 characters
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Evidence (Optional)
            </label>
            <div className="flex items-start gap-2">
              <LinkIcon className="w-4 h-4 text-gray-400 mt-2.5" />
              <textarea
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Add links to evidence (transaction hashes, social media posts, etc.)"
                className="flex-1 px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-200">
                <p className="font-medium mb-1">Important Notice</p>
                <p>
                  False reports may affect your own reputation. Please only report legitimate
                  concerns with accurate information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !reporterAddress}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
