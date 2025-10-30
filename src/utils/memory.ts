export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usageRatio: number;
}

export function getMemoryInfo(): MemoryInfo | null {
  const memory = (performance as any).memory;

  if (!memory) {
    return null;
  }

  return {
    usedJSHeapSize: memory.usedJSHeapSize,
    totalJSHeapSize: memory.totalJSHeapSize,
    jsHeapSizeLimit: memory.jsHeapSizeLimit,
    usageRatio: memory.usedJSHeapSize / memory.jsHeapSizeLimit,
  };
}

export function shouldEnableLowMemoryMode(): boolean {
  const info = getMemoryInfo();
  if (!info) return false;

  return info.usageRatio > 0.75;
}

export class WeakCache<K extends object, V> {
  private cache = new WeakMap<K, { value: V; timestamp: number }>();

  set(key: K, value: V): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: K): V | undefined {
    return this.cache.get(key)?.value;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }
}

export class LRUCache<K, V> {
  private maxSize: number;
  private cache = new Map<K, { value: V; timestamp: number }>();

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { value, timestamp: Date.now() });
  }

  get(key: K): V | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.value;
  }

  has(key: K): boolean {
    return this.cache.has(key);
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  resize(newSize: number): void {
    this.maxSize = newSize;
    if (this.cache.size > newSize) {
      const keysToRemove = Array.from(this.cache.keys()).slice(0, this.cache.size - newSize);
      keysToRemove.forEach(key => this.cache.delete(key));
    }
  }
}

export function detectMemoryLeaks(threshold: number = 50 * 1024 * 1024): void {
  const info = getMemoryInfo();
  if (!info) {
    console.warn('Memory profiling not supported in this browser');
    return;
  }

  const currentUsage = info.usedJSHeapSize;
  const leakWarningThreshold = threshold;

  if (currentUsage > leakWarningThreshold) {
    console.warn(
      `Potential memory leak detected: ${(currentUsage / 1024 / 1024).toFixed(2)} MB used`
    );
  }
}

export function estimateObjectSize(obj: unknown): number {
  const seen = new WeakSet();
  
  function sizeOf(value: unknown): number {
    if (value === null || value === undefined) return 0;
    
    const type = typeof value;
    
    if (type === 'boolean') return 4;
    if (type === 'number') return 8;
    if (type === 'string') return (value as string).length * 2;
    
    if (type === 'object') {
      if (seen.has(value as object)) return 0;
      seen.add(value as object);
      
      if (Array.isArray(value)) {
        return value.reduce((sum, item) => sum + sizeOf(item), 0);
      }
      
      return Object.keys(value as object).reduce((sum, key) => {
        return sum + key.length * 2 + sizeOf((value as any)[key]);
      }, 0);
    }
    
    return 0;
  }
  
  return sizeOf(obj);
}

export function limitHistorySize<T>(
  history: T[],
  maxSize: number,
  lowMemoryMode: boolean
): T[] {
  const limit = lowMemoryMode ? Math.floor(maxSize / 2) : maxSize;
  return history.length > limit ? history.slice(-limit) : history;
}
