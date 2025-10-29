import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';

export function RiskIndicator() {
  const [riskScore, setRiskScore] = useState<number | null>(null);

  useEffect(() => {
    const calculateRisk = async () => {
      // Mock features - replace with real trade data
      const features = [0.5, 1.2, -0.3, 0.8];
      const score = await invoke<number>('assess_risk', { features });
      setRiskScore(score);
    };
    calculateRisk();
  }, []);

  if (riskScore === null) return <div>Calculating risk...</div>;

  const riskLevel = riskScore < 0.3 ? 'low' : riskScore < 0.7 ? 'medium' : 'high';

  return (
    <div className="flex items-center gap-2">
      <div className="text-sm">Trade Risk:</div>
      <div
        className={`px-2 py-1 rounded-full text-xs ${
          riskLevel === 'low'
            ? 'bg-green-500'
            : riskLevel === 'medium'
              ? 'bg-yellow-500'
              : 'bg-red-500'
        }`}
      >
        {riskLevel.toUpperCase()} ({riskScore.toFixed(2)})
      </div>
    </div>
  );
}
