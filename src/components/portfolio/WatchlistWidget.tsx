import { useEffect, useMemo } from 'react';
import { PlusCircle, Settings2, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWatchlistStore } from '../../store/watchlistStore';
import { useAlertStore } from '../../store/alertStore';

interface WatchlistWidgetProps {
  onOpenManager: () => void;
  onCreateWatchlist: () => void;
  onOpenAlerts: () => void;
}

const WatchlistWidget = ({
  onOpenManager,
  onCreateWatchlist,
  onOpenAlerts,
}: WatchlistWidgetProps) => {
  const { watchlists, fetchWatchlists } = useWatchlistStore();
  const { alerts } = useAlertStore();

  useEffect(() => {
    fetchWatchlists().catch(console.error);
  }, [fetchWatchlists]);

  const summary = useMemo(() => {
    const totalItems = watchlists.reduce((acc, list) => acc + list.items.length, 0);
    const alertsCount = alerts.length;

    return {
      totalWatchlists: watchlists.length,
      totalItems,
      alertsCount,
    };
  }, [watchlists, alerts]);

  const topWatchlist = watchlists[0];

  return (
    <motion.div
      className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6 h-full"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Watchlists</h3>
          <p className="text-sm text-slate-400">Custom trackers & price alerts</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1.5 rounded-full bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 text-sm transition"
            onClick={onOpenManager}
          >
            Manage
          </button>
          <button
            className="p-2 rounded-full bg-slate-800/80 hover:bg-slate-800 transition"
            onClick={onOpenAlerts}
            title="Alerts"
          >
            <Settings2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-800/60 border border-purple-500/10 rounded-2xl p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">Watchlists</p>
          <p className="text-2xl font-semibold">{summary.totalWatchlists}</p>
        </div>
        <div className="bg-slate-800/60 border border-purple-500/10 rounded-2xl p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">Tracked Assets</p>
          <p className="text-2xl font-semibold">{summary.totalItems}</p>
        </div>
        <div className="bg-slate-800/60 border border-emerald-500/10 rounded-2xl p-4">
          <p className="text-xs uppercase text-slate-400 mb-1">Active Alerts</p>
          <p className="text-2xl font-semibold">{summary.alertsCount}</p>
        </div>
      </div>

      {topWatchlist ? (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-sm">{topWatchlist.name}</h4>
            <button
              className="text-xs text-purple-300 hover:text-purple-200"
              onClick={onOpenManager}
            >
              View all
            </button>
          </div>

          <div className="space-y-2">
            {topWatchlist.items.slice(0, 5).map(item => (
              <div
                key={item.mint}
                className="flex items-center justify-between bg-slate-800/60 border border-purple-500/10 rounded-2xl px-4 py-2.5"
              >
                <div>
                  <p className="font-medium">{item.symbol}</p>
                  <p className="text-xs text-slate-400">{item.mint.slice(0, 10)}...</p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-emerald-400 text-sm">
                    <ArrowUpRight className="w-4 h-4" />
                    <span>+2.4%</span>
                  </div>
                  <p className="text-xs text-slate-400">24h change</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-purple-500/30 rounded-3xl">
          <p className="text-sm text-slate-400 mb-4">Start tracking your favorite tokens</p>
          <button
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500 hover:bg-purple-600 transition"
            onClick={onCreateWatchlist}
          >
            <PlusCircle className="w-4 h-4" />
            Create watchlist
          </button>
        </div>
      )}
    </motion.div>
  );
};

export default WatchlistWidget;
