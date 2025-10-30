import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Calendar, Tag, Filter, Rss, ChevronDown, ChevronRight } from 'lucide-react';
import { useChangelogStore } from '../../store/changelogStore';

export function ChangelogViewer() {
  const {
    isViewerOpen,
    filter,
    closeViewer,
    setFilter,
    clearFilters,
    getFilteredReleases,
    getAllTags,
  } = useChangelogStore(state => ({
    isViewerOpen: state.isViewerOpen,
    filter: state.filter,
    closeViewer: state.closeViewer,
    setFilter: state.setFilter,
    clearFilters: state.clearFilters,
    getFilteredReleases: state.getFilteredReleases,
    getAllTags: state.getAllTags,
  }));

  const [expandedReleases, setExpandedReleases] = useState<Set<string>>(new Set());
  const [showTagFilter, setShowTagFilter] = useState(false);

  const filteredReleases = getFilteredReleases();
  const allTags = getAllTags();

  const toggleRelease = (version: string) => {
    setExpandedReleases(prev => {
      const next = new Set(prev);
      if (next.has(version)) {
        next.delete(version);
      } else {
        next.add(version);
      }
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setFilter({
      selectedTags: filter.selectedTags.includes(tag)
        ? filter.selectedTags.filter(t => t !== tag)
        : [...filter.selectedTags, tag],
    });
  };

  if (!isViewerOpen) return null;

  const hasActiveFilters =
    filter.searchQuery || filter.selectedTags.length > 0 || filter.categoryFilter.length > 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={closeViewer}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Calendar className="w-6 h-6" />
                  Changelog
                </h2>
                <p className="text-sm text-white/60 mt-1">
                  Track all updates, improvements, and fixes
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    /* RSS feed logic */
                  }}
                  className="p-2 hover:bg-white/5 rounded-lg transition"
                  title="Subscribe to RSS feed"
                  aria-label="Subscribe to RSS feed"
                >
                  <Rss className="w-5 h-5" />
                </button>
                <button
                  onClick={closeViewer}
                  className="p-2 hover:bg-white/5 rounded-lg transition"
                  aria-label="Close changelog"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="search"
                  placeholder="Search changes..."
                  value={filter.searchQuery}
                  onChange={e => setFilter({ searchQuery: e.target.value })}
                  className="w-full bg-slate-800/60 border border-purple-500/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/40 transition"
                  aria-label="Search changelog"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setShowTagFilter(!showTagFilter)}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/60 border border-purple-500/20 rounded-lg text-sm hover:border-purple-500/40 transition"
                >
                  <Tag className="w-4 h-4" />
                  Tags {filter.selectedTags.length > 0 && `(${filter.selectedTags.length})`}
                  <ChevronDown
                    className={`w-3 h-3 transition-transform ${showTagFilter ? 'rotate-180' : ''}`}
                  />
                </button>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600/20 border border-purple-500/40 rounded-lg text-sm hover:bg-purple-600/30 transition"
                  >
                    <Filter className="w-4 h-4" />
                    Clear Filters
                  </button>
                )}
              </div>

              {showTagFilter && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex flex-wrap gap-2"
                >
                  {allTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition border ${
                        filter.selectedTags.includes(tag)
                          ? 'bg-purple-600 border-purple-500 text-white'
                          : 'bg-slate-800/40 border-purple-500/20 text-white/70 hover:border-purple-500/40'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </motion.div>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {filteredReleases.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-white/60">No releases match your search criteria.</p>
              </div>
            ) : (
              filteredReleases.map(release => (
                <div
                  key={release.version}
                  className="bg-slate-800/30 border border-purple-500/10 rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => toggleRelease(release.version)}
                    className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition text-left"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center font-bold">
                        v{release.version.split('.')[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">Version {release.version}</h3>
                        <p className="text-sm text-white/60">
                          Released {new Date(release.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        expandedReleases.has(release.version) ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedReleases.has(release.version) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {release.categories.map((category, idx) => (
                            <div key={idx} className="space-y-2">
                              <h4 className="text-sm font-semibold text-purple-400">
                                {category.name}
                              </h4>
                              <div className="space-y-2">
                                {category.changes.map((change, changeIdx) => (
                                  <div
                                    key={changeIdx}
                                    className="p-3 bg-slate-800/50 rounded-lg border border-purple-500/5"
                                  >
                                    <p className="font-medium text-sm">{change.title}</p>
                                    <p className="text-xs text-white/60 mt-1">
                                      {change.description}
                                    </p>
                                    <div className="flex flex-wrap gap-1 mt-2">
                                      {change.tags.map(tag => (
                                        <span
                                          key={tag}
                                          className="px-2 py-0.5 bg-purple-500/20 border border-purple-500/30 rounded-full text-[10px] text-purple-300"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
