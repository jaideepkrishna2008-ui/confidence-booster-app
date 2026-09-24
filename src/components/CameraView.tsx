import React from 'react';
import { Download, X, Loader2, Play, Flame } from 'lucide-react';
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
    <div className="relative w-full h-full bg-[#05070a] overflow-hidden select-none">
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

      {/* Subtle Tactical Crosshair / Corner Brackets Overlay in Standby */}
      {!isZeroUi && state === 'STANDBY' && (
        <div className="absolute inset-0 pointer-events-none p-6 flex flex-col justify-between">
          <div className="flex justify-between w-full">
            <div className="w-8 h-8 border-t-2 border-l-2 border-cyber-green/40 rounded-tl-sm" />
            <div className="w-8 h-8 border-t-2 border-r-2 border-cyber-green/40 rounded-tr-sm" />
          </div>
          <div className="flex justify-between w-full mb-14">
            <div className="w-8 h-8 border-b-2 border-l-2 border-cyber-green/40 rounded-bl-sm" />
            <div className="w-8 h-8 border-b-2 border-r-2 border-cyber-green/40 rounded-br-sm" />
          </div>
        </div>
      )}

      {/* Edit Canvas Overlay (PiP or Fullscreen) */}
      <div
        className={`absolute transition-all duration-300 ease-out overflow-hidden font-mono ${
          !isPlaying && !isEditing
            ? 'pointer-events-none opacity-0 hidden'
            : isFullscreenTakeover
            ? 'inset-0 w-screen h-screen z-40 bg-black flex flex-col border-none shadow-none rounded-none'
            : isPlaying
            ? 'top-4 right-4 bottom-24 w-[42%] max-w-lg bg-black border-2 border-cyber-green shadow-2xl shadow-cyber-green/40 rounded-xl flex flex-col z-20 overflow-hidden'
            : 'top-4 right-4 w-56 h-40 md:w-64 md:h-44 bg-[#05080e]/95 border border-cyber-green/80 backdrop-blur-md rounded-xl z-20 flex flex-col overflow-hidden shadow-2xl shadow-cyber-green/20'
        }`}
      >
        {/* Header Bar */}
        {!isZeroUi && (isPlaying || isEditing) && (
          <div
            className={`flex items-center justify-between px-3 py-1.5 text-[10px] text-cyber-green z-30 select-none ${
              isFullscreenTakeover
                ? 'absolute top-4 right-4 bg-black/80 backdrop-blur-md rounded-xl border border-cyber-green/50 opacity-70 hover:opacity-100 transition-opacity gap-3 p-2 shadow-lg shadow-cyber-green/20'
                : 'bg-black/90 border-b border-cyber-green/30 flex-shrink-0'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-cyber font-bold flex items-center gap-1.5">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isPlaying
                      ? 'bg-cyber-pink animate-ping'
                      : isEditing
                      ? 'bg-amber-400 animate-pulse'
                      : 'bg-cyber-green'
                  }`}
                />
                {isPlaying
                  ? isFullscreenTakeover
                    ? 'STREAM TAKE-OVER LIVE'
                    : 'EDIT CLIP PLAYBACK'
                  : isEditing
                  ? 'GENERATING DROP EDIT...'
                  : 'AI MONITOR'}
              </span>
              {isPlaying && (
                <span className="flex items-center gap-1 text-[9px] bg-cyber-pink/20 text-cyber-pink border border-cyber-pink/40 px-1.5 py-0.2 rounded font-mono font-bold animate-pulse">
                  <Flame className="w-2.5 h-2.5 fill-current" />
                  MOGGED
                </span>
              )}
            </div>

            {isPlaying && (
              <div className="flex items-center gap-1.5 pointer-events-auto">
                {canDownload && (
                  <button
                    onClick={onDownloadClip}
                    disabled={isConverting}
                    className={`btn-cyber text-[9px] px-2 py-0.5 rounded transition-all ${
                      isConverting
                        ? 'border border-amber-400/50 text-amber-300 animate-pulse cursor-wait'
                        : 'btn-ghost-green'
                    }`}
                    title={isConverting ? 'Encoding MP4 video clip...' : 'Download edit clip (MP4)'}
                  >
                    {isConverting ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Download className="w-3 h-3" />
                    )}
                    <span className="hidden sm:inline">MP4</span>
                  </button>
                )}
                <button
                  onClick={onSkipEdit}
                  className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
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
                  ? 'animate-[spin_3s_linear_infinite] border-amber-400 scale-110 shadow-lg shadow-amber-400/30'
                  : 'opacity-75'
              }`}
              style={{
                clipPath:
                  'polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)',
              }}
            >
              <div className="w-12 h-12 rounded-full border border-dashed border-cyber-green opacity-60" />
            </div>

            <div className="absolute z-10 text-center font-cyber font-bold tracking-widest text-xs md:text-sm">
              {isEditing ? (
                <span className="text-amber-400 animate-pulse drop-shadow-[0_0_10px_rgba(251,191,36,0.9)]">
                  COMPOSITING EDIT...
                </span>
              ) : (
                <span className="text-cyber-green/70 text-[10px]">STANDBY</span>
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
