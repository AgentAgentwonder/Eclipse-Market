import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useChangelogStore } from '../../store/changelogStore';

interface WhatsNewModalProps {
  currentVersion: string;
}

export function WhatsNewModal({ currentVersion }: WhatsNewModalProps) {
  const {
    isWhatsNewOpen,
    openViewer,
    closeWhatsNew,
    getUnseenReleases,
  } = useChangelogStore(state => ({
    isWhatsNewOpen: state.isWhatsNewOpen,
    openViewer: state.openViewer,
    closeWhatsNew: state.closeWhatsNew,
    getUnseenReleases: state.getUnseenReleases,
  }));

  const unseenReleases = getUnseenReleases(currentVersion);
  const primaryRelease = unseenReleases[0];

  if (!isWhatsNewOpen || !primaryRelease) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={closeWhatsNew}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-cyan-500/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm text-white/60 uppercase tracking-wide">What's New</p>
                <h3 className="text-2xl font-bold">Version {primaryRelease.version}</h3>
                <p className="text-sm text-white/60">
                  Released {new Date(primaryRelease.date).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            {primaryRelease.categories.map((category, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className="text-sm font-semibold text-purple-400">{category.name}</h4>
                <ul className="space-y-2">
                  {category.changes.slice(0, 3).map((change, changeIdx) => (
                    <li key={changeIdx} className="p-3 bg-slate-800/40 rounded-xl border border-purple-500/10">
                      <p className="font-medium text-sm text-white/90">{change.title}</p>
                      <p className="text-xs text-white/60 mt-1">{change.description}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {unseenReleases.length > 1 && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm font-semibold text-purple-300">Other recent updates</p>
                <ul className="mt-2 space-y-1 text-xs text-white/60">
                  {unseenReleases.slice(1).map(release => (
                    <li key={release.version}>
                      Version {release.version} · {new Date(release.date).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-purple-500/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              onClick={closeWhatsNew}
              className="px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-sm font-medium transition"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                closeWhatsNew();
                openViewer();
              }}
              className="inline-flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-sm font-semibold transition"
            >
              View full changelog
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
