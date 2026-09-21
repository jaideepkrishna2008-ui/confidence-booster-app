import React from 'react';
import {
  Camera,
  FlipHorizontal,
  Volume2,
  VolumeX,
  Radio,
  Tv,
  Zap,
  Download,
  Maximize,
  Minimize,
  Sliders,
  Smile,
} from 'lucide-react';
import { TriggerMode, EditPreset } from '../types';

interface ControlBarProps {
  onSwitchCamera: () => void;
  onToggleMirror: () => void;
  isMirrored: boolean;
  soundMuted: boolean;
  onToggleSound: () => void;
  onOpenSoundboard: () => void;
  onOpenObsModal: () => void;
  triggerMode: TriggerMode;
  onChangeTriggerMode: (mode: TriggerMode) => void;
  selectedPreset: EditPreset;
  onChangePreset: (preset: EditPreset) => void;
  onForceTrigger: () => void;
  onDownloadClip: () => void;
  hasDownloadableClip: boolean;
  isConverting?: boolean;
  sensitivity: number;
  onChangeSensitivity: (val: number) => void;
  isEditing: boolean;
  isMemeMode: boolean;
  onToggleMemeMode: () => void;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  onSwitchCamera,
  onToggleMirror,
  isMirrored,
  soundMuted,
  onToggleSound,
  onOpenSoundboard,
  onOpenObsModal,
  triggerMode,
  onChangeTriggerMode,
  selectedPreset,
  onChangePreset,
  onForceTrigger,
  onDownloadClip,
  hasDownloadableClip,
  isConverting = false,
  sensitivity,
  onChangeSensitivity,
  isEditing,
  isMemeMode,
  onToggleMemeMode,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    } else {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    }
  };

  return (
    <div className="absolute bottom-3 left-3 right-3 z-30 flex items-center justify-between gap-2 px-3 py-2 bg-[#080d16]/90 border border-cyber-green/40 backdrop-blur-md rounded-md select-none font-mono text-xs shadow-xl shadow-black/80">
      {/* Left Camera & Audio Utilities */}
      <div className="flex items-center gap-1.5">
        <button
          onClick={onSwitchCamera}
          className="p-1.5 rounded hover:bg-cyber-green/20 text-cyber-green hover:text-white transition-colors"
          title="Switch Camera (Front/Rear)"
        >
          <Camera className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleMirror}
          className={`p-1.5 rounded transition-colors ${
            isMirrored ? 'text-cyber-green bg-cyber-green/10' : 'text-gray-400 hover:text-white'
          }`}
          title="Toggle Mirror Camera"
        >
          <FlipHorizontal className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSound}
          className={`p-1.5 rounded transition-colors ${
            soundMuted ? 'text-cyber-pink bg-cyber-pink/10' : 'text-cyber-green hover:text-white'
          }`}
          title={soundMuted ? 'Unmute Phonk Audio' : 'Mute Phonk Audio'}
        >
          {soundMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenSoundboard}
          className="flex items-center gap-1 px-2 py-1 bg-gray-900 border border-cyber-green/30 hover:border-cyber-green text-cyber-green rounded transition-colors"
          title="Phonk Soundboard"
        >
          <Radio className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">TRACKS</span>
        </button>

        <button
          onClick={onOpenObsModal}
          className="flex items-center gap-1 px-2 py-1 bg-gray-900 border border-cyber-cyan/40 hover:border-cyber-cyan text-cyber-cyan rounded transition-colors"
          title="OBS & Virtual Cable Settings"
        >
          <Tv className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">STREAM / OBS</span>
        </button>

        {/* Meme Matcher Mode Toggle */}
        <button
          onClick={onToggleMemeMode}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors border ${
            isMemeMode
              ? 'bg-cyber-pink/20 border-cyber-pink text-cyber-pink shadow-sm shadow-cyber-pink/30'
              : 'bg-gray-900 border-gray-700 text-gray-400 hover:text-white'
          }`}
          title="Toggle Real-time Meme Matcher Mode"
        >
          <Smile className="w-3.5 h-3.5" />
          <span className="hidden md:inline">MEME MODE</span>
        </button>
      </div>

      {/* Center Trigger Action Button & Preset Selection */}
      <div className="flex items-center gap-2">
        {/* Preset Selector */}
        <select
          value={selectedPreset}
          onChange={(e) => onChangePreset(e.target.value as EditPreset)}
          className="bg-black/80 border border-cyber-green/40 text-cyber-green text-[11px] rounded px-2 py-1 outline-none cursor-pointer focus:border-cyber-green"
        >
          <option value="ghost_trail_impact">Ghost Trail Impact</option>
          <option value="dark_manga_strobe">Dark Manga Invert</option>
          <option value="sigma_hard_snaps">Sigma Hard Snaps</option>
          <option value="parallax_dual_speed">Parallax Dual Speed</option>
        </select>

        {/* Trigger Mode Selector */}
        <select
          value={triggerMode}
          onChange={(e) => onChangeTriggerMode(e.target.value as TriggerMode)}
          className="hidden md:block bg-black/80 border border-gray-700 text-gray-300 text-[11px] rounded px-2 py-1 outline-none cursor-pointer"
        >
          <option value="both">Trigger: BOTH (Drink/Glasses)</option>
          <option value="drink">Trigger: DRINK SIP ONLY</option>
          <option value="glasses">Trigger: GLASSES ONLY</option>
        </select>

        {/* Manual Lock-In / Boost Button */}
        <button
          onClick={onForceTrigger}
          disabled={isEditing}
          className={`px-3 py-1.5 rounded font-cyber font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
            isEditing
              ? 'bg-amber-400/20 text-amber-400 border border-amber-400/40 animate-pulse'
              : 'bg-cyber-green text-black hover:bg-white shadow-lg shadow-cyber-green/30 active:scale-95'
          }`}
          title="Trigger edit manually (or press SPACEBAR)"
        >
          <Zap className="w-3.5 h-3.5 fill-current" />
          <span>{isEditing ? 'EDITING...' : 'TRIGGER (SPACE)'}</span>
        </button>
      </div>

      {/* Right Controls: Sensitivity, Download, Fullscreen */}
      <div className="flex items-center gap-2">
        {/* Sensitivity slider */}
        <div className="hidden lg:flex items-center gap-1.5 bg-black/50 px-2 py-1 rounded border border-gray-800">
          <Sliders className="w-3 h-3 text-gray-400" />
          <span className="text-[10px] text-gray-400">SENS:</span>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={sensitivity}
            onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
            className="w-16 accent-cyber-green h-1 bg-gray-700 rounded cursor-pointer"
          />
        </div>

        {/* Clip Download Button */}
        {hasDownloadableClip && (
          <button
            onClick={onDownloadClip}
            disabled={isConverting}
            className="p-1.5 rounded bg-gray-900 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-black transition-all"
            title="Download last recorded edit clip"
          >
            <Download className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={toggleFullscreen}
          className="p-1.5 rounded hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};
