import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import {
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  History,
  PlayCircle,
  RotateCcw,
  Database,
} from 'lucide-react';

interface EventRecord {
  id: string;
  event_type: string;
  event_data: string;
  aggregate_id: string;
  sequence: number;
  timestamp: string;
}

interface EventStats {
  total_events: number;
  events_last_24h: number;
  event_type_counts: Record<string, number>;
}

interface EventFilter {
  aggregate_id?: string;
  event_type?: string;
  from_time?: string;
  to_time?: string;
  limit?: number;
  offset?: number;
}

const PAGE_SIZE = 50;

const EVENT_TYPES = [
  'order_placed',
  'order_filled',
  'order_cancelled',
  'position_opened',
  'position_closed',
  'balance_changed',
  'setting_changed',
  'wallet_connected',
  'wallet_disconnected',
  'trade_executed',
];

export function EventAuditLog() {
  const [events, setEvents] = useState<EventRecord[]>([]);
  const [stats, setStats] = useState<EventStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [aggregateIdFilter, setAggregateIdFilter] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [aggregateIdFilter, eventTypeFilter, startDate, endDate, currentPage]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: EventFilter = {
        limit: PAGE_SIZE,
        offset: (currentPage - 1) * PAGE_SIZE,
      };

      if (aggregateIdFilter) filter.aggregate_id = aggregateIdFilter;
      if (eventTypeFilter) filter.event_type = eventTypeFilter;
      if (startDate) filter.from_time = new Date(startDate).toISOString();
      if (endDate) filter.to_time = new Date(endDate).toISOString();

      const [eventsData, statsData] = await Promise.all([
        invoke<EventRecord[]>('get_events_command', filter),
        invoke<EventStats>('get_event_stats'),
      ]);

      setEvents(eventsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const filter: Partial<EventFilter> = {};
      if (aggregateIdFilter) filter.aggregate_id = aggregateIdFilter;
      if (eventTypeFilter) filter.event_type = eventTypeFilter;
      if (startDate) filter.from_time = new Date(startDate).toISOString();
      if (endDate) filter.to_time = new Date(endDate).toISOString();

      const content = await invoke<string>('export_audit_trail_command', {
        aggregateId: filter.aggregate_id || null,
        eventType: filter.event_type || null,
        fromTime: filter.from_time || null,
        toTime: filter.to_time || null,
        format,
      });

      const blob = new Blob([content], {
        type: format === 'json' ? 'application/json' : 'text/csv',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-trail-${new Date().toISOString()}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export audit trail:', err);
      setError(String(err));
    }
  };

  const handleReplay = async (aggregateId: string) => {
    try {
      setLoading(true);
      await invoke('replay_events_command', { aggregateId });
      alert(`Successfully replayed events for ${aggregateId}`);
    } catch (err) {
      console.error('Failed to replay events:', err);
      alert(`Failed to replay events: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSnapshot = async (aggregateId: string) => {
    try {
      const stateData = JSON.stringify({
        note: 'Manual snapshot',
        timestamp: new Date().toISOString(),
      });
      const snapshotId = await invoke<string>('create_snapshot_command', {
        aggregateId,
        stateData,
      });
      alert(`Snapshot created successfully: ${snapshotId}`);
    } catch (err) {
      console.error('Failed to create snapshot:', err);
      alert(`Failed to create snapshot: ${err}`);
    }
  };

  const resetFilters = () => {
    setAggregateIdFilter('');
    setEventTypeFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const getEventDescription = (event: EventRecord): string => {
    try {
      const data = JSON.parse(event.event_data);
      switch (event.event_type) {
        case 'order_placed':
          return `Order ${data.order_id}: ${data.side} ${data.quantity} ${data.symbol}`;
        case 'order_filled':
          return `Order ${data.order_id} filled at ${data.fill_price}`;
        case 'order_cancelled':
          return `Order ${data.order_id} cancelled: ${data.reason}`;
        case 'balance_changed':
          return `${data.wallet}: ${data.token} ${data.old_balance} → ${data.new_balance}`;
        case 'wallet_connected':
          return `Connected: ${data.wallet_address} (${data.wallet_type})`;
        case 'trade_executed':
          return `Trade ${data.trade_id}: ${data.from_amount} ${data.from_token} → ${data.to_amount} ${data.to_token}`;
        default:
          return event.event_type;
      }
    } catch {
      return event.event_type;
    }
  };

  const totalPages = stats ? Math.ceil(stats.total_events / PAGE_SIZE) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Sourcing Audit Trail</h2>
          <p className="text-white/60 text-sm mt-1">Immutable event log for all state changes</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 rounded-xl font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            Export JSON
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Total Events</p>
            <p className="text-2xl font-bold">{stats.total_events.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Last 24 Hours</p>
            <p className="text-2xl font-bold">{stats.events_last_24h.toLocaleString()}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Event Types</p>
            <p className="text-2xl font-bold">{Object.keys(stats.event_type_counts).length}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Average/Day</p>
            <p className="text-2xl font-bold">
              {Math.round(stats.total_events / Math.max(1, Math.ceil(stats.events_last_24h / 24)))}
            </p>
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Aggregate ID</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={aggregateIdFilter}
                onChange={e => setAggregateIdFilter(e.target.value)}
                placeholder="e.g., order_123, wallet_abc"
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Event Type</label>
            <select
              value={eventTypeFilter}
              onChange={e => setEventTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              <option value="">All Event Types</option>
              {EVENT_TYPES.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded-xl font-medium transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Loading events...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Sequence
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Event Type
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Aggregate ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Description
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map(event => (
                  <>
                    <tr
                      key={event.id}
                      className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors cursor-pointer"
                      onClick={() => setExpandedRow(expandedRow === event.id ? null : event.id)}
                    >
                      <td className="px-4 py-3 text-sm font-mono">#{event.sequence}</td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(event.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300">
                          {event.event_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-white/60">
                        {event.aggregate_id}
                      </td>
                      <td className="px-4 py-3 text-sm text-white/80">
                        {getEventDescription(event)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleReplay(event.aggregate_id);
                            }}
                            className="p-1 hover:bg-blue-500/20 rounded transition-colors"
                            title="Replay events"
                          >
                            <PlayCircle className="w-4 h-4 text-blue-400" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleCreateSnapshot(event.aggregate_id);
                            }}
                            className="p-1 hover:bg-green-500/20 rounded transition-colors"
                            title="Create snapshot"
                          >
                            <Database className="w-4 h-4 text-green-400" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedRow === event.id && (
                      <tr className="border-b border-purple-500/10 bg-slate-900/50">
                        <td colSpan={6} className="px-4 py-3">
                          <div className="p-4 bg-slate-800/50 rounded-xl">
                            <p className="text-xs font-semibold text-white/60 mb-2">
                              Event Data (JSON):
                            </p>
                            <pre className="text-xs text-white/80 overflow-x-auto">
                              {JSON.stringify(JSON.parse(event.event_data), null, 2)}
                            </pre>
                            <div className="mt-3 pt-3 border-t border-purple-500/10 text-xs text-white/60">
                              <p>
                                <span className="font-semibold">Event ID:</span> {event.id}
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              Showing {Math.min((currentPage - 1) * PAGE_SIZE + 1, stats?.total_events || 0)} to{' '}
              {Math.min(currentPage * PAGE_SIZE, stats?.total_events || 0)} of{' '}
              {stats?.total_events || 0} events
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-900/50 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 bg-slate-900/50 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
