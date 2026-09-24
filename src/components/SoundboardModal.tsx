import React, { useState } from 'react';
import { Volume2, X, Music, Play, Square, Radio, Disc3, Sparkles, Zap, Check } from 'lucide-react';
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
  const [activeSfx, setActiveSfx] = useState<'808' | 'scratch' | null>(null);

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

  const handleTrigger808 = async () => {
    setActiveSfx('808');
    await phonkAudio.playQuickPhonkTest();
    setTimeout(() => setActiveSfx(null), 600);
  };

  const handleTriggerScratch = async () => {
    setActiveSfx('scratch');
    await phonkAudio.playVinylScratch();
    setTimeout(() => setActiveSfx(null), 500);
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
                HIGH-OCTANE RUNTIMES // INSTANT TRIGGER & PREVIEWS
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
                  {/* Left: Disc + Track Info */}
                  <div className="flex items-center gap-3 min-w-0 flex-1 mr-3">
                    <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-cyan-400/20 text-cyan-300' : 'bg-gray-900 text-gray-500'}`}>
                      <Disc3 className={`w-4 h-4 ${isPlaying ? 'animate-spin text-cyber-pink' : ''}`} />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className={`font-cyber font-bold text-xs truncate ${isSelected ? 'text-cyan-300 glow-cyan' : 'text-gray-300'}`}>
                        {track.title}
                      </span>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5 flex items-center gap-2">
                        <span>{track.bpm} BPM</span>
                        <span>//</span>
                        <span className="text-gray-400 truncate">{track.vibe}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Clean Separate Controls */}
                  <div className="flex items-center gap-2.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Active Pill Badge */}
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[9px] bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded font-cyber font-bold border border-cyan-400/40 shadow-sm shadow-cyan-500/20">
                        <Check className="w-3 h-3 text-cyan-400" />
                        ACTIVE
                      </span>
                    )}

                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-3 px-1">
                        <span className="w-1 bg-cyber-pink rounded-full animate-[bounce_0.6s_infinite]" />
                        <span className="w-1 bg-cyan-400 rounded-full animate-[bounce_0.4s_infinite]" />
                        <span className="w-1 bg-cyber-green rounded-full animate-[bounce_0.5s_infinite]" />
                      </div>
                    )}

                    {/* Preview Button */}
                    <button
                      type="button"
                      onClick={(e) => handleTogglePreview(trackKey, e)}
                      className={`btn-cyber text-[10px] px-3 py-1.5 rounded-lg border transition-all ${
                        isPlaying
                          ? 'bg-cyber-pink/20 text-cyber-pink border-cyber-pink shadow-md shadow-cyber-pink/30 hover:bg-cyber-pink hover:text-white'
                          : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/40 hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
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
          <div className="flex items-center gap-1.5 text-[11px] text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-cyber font-bold tracking-wider">TACTICAL SFX:</span>
          </div>
          <div className="flex gap-2.5">
            <button
              onClick={handleTrigger808}
              className={`btn-cyber text-[10px] px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeSfx === '808'
                  ? 'bg-cyan-400 text-black border-cyan-400 shadow-lg shadow-cyan-400/50 scale-105'
                  : 'bg-cyan-950/50 text-cyan-300 border-cyan-500/40 hover:bg-cyan-400 hover:text-black hover:border-cyan-400'
              }`}
            >
              <Zap className={`w-3.5 h-3.5 ${activeSfx === '808' ? 'fill-current animate-bounce' : ''}`} />
              <span>808 BASS DROP</span>
            </button>
            <button
              onClick={handleTriggerScratch}
              className={`btn-cyber text-[10px] px-3.5 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                activeSfx === 'scratch'
                  ? 'bg-cyber-pink text-white border-cyber-pink shadow-lg shadow-cyber-pink/50 scale-105'
                  : 'bg-pink-950/40 text-pink-300 border-pink-500/40 hover:bg-cyber-pink hover:text-white hover:border-cyber-pink'
              }`}
            >
              <Disc3 className={`w-3.5 h-3.5 ${activeSfx === 'scratch' ? 'animate-spin' : ''}`} />
              <span>VINYL SCRATCH</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
