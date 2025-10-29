import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { Sankey, Tooltip, ResponsiveContainer } from 'recharts';
import { useTokenFlowContext } from '../../contexts/TokenFlowContext';
import FlowNetworkGraph from './FlowNetworkGraph';

const sankeyTooltipFormatter = (value: number) => value.toLocaleString();

export default function FlowVisualization() {
  const {
    analysis,
    loading,
    timelineIndex,
    setTimelineIndex,
    playing,
    setPlaying,
    currentFrame,
  } = useTokenFlowContext();

  const sankeyData = useMemo(() => {
    if (!analysis) return null;
    return {
      nodes: analysis.sankey.nodes.map(node => ({ name: node.name })),
      links: analysis.sankey.links.map(link => ({ ...link })),
    };
  }, [analysis]);

  const handlePlayPause = () => {
    setPlaying(!playing);
  };

  const handleRewind = () => {
    setPlaying(false);
    setTimelineIndex(0);
  };

  const handleForward = () => {
    if (!analysis?.timeline.length) return;
    setTimelineIndex(Math.min(timelineIndex + 1, analysis.timeline.length - 1));
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
        <div className="text-center text-gray-400">Analyzing token flows...</div>
      </div>
    );
  }

  if (!analysis || !sankeyData) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
        <p className="text-center text-gray-400">No flow data available.</p>
      </div>
    );
  }

  const totalVolume = analysis.graph.edges.reduce((sum, edge) => sum + edge.amount, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6 space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Sankey Flow Diagram</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRewind}
              className="p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-all"
              aria-label="Rewind"
            >
              <SkipBack className="w-4 h-4" />
            </button>
            <button
              onClick={handlePlayPause}
              className="p-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
              aria-label={playing ? 'Pause timeline' : 'Play timeline'}
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={handleForward}
              className="p-2 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg transition-all"
              aria-label="Forward"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="h-96 w-full">
          <ResponsiveContainer>
            <Sankey
              data={sankeyData}
              link={{ stroke: 'url(#sankey-link-gradient)' }}
              nodePadding={20}
              nodeWidth={24}
              node={{ fill: '#a855f7', stroke: '#7c3aed' }}
              iterations={32}
            >
              <Tooltip formatter={sankeyTooltipFormatter} cursor={{ fill: 'rgba(148, 163, 184, 0.08)' }} />
              <defs>
                <linearGradient id="sankey-link-gradient" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="100" y2="0">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#ec4899" />
                </linearGradient>
              </defs>
            </Sankey>
          </ResponsiveContainer>
        </div>

        {analysis.timeline.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>
                Frame {timelineIndex + 1} of {analysis.timeline.length}
              </span>
              <span>
                {new Date(currentFrame?.timestamp ? currentFrame.timestamp * 1000 : Date.now()).toLocaleString()}
              </span>
            </div>
            <input
              className="w-full"
              type="range"
              min={0}
              max={Math.max(analysis.timeline.length - 1, 0)}
              value={timelineIndex}
              onChange={event => setTimelineIndex(Number(event.target.value))}
            />
          </div>
        )}
      </motion.div>

      <FlowNetworkGraph analysis={analysis} currentFrame={currentFrame} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold mb-4">Flow Metrics</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Total Nodes</div>
            <div className="text-2xl font-bold">{analysis.graph.nodes.length}</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Total Flows</div>
            <div className="text-2xl font-bold">{analysis.graph.edges.length}</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Total Volume</div>
            <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
          </div>
          <div className="bg-slate-700/30 rounded-lg p-4">
            <div className="text-xs text-gray-400 mb-1">Clusters</div>
            <div className="text-2xl font-bold">{analysis.clusters.length}</div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
