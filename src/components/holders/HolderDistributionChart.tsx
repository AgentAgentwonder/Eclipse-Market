import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { HolderDistribution } from '../../types/holders';

interface Props {
  distribution: HolderDistribution;
}

export function HolderDistributionChart({ distribution }: Props) {
  const data = [
    { name: 'Top 10 Holders', value: distribution.top10Percentage, color: '#a855f7' },
    {
      name: 'Top 11-50 Holders',
      value: distribution.top50Percentage - distribution.top10Percentage,
      color: '#ec4899',
    },
    {
      name: 'Other Holders',
      value: 100 - distribution.top50Percentage,
      color: '#8b5cf6',
    },
  ];

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-purple-500/20 rounded-xl p-6">
      <h3 className="text-xl font-bold mb-4">Holder Distribution</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={entry => `${entry.value.toFixed(1)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(168, 85, 247, 0.2)',
              borderRadius: '0.5rem',
            }}
            formatter={(value: number) => `${value.toFixed(2)}%`}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-400">Gini Coefficient</p>
          <p className="text-lg font-semibold">{distribution.giniCoefficient.toFixed(3)}</p>
          <p className="text-xs text-gray-500">0 = equal, 1 = concentrated</p>
        </div>
        <div>
          <p className="text-sm text-gray-400">Concentration Risk</p>
          <p
            className={`text-lg font-semibold ${
              distribution.concentrationRisk === 'Critical'
                ? 'text-red-500'
                : distribution.concentrationRisk === 'High'
                  ? 'text-orange-500'
                  : distribution.concentrationRisk === 'Medium'
                    ? 'text-yellow-500'
                    : 'text-green-500'
            }`}
          >
            {distribution.concentrationRisk}
          </p>
        </div>
      </div>
    </div>
  );
}
