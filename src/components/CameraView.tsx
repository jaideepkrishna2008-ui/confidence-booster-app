import React from 'react';
import { Download, X, Loader2 } from 'lucide-react';
import { AppState, TakeoverMode } from '../types';

interface CameraViewProps {
  state: AppState;
  videoRef: React.RefObject<HTMLVideoElement>;
  liveCanvasRef: React.RefObject<HTMLCanvasElement>;
  editCanvasRef: React.RefObject<HTMLCanvasElement>;
  onSkipEdit: () => void;
  onDownloadClip: () => void;
  canDownload: boolean;
  isConverting?: boolean;
  takeoverMode?: TakeoverMode;
  isZeroUi?: boolean;
}

export const CameraView: React.FC<CameraViewProps> = ({
  state,
  videoRef,
  liveCanvasRef,
  editCanvasRef,
  onSkipEdit,
  onDownloadClip,
  canDownload,
  isConverting = false,
  takeoverMode = 'fullscreen',
  isZeroUi = false,
}) => {
  const isPlaying = state === 'PLAYING';
  const isEditing = state === 'EDITING';
  const isFullscreenTakeover = isPlaying && takeoverMode === 'fullscreen';

  return (
    <div className="relative w-full h-full bg-black overflow-hidden select-none">
      {/* Hidden Live Video Source */}
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '4px',
          height: '4px',
          opacity: 0.01,
          pointerEvents: 'none',
          zIndex: -9999,
        }}
      />

      {/* Main Live Camera Feed Canvas */}
      <canvas
        ref={liveCanvasRef}
        className="w-full h-full object-cover select-none"
      />

      {/* Edit Canvas Overlay (PiP or Fullscreen) */}
      <div
        className={`absolute transition-all duration-300 ease-out overflow-hidden font-mono ${
          !isPlaying && !isEditing
            ? 'pointer-events-none opacity-0 hidden'
            : isFullscreenTakeover
            ? 'inset-0 w-screen h-screen z-40 bg-black flex flex-col border-none shadow-none rounded-none'
            : isPlaying
            ? 'top-4 right-4 bottom-24 w-[42%] max-w-lg bg-black border-2 border-cyber-green shadow-2xl shadow-cyber-green/40 rounded-sm flex flex-col z-20'
            : 'top-4 right-4 w-56 h-40 md:w-64 md:h-44 bg-[#05080e]/90 border border-cyber-green/80 backdrop-blur-md rounded-sm z-20 flex flex-col'
        }`}
      >
        {/* Header Bar */}
        {!isZeroUi && (isPlaying || isEditing) && (
          <div
            className={`flex items-center justify-between px-2.5 py-1 text-[10px] text-cyber-green z-30 select-none ${
              isFullscreenTakeover
                ? 'absolute top-3 right-4 bg-black/70 backdrop-blur-md rounded border border-cyber-green/40 opacity-50 hover:opacity-100 transition-opacity gap-3'
                : 'bg-black/80 border-b border-cyber-green/30 flex-shrink-0'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-bold flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isPlaying
                      ? 'bg-cyber-pink animate-ping'
                      : isEditing
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-cyber-green'
                  }`}
                />
                {isPlaying
                  ? isFullscreenTakeover
                    ? 'STREAM EDIT LIVE'
                    : 'EDIT PLAYBACK'
                  : isEditing
                  ? 'EDITING...'
                  : 'MONITOR'}
              </span>
            </div>

            {isPlaying && (
              <div className="flex items-center gap-1 pointer-events-auto">
                {canDownload && (
                  <button
                    onClick={onDownloadClip}
                    disabled={isConverting}
                    className={`p-1 transition-colors ${
                      isConverting
                        ? 'text-amber-400 animate-pulse cursor-wait'
                        : 'text-cyber-green hover:text-white'
                    }`}
                    title={isConverting ? 'Processing fast-start MP4...' : 'Download edit clip (MP4)'}
                  >
                    {isConverting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                  </button>
                )}
                <button
                  onClick={onSkipEdit}
                  className="p-1 text-gray-400 hover:text-white transition-colors"
                  title="Close edit player"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        )}

        {/* Edit Canvas & Loading State */}
        <div className="relative flex-1 w-full h-full overflow-hidden bg-black flex items-center justify-center">
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center transition-opacity duration-200 ${
              isPlaying ? 'opacity-0 pointer-events-none hidden' : 'opacity-100 flex'
            }`}
          >
            {/* Reticle Spinner */}
            <div
              className={`relative w-20 h-20 md:w-24 md:h-24 border border-cyber-green flex items-center justify-center transition-transform ${
                isEditing
                  ? 'animate-[spin_4s_linear_infinite] border-amber-400 scale-110 shadow-lg shadow-amber-400/20'
                  : 'opacity-75'
              }`}
              style={{
                clipPath:
                  'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              }}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-cyber-green opacity-60" />
            </div>

            <div className="absolute z-10 text-center font-bold tracking-widest text-xs md:text-sm">
              {isEditing ? (
                <span className="text-amber-400 animate-pulse font-mono drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]">
                  EDITING...
                </span>
              ) : (
                <span className="text-cyber-green/70 text-[10px] font-mono">STANDBY</span>
              )}
            </div>
          </div>

          <canvas
            ref={editCanvasRef}
            className={`w-full h-full ${
              isFullscreenTakeover ? 'object-cover' : 'object-contain'
            } transition-opacity duration-300 ${
              isPlaying ? 'opacity-100 block' : 'opacity-0 pointer-events-none hidden'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
