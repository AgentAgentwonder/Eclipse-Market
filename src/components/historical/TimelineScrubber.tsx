import React, { useMemo } from 'react';
import { useHistoricalReplayStore } from '../../store/historicalReplayStore';

interface TimelineScrubberProps {
  onScrub?: (timestamp: number) => void;
}

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({ onScrub }) => {
  const { currentDataset, playbackState, setPlaybackState } = useHistoricalReplayStore();

  const { minTimestamp, maxTimestamp } = useMemo(() => {
    if (!currentDataset || currentDataset.data.length === 0) {
      return { minTimestamp: 0, maxTimestamp: 0 };
    }

    return {
      minTimestamp: currentDataset.data[0]?.timestamp ?? 0,
      maxTimestamp: currentDataset.data[currentDataset.data.length - 1]?.timestamp ?? 0,
    };
  }, [currentDataset]);

  const handleScrub = (event: React.ChangeEvent<HTMLInputElement>) => {
    const timestamp = Number(event.target.value);
    setPlaybackState({ currentTime: timestamp });
    onScrub?.(timestamp);
  };

  if (!currentDataset) {
    return (
      <div className="py-6 px-4 bg-slate-900/50 border border-dashed border-slate-700 rounded-lg text-center text-slate-500">
        Load a dataset to begin replay.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between text-xs text-slate-400">
        <span>{new Date(minTimestamp * 1000).toLocaleString()}</span>
        <span>{new Date(maxTimestamp * 1000).toLocaleString()}</span>
      </div>
      <input
        type="range"
        min={minTimestamp}
        max={maxTimestamp}
        value={Math.min(Math.max(playbackState.currentTime, minTimestamp), maxTimestamp)}
        onChange={handleScrub}
        className="w-full accent-blue-500"
      />
    </div>
  );
};
