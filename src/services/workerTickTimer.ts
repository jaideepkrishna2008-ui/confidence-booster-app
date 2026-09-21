class WorkerTickTimer {
  private worker: Worker | null = null;
  private listeners: Set<(time: number) => void> = new Set();
  private isRunning: boolean = false;
  private lastRafTime: number = performance.now();

  constructor() {
    this.initWorker();
  }

  private initWorker(): void {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') return;

    try {
      const code = `
        let timer = null;
        self.onmessage = function(e) {
          if (e.data === 'start') {
            if (!timer) {
              timer = setInterval(function() {
                self.postMessage(performance.now());
              }, 1000 / 60); // 60 FPS continuous background clock (~16.66ms)
            }
          } else if (e.data === 'stop') {
            if (timer) {
              clearInterval(timer);
              timer = null;
            }
          }
        };
      `;
      const blob = new Blob([code], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      this.worker = new Worker(url);
      this.worker.onmessage = (ev) => {
        const timestamp = ev.data || performance.now();
        if (timestamp - this.lastRafTime >= 18) {
          this.dispatchTick(timestamp);
        }
      };
    } catch (err) {
      console.warn('[UnthrottledDriver] Web Worker not available, using fallback timer:', err);
    }
  }

  register(listener: (time: number) => void): () => void {
    this.listeners.add(listener);
    if (!this.isRunning) {
      this.start();
    }
    return () => {
      this.listeners.delete(listener);
      if (this.listeners.size === 0) {
        this.stop();
      }
    };
  }

  recordRafTick(time: number = performance.now()): void {
    this.lastRafTime = time;
  }

  private dispatchTick(time: number = performance.now()): void {
    for (const listener of this.listeners) {
      try {
        listener(time);
      } catch (err) {
        console.error('[UnthrottledDriver] Listener error:', err);
      }
    }
  }

  start(): void {
    this.isRunning = true;
    this.worker?.postMessage('start');
  }

  stop(): void {
    this.isRunning = false;
    this.worker?.postMessage('stop');
  }
}

export const workerTickTimer = new WorkerTickTimer();
