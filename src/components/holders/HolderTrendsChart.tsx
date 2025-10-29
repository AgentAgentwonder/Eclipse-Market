import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { HolderTrend } from '../../types/holders';

interface Props {
  trends: HolderTrend[];
}

export function HolderTrendsChart({ trends }: Props) {
  const formattedData = trends.map(trend => ({
    date: new Date(trend.timestamp).toLocaleDateString(),
    holders: trend.holderCount,
    newHolders: trend.newHolders,
    existingHolders: trend.existingHolders,
  }));

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Holder Growth Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={formattedData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHolders" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#a855f7" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNew" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#ec4899" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" />
          <XAxis dataKey="date" stroke="#94a3b8" tickLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '0.5rem',
            }}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="holders"
            stroke="#a855f7"
            fillOpacity={1}
            fill="url(#colorHolders)"
            name="Total Holders"
          />
          <Area
            type="monotone"
            dataKey="newHolders"
            stroke="#ec4899"
            fillOpacity={1}
            fill="url(#colorNew)"
            name="New Holders"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
