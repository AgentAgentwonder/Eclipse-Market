export interface WorkerTask<T = any> {
  id: string;
  type: string;
  payload: any;
  resolve: (result: T) => void;
  reject: (error: Error) => void;
  abortController?: AbortController;
}

export interface WorkerStatus {
  id: string;
  busy: boolean;
  currentTask: string | null;
  completedTasks: number;
  errors: number;
}

export type PoolTask<T> = Promise<T> & {
  taskId: string;
  cancel: () => boolean;
};

export class WorkerPool {
  private workers: Worker[] = [];
  private workerStatuses: Map<Worker, WorkerStatus> = new Map();
  private taskQueue: WorkerTask[] = [];
  private activeTasks: Map<string, WorkerTask> = new Map();
  private poolSize: number;
  private workerFactory: () => Worker;
  private nextWorkerId = 0;

  constructor(workerFactory: () => Worker, poolSize = navigator.hardwareConcurrency || 4) {
    this.workerFactory = workerFactory;
    this.poolSize = Math.max(1, Math.min(poolSize, 8));
    this.initializePool();
  }

  private initializePool(): void {
    for (let i = 0; i < this.poolSize; i++) {
      const worker = this.createWorker();
      this.workers.push(worker);
    }
  }

  private createWorker(): Worker {
    const worker = this.workerFactory();
    const workerId = `worker-${this.nextWorkerId++}`;

    this.workerStatuses.set(worker, {
      id: workerId,
      busy: false,
      currentTask: null,
      completedTasks: 0,
      errors: 0,
    });

    worker.onmessage = (event: MessageEvent) => {
      const { id, type, result, error } = event.data;

      const task = this.activeTasks.get(id);
      if (!task) return;

      this.activeTasks.delete(id);

      const status = this.workerStatuses.get(worker);
      if (status) {
        status.busy = false;
        status.currentTask = null;
        if (type === 'result') {
          status.completedTasks++;
          task.resolve(result);
        } else if (type === 'error') {
          status.errors++;
          task.reject(new Error(error || 'Worker task failed'));
        }
      }

      this.processNextTask();
    };

    worker.onerror = (event: ErrorEvent) => {
      const status = this.workerStatuses.get(worker);
      if (status && status.currentTask) {
        const task = this.activeTasks.get(status.currentTask);
        if (task) {
          this.activeTasks.delete(status.currentTask);
          task.reject(new Error(event.message || 'Worker error'));
        }
        status.busy = false;
        status.currentTask = null;
        status.errors++;
      }
      this.processNextTask();
    };

    return worker;
  }

  public async execute<T>(type: string, payload: any, cancelable = false): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const taskId = `task-${crypto.randomUUID?.() || Date.now()}-${Math.random()}`;
      const abortController = cancelable ? new AbortController() : undefined;

      const task: WorkerTask<T> = {
        id: taskId,
        type,
        payload,
        resolve,
        reject,
        abortController,
      };

      this.taskQueue.push(task);
      this.processNextTask();
    });
  }

  private processNextTask(): void {
    if (this.taskQueue.length === 0) return;

    const availableWorker = this.workers.find(worker => {
      const status = this.workerStatuses.get(worker);
      return status && !status.busy;
    });

    if (!availableWorker) return;

    const task = this.taskQueue.shift();
    if (!task) return;

    const status = this.workerStatuses.get(availableWorker);
    if (!status) return;

    status.busy = true;
    status.currentTask = task.id;
    this.activeTasks.set(task.id, task);

    if (task.abortController?.signal.aborted) {
      task.reject(new Error('Task was cancelled'));
      status.busy = false;
      status.currentTask = null;
      this.processNextTask();
      return;
    }

    availableWorker.postMessage({
      id: task.id,
      type: task.type,
      payload: task.payload,
    });
  }

  public cancelTask(taskId: string): boolean {
    const task = this.activeTasks.get(taskId);
    if (task && task.abortController) {
      task.abortController.abort();
      return true;
    }

    const queuedIndex = this.taskQueue.findIndex(t => t.id === taskId);
    if (queuedIndex >= 0) {
      const [removed] = this.taskQueue.splice(queuedIndex, 1);
      removed.reject(new Error('Task was cancelled'));
      return true;
    }

    return false;
  }

  public getStatus(): WorkerStatus[] {
    return Array.from(this.workerStatuses.values());
  }

  public getQueueLength(): number {
    return this.taskQueue.length;
  }

  public getActiveTaskCount(): number {
    return this.activeTasks.size;
  }

  public terminate(): void {
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.workerStatuses.clear();
    this.taskQueue.forEach(task => task.reject(new Error('Worker pool terminated')));
    this.taskQueue = [];
    this.activeTasks.clear();
  }

  public resize(newSize: number): void {
    newSize = Math.max(1, Math.min(newSize, 8));
    const diff = newSize - this.poolSize;

    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const worker = this.createWorker();
        this.workers.push(worker);
      }
    } else if (diff < 0) {
      for (let i = 0; i < -diff; i++) {
        const worker = this.workers.pop();
        if (worker) {
          const status = this.workerStatuses.get(worker);
          if (status && status.currentTask) {
            const task = this.activeTasks.get(status.currentTask);
            if (task) {
              this.taskQueue.unshift(task);
            }
          }
          worker.terminate();
          this.workerStatuses.delete(worker);
        }
      }
    }

    this.poolSize = newSize;
  }
}
