import { DAOMembership } from '../../types/governance';
import { Users, Crown, ArrowRightCircle, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';

interface DAOMembershipListProps {
  memberships: DAOMembership[];
  onDelegate: () => void;
}

export function DAOMembershipList({ memberships, onDelegate }: DAOMembershipListProps) {
  if (memberships.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
        <p className="text-gray-400">No DAO memberships found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {memberships.map((membership, index) => (
        <motion.div
          key={membership.daoId}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold">{membership.daoName}</h3>
              </div>
              <p className="text-sm text-gray-400">Platform: {membership.platform}</p>
            </div>
            <button
              onClick={onDelegate}
              className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-lg text-sm hover:bg-purple-600/30 transition-colors"
            >
              Delegate
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <Crown className="w-4 h-4" />
                Voting Power
              </div>
              <p className="text-xl font-semibold">
                {membership.votingPower.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <ArrowRightCircle className="w-4 h-4" />
                Delegated To
              </div>
              <p className="text-sm">
                {membership.delegatedTo ?? 'Not delegated'}
              </p>
            </div>

            <div className="bg-gray-800 rounded-lg p-4 col-span-2">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <Calendar className="w-4 h-4" />
                Joined
              </div>
              <p className="text-sm text-gray-300">
                {new Date(membership.joinedAt * 1000).toLocaleDateString()}
              </p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
