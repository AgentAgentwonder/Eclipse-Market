import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Plus, BarChart3, Brain, TrendingUp, Search, Filter } from 'lucide-react';
import { JournalEntry, JournalFilters, WeeklyReport, JournalStats } from '../types/journal';
import { JournalEntryCard } from '../components/journal/JournalEntryCard';
import { JournalEntryForm } from '../components/journal/JournalEntryForm';
import { WeeklyReportView } from '../components/journal/WeeklyReportView';
import { BehavioralAnalyticsDashboard } from '../components/journal/BehavioralAnalyticsDashboard';
import { JournalStats as JournalStatsComponent } from '../components/journal/JournalStats';
import { FilterPanel } from '../components/journal/FilterPanel';

type Tab = 'entries' | 'weekly' | 'analytics' | 'stats';

function Journal() {
  const [activeTab, setActiveTab] = useState<Tab>('entries');
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [totalEntries, setTotalEntries] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState<JournalFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  const [showNewEntryForm, setShowNewEntryForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [stats, setStats] = useState<JournalStats | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const pageSize = 10;

  useEffect(() => {
    loadEntries();
    loadStats();
  }, [page, filters]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const count = await invoke<number>('get_journal_entries_count', { filters });
      setTotalEntries(count);
      
      const result = await invoke<JournalEntry[]>('get_journal_entries', {
        filters,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      });
      setEntries(result);
    } catch (error) {
      console.error('Failed to load journal entries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await invoke<JournalStats>('get_journal_stats');
      setStats(result);
    } catch (error) {
      console.error('Failed to load journal stats:', error);
    }
  };

  const loadWeeklyReports = async () => {
    try {
      const reports = await invoke<WeeklyReport[]>('get_weekly_reports', { limit: 12 });
      setWeeklyReports(reports);
    } catch (error) {
      console.error('Failed to load weekly reports:', error);
    }
  };

  const handleCreateEntry = async (entry: Partial<JournalEntry>) => {
    try {
      await invoke('create_journal_entry', { entry });
      setShowNewEntryForm(false);
      loadEntries();
      loadStats();
    } catch (error) {
      console.error('Failed to create journal entry:', error);
    }
  };

  const handleUpdateEntry = async (entry: JournalEntry) => {
    try {
      await invoke('update_journal_entry', { entry });
      setEditingEntry(null);
      loadEntries();
    } catch (error) {
      console.error('Failed to update journal entry:', error);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    
    try {
      await invoke('delete_journal_entry', { id });
      loadEntries();
      loadStats();
    } catch (error) {
      console.error('Failed to delete journal entry:', error);
    }
  };

  const handleGenerateWeeklyReport = async () => {
    try {
      await invoke('generate_weekly_report', { weekStart: null });
      loadWeeklyReports();
    } catch (error) {
      console.error('Failed to generate weekly report:', error);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setFilters({ ...filters, search_query: query || undefined });
    setPage(1);
  };

  const handleApplyFilters = (newFilters: JournalFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  useEffect(() => {
    if (activeTab === 'weekly') {
      loadWeeklyReports();
    }
  }, [activeTab]);

  const totalPages = Math.ceil(totalEntries / pageSize);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Trading Journal</h1>
        <button
          onClick={() => setShowNewEntryForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Entry
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Total Entries</div>
            <div className="text-2xl font-bold text-white">{stats.total_entries}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">This Week</div>
            <div className="text-2xl font-bold text-white">{stats.entries_this_week}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Trades Logged</div>
            <div className="text-2xl font-bold text-white">{stats.total_trades_logged}</div>
          </div>
          <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded-xl p-4">
            <div className="text-gray-400 text-sm mb-1">Discipline Score</div>
            <div className="text-2xl font-bold text-white">
              {(stats.overall_discipline_score * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveTab('entries')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'entries'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Entries
        </button>
        <button
          onClick={() => setActiveTab('weekly')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'weekly'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Weekly Reports
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'analytics'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Brain className="w-4 h-4" />
          Behavioral Analytics
        </button>
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 font-medium transition-colors flex items-center gap-2 ${
            activeTab === 'stats'
              ? 'text-blue-400 border-b-2 border-blue-400'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Statistics
        </button>
      </div>

      {activeTab === 'entries' && (
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="Search entries..."
                className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                showFilters
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800/50 border border-gray-700/50 text-gray-300 hover:bg-gray-700/50'
              }`}
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>

          {showFilters && (
            <FilterPanel
              filters={filters}
              onApply={handleApplyFilters}
              onClose={() => setShowFilters(false)}
            />
          )}

          {loading ? (
            <div className="text-center py-8 text-gray-400">Loading entries...</div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No entries yet. Start journaling your trades!
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {entries.map((entry) => (
                  <JournalEntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => setEditingEntry(entry)}
                    onDelete={() => handleDeleteEntry(entry.id)}
                  />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700/50 transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === 'weekly' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-white">Weekly Reports</h2>
            <button
              onClick={handleGenerateWeeklyReport}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Generate Current Week Report
            </button>
          </div>
          {weeklyReports.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              No reports yet. Generate your first weekly report!
            </div>
          ) : (
            <div className="space-y-4">
              {weeklyReports.map((report) => (
                <WeeklyReportView key={report.id} report={report} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'analytics' && (
        <BehavioralAnalyticsDashboard filters={filters} />
      )}

      {activeTab === 'stats' && stats && (
        <JournalStatsComponent stats={stats} />
      )}

      {(showNewEntryForm || editingEntry) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <JournalEntryForm
              entry={editingEntry || undefined}
              onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
              onCancel={() => {
                setShowNewEntryForm(false);
                setEditingEntry(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Journal;
