class RecorderService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private lastBlobUrl: string | null = null;
  private isRecording: boolean = false;
  private isConverting: boolean = false;
  private onStateChange: ((converting: boolean) => void) | null = null;

  setOnStateChange(cb: (converting: boolean) => void): void {
    this.onStateChange = cb;
  }

  getIsConverting(): boolean {
    return this.isConverting;
  }

  startRecording(canvas: HTMLCanvasElement, audioStream?: MediaStream | null): void {
    this.stopRecording();
    this.recordedChunks = [];
    if (this.lastBlobUrl) {
      URL.revokeObjectURL(this.lastBlobUrl);
      this.lastBlobUrl = null;
    }
    this.isConverting = false;
    this.onStateChange?.(false);

    try {
      const streamTracks = [...(canvas as any).captureStream(30).getVideoTracks()];
      if (audioStream) {
        audioStream.getAudioTracks().forEach((track) => {
          streamTracks.push(track);
        });
      }

      const combinedStream = new MediaStream(streamTracks);
      const mimeTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4;codecs=avc1',
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=h264',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm',
      ];

      const selectedMime = mimeTypes.find((mime) => MediaRecorder.isTypeSupported(mime)) || 'video/webm';

      this.mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: MediaRecorder.isTypeSupported(selectedMime) ? selectedMime : undefined,
        videoBitsPerSecond: 4000000,
      });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          this.recordedChunks.push(e.data);
        }
      };

      this.mediaRecorder.onstop = () => {
        if (this.recordedChunks.length > 0) {
          const mime = this.mediaRecorder?.mimeType || 'video/webm';
          const blob = new Blob(this.recordedChunks, { type: mime });
          this.lastBlobUrl = URL.createObjectURL(blob);
          this.onStateChange?.(false);
          console.log(`[ClipRecorder] Recording finished! Size: ${(blob.size / 1024 / 1024).toFixed(2)} MB`);
        }
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (err) {
      console.warn('MediaRecorder error:', err);
    }
  }

  stopRecording(): string | null {
    if (this.isRecording && this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }
    this.isRecording = false;
    return this.lastBlobUrl;
  }

  getLastDownloadUrl(): string | null {
    return this.lastBlobUrl;
  }

  async downloadLastClip(filename: string = 'sigma_phonk_edit.mp4'): Promise<void> {
    const url = this.lastBlobUrl;
    if (!url) return;
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
}

export const recorderService = new RecorderService();
