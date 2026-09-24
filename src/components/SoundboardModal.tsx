import React, { useState } from 'react';
import { Volume2, X, Music, Play, Square, Radio, Disc3, Sparkles } from 'lucide-react';
import { SOUND_TRACKS } from '../services/broadcastAudioEngine';
import { phonkAudio } from '../services/phonkAudioEngine';

interface SoundboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTrack: string;
  onSelectTrack: (trackId: string) => void;
  volume: number;
  onVolumeChange: (vol: number) => void;
}

export const SoundboardModal: React.FC<SoundboardModalProps> = ({
  isOpen,
  onClose,
  selectedTrack,
  onSelectTrack,
  volume,
  onVolumeChange,
}) => {
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTogglePreview = (trackKey: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingPreview === trackKey) {
      phonkAudio.stop();
      setPlayingPreview(null);
    } else {
      setPlayingPreview(trackKey);
      phonkAudio.playEditSequence(trackKey, () => {}, () => {
        setPlayingPreview(null);
      });
    }
  };

  const handleClose = () => {
    if (playingPreview) {
      phonkAudio.stop();
      setPlayingPreview(null);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-mono animate-modal-in">
      <div className="glass-panel-cyan rounded-2xl max-w-xl w-full p-6 shadow-2xl shadow-cyan-500/20 flex flex-col gap-5 text-white border-glow-cyan">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-cyan-500/25 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-cyber font-bold text-sm tracking-wider text-cyan-400 glow-cyan">
                PHONK SOUNDBOARD & AUDIO DECK
              </h2>
              <p className="text-[10px] text-gray-400 font-mono">
                HIGH-OCTANE PHONK RUNTIMES // AUTOMATIC SYNC WITH AI BRAIN
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Master Volume Console */}
        <div className="flex items-center gap-3 bg-black/60 p-3 rounded-xl border border-cyan-500/25">
          <div className="p-1.5 rounded bg-cyan-500/10 text-cyan-400">
            <Volume2 className="w-4 h-4" />
          </div>
          <span className="text-[11px] text-gray-300 font-cyber">MASTER GAIN:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={volume}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
            className="slider-cyber flex-1"
          />
          <div className="px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-xs font-bold font-mono">
            {Math.round(volume * 100)}%
          </div>
        </div>

        {/* Tracks List */}
        <div className="flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-300 font-cyber font-bold uppercase tracking-wider flex items-center gap-2">
              <Music className="w-4 h-4 text-cyber-pink" />
              SELECT ACTIVE SOUNDTRACK PRESET
            </span>
            <span className="text-[9px] text-cyan-500/80 uppercase">
              {Object.keys(SOUND_TRACKS).length} AUDIO STREAMS LOADED
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5 max-h-64 overflow-y-auto pr-1">
            {Object.keys(SOUND_TRACKS).map((trackKey) => {
              const track = SOUND_TRACKS[trackKey];
              const isSelected = selectedTrack === trackKey;
              const isPlaying = playingPreview === trackKey;

              return (
                <div
                  key={trackKey}
                  onClick={() => onSelectTrack(trackKey)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? 'border-cyan-400 bg-cyan-950/40 text-white shadow-lg shadow-cyan-500/15 ring-1 ring-cyan-400/40'
                      : 'border-gray-800/80 bg-gray-950/60 text-gray-300 hover:border-cyan-500/40 hover:bg-gray-900/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Visual Disk / Equalizer Icon */}
                    <div className={`p-2 rounded-lg ${isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-gray-900 text-gray-500'}`}>
                      <Disc3 className={`w-4 h-4 ${isPlaying ? 'animate-spin text-cyber-pink' : ''}`} />
                    </div>

                    <div className="flex flex-col">
                      <div className="font-cyber font-bold text-xs flex items-center gap-2">
                        <span className={isSelected ? 'text-cyan-400 glow-cyan' : 'text-gray-400'}>
                          {track.title}
                        </span>
                        {isSelected && (
                          <span className="text-[9px] bg-cyan-500/20 text-cyan-300 px-1.5 py-0.2 rounded font-mono border border-cyan-500/30">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{track.bpm} BPM</span>
                        <span>//</span>
                        <span className="text-gray-300">{track.vibe}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-3 px-1">
                        <span className="w-1 bg-cyber-pink rounded-full animate-[bounce_0.6s_infinite]" />
                        <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.4s_infinite]" />
                        <span className="w-1 bg-cyber-green rounded-full animate-[bounce_0.5s_infinite]" />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(trackKey, e)}
                      className={`btn-cyber text-[10px] px-2.5 py-1 ${
                        isPlaying
                          ? 'btn-ghost-pink text-cyber-pink border-cyber-pink'
                          : 'btn-ghost-cyan'
                      }`}
                      title={isPlaying ? 'Stop beat preview' : 'Preview track beat'}
                    >
                      {isPlaying ? (
                        <>
                          <Square className="w-3 h-3 fill-current" />
                          STOP
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 fill-current" />
                          PREVIEW
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick SFX Console */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-800">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <Sparkles className="w-3 h-3 text-cyan-400" />
            <span className="font-cyber font-bold">TACTICAL SFX:</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => phonkAudio.playQuickPhonkTest()}
              className="btn-cyber btn-ghost-cyan text-[10px] px-3 py-1"
            >
              808 Bass Drop
            </button>
            <button
              onClick={() => phonkAudio.playVinylScratch()}
              className="btn-cyber btn-ghost-pink text-[10px] px-3 py-1"
            >
              Vinyl Scratch
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
