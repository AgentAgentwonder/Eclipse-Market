import { useEffect, useMemo, useRef } from 'react';
import { WorkerPool } from '../utils/workerPool';

interface Options {
  poolSize?: number;
  warmupTasks?: Array<{ type: string; payload: unknown }>;
}

export function useWorkerPool(workerFactory: () => Worker, options: Options = {}) {
  const poolRef = useRef<WorkerPool>();

  const pool = useMemo(() => {
    if (poolRef.current) return poolRef.current;
    poolRef.current = new WorkerPool(workerFactory, options.poolSize);
    return poolRef.current;
  }, [workerFactory, options.poolSize]);

  useEffect(() => {
    if (!options.warmupTasks?.length) return;

    options.warmupTasks.forEach(task => {
      pool.execute(task.type, task.payload).catch(err => {
        console.warn('Warmup task failed', err);
      });
    });
  }, [pool, options.warmupTasks]);

  useEffect(() => {
    return () => {
      poolRef.current?.terminate();
      poolRef.current = undefined;
    };
  }, [pool]);

  return pool;
}
