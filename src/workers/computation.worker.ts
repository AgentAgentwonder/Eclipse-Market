interface WorkerMessage {
  id: string;
  type: string;
  payload: unknown;
}

interface WorkerResponse {
  id: string;
  type: 'result' | 'error' | 'progress';
  result?: unknown;
  error?: string;
  progress?: number;
}

function toNumericArray(source: unknown): number[] {
  if (Array.isArray(source)) {
    return source.map(value => (typeof value === 'number' ? value : Number(value)));
  }

  if (typeof SharedArrayBuffer !== 'undefined' && source instanceof SharedArrayBuffer) {
    return Array.from(new Float64Array(source));
  }

  if (ArrayBuffer.isView(source)) {
    return Array.from(source as ArrayLike<number>);
  }

  return [];
}

function maybeCreateSharedBuffer(values: number[], useSharedBuffer?: boolean) {
  if (!useSharedBuffer || typeof SharedArrayBuffer === 'undefined') {
    return values;
  }
  const buffer = new SharedArrayBuffer(values.length * Float64Array.BYTES_PER_ELEMENT);
  const view = new Float64Array(buffer);
  view.set(values);
  return { buffer, length: values.length };
}

function calculateMA(data: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(NaN);
      continue;
    }
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j];
    }
    result.push(sum / period);
  }
  return result;
}

function calculateRSI(data: number[], period: number = 14): number[] {
  const result: number[] = [];
  if (data.length < period + 1) {
    return data.map(() => NaN);
  }

  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = data[i] - data[i - 1];
    if (diff >= 0) {
      gains += diff;
    } else {
      losses -= diff;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i < period; i++) {
    result.push(NaN);
  }

  result.push(100 - 100 / (1 + avgGain / avgLoss));

  for (let i = period + 1; i < data.length; i++) {
    const diff = data[i] - data[i - 1];
    const gain = diff >= 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    result.push(100 - 100 / (1 + avgGain / avgLoss));
  }

  return result;
}

function calculateBollingerBands(data: number[], period: number = 20, stdDev: number = 2) {
  const ma = calculateMA(data, period);
  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      upper.push(NaN);
      lower.push(NaN);
      continue;
    }

    let variance = 0;
    for (let j = 0; j < period; j++) {
      const diff = data[i - j] - ma[i];
      variance += diff * diff;
    }
    const sd = Math.sqrt(variance / period);

    upper.push(ma[i] + stdDev * sd);
    lower.push(ma[i] - stdDev * sd);
  }

  return { middle: ma, upper, lower };
}

function sortLargeArray<T>(arr: T[], compareFn?: (a: T, b: T) => number): T[] {
  const copy = [...arr];
  if (copy.length < 100000) {
    return copy.sort(compareFn);
  }

  const chunks: T[][] = [];
  const chunkSize = 10000;

  for (let i = 0; i < copy.length; i += chunkSize) {
    chunks.push(copy.slice(i, i + chunkSize).sort(compareFn));
  }

  return mergeChunks(chunks, compareFn);
}

function mergeChunks<T>(chunks: T[][], compareFn?: (a: T, b: T) => number): T[] {
  if (chunks.length === 0) return [];
  if (chunks.length === 1) return chunks[0];

  const merged: T[] = [];
  const pointers = chunks.map(() => 0);

  while (true) {
    let minIndex = -1;
    let minValue: T | null = null;

    for (let i = 0; i < chunks.length; i++) {
      if (pointers[i] >= chunks[i].length) continue;
      const value = chunks[i][pointers[i]];
      if (
        minValue === null ||
        (compareFn ? compareFn(value, minValue) < 0 : value < minValue)
      ) {
        minValue = value;
        minIndex = i;
      }
    }

    if (minIndex === -1) break;
    merged.push(minValue!);
    pointers[minIndex]++;
  }

  return merged;
}

function filterLargeDataset(
  data: unknown[],
  predicate: (item: unknown, index: number) => boolean
): unknown[] {
  const result: unknown[] = [];
  for (let i = 0; i < data.length; i++) {
    if (predicate(data[i], i)) {
      result.push(data[i]);
    }
  }
  return result;
}

function aggregatePriceData(
  prices: Array<{ timestamp: number; price: number; volume: number }>,
  interval: number
): Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume: number }> {
  if (prices.length === 0) return [];

  const buckets = new Map<number, typeof prices>();

  prices.forEach(price => {
    const bucketKey = Math.floor(price.timestamp / interval) * interval;
    const bucket = buckets.get(bucketKey) || [];
    bucket.push(price);
    buckets.set(bucketKey, bucket);
  });

  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([timestamp, bucket]) => {
      const open = bucket[0].price;
      const close = bucket[bucket.length - 1].price;
      const high = Math.max(...bucket.map(p => p.price));
      const low = Math.min(...bucket.map(p => p.price));
      const volume = bucket.reduce((sum, p) => sum + p.volume, 0);
      return { timestamp, open, high, low, close, volume };
    });
}

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { id, type, payload } = event.data;

  const sendResponse = (response: Omit<WorkerResponse, 'id'>) => {
    self.postMessage({ ...response, id });
  };

  try {
    switch (type) {
      case 'calculateMA': {
        const { data, period } = payload as { data: number[]; period: number };
        const result = calculateMA(data, period);
        sendResponse({ type: 'result', result });
        break;
      }

      case 'calculateRSI': {
        const { data, period } = payload as { data: number[]; period?: number };
        const result = calculateRSI(data, period);
        sendResponse({ type: 'result', result });
        break;
      }

      case 'calculateBollingerBands': {
        const { data, period, stdDev } = payload as { data: number[]; period?: number; stdDev?: number };
        const result = calculateBollingerBands(data, period, stdDev);
        sendResponse({ type: 'result', result });
        break;
      }

      case 'sortLargeArray': {
        const { data, compareFn } = payload as { data: unknown[]; compareFn?: string };
        const fn = compareFn ? new Function('a', 'b', `return ${compareFn}`) : undefined;
        const result = sortLargeArray(data, fn);
        sendResponse({ type: 'result', result });
        break;
      }

      case 'filterLargeDataset': {
        const { data, predicateFn } = payload as { data: unknown[]; predicateFn: string };
        const predicate = new Function('item', 'index', `return ${predicateFn}`) as (
          item: unknown,
          index: number
        ) => boolean;
        const result = filterLargeDataset(data, predicate);
        sendResponse({ type: 'result', result });
        break;
      }

      case 'aggregatePriceData': {
        const { prices, interval } = payload as {
          prices: Array<{ timestamp: number; price: number; volume: number }>;
          interval: number;
        };
        const result = aggregatePriceData(prices, interval);
        sendResponse({ type: 'result', result });
        break;
      }

      default:
        sendResponse({ type: 'error', error: `Unknown task type: ${type}` });
    }
  } catch (error) {
    sendResponse({
      type: 'error',
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

export {};
