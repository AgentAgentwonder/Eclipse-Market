import { useEffect, useRef } from 'react';
import { usePerformanceStore } from '../store/performanceStore';
import { detectGPUSupport } from '../utils/gpu';
import { getMemoryInfo, shouldEnableLowMemoryMode } from '../utils/memory';

interface Options {
  sampleIntervalMs?: number;
}

export function usePerformanceMonitor({ sampleIntervalMs = 2000 }: Options = {}) {
  const gpuOverride = usePerformanceStore(state => state.gpuOverride);
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const rafRef = useRef<number>();
  const longTaskDurationRef = useRef(0);
  const lastSampleTimestampRef = useRef(performance.now());

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const { setGpuInfo, setGpuEnabled, updateMetrics, setLowMemoryMode, trimHistory } =
      usePerformanceStore.getState();

    const gpuInfo = detectGPUSupport();
    setGpuInfo(gpuInfo);

    if (!gpuInfo.supported && gpuOverride === true) {
      setGpuEnabled(false);
    }

    let longTaskObserver: PerformanceObserver | null = null;

    if (typeof PerformanceObserver !== 'undefined') {
      try {
        longTaskObserver = new PerformanceObserver(list => {
          for (const entry of list.getEntries()) {
            longTaskDurationRef.current += entry.duration;
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] as any });
      } catch (err) {
        console.warn('Long task observer not supported', err);
      }
    }

    const measureFrame = (now: number) => {
      frameCountRef.current += 1;
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      if (now - lastSampleTimestampRef.current >= sampleIntervalMs) {
        const elapsed = now - lastSampleTimestampRef.current;
        const fps = (frameCountRef.current * 1000) / elapsed;
        const frameTime = delta;
        const longTaskDuration = longTaskDurationRef.current;
        const cpuLoad = Math.min(100, (longTaskDuration / sampleIntervalMs) * 100);
        longTaskDurationRef.current = 0;
        frameCountRef.current = 0;
        lastSampleTimestampRef.current = now;

        const memoryInfo = getMemoryInfo();
        const lowMemoryMode = shouldEnableLowMemoryMode();
        setLowMemoryMode(lowMemoryMode);

        const connection =
          navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;

        const storeSnapshot = usePerformanceStore.getState();
        const gpuStats = storeSnapshot.gpuStats;
        const metrics = storeSnapshot.metrics;

        updateMetrics({
          fps: Number.isFinite(fps) ? Math.round(fps) : 0,
          frameTime,
          cpuLoad,
          gpuLoad: gpuStats ? Math.min(100, (gpuStats.drawCalls / 5000) * 100) : metrics.gpuLoad,
          memoryUsed: memoryInfo?.usedJSHeapSize ?? metrics.memoryUsed,
          memoryTotal: memoryInfo?.jsHeapSizeLimit ?? metrics.memoryTotal,
          networkDownlink: connection?.downlink ?? metrics.networkDownlink,
          networkType: connection?.effectiveType ?? metrics.networkType,
        });

        if (lowMemoryMode) {
          trimHistory();
        }
      }

      rafRef.current = requestAnimationFrame(measureFrame);
    };

    rafRef.current = requestAnimationFrame(measureFrame);

    const handleConnectionChange = () => {
      const connection =
        navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
      updateMetrics({
        networkDownlink: connection?.downlink ?? 0,
        networkType: connection?.effectiveType ?? 'unknown',
      });
    };

    const connection =
      navigator.connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    connection?.addEventListener?.('change', handleConnectionChange);

    return () => {
      longTaskObserver?.disconnect();
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      connection?.removeEventListener?.('change', handleConnectionChange);
    };
  }, [gpuOverride, sampleIntervalMs]);
}
