import React from 'react';
import { Play, Pause, SkipBack, SkipForward, FastForward } from 'lucide-react';
import { useHistoricalReplayStore } from '../../store/historicalReplayStore';

const SPEED_OPTIONS = [0.25, 0.5, 1, 2, 4, 8];

export const PlaybackControls: React.FC = () => {
  const { playbackState, setPlaybackState } = useHistoricalReplayStore();

  const togglePlay = () => {
    setPlaybackState({ isPlaying: !playbackState.isPlaying });
  };

  const handleSpeedChange = () => {
    const currentIndex = SPEED_OPTIONS.indexOf(playbackState.speed);
    const nextIndex = (currentIndex + 1) % SPEED_OPTIONS.length;
    setPlaybackState({ speed: SPEED_OPTIONS[nextIndex] });
  };

  const skipBackward = () => {
    const { currentTime } = playbackState;
    setPlaybackState({ currentTime: Math.max(0, currentTime - 3600) });
  };

  const skipForward = () => {
    const { currentTime } = playbackState;
    setPlaybackState({ currentTime: currentTime + 3600 });
  };

  return (
    <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
      <button
        onClick={skipBackward}
        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        title="Skip Backward 1 Hour"
      >
        <SkipBack className="w-5 h-5 text-slate-300" />
      </button>

      <button
        onClick={togglePlay}
        className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
        title={playbackState.isPlaying ? 'Pause' : 'Play'}
      >
        {playbackState.isPlaying ? (
          <Pause className="w-6 h-6 text-white" />
        ) : (
          <Play className="w-6 h-6 text-white" />
        )}
      </button>

      <button
        onClick={skipForward}
        className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        title="Skip Forward 1 Hour"
      >
        <SkipForward className="w-5 h-5 text-slate-300" />
      </button>

      <div className="h-8 w-px bg-slate-700 mx-2" />

      <button
        onClick={handleSpeedChange}
        className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors"
        title="Change Playback Speed"
      >
        <FastForward className="w-5 h-5 text-slate-300" />
        <span className="text-sm text-slate-300 font-medium">
          {playbackState.speed}x
        </span>
      </button>

      <div className="flex-1" />

      <div className="text-sm text-slate-400">
        {new Date(playbackState.currentTime * 1000).toLocaleString()}
      </div>
    </div>
  );
};
