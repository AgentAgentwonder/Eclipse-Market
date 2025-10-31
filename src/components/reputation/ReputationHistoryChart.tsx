import React, { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { Chart } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { AlertCircle } from 'lucide-react';

ChartJS.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
);

interface ReputationHistoryPoint {
  address: string;
  timestamp: string;
  trustScore: number;
  eventType: string;
  details?: string;
}

interface ReputationHistoryChartProps {
  address: string;
  className?: string;
  limit?: number;
}

export const ReputationHistoryChart: React.FC<ReputationHistoryChartProps> = ({
  address,
  className = '',
  limit = 50,
}) => {
  const [history, setHistory] = useState<ReputationHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadHistory();
  }, [address, limit]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<ReputationHistoryPoint[]>('get_reputation_history', {
        address,
        limit,
      });
      setHistory(data.reverse());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const chartData = useMemo(() => {
    const labels = history.map((point) => new Date(point.timestamp));
    const data = history.map((point) => point.trustScore);

    return {
      labels,
      datasets: [
        {
          label: 'Trust Score',
          data,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          tension: 0.4,
          pointRadius: 4,
          pointBackgroundColor: '#34d399',
          fill: true,
        },
      ],
    };
  }, [history]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'time' as const,
        time: {
          unit: 'day' as const,
          tooltipFormat: 'MMM d, yyyy HH:mm',
        },
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: 'rgba(255, 255, 255, 0.5)',
          callback: (value: number) => `${value}`,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const point = history[context.dataIndex];
            return [
              `Score: ${context.parsed.y.toFixed(1)}`,
              `Event: ${point.eventType}`,
              point.details ? `Details: ${point.details}` : undefined,
            ].filter(Boolean);
          },
        },
      },
    },
  }), [history]);

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 text-sm text-gray-400 ${className}`}>
        No reputation history available yet.
      </div>
    );
  }

  return (
    <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-white mb-4">Reputation History</h3>
      <div className="h-64">
        <Chart type="line" data={chartData} options={options} />
      </div>
    </div>
  );
};
