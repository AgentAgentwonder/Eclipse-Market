import { Wallet, Activity, Lock } from 'lucide-react';

interface FollowedWalletFeedProps {
  isEnabled?: boolean;
}

export function FollowedWalletFeed({ isEnabled = false }: FollowedWalletFeedProps) {
  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-700/60">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-cyan-400" />
            Whale Wallet Signals
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time activity from tracked high-value wallets correlated with social momentum.
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-dashed border-slate-700/60 px-8 py-16 text-center">
        {isEnabled ? (
          <div className="flex flex-col items-center gap-4">
            <Activity className="w-12 h-12 text-slate-500" />
            <div className="text-sm text-slate-400">
              <div className="font-semibold mb-2">No wallet signals yet</div>
              <div className="text-xs text-slate-500 max-w-md">
                Configure tracked whale wallets in Settings → Advanced → Whale Tracking. Activity from these
                wallets will be surfaced here alongside social intelligence metrics.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <Lock className="w-12 h-12 text-amber-500/60" />
            <div className="text-sm text-slate-400">
              <div className="font-semibold mb-2">Whale Tracking Not Configured</div>
              <div className="text-xs text-slate-500 max-w-md mb-4">
                This feature requires whale wallet tracking to be enabled. Once configured, you'll see
                real-time signals from followed high-impact wallets.
              </div>
              <button className="mt-2 px-4 py-2 rounded-xl border border-amber-500/40 text-amber-300 text-xs font-medium hover:bg-amber-500/10 transition">
                Enable Whale Tracking
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-4 py-3">
          <div className="text-slate-400 mb-1">Tracked Wallets</div>
          <div className="text-2xl font-semibold text-white/90">0</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-4 py-3">
          <div className="text-slate-400 mb-1">Today's Signals</div>
          <div className="text-2xl font-semibold text-white/90">0</div>
        </div>
        <div className="rounded-xl bg-slate-900/60 border border-slate-800/60 px-4 py-3">
          <div className="text-slate-400 mb-1">Correlation Score</div>
          <div className="text-2xl font-semibold text-slate-400">N/A</div>
        </div>
      </div>
    </div>
  );
}
