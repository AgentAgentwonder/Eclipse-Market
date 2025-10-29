import { useEffect, useMemo, useRef, useState } from 'react';
import { CandleData, CustomIndicator, IndicatorValue } from '../types/indicators';

const STORAGE_KEY = 'custom_indicators_v2';

interface WorkerRequest {
  id: string;
  type: 'evaluateIndicator' | 'calculateVolumeProfile' | 'batchEvaluate' | 'clearCache';
  payload?: unknown;
}

interface WorkerResponse {
  id: string;
  type: 'result' | 'error';
  result?: unknown;
  error?: string;
}

export function useCustomIndicators() {
  const [indicators, setIndicators] = useState<CustomIndicator[]>(() => {
    if (typeof window === 'undefined') return [];

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.error('Failed to load custom indicators:', err);
      return [];
    }
  });

  const [evaluations, setEvaluations] = useState<Record<string, IndicatorValue[]>>({});
  const [isEvaluating, setIsEvaluating] = useState(false);
  const pendingRequests = useRef<Map<string, (response: WorkerResponse) => void>>(new Map());
  const workerRef = useRef<Worker>();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const worker = new Worker(new URL('../workers/indicator-calculator.worker.ts', import.meta.url), {
      type: 'module',
    });

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const handler = pendingRequests.current.get(event.data.id);
      if (handler) {
        handler(event.data);
        pendingRequests.current.delete(event.data.id);
      }
    };

    workerRef.current = worker;

    return () => {
      worker.terminate();
      workerRef.current = undefined;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(indicators));
    } catch (err) {
      console.error('Failed to persist custom indicators:', err);
    }
  }, [indicators]);

  const sendRequest = async <T>(request: WorkerRequest): Promise<T> => {
    if (!workerRef.current) {
      throw new Error('Indicator worker not initialized');
    }

    return new Promise<T>((resolve, reject) => {
      pendingRequests.current.set(request.id, response => {
        if (response.type === 'error') {
          reject(new Error(response.error));
          return;
        }
        resolve(response.result as T);
      });

      workerRef.current?.postMessage(request);
    });
  };

  const evaluateIndicators = async (candles: CandleData[]) => {
    if (indicators.length === 0 || candles.length === 0) return;

    setIsEvaluating(true);

    try {
      const result = await sendRequest<Array<{ indicatorId: string; values: IndicatorValue[] }>>({
        id: `batch-${Date.now()}`,
        type: 'batchEvaluate',
        payload: { indicators, candles },
      });

      const evaluationMap: Record<string, IndicatorValue[]> = {};
      for (const { indicatorId, values } of result) {
        evaluationMap[indicatorId] = values;
      }
      setEvaluations(evaluationMap);
    } catch (err) {
      console.error('Failed to evaluate indicators:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const addIndicator = (indicator: CustomIndicator) => {
    setIndicators(prev => [...prev, indicator]);
  };

  const updateIndicator = (indicatorId: string, updates: Partial<CustomIndicator>) => {
    setIndicators(prev =>
      prev.map(indicator =>
        indicator.id === indicatorId
          ? { ...indicator, ...updates, updatedAt: Date.now() }
          : indicator
      )
    );
  };

  const deleteIndicator = (indicatorId: string) => {
    setIndicators(prev => prev.filter(indicator => indicator.id !== indicatorId));
    setEvaluations(prev => {
      const updated = { ...prev };
      delete updated[indicatorId];
      return updated;
    });
  };

  const importIndicators = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      if (!Array.isArray(parsed)) throw new Error('Invalid indicator export');
      setIndicators(prev => [...prev, ...parsed]);
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : String(err));
    }
  };

  const exportIndicators = () => {
    return JSON.stringify(indicators, null, 2);
  };

  const indicatorById = useMemo(() => {
    return indicators.reduce<Record<string, CustomIndicator>>((acc, indicator) => {
      acc[indicator.id] = indicator;
      return acc;
    }, {});
  }, [indicators]);

  return {
    indicators,
    evaluations,
    isEvaluating,
    evaluateIndicators,
    addIndicator,
    updateIndicator,
    deleteIndicator,
    importIndicators,
    exportIndicators,
    indicatorById,
  };
}
