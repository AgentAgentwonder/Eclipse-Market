import { motion } from 'framer-motion';
import { PieChart as PieChartIcon } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { SectorAllocation } from '../../types/portfolio';

interface SectorAllocationChartProps {
  sectors: SectorAllocation[];
}

const SECTOR_COLORS: Record<string, string> = {
  'Layer 1': '#8b5cf6',
  'DeFi': '#06b6d4',
  'Meme': '#f59e0b',
  'Stablecoin': '#10b981',
  'Oracle': '#ec4899',
  'Storage/Compute': '#ef4444',
  'Other': '#6b7280',
};

export function SectorAllocationChart({ sectors }: SectorAllocationChartProps) {
  const chartData = sectors.map(sector => ({
    name: sector.sector,
    value: sector.allocation,
    valueUsd: sector.value,
    symbols: sector.symbols,
  }));

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <PieChartIcon className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold">Sector Allocation</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={SECTOR_COLORS[entry.name] || SECTOR_COLORS['Other']}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                formatter={(value: unknown, name: unknown, props: any) => {
                  const v = typeof value === 'number' ? value : 0;
                  return [
                    `${v.toFixed(2)}% ($${props.payload.valueUsd.toLocaleString()})`,
                    props.payload.name,
                  ];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-3">
          {sectors
            .sort((a, b) => b.allocation - a.allocation)
            .map((sector, index) => (
              <motion.div
                key={sector.sector}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-700/50 rounded-lg p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{
                        backgroundColor:
                          SECTOR_COLORS[sector.sector] || SECTOR_COLORS['Other'],
                      }}
                    ></div>
                    <span className="font-medium">{sector.sector}</span>
                  </div>
                  <span className="text-gray-400">{sector.allocation.toFixed(1)}%</span>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex flex-wrap gap-1">
                    {sector.symbols.map(symbol => (
                      <span
                        key={symbol}
                        className="px-2 py-0.5 bg-gray-600 rounded text-xs"
                      >
                        {symbol}
                      </span>
                    ))}
                  </div>
                  <span className="text-gray-400">
                    ${sector.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
