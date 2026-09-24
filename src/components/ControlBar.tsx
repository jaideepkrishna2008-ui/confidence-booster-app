import React, { useState } from 'react';
import {
  Camera, FlipHorizontal, Volume2, VolumeX, Radio, Tv,
  Zap, Download, Maximize, Minimize, Sliders, Loader2,
  Sparkles, ChevronDown, Activity,
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
  isMemeMode?: boolean;
  onToggleMemeMode?: () => void;
}

const PRESET_LABELS: Record<string, string> = {
  rotating_sigma_vortex: '🌀 Rotating Vortex',
  lightning_god_aura:    '⚡ Lightning God',
  ghost_trail_impact:    '👻 Ghost Trail',
  dark_manga_strobe:     '📖 Manga Strobe',
  sigma_hard_snaps:      '⚡ Sigma Snaps',
  parallax_dual_speed:   '💫 Parallax Dual',
};

const MODE_LABELS: Record<string, string> = {
  all:        'AUTO: ALL',
  expression: 'FACE EXPR',
  crazy:      'CRAZY MOV',
  both:       'DRINK+GLASS',
  drink:      'DRINK SIP',
  glasses:    'GLASSES',
};

// Compact icon button with tooltip
const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  active?: boolean;
  variant?: 'green' | 'cyan' | 'pink' | 'default';
  children: React.ReactNode;
}> = ({ onClick, title, active, variant = 'green', children }) => {
  let activeClasses = 'text-cyber-green bg-cyber-green/15 border-cyber-green/60 shadow-[0_0_10px_rgba(0,255,102,0.25)]';
  if (variant === 'pink') {
    activeClasses = 'text-cyber-pink bg-cyber-pink/15 border-cyber-pink/60 shadow-[0_0_10px_rgba(255,0,85,0.25)]';
  } else if (variant === 'cyan') {
    activeClasses = 'text-cyber-cyan bg-cyber-cyan/15 border-cyber-cyan/60 shadow-[0_0_10px_rgba(0,240,255,0.25)]';
  }

  const inactiveClasses = 'text-gray-400 bg-black/40 border-white/10 hover:text-white hover:border-cyber-green/40 hover:bg-cyber-green/5';

  return (
    <button
      onClick={onClick}
      title={title}
      className={`
        relative group h-8 w-8 rounded-lg border flex items-center justify-center
        transition-all duration-150 cursor-pointer select-none
        ${active ? activeClasses : inactiveClasses}
      `}
    >
      {children}
      <span className="
        absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
        text-[9px] font-mono bg-[#080d16]/95 text-gray-200 border border-gray-700/80 rounded-md
        whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200
        pointer-events-none z-50 shadow-lg
      ">
        {title}
      </span>
    </button>
  );
};

export const ControlBar: React.FC<ControlBarProps> = ({
  onSwitchCamera, onToggleMirror, isMirrored,
  soundMuted, onToggleSound, onOpenSoundboard, onOpenObsModal,
  triggerMode, onChangeTriggerMode, selectedPreset, onChangePreset,
  onForceTrigger, onDownloadClip, hasDownloadableClip,
  isConverting = false, sensitivity, onChangeSensitivity,
  isEditing,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

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
    <div className="
      absolute bottom-0 left-0 right-0 z-30
      bg-[#040810]/95 border-t border-cyber-green/30
      backdrop-blur-xl
      shadow-[0_-8px_32px_rgba(0,0,0,0.8),0_-1px_15px_rgba(0,255,102,0.12)]
      select-none font-mono text-xs
      py-2 px-3 md:px-6
      animate-slide-up
    ">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4 flex-wrap sm:flex-nowrap">

        {/* ── LEFT POD: Camera & Audio ─────────────────────────────── */}
        <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl p-1 backdrop-blur-md shrink-0">
          <IconBtn onClick={onSwitchCamera} title="Switch Camera (Front / Rear)">
            <Camera className="w-3.5 h-3.5" />
          </IconBtn>

          <IconBtn onClick={onToggleMirror} title="Toggle Mirror Mode" active={isMirrored} variant="green">
            <FlipHorizontal className="w-3.5 h-3.5" />
          </IconBtn>

          <div className="w-px h-5 bg-white/10 mx-0.5" />

          <IconBtn
            onClick={onToggleSound}
            title={soundMuted ? 'Unmute Phonk Audio' : 'Mute Phonk Audio'}
            active={soundMuted}
            variant="pink"
          >
            {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </IconBtn>

          <button
            onClick={onOpenSoundboard}
            title="Phonk Soundboard & Music Tracks"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-cyber font-bold tracking-wider uppercase bg-cyber-green/10 text-cyber-green border border-cyber-green/35 hover:bg-cyber-green/20 hover:border-cyber-green hover:shadow-[0_0_12px_rgba(0,255,102,0.25)] active:scale-95 transition-all cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">TRACKS</span>
          </button>

          <button
            onClick={onOpenObsModal}
            title="OBS Virtual Camera & Stream Settings"
            className="h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-cyber font-bold tracking-wider uppercase bg-cyber-cyan/10 text-cyber-cyan border border-cyber-cyan/35 hover:bg-cyber-cyan/20 hover:border-cyber-cyan hover:shadow-[0_0_12px_rgba(0,240,255,0.25)] active:scale-95 transition-all cursor-pointer"
          >
            <Tv className="w-3.5 h-3.5" />
            <span className="hidden md:inline">STREAM</span>
          </button>
        </div>

        {/* ── CENTER POD: Presets, Mode, Hero Trigger ─────────────────── */}
        <div className="flex items-center gap-2 bg-black/60 border border-cyber-green/25 rounded-xl p-1 shadow-[0_0_20px_rgba(0,255,102,0.08)] backdrop-blur-md">
          {/* Preset Selector */}
          <div className="relative hidden sm:flex items-center h-8 px-2.5 rounded-lg bg-black/80 border border-white/15 hover:border-cyber-green/50 focus-within:border-cyber-green focus-within:shadow-[0_0_12px_rgba(0,255,102,0.25)] transition-all gap-1.5">
            <span className="text-[9px] font-cyber font-bold text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5 text-cyber-green" />
              PRESET
            </span>
            <select
              value={selectedPreset}
              onChange={(e) => onChangePreset(e.target.value as EditPreset)}
              className="bg-transparent text-cyber-green font-mono text-[11px] font-bold focus:outline-none cursor-pointer appearance-none pr-5"
            >
              {Object.entries(PRESET_LABELS).map(([val, label]) => (
                <option key={val} value={val} className="bg-[#080d16] text-cyber-green font-mono">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-cyber-green pointer-events-none absolute right-2" />
          </div>

          {/* Trigger Mode Selector */}
          <div className="relative hidden md:flex items-center h-8 px-2.5 rounded-lg bg-black/80 border border-white/15 hover:border-cyber-cyan/50 focus-within:border-cyber-cyan focus-within:shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all gap-1.5">
            <span className="text-[9px] font-cyber font-bold text-gray-500 uppercase tracking-widest shrink-0 flex items-center gap-1">
              <Activity className="w-2.5 h-2.5 text-cyber-cyan" />
              MODE
            </span>
            <select
              value={triggerMode}
              onChange={(e) => onChangeTriggerMode(e.target.value as TriggerMode)}
              className="bg-transparent text-cyber-cyan font-mono text-[11px] font-bold focus:outline-none cursor-pointer appearance-none pr-5"
            >
              {Object.entries(MODE_LABELS).map(([val, label]) => (
                <option key={val} value={val} className="bg-[#080d16] text-cyber-cyan font-mono">
                  {label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-cyber-cyan pointer-events-none absolute right-2" />
          </div>

          {/* Main TRIGGER Button */}
          <button
            onClick={onForceTrigger}
            disabled={isEditing}
            title="Trigger Instant Edit (or press SPACEBAR)"
            className={`
              h-8 px-4 rounded-lg font-cyber font-black text-xs tracking-wider uppercase
              flex items-center gap-2 transition-all cursor-pointer select-none whitespace-nowrap
              ${isEditing
                ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300 animate-pulse cursor-wait'
                : 'bg-cyber-green text-black border border-cyber-green hover:bg-white hover:text-black hover:border-white shadow-[0_0_18px_rgba(0,255,102,0.5)] active:scale-95'
              }
            `}
          >
            {isEditing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-300" />
                <span>EDITING...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>TRIGGER</span>
                <span className="hidden lg:inline text-[8px] font-mono font-bold px-1.5 py-0.5 rounded bg-black/25 text-black">
                  SPACE
                </span>
              </>
            )}
          </button>
        </div>

        {/* ── RIGHT POD: Sensitivity, Download, Fullscreen ────────────── */}
        <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-xl p-1 backdrop-blur-md shrink-0">
          {/* Sensitivity Slider Pill */}
          <div className="hidden lg:flex items-center gap-2 h-8 px-2.5 rounded-lg bg-black/60 border border-white/10">
            <Sliders className="w-3 h-3 text-gray-400" />
            <span className="text-[9px] font-cyber text-gray-400 uppercase tracking-wider whitespace-nowrap">
              SENS <span className="text-cyber-green font-bold">{sensitivity.toFixed(1)}×</span>
            </span>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={sensitivity}
              onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
              className="slider-cyber w-16 cursor-pointer"
            />
          </div>

          {/* Download Clip Button */}
          {hasDownloadableClip && (
            <button
              onClick={onDownloadClip}
              disabled={isConverting}
              title={isConverting ? 'Processing MP4...' : 'Download last edit clip'}
              className={`h-8 px-2.5 rounded-lg flex items-center gap-1.5 text-[10px] font-cyber font-bold tracking-wider uppercase transition-all ${
                isConverting
                  ? 'bg-amber-400/20 border border-amber-400/60 text-amber-300 animate-pulse cursor-wait'
                  : 'bg-cyber-green text-black border border-cyber-green hover:bg-white hover:text-black shadow-[0_0_15px_rgba(0,255,102,0.4)] active:scale-95'
              }`}
            >
              {isConverting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">SAVE CLIP</span>
            </button>
          )}

          {/* Fullscreen Button */}
          <IconBtn
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            variant="default"
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </IconBtn>
        </div>

      </div>
    </div>
  );
};
