import { HelpCircle, BookOpen, Compass } from 'lucide-react';
import { useHelpStore } from '../../store/helpStore';
import { useChangelogStore } from '../../store/changelogStore';

interface HelpButtonProps {
  sectionId?: string;
  itemId?: string;
}

export function HelpButton({ sectionId, itemId }: HelpButtonProps) {
  const { openPanel, enterWhatsThisMode, whatsThisMode } = useHelpStore();
  const { openViewer } = useChangelogStore();

  return (
    <div className="flex items-center gap-2" role="group" aria-label="Help controls">
      <button
        type="button"
        onClick={() => openPanel(sectionId, itemId)}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800/60 border border-purple-500/20 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:border-purple-400/30 transition"
        aria-label="Open help panel"
      >
        <HelpCircle className="w-4 h-4" aria-hidden="true" />
        Help
      </button>

      <button
        type="button"
        onClick={enterWhatsThisMode}
        className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition border ${
          whatsThisMode
            ? 'bg-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/30'
            : 'bg-slate-800/60 text-white/80 border-purple-500/20 hover:text-white hover:border-purple-400/30'
        }`}
        aria-pressed={whatsThisMode}
        aria-label="Activate What's This mode"
      >
        <Compass className="w-4 h-4" aria-hidden="true" />
        What's This?
      </button>

      <button
        type="button"
        onClick={openViewer}
        className="inline-flex items-center gap-2 rounded-xl bg-slate-800/60 border border-purple-500/20 px-3 py-2 text-sm font-medium text-white/80 hover:text-white hover:border-purple-400/30 transition"
        aria-label="View changelog"
      >
        <BookOpen className="w-4 h-4" aria-hidden="true" />
        What's New
      </button>
    </div>
  );
}
