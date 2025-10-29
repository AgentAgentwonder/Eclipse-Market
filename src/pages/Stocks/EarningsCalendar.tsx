import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Bell, BellOff, LineChart, RefreshCw } from 'lucide-react';
import type { EarningsEvent } from '../../types/stocks';

type ViewMode = 'upcoming' | 'recent';

export function EarningsCalendar() {
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('upcoming');
  const [daysAhead, setDaysAhead] = useState(30);
  const [pendingAlert, setPendingAlert] = useState<string | null>(null);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const result = await invoke<EarningsEvent[]>('get_earnings_calendar', { daysAhead });
      setEvents(result);
    } catch (error) {
      console.error('Failed to fetch earnings calendar:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [daysAhead]);

  const filteredEvents = useMemo(() => {
    const today = new Date();
    return events.filter(event => {
      const eventDate = new Date(event.date);
      if (viewMode === 'upcoming') {
        return eventDate >= today;
      }
      return eventDate < today;
    });
  }, [events, viewMode]);

  const toggleAlert = async (event: EarningsEvent) => {
    setPendingAlert(event.symbol);
    try {
      if (!event.hasAlert) {
        await invoke('create_stock_alert', {
          symbol: event.symbol,
          alertType: 'earningsUpcoming',
          threshold: null,
        });
        setEvents(prev =>
          prev.map(item =>
            item.symbol === event.symbol ? { ...item, hasAlert: true } : item
          )
        );
      } else {
        // Placeholder for alert removal when backend supports it
        setEvents(prev =>
          prev.map(item =>
            item.symbol === event.symbol ? { ...item, hasAlert: false } : item
          )
        );
      }
    } catch (error) {
      console.error('Failed to update alert:', error);
    } finally {
      setPendingAlert(null);
    }
  };

  const timeLabel = (time: EarningsEvent['time']) => {
    switch (time) {
      case 'beforemarket':
        return 'Before Market';
      case 'aftermarket':
        return 'After Market';
      case 'duringmarket':
        return 'During Market';
      default:
        return 'TBA';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">Earnings Calendar</h2>
          <p className="text-sm text-gray-400">
            Track upcoming earnings events, market reactions, and EPS performance
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-800/60 rounded-xl flex items-center">
            {(['upcoming', 'recent'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  viewMode === mode
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'text-gray-400'
                }`}
              >
                {mode === 'upcoming' ? 'Upcoming' : 'Recent'}
              </button>
            ))}
          </div>
          <select
            value={daysAhead}
            onChange={e => setDaysAhead(Number(e.target.value))}
            className="bg-slate-800/60 text-sm rounded-lg px-3 py-2 border border-purple-500/30 focus:outline-none"
          >
            <option value={7}>Next 7 days</option>
            <option value={30}>Next 30 days</option>
            <option value={90}>Next 90 days</option>
          </select>
          <button
            onClick={fetchCalendar}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-purple-500/30 text-purple-300 hover:bg-purple-500/10"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-purple-500/20 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Symbol
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Company
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Date & Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                EPS
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Historical Reaction
              </th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredEvents.map(event => (
              <tr key={`${event.symbol}-${event.date}`} className="hover:bg-slate-800/40">
                <td className="px-4 py-3 font-semibold">{event.symbol}</td>
                <td className="px-4 py-3 text-sm text-gray-300">{event.name}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col">
                    <span>{new Date(event.date).toLocaleDateString()}</span>
                    <span className="text-xs text-gray-400">{timeLabel(event.time)}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex flex-col text-xs text-gray-300 gap-1">
                    {event.estimateEps !== undefined && (
                      <span>Estimate: ${event.estimateEps.toFixed(2)}</span>
                    )}
                    {event.actualEps !== undefined && (
                      <span>Actual: ${event.actualEps.toFixed(2)}</span>
                    )}
                    {event.surprisePercent !== undefined && (
                      <span
                        className={`${event.surprisePercent >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        Surprise: {event.surprisePercent >= 0 ? '+' : ''}
                        {event.surprisePercent.toFixed(2)}%
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-xs text-gray-300">
                  {event.historicalReaction ? (
                    <div className="flex flex-col gap-1">
                      <span>Avg Move: {event.historicalReaction.avgMovePercent.toFixed(2)}%</span>
                      <span
                        className={`${
                          event.historicalReaction.lastReactionPercent >= 0 ? 'text-green-300' : 'text-red-300'
                        }`}
                      >
                        Last: {event.historicalReaction.lastReactionPercent.toFixed(2)}%
                      </span>
                      <span>Beat/Miss: {event.historicalReaction.beatMissRatio}</span>
                    </div>
                  ) : (
                    <span className="text-gray-500">No data</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => toggleAlert(event)}
                    disabled={pendingAlert === event.symbol}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      event.hasAlert
                        ? 'border-green-500/40 text-green-300 hover:bg-green-500/10'
                        : 'border-purple-500/40 text-purple-300 hover:bg-purple-500/10'
                    }`}
                  >
                    {event.hasAlert ? (
                      <BellOff className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                    {event.hasAlert ? 'Alert Enabled' : 'Enable Alert'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredEvents.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">
            <LineChart className="w-6 h-6 mx-auto mb-2" />
            <p>No earnings events found</p>
          </div>
        )}
      </div>
    </div>
  );
}
