import React, { useMemo } from 'react';
import { CandleData, VolumeProfileData } from '../../types/indicators';
import { calculateVolumeProfile } from '../../utils/volumeProfile';
import { motion } from 'framer-motion';

interface VolumeProfileProps {
  candles: CandleData[];
  width?: number;
  height?: number;
  showPOC?: boolean;
  showValueArea?: boolean;
  showVWAP?: boolean;
  numLevels?: number;
}

export const VolumeProfile: React.FC<VolumeProfileProps> = ({
  candles,
  width = 200,
  height = 600,
  showPOC = true,
  showValueArea = true,
  showVWAP = true,
  numLevels = 50,
}) => {
  const profile = useMemo(() => {
    return calculateVolumeProfile(candles, numLevels);
  }, [candles, numLevels]);

  if (!profile || profile.levels.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        No volume data
      </div>
    );
  }

  const maxVolume = Math.max(...profile.levels.map(l => l.volume), 1);
  const minPrice = Math.min(...profile.levels.map(l => l.price));
  const maxPrice = Math.max(...profile.levels.map(l => l.price));
  const priceRange = maxPrice - minPrice;

  const getY = (price: number) => {
    if (priceRange === 0) return height / 2;
    return height - ((price - minPrice) / priceRange) * height;
  };

  return (
    <div className="relative bg-slate-900/50 rounded-lg overflow-hidden" style={{ width, height }}>
      <svg width={width} height={height} className="absolute inset-0">
        <defs>
          <linearGradient id="buyGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#10b981" stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="sellGradient" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.6} />
          </linearGradient>
        </defs>

        {/* Volume bars */}
        {profile.levels.map((level, i) => {
          const barWidth = (level.volume / maxVolume) * (width - 40);
          const y = getY(level.price);
          const barHeight = height / numLevels;
          const isBuyDominant = level.delta > 0;

          return (
            <g key={i}>
              <rect
                x={0}
                y={y - barHeight / 2}
                width={barWidth}
                height={barHeight}
                fill={isBuyDominant ? 'url(#buyGradient)' : 'url(#sellGradient)'}
                opacity={0.7}
              />
              {/* Delta indicator */}
              {Math.abs(level.delta) > 0 && (
                <line
                  x1={barWidth}
                  y1={y}
                  x2={barWidth + Math.abs(level.delta / maxVolume) * 20}
                  y2={y}
                  stroke={isBuyDominant ? '#10b981' : '#ef4444'}
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}

        {/* Point of Control line */}
        {showPOC && profile.poc > 0 && (
          <g>
            <line
              x1={0}
              y1={getY(profile.poc)}
              x2={width}
              y2={getY(profile.poc)}
              stroke="#fbbf24"
              strokeWidth={2}
              strokeDasharray="5,5"
            />
            <text
              x={width - 5}
              y={getY(profile.poc) - 5}
              fill="#fbbf24"
              fontSize={10}
              textAnchor="end"
              className="font-mono font-bold"
            >
              POC
            </text>
          </g>
        )}

        {/* Value Area */}
        {showValueArea && (
          <g>
            <rect
              x={0}
              y={getY(profile.valueAreaHigh)}
              width={width}
              height={getY(profile.valueAreaLow) - getY(profile.valueAreaHigh)}
              fill="#a855f7"
              opacity={0.1}
            />
            <line
              x1={0}
              y1={getY(profile.valueAreaHigh)}
              x2={width}
              y2={getY(profile.valueAreaHigh)}
              stroke="#a855f7"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
            <line
              x1={0}
              y1={getY(profile.valueAreaLow)}
              x2={width}
              y2={getY(profile.valueAreaLow)}
              stroke="#a855f7"
              strokeWidth={1}
              strokeDasharray="3,3"
            />
          </g>
        )}

        {/* VWAP */}
        {showVWAP && profile.vwap > 0 && (
          <g>
            <line
              x1={0}
              y1={getY(profile.vwap)}
              x2={width}
              y2={getY(profile.vwap)}
              stroke="#3b82f6"
              strokeWidth={2}
            />
            <line
              x1={0}
              y1={getY(profile.vwapBandUpper)}
              x2={width}
              y2={getY(profile.vwapBandUpper)}
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
            <line
              x1={0}
              y1={getY(profile.vwapBandLower)}
              x2={width}
              y2={getY(profile.vwapBandLower)}
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="2,2"
              opacity={0.5}
            />
          </g>
        )}
      </svg>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute top-2 left-2 bg-slate-800/80 backdrop-blur-sm rounded-lg p-2 text-xs space-y-1"
      >
        {showPOC && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-yellow-500"></div>
            <span>POC: ${profile.poc.toFixed(2)}</span>
          </div>
        )}
        {showVWAP && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-blue-500"></div>
            <span>VWAP: ${profile.vwap.toFixed(2)}</span>
          </div>
        )}
        {showValueArea && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-purple-500"></div>
            <span>VA: ${profile.valueAreaLow.toFixed(2)} - ${profile.valueAreaHigh.toFixed(2)}</span>
          </div>
        )}
      </motion.div>
    </div>
  );
};
