import { motion } from 'framer-motion';
import { Flame, Snowflake } from 'lucide-react';

interface FomoFudGaugesProps {
  tokenAddress: string;
  data?: {
    fomo_score: number;
    fud_score: number;
    contrarian_signal?: string | null;
    extreme?: boolean;
    sample_fomo_messages?: string[];
    sample_fud_messages?: string[];
  };
}

const thresholds = {
  fomo: [
    { max: 20, label: 'Calm', color: 'text-emerald-400' },
    { max: 40, label: 'Interest', color: 'text-lime-300' },
    { max: 60, label: 'Excitement', color: 'text-yellow-300' },
    { max: 80, label: 'FOMO', color: 'text-orange-400' },
    { max: 100, label: 'Extreme FOMO', color: 'text-red-500' },
  ],
  fud: [
    { max: 20, label: 'Confident', color: 'text-emerald-400' },
    { max: 40, label: 'Cautious', color: 'text-yellow-300' },
    { max: 60, label: 'Concerned', color: 'text-orange-400' },
    { max: 80, label: 'FUD', color: 'text-red-500' },
    { max: 100, label: 'Panic', color: 'text-purple-400' },
  ],
};

function getLabel(score: number, type: 'fomo' | 'fud') {
  return thresholds[type].find(threshold => score <= threshold.max) || thresholds[type][3];
}

function CircularGauge({ score, type }: { score: number; type: 'fomo' | 'fud' }) {
  const label = getLabel(score, type);
  const gradient =
    type === 'fomo' ? 'from-orange-500 to-red-600' : 'from-sky-500 to-purple-600';

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <svg className="w-24 h-24" viewBox="0 0 36 36">
          <path
            className="text-slate-700"
            strokeWidth="4"
            fill="none"
            stroke="currentColor"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <motion.path
            initial={{ strokeDasharray: '0, 100' }}
            animate={{ strokeDasharray: `${score}, 100` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`text-${label.color}`}
            strokeWidth="4"
            strokeLinecap="round"
            fill="none"
            stroke="url(#gradient)"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <defs>
            <linearGradient id="gradient" x1="1" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={type === 'fomo' ? '#f97316' : '#0ea5e9'} />
              <stop offset="100%" stopColor={type === 'fomo' ? '#ef4444' : '#a855f7'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          {type === 'fomo' ? <Flame className="w-6 h-6 text-orange-400" /> : <Snowflake className="w-6 h-6 text-sky-400" />}
          <div className="text-lg font-bold">{score.toFixed(0)}</div>
        </div>
      </div>
      <div>
        <div className="text-sm text-gray-400 uppercase">{type === 'fomo' ? 'FOMO Score' : 'FUD Score'}</div>
        <div className={`text-lg font-semibold ${label.color}`}>{label.label}</div>
      </div>
    </div>
  );
}

export default function FomoFudGauges({ data }: FomoFudGaugesProps) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <h2 className="text-xl font-semibold mb-4">FOMO &amp; FUD Gauges</h2>

      <div className="space-y-6">
        <div className="flex flex-col gap-6">
          <CircularGauge score={data.fomo_score} type="fomo" />
          <CircularGauge score={data.fud_score} type="fud" />
        </div>

        {data.contrarian_signal && (
          <div className="bg-slate-900/60 border border-purple-500/20 rounded-lg p-4">
            <div className="text-sm font-semibold text-purple-400">Contrarian Indicator</div>
            <p className="text-sm text-gray-300 mt-1">{data.contrarian_signal}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs uppercase text-orange-400 mb-2">FOMO Messages</div>
            <ul className="space-y-2 text-gray-400">
              {data.sample_fomo_messages?.map((message, idx) => (
                <li key={`fomo-${idx}`} className="bg-slate-900/40 rounded-md p-3">
                  {message}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-xs uppercase text-blue-400 mb-2">FUD Messages</div>
            <ul className="space-y-2 text-gray-400">
              {data.sample_fud_messages?.map((message, idx) => (
                <li key={`fud-${idx}`} className="bg-slate-900/40 rounded-md p-3">
                  {message}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
