class CameraService {
  private currentStream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private facingMode: 'user' | 'environment' = 'user';
  private isMirrored: boolean = true;

  async init(videoEl: HTMLVideoElement): Promise<MediaStream | null> {
    this.videoElement = videoEl;
    return this.startStream();
  }

  async startStream(): Promise<MediaStream | null> {
    this.stopStream();

    const idealConstraints: MediaStreamConstraints = {
      video: {
        facingMode: this.facingMode,
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
      },
      audio: false,
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
      this.currentStream = stream;
      const [track] = stream.getVideoTracks();

      if (track) {
        try {
          const caps: any = track.getCapabilities && track.getCapabilities();
          if (caps && caps.zoom && typeof caps.zoom.min === 'number') {
            await (track as any).applyConstraints({ advanced: [{ zoom: caps.zoom.min }] });
          }
        } catch {}
      }

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play();
      }

      return stream;
    } catch (err) {
      console.warn('Initial camera constraints failed, attempting fallback constraints:', err);
      const fallbackConstraints: MediaStreamConstraints = {
        video: { facingMode: this.facingMode },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      this.currentStream = stream;
      const [track] = stream.getVideoTracks();

      if (track) {
        try {
          const caps: any = track.getCapabilities && track.getCapabilities();
          if (caps && caps.zoom && typeof caps.zoom.min === 'number') {
            await (track as any).applyConstraints({ advanced: [{ zoom: caps.zoom.min }] });
          }
        } catch {}
      }

      if (this.videoElement) {
        this.videoElement.srcObject = stream;
        this.videoElement.playsInline = true;
        this.videoElement.muted = true;
        await this.videoElement.play();
      }

      return stream;
    }
  }

  async toggleFacingMode(): Promise<'user' | 'environment'> {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.isMirrored = this.facingMode === 'user';
    await this.startStream();
    return this.facingMode;
  }

  getFacingMode(): 'user' | 'environment' {
    return this.facingMode;
  }

  isFrontCamera(): boolean {
    return this.facingMode === 'user';
  }

  toggleMirror(): boolean {
    this.isMirrored = !this.isMirrored;
    return this.isMirrored;
  }

  getIsMirrored(): boolean {
    return this.isMirrored;
  }

  getStream(): MediaStream | null {
    return this.currentStream;
  }

  stopStream(): void {
    if (this.currentStream) {
      this.currentStream.getTracks().forEach((track) => track.stop());
      this.currentStream = null;
    }
    if (this.videoElement) {
      this.videoElement.srcObject = null;
    }
  }

  getVideoElement(): HTMLVideoElement | null {
    return this.videoElement;
  }
}

export const cameraService = new CameraService();
