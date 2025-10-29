import { CustomIndicator, CandleData } from '../types/indicators';
import { IndicatorEngine } from '../utils/indicatorEngine';
import { calculateVolumeProfile } from '../utils/volumeProfile';

declare const self: DedicatedWorkerGlobalScope;

const engine = new IndicatorEngine();

self.onmessage = (event: MessageEvent) => {
  const { type, payload, id } = event.data;

  try {
    switch (type) {
      case 'evaluateIndicator': {
        const { indicator, candles } = payload as { indicator: CustomIndicator; candles: CandleData[] };
        const result = engine.evaluateIndicator(indicator, candles);
        self.postMessage({ type: 'result', id, result });
        break;
      }

      case 'calculateVolumeProfile': {
        const { candles, numLevels } = payload as { candles: CandleData[]; numLevels?: number };
        const result = calculateVolumeProfile(candles, numLevels);
        self.postMessage({ type: 'result', id, result });
        break;
      }

      case 'batchEvaluate': {
        const { indicators, candles } = payload as { 
          indicators: CustomIndicator[]; 
          candles: CandleData[] 
        };
        const results = indicators.map(indicator => ({
          indicatorId: indicator.id,
          values: engine.evaluateIndicator(indicator, candles),
        }));
        self.postMessage({ type: 'result', id, result: results });
        break;
      }

      case 'clearCache':
        engine.clearCache();
        self.postMessage({ type: 'result', id, result: 'cleared' });
        break;

      default:
        throw new Error(`Unknown message type: ${type}`);
    }
  } catch (error) {
    self.postMessage({ 
      type: 'error', 
      id, 
      error: error instanceof Error ? error.message : String(error) 
    });
  }
};
