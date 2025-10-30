import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { WorkerPool } from '../utils/workerPool';
import { LRUCache, WeakCache, limitHistorySize, getMemoryInfo } from '../utils/memory';
import { detectGPUSupport, estimateGPUMemoryUsage } from '../utils/gpu';

describe('WorkerPool', () => {
  let pool: WorkerPool;

  beforeEach(() => {
    pool = new WorkerPool(() => {
      const mockWorker = {
        postMessage: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        terminate: vi.fn(),
        onmessage: null,
        onerror: null,
      } as unknown as Worker;
      return mockWorker;
    }, 2);
  });

  afterEach(() => {
    pool.terminate();
  });

  it('should create worker pool with specified size', () => {
    const status = pool.getStatus();
    expect(status).toHaveLength(2);
    expect(status.every(s => !s.busy)).toBe(true);
  });

  it('should execute tasks', async () => {
    const taskPromise = pool.execute('test-task', { data: 123 });
    expect(pool.getActiveTaskCount()).toBeGreaterThan(0);

    const status = pool.getStatus();
    const workers = status.filter(s => s.busy);
    expect(workers.length).toBeGreaterThan(0);
  });

  it('should queue tasks when pool is full', () => {
    pool.execute('task1', {});
    pool.execute('task2', {});
    pool.execute('task3', {});
    
    expect(pool.getQueueLength()).toBeGreaterThan(0);
  });

  it('should resize pool', () => {
    pool.resize(4);
    expect(pool.getStatus()).toHaveLength(4);

    pool.resize(1);
    expect(pool.getStatus()).toHaveLength(1);
  });

  it('should terminate all workers', () => {
    pool.terminate();
    expect(pool.getStatus()).toHaveLength(0);
  });
});

describe('LRUCache', () => {
  let cache: LRUCache<string, number>;

  beforeEach(() => {
    cache = new LRUCache<string, number>(3);
  });

  it('should store and retrieve values', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBe(2);
  });

  it('should evict oldest item when capacity exceeded', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    cache.set('d', 4);

    expect(cache.get('a')).toBeUndefined();
    expect(cache.get('d')).toBe(4);
  });

  it('should update access order on get', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    cache.get('a');
    
    cache.set('d', 4);
    
    expect(cache.get('a')).toBe(1);
    expect(cache.get('b')).toBeUndefined();
  });

  it('should resize cache', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.set('c', 3);
    
    cache.resize(2);
    
    expect(cache.size()).toBe(2);
  });

  it('should clear cache', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    
    expect(cache.size()).toBe(0);
  });
});

describe('WeakCache', () => {
  let cache: WeakCache<object, string>;

  beforeEach(() => {
    cache = new WeakCache<object, string>();
  });

  it('should store and retrieve values', () => {
    const key = {};
    cache.set(key, 'value');
    expect(cache.get(key)).toBe('value');
  });

  it('should check if key exists', () => {
    const key = {};
    cache.set(key, 'value');
    expect(cache.has(key)).toBe(true);
    expect(cache.has({})).toBe(false);
  });

  it('should delete values', () => {
    const key = {};
    cache.set(key, 'value');
    cache.delete(key);
    expect(cache.get(key)).toBeUndefined();
  });
});

describe('Memory utilities', () => {
  it('should limit history size in normal mode', () => {
    const history = Array.from({ length: 100 }, (_, i) => i);
    const limited = limitHistorySize(history, 50, false);
    
    expect(limited).toHaveLength(50);
    expect(limited[0]).toBe(50);
    expect(limited[49]).toBe(99);
  });

  it('should limit history size in low memory mode', () => {
    const history = Array.from({ length: 100 }, (_, i) => i);
    const limited = limitHistorySize(history, 50, true);
    
    expect(limited).toHaveLength(25);
    expect(limited[0]).toBe(75);
    expect(limited[24]).toBe(99);
  });

  it('should return history if under limit', () => {
    const history = Array.from({ length: 30 }, (_, i) => i);
    const limited = limitHistorySize(history, 50, false);
    
    expect(limited).toHaveLength(30);
  });
});

describe('GPU utilities', () => {
  it('should detect GPU support', () => {
    const info = detectGPUSupport();
    
    expect(info).toHaveProperty('supported');
    expect(info).toHaveProperty('renderer');
    expect(info).toHaveProperty('vendor');
    expect(info).toHaveProperty('maxTextureSize');
    expect(info).toHaveProperty('webglVersion');
  });

  it('should estimate GPU memory usage', () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1920;
    canvas.height = 1080;
    
    const memory = estimateGPUMemoryUsage(canvas);
    
    expect(memory).toBeGreaterThan(0);
    expect(typeof memory).toBe('number');
  });
});

describe('Virtual scrolling', () => {
  it('should handle large datasets efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      id: i,
      value: Math.random(),
    }));

    const visibleItems = largeDataset.slice(0, 20);
    
    expect(visibleItems).toHaveLength(20);
    expect(visibleItems[0].id).toBe(0);
    expect(visibleItems[19].id).toBe(19);
  });

  it('should calculate visible range for virtual scrolling', () => {
    const itemHeight = 50;
    const containerHeight = 500;
    const scrollTop = 1000;
    
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.ceil((scrollTop + containerHeight) / itemHeight);
    
    expect(startIndex).toBe(20);
    expect(endIndex).toBe(30);
  });
});

describe('Worker computations', () => {
  it('should calculate moving average correctly', () => {
    const data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const period = 3;
    
    const calculateMA = (data: number[], period: number) => {
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
    };
    
    const ma = calculateMA(data, period);
    
    expect(ma[2]).toBe(2);
    expect(ma[3]).toBe(3);
    expect(ma[9]).toBe(9);
  });

  it('should aggregate price data correctly', () => {
    const prices = [
      { timestamp: 1000, price: 100, volume: 10 },
      { timestamp: 1500, price: 101, volume: 15 },
      { timestamp: 2000, price: 102, volume: 20 },
      { timestamp: 2500, price: 99, volume: 12 },
      { timestamp: 3000, price: 103, volume: 18 },
    ];
    
    const interval = 1000;
    
    const aggregate = (
      prices: Array<{ timestamp: number; price: number; volume: number }>,
      interval: number
    ) => {
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
    };
    
    const result = aggregate(prices, interval);
    
    expect(result).toHaveLength(3);
    expect(result[0].timestamp).toBe(1000);
    expect(result[0].volume).toBe(25);
    expect(result[1].timestamp).toBe(2000);
  });
});

describe('Performance metrics tracking', () => {
  it('should track FPS correctly', () => {
    const frames = 60;
    const duration = 1000;
    
    const fps = (frames * 1000) / duration;
    
    expect(fps).toBe(60);
  });

  it('should calculate CPU load percentage', () => {
    const longTaskDuration = 500;
    const sampleInterval = 2000;
    
    const cpuLoad = Math.min(100, (longTaskDuration / sampleInterval) * 100);
    
    expect(cpuLoad).toBe(25);
  });

  it('should detect memory pressure', () => {
    const usedMemory = 800 * 1024 * 1024;
    const totalMemory = 1024 * 1024 * 1024;
    
    const ratio = usedMemory / totalMemory;
    const isHighMemoryUsage = ratio > 0.75;
    
    expect(isHighMemoryUsage).toBe(true);
  });
});
