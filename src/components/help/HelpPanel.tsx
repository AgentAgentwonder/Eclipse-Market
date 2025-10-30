import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ExternalLink, Video, BookOpen, ChevronRight } from 'lucide-react';
import { useHelpStore } from '../../store/helpStore';

export function HelpPanel() {
  const {
    content,
    isPanelOpen,
    activeSectionId,
    activeItemId,
    searchQuery,
    closePanel,
    setSearchQuery,
    getSectionById,
    getItemById,
    openPanel,
  } = useHelpStore();

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  // Auto-expand active section
  useEffect(() => {
    if (!activeSectionId) return;
    setExpandedSections(prev => {
      if (prev.has(activeSectionId)) return prev;
      const next = new Set(prev);
      next.add(activeSectionId);
      return next;
    });
  }, [activeSectionId]);

  const filteredSections = useMemo(() => {
    if (!searchQuery) return content.sections;

    const query = searchQuery.toLowerCase();
    return content.sections
      .map(section => ({
        ...section,
        items: section.items.filter(
          item =>
            item.label.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        ),
      }))
      .filter(section => section.items.length > 0);
  }, [content.sections, searchQuery]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  if (!isPanelOpen) return null;

  const activeItem = activeItemId ? getItemById(activeItemId) : null;
  const activeSection = activeSectionId ? getSectionById(activeSectionId) : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm"
        onClick={closePanel}
      />
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 z-[80] w-full max-w-2xl bg-slate-900 border-l border-purple-500/20 shadow-2xl overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Help & Documentation
              </h2>
              <p className="text-sm text-white/60 mt-1">
                {activeItem
                  ? activeItem.label
                  : activeSection
                    ? activeSection.title
                    : 'Find guides, tutorials, and documentation'}
              </p>
            </div>
            <button
              onClick={closePanel}
              className="p-2 hover:bg-white/5 rounded-lg transition"
              aria-label="Close help panel"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="search"
              placeholder="Search help topics..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-slate-800/60 border border-purple-500/20 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-purple-500/40 transition"
              aria-label="Search help topics"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeItem ? (
            // Detailed Item View
            <div className="space-y-4">
              <button
                onClick={() => openPanel(activeSection?.id ?? undefined)}
                className="inline-flex items-center gap-2 px-3 py-2 bg-slate-800/50 hover:bg-slate-800/70 rounded-lg text-sm font-medium transition"
                aria-label="Back to help topics"
              >
                ← Back
              </button>
              <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/10">
                <p className="text-white/80 leading-relaxed">{activeItem.description}</p>
              </div>

              <div className="space-y-3">
                <h3 className="text-lg font-semibold">Resources</h3>
                {activeItem.links.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-slate-800/50 hover:bg-slate-800 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition group"
                  >
                    <div className="flex items-center gap-3">
                      {link.type === 'video' ? (
                        <Video className="w-5 h-5 text-purple-400" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-400" />
                      )}
                      <div>
                        <p className="font-medium group-hover:text-purple-400 transition">
                          {link.label}
                        </p>
                        <p className="text-xs text-white/50 capitalize">{link.type}</p>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition" />
                  </a>
                ))}
              </div>
            </div>
          ) : (
            // Section List View
            <div className="space-y-4">
              {filteredSections.map(section => (
                <div key={section.id} className="space-y-2">
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between p-4 bg-slate-800/30 hover:bg-slate-800/50 rounded-xl border border-purple-500/10 transition text-left"
                  >
                    <div>
                      <h3 className="font-semibold text-lg">{section.title}</h3>
                      <p className="text-sm text-white/60 mt-1">{section.summary}</p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 transition-transform ${
                        expandedSections.has(section.id) ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.has(section.id) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden space-y-2 ml-4"
                      >
                        {section.items.map(item => (
                          <button
                            key={item.id}
                            onClick={() => openPanel(section.id, item.id)}
                            className="w-full flex items-center justify-between p-3 bg-slate-800/20 hover:bg-slate-800/40 rounded-lg border border-purple-500/5 hover:border-purple-500/20 transition text-left group"
                          >
                            <div>
                              <p className="font-medium text-sm group-hover:text-purple-400 transition">
                                {item.label}
                              </p>
                              <p className="text-xs text-white/50 mt-1">
                                {item.description.slice(0, 80)}
                                {item.description.length > 80 ? '...' : ''}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-white/40 group-hover:text-purple-400 transition" />
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
