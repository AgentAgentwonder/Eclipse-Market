import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import { X, TrendingUp, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import { GovernanceProposal, ProposalImpactAnalysis } from '../../types/governance';

interface ProposalImpactModalProps {
  proposal: GovernanceProposal;
  onClose: () => void;
  onVote: () => void;
}

export function ProposalImpactModal({ proposal, onClose, onVote }: ProposalImpactModalProps) {
  const [analysis, setAnalysis] = useState<ProposalImpactAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalysis();
  }, [proposal]);

  const loadAnalysis = async () => {
    try {
      const result = await invoke<ProposalImpactAnalysis>('analyze_governance_proposal', {
        proposalId: proposal.proposalId,
      });
      setAnalysis(result);
    } catch (error) {
      console.error('Failed to load impact analysis:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl max-w-4xl w-full border border-gray-800 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Proposal Impact Analysis</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
              </div>
            ) : analysis ? (
              <>
                <div className="bg-gray-800 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">{proposal.title}</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-1">
                        {(analysis.confidence * 100).toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-400">Confidence</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-1">
                        {analysis.similarProposals.length}
                      </div>
                      <div className="text-sm text-gray-400">Similar Proposals</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-3xl font-bold mb-1 ${
                        analysis.predictedOutcome === 'succeeded'
                          ? 'text-green-400'
                          : 'text-red-400'
                      }`}>
                        {analysis.predictedOutcome}
                      </div>
                      <div className="text-sm text-gray-400">Prediction</div>
                    </div>
                  </div>
                </div>

                {analysis.recommendedVote && (
                  <div className="bg-purple-900/30 border border-purple-800 rounded-lg p-4 flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-purple-300">Recommended Vote</p>
                      <p className="text-sm text-gray-400">
                        Based on historical data, we recommend voting{' '}
                        <span className="font-semibold text-purple-300 uppercase">
                          {analysis.recommendedVote}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                {analysis.riskFactors.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-400" />
                      Risk Factors
                    </h4>
                    <div className="space-y-2">
                      {analysis.riskFactors.map((risk, index) => (
                        <div
                          key={index}
                          className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-3 text-sm text-yellow-200"
                        >
                          {risk}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.similarProposals.length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-400" />
                      Similar Past Proposals
                    </h4>
                    <div className="space-y-3">
                      {analysis.similarProposals.map((similar) => (
                        <div
                          key={similar.proposalId}
                          className="bg-gray-800 rounded-lg p-4"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h5 className="font-medium">{similar.title}</h5>
                            <span className={`text-sm px-2 py-1 rounded ${
                              similar.outcome === 'succeeded'
                                ? 'bg-green-600/20 text-green-300'
                                : 'bg-red-600/20 text-red-300'
                            }`}>
                              {similar.outcome}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span>Similarity: {(similar.similarityScore * 100).toFixed(0)}%</span>
                            <span>Yes votes: {similar.finalYesPercent.toFixed(1)}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {Object.keys(analysis.potentialImpacts).length > 0 && (
                  <div>
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Potential Impacts
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(analysis.potentialImpacts).map(([key, value]) => (
                        <div
                          key={key}
                          className="bg-gray-800 rounded-lg p-3"
                        >
                          <div className="font-medium text-sm text-gray-300 capitalize mb-1">
                            {key}
                          </div>
                          <div className="text-sm text-gray-400">{value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                Failed to load analysis
              </div>
            )}
          </div>

          <div className="p-6 border-t border-gray-800 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Close
            </button>
            {proposal.status === 'active' && (
              <button
                onClick={onVote}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
              >
                Vote on Proposal
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
