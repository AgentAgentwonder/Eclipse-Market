import { useMemo } from 'react';
import type { FlowAnalysis, TokenFlowEdge, TokenFlowNode, TimelineFrame } from '../../types/tokenFlow';

interface FlowNetworkGraphProps {
  analysis: FlowAnalysis;
  currentFrame: TimelineFrame | null;
}

interface PositionedNode extends TokenFlowNode {
  x: number;
  y: number;
}

interface StyledEdge extends TokenFlowEdge {
  isActive: boolean;
}

const SVG_WIDTH = 800;
const SVG_HEIGHT = 420;

export default function FlowNetworkGraph({ analysis, currentFrame }: FlowNetworkGraphProps) {
  const { positionedNodes, positionedMap, styledEdges } = useMemo(() => {
    const sourceNodes = analysis.graph.nodes.filter(node => node.kind === 'source');
    const intermediateNodes = analysis.graph.nodes.filter(node => node.kind === 'intermediate');
    const destinationNodes = analysis.graph.nodes.filter(node => node.kind === 'destination');

    const positionGroup = (nodes: TokenFlowNode[], x: number): PositionedNode[] => {
      if (!nodes.length) return [];
      const spacing = SVG_HEIGHT / (nodes.length + 1);
      return nodes.map((node, index) => ({
        ...node,
        x,
        y: spacing * (index + 1),
      }));
    };

    const positioned: Record<string, PositionedNode> = {};

    const positionedSources = positionGroup(sourceNodes, 100);
    const positionedIntermediates = positionGroup(intermediateNodes, SVG_WIDTH / 2);
    const positionedDestinations = positionGroup(destinationNodes, SVG_WIDTH - 120);

    [...positionedSources, ...positionedIntermediates, ...positionedDestinations].forEach(node => {
      positioned[node.id] = node;
    });

    const activeEdgeIds = new Set(currentFrame?.flows.map(flow => flow.id));

    const styledEdges: StyledEdge[] = analysis.graph.edges.map(edge => ({
      ...edge,
      isActive: activeEdgeIds.has(edge.id),
    }));

    return {
      positionedNodes: Object.values(positioned),
      positionedMap: positioned,
      styledEdges,
    };
  }, [analysis, currentFrame]);

  const groupedNodes = useMemo(() => {
    const groups: Record<'source' | 'intermediate' | 'destination', PositionedNode[]> = {
      source: [],
      intermediate: [],
      destination: [],
    };

    positionedNodes.forEach(node => {
      if (node.kind === 'source') groups.source.push(node);
      else if (node.kind === 'destination') groups.destination.push(node);
      else groups.intermediate.push(node);
    });

    return groups;
  }, [positionedNodes]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold">Network Graph</h3>
        {currentFrame && (
          <span className="text-xs text-gray-400">
            Highlighting {currentFrame.flows.length} active flows in frame
          </span>
        )}
      </div>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full h-[420px]">
          {/* Background grid lines */}
          <g opacity={0.2}>
            {[100, SVG_WIDTH / 2, SVG_WIDTH - 120].map((x, idx) => (
              <line
                key={x}
                x1={x}
                x2={x}
                y1={20}
                y2={SVG_HEIGHT - 20}
                stroke="url(#grid-gradient)"
                strokeWidth={idx === 1 ? 2 : 1}
                strokeDasharray="8 6"
              />
            ))}
          </g>

          {/* Edges */}
          <g>
            {styledEdges.map(edge => {
              const source = positionedMap[edge.source];
              const target = positionedMap[edge.target];

              if (!source || !target) return null;

              const midX = (source.x + target.x) / 2;
              const path = `M ${source.x} ${source.y} C ${midX} ${source.y}, ${midX} ${target.y}, ${target.x} ${target.y}`;

              return (
                <path
                  key={edge.id}
                  d={path}
                  stroke={edge.isActive ? 'url(#active-edge)' : 'url(#inactive-edge)'}
                  strokeWidth={Math.max(2, Math.log(edge.amount + 1))}
                  fill="none"
                  opacity={edge.isActive ? 0.9 : 0.35}
                />
              );
            })}
          </g>

          {/* Nodes */}
          <g>
            {positionedNodes.map(node => (
              <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
                <circle
                  r={14}
                  fill={getNodeFill(node.kind)}
                  stroke="rgba(255, 255, 255, 0.35)"
                  strokeWidth={1.5}
                />
                <text
                  x={node.kind === 'destination' ? -18 : 18}
                  y={4}
                  textAnchor={node.kind === 'destination' ? 'end' : 'start'}
                  className="text-xs fill-gray-200"
                >
                  {node.label ?? truncateAddress(node.address)}
                </text>
              </g>
            ))}
          </g>

          {/* Group labels */}
          <g className="text-xs fill-gray-400">
            <text x={100} y={24} textAnchor="middle">Sources ({groupedNodes.source.length})</text>
            <text x={SVG_WIDTH / 2} y={24} textAnchor="middle">Intermediaries ({groupedNodes.intermediate.length})</text>
            <text x={SVG_WIDTH - 120} y={24} textAnchor="middle">Destinations ({groupedNodes.destination.length})</text>
          </g>

          <defs>
            <linearGradient id="active-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#f472b6" />
            </linearGradient>
            <linearGradient id="inactive-edge" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(148, 163, 184, 0.4)" />
              <stop offset="100%" stopColor="rgba(148, 163, 184, 0.2)" />
            </linearGradient>
            <linearGradient id="grid-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(148, 163, 184, 0.15)" />
              <stop offset="100%" stopColor="rgba(148, 163, 184, 0.05)" />
            </linearGradient>
            <radialGradient id="node-source" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#34d399" />
              <stop offset="100%" stopColor="#059669" />
            </radialGradient>
            <radialGradient id="node-intermediate" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#7c3aed" />
            </radialGradient>
            <radialGradient id="node-destination" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </radialGradient>
          </defs>
        </svg>
      </div>
    </div>
  );
}

function getNodeFill(kind: TokenFlowNode['kind']) {
  switch (kind) {
    case 'source':
      return 'url(#node-source)';
    case 'destination':
      return 'url(#node-destination)';
    default:
      return 'url(#node-intermediate)';
  }
}

function truncateAddress(address: string) {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
