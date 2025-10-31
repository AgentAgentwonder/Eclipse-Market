import { FC, useState } from 'react';
import { JournalFilters, EntryType, Emotion } from '../../types/journal';
import { X } from 'lucide-react';

interface Props {
  filters: JournalFilters;
  onApply: (filters: JournalFilters) => void;
  onClose: () => void;
}

const ENTRY_TYPES: { value: EntryType; label: string }[] = [
  { value: 'pre_trade', label: 'Pre-Trade' },
  { value: 'in_trade', label: 'In-Trade' },
  { value: 'post_trade', label: 'Post-Trade' },
  { value: 'reflection', label: 'Reflection' },
  { value: 'goal', label: 'Goals' },
  { value: 'mistake', label: 'Mistakes' },
];

const EMOTIONS: { value: Emotion; label: string }[] = [
  'confident',
  'anxious',
  'excited',
  'fearful',
  'greedy',
  'patient',
  'impatient',
  'calm',
  'stressed',
  'euphoric',
  'regretful',
  'neutral',
].map(value => ({ value, label: value.replace(/_/g, ' ') as Emotion }));

export const FilterPanel: FC<Props> = ({ filters, onApply, onClose }) => {
  const [selectedEntryTypes, setSelectedEntryTypes] = useState<EntryType[]>(filters.entry_types || []);
  const [selectedEmotions, setSelectedEmotions] = useState<Emotion[]>(filters.emotions || []);
  const [startDate, setStartDate] = useState<string>(filters.date_range ? formatDate(filters.date_range.start) : '');
  const [endDate, setEndDate] = useState<string>(filters.date_range ? formatDate(filters.date_range.end) : '');
  const [minConfidence, setMinConfidence] = useState<number | ''>(
    typeof filters.min_confidence === 'number' ? Math.round(filters.min_confidence * 100) : ''
  );
  const [maxConfidence, setMaxConfidence] = useState<number | ''>(
    typeof filters.max_confidence === 'number' ? Math.round(filters.max_confidence * 100) : ''
  );
  const [searchQuery, setSearchQuery] = useState(filters.search_query || '');

  const toggleEntryType = (type: EntryType) => {
    setSelectedEntryTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleEmotion = (emotion: Emotion) => {
    setSelectedEmotions(prev =>
      prev.includes(emotion) ? prev.filter(e => e !== emotion) : [...prev, emotion]
    );
  };

  const handleApply = () => {
    const newFilters: JournalFilters = {
      entry_types: selectedEntryTypes.length > 0 ? selectedEntryTypes : undefined,
      emotions: selectedEmotions.length > 0 ? selectedEmotions : undefined,
      min_confidence: minConfidence !== '' ? Number(minConfidence) / 100 : undefined,
      max_confidence: maxConfidence !== '' ? Number(maxConfidence) / 100 : undefined,
      search_query: searchQuery.trim() || undefined,
      date_range:
        startDate || endDate
          ? {
              start: startDate ? Math.floor(new Date(startDate).getTime() / 1000) : 0,
              end: endDate ? Math.floor(new Date(endDate).getTime() / 1000) : Math.floor(Date.now() / 1000),
            }
          : undefined,
      strategy_tags: filters.strategy_tags,
      outcome_success: filters.outcome_success,
    };

    onApply(newFilters);
    onClose();
  };

  const handleClear = () => {
    setSelectedEntryTypes([]);
    setSelectedEmotions([]);
    setStartDate('');
    setEndDate('');
    setMinConfidence('');
    setMaxConfidence('');
    setSearchQuery('');
    onApply({});
    onClose();
  };

  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Filters</h3>
        <button onClick={onClose} className="text-gray-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-gray-400">Start Date</span>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-gray-400">End Date</span>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
          />
        </label>
      </div>

      <div>
        <span className="text-sm text-gray-400 block mb-2">Entry Types</span>
        <div className="flex flex-wrap gap-2">
          {ENTRY_TYPES.map(type => {
            const active = selectedEntryTypes.includes(type.value);
            return (
              <button
                key={type.value}
                type="button"
                onClick={() => toggleEntryType(type.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  active
                    ? 'bg-blue-500/20 border-blue-500/40 text-blue-200'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <span className="text-sm text-gray-400 block mb-2">Primary Emotions</span>
        <div className="flex flex-wrap gap-2">
          {EMOTIONS.map(emotion => {
            const active = selectedEmotions.includes(emotion.value);
            return (
              <button
                key={emotion.value}
                type="button"
                onClick={() => toggleEmotion(emotion.value)}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors capitalize ${
                  active
                    ? 'bg-purple-500/20 border-purple-500/40 text-purple-200'
                    : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {emotion.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-2">
          <span className="text-sm text-gray-400">Min Confidence</span>
          <input
            type="number"
            min={0}
            max={100}
            value={minConfidence}
            onChange={e => setMinConfidence(e.target.value ? Number(e.target.value) : '')}
            placeholder="0-100"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm text-gray-400">Max Confidence</span>
          <input
            type="number"
            min={0}
            max={100}
            value={maxConfidence}
            onChange={e => setMaxConfidence(e.target.value ? Number(e.target.value) : '')}
            placeholder="0-100"
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
          />
        </label>
      </div>

      <label className="space-y-2 block">
        <span className="text-sm text-gray-400">Full Text Search</span>
        <input
          type="text"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search in notes and lessons learned"
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-gray-100"
        />
      </label>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 bg-gray-800 border border-gray-700 text-gray-300 rounded-lg hover:bg-gray-700"
        >
          Reset
        </button>
        <button
          type="button"
          onClick={handleApply}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          Apply Filters
        </button>
      </div>
    </div>
  );
};

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp * 1000);
  return date.toISOString().slice(0, 10);
};
