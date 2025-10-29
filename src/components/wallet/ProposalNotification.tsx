import React, { useEffect } from 'react';
import { Bell, FileText } from 'lucide-react';
import { useTransition, animated } from '@react-spring/web';

export interface ProposalNotificationItem {
  id: string;
  walletName: string;
  proposalDescription?: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
}

interface ProposalNotificationProps {
  notifications: ProposalNotificationItem[];
  onDismiss: (id: string) => void;
  onOpenProposal?: (id: string) => void;
}

const ProposalNotification: React.FC<ProposalNotificationProps> = ({
  notifications,
  onDismiss,
  onOpenProposal,
}) => {
  const transitions = useTransition(notifications, {
    keys: item => item.id,
    from: { opacity: 0, transform: 'translateY(20px)' },
    enter: { opacity: 1, transform: 'translateY(0)' },
    leave: { opacity: 0, transform: 'translateY(20px)' },
    config: { tension: 210, friction: 20 },
  });

  useEffect(() => {
    const timers = notifications.map(notification =>
      setTimeout(() => onDismiss(notification.id), 8000)
    );
    return () => {
      timers.forEach(clearTimeout);
    };
  }, [notifications, onDismiss]);

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm space-y-3 z-50">
      {transitions((style, item) => (
        <animated.div style={style}>
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="flex items-center gap-3 px-4 py-3 bg-blue-900/30">
              <Bell size={18} className="text-blue-400" />
              <span className="text-sm font-medium text-blue-200">New Multisig Proposal</span>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <FileText size={16} className="text-gray-400" />
                <span className="font-semibold text-white">{item.walletName}</span>
              </div>
              <p className="text-gray-400 text-sm">
                {item.proposalDescription || 'New transaction proposal awaiting signatures'}
              </p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(item.createdAt).toLocaleTimeString()}</span>
                <span className="capitalize">{item.status}</span>
              </div>
              {onOpenProposal && (
                <button
                  onClick={() => onOpenProposal(item.id)}
                  className="w-full px-3 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                >
                  View Proposal
                </button>
              )}
            </div>
            <button
              onClick={() => onDismiss(item.id)}
              className="w-full text-xs text-gray-500 hover:text-white py-2 border-t border-gray-700"
            >
              Dismiss
            </button>
          </div>
        </animated.div>
      ))}
    </div>
  );
};

export default ProposalNotification;
