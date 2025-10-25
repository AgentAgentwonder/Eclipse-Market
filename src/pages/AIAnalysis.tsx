import { RiskIndicator } from '../components/RiskIndicator';
import { Sentiment } from '../components/Sentiment';

export function AIAnalysis() {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 p-4 rounded-lg">
        <h1 className="text-xl font-semibold mb-4">AI Analysis</h1>
        <RiskIndicator />
      </div>
      <Sentiment />
    </div>
  );
}
