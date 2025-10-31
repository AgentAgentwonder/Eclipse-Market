import React from 'react';
import { X } from 'lucide-react';
import { P2POffer } from '../../types/p2p';

interface EscrowFlowProps {
  offer: P2POffer;
  userAddress: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function EscrowFlow({ offer, userAddress, onClose, onSuccess }: EscrowFlowProps) {
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 max-w-2xl w-full">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Escrow Flow</h2>
          <button onClick={onClose} className="text-purple-300 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-purple-300">Escrow flow implementation for offer {offer.id}</p>
        <button onClick={onSuccess} className="mt-4 px-4 py-2 bg-purple-500 text-white rounded-lg">
          Complete
        </button>
      </div>
    </div>
  );
}
