class DevicePerformanceManager {
  private _isMobile: boolean = false;
  private _isTouch: boolean = false;
  private _isLowPower: boolean = false;

  constructor() {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return;
    }
    const ua = navigator.userAgent || '';
    const isMobileUa = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(ua);
    const hasTouch = (navigator.maxTouchPoints || 0) > 1 || 'ontouchstart' in window;
    const isSmallScreen = window.innerWidth <= 820 || window.innerHeight <= 820;

    this._isMobile = isMobileUa || (hasTouch && isSmallScreen);
    this._isTouch = hasTouch;
    const cores = navigator.hardwareConcurrency || 4;
    this._isLowPower = this._isMobile || cores <= 4;
  }

  isMobile(): boolean {
    return this._isMobile;
  }

  isTouch(): boolean {
    return this._isTouch;
  }

  isLowPower(): boolean {
    return this._isLowPower;
  }

  getAiDetectIntervalMs(): number {
    return this._isMobile ? 90 : 50;
  }

  getBufferPushIntervalMs(): number {
    return this._isMobile ? 50 : 33;
  }

  getMaxBufferDurationMs(): number {
    return this._isMobile ? 3800 : 6500;
  }

  getBufferTargetWidth(): number {
    return this._isMobile ? 480 : 854;
  }

  getVisionInputSize(): { width: number; height: number } {
    return this._isMobile ? { width: 288, height: 288 } : { width: 320, height: 240 };
  }
}

export const deviceManager = new DevicePerformanceManager();
