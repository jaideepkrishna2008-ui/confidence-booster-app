import React from 'react';
import {
  Camera, FlipHorizontal, Volume2, VolumeX, Radio, Tv,
  Zap, Download, Maximize, Minimize, Sliders, Smile, Loader2,
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

// Slim icon-button with tooltip
const IconBtn: React.FC<{
  onClick: () => void;
  title: string;
  active?: boolean;
  activeColor?: string;
  danger?: boolean;
  children: React.ReactNode;
}> = ({ onClick, title, active, activeColor = 'cyber-green', danger, children }) => (
  <button
    onClick={onClick}
    title={title}
    className={`
      relative group p-1.5 rounded transition-all duration-150 cursor-pointer
      ${danger
        ? active ? 'text-cyber-pink bg-cyber-pink/15 border border-cyber-pink/40' : 'text-gray-400 hover:text-cyber-pink hover:bg-cyber-pink/10 border border-transparent'
        : active ? `text-${activeColor} bg-${activeColor}/10 border border-${activeColor}/40 shadow-[0_0_8px_rgba(0,255,102,0.2)]`
                 : 'text-gray-400 hover:text-white hover:bg-white/8 border border-transparent'
      }
    `}
  >
    {children}
    <span className="
      absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1
      text-[9px] font-mono bg-[#0a0e16]/95 border border-gray-700 rounded whitespace-nowrap
      opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50
    ">{title}</span>
  </button>
);

export const ControlBar: React.FC<ControlBarProps> = ({
  onSwitchCamera, onToggleMirror, isMirrored,
  soundMuted, onToggleSound, onOpenSoundboard, onOpenObsModal,
  triggerMode, onChangeTriggerMode, selectedPreset, onChangePreset,
  onForceTrigger, onDownloadClip, hasDownloadableClip,
  isConverting = false, sensitivity, onChangeSensitivity,
  isEditing, isMemeMode, onToggleMemeMode,
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
    <div className="
      absolute bottom-0 left-0 right-0 z-30
      flex items-center justify-between gap-1.5
      px-3 py-2
      bg-[#040810]/95 border-t border-cyber-green/25
      backdrop-blur-xl
      shadow-[0_-4px_30px_rgba(0,255,102,0.08)]
      select-none font-mono text-xs
      animate-slide-up
    ">

      {/* ── LEFT GROUP: Camera & Audio ─────────────────────────────── */}
      <div className="flex items-center gap-1">
        {/* Divider label */}
        <span className="text-[8px] text-gray-600 uppercase tracking-widest pr-1 hidden lg:block">CAM</span>

        <IconBtn onClick={onSwitchCamera} title="Switch Camera (Front / Rear)">
          <Camera className="w-3.5 h-3.5" />
        </IconBtn>

        <IconBtn onClick={onToggleMirror} title="Toggle Mirror" active={isMirrored}>
          <FlipHorizontal className="w-3.5 h-3.5" />
        </IconBtn>

        {/* Divider */}
        <div className="w-px h-5 bg-gray-700/70 mx-0.5" />

        <IconBtn onClick={onToggleSound} title={soundMuted ? 'Unmute Phonk' : 'Mute Phonk'} danger={soundMuted}>
          {soundMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </IconBtn>

        <button
          onClick={onOpenSoundboard}
          title="Phonk Soundboard"
          className="btn-ghost-green btn-cyber text-[9px] hidden sm:flex"
        >
          <Radio className="w-3 h-3" />
          TRACKS
        </button>

        <button
          onClick={onOpenObsModal}
          title="OBS & Virtual Cable Settings"
          className="btn-ghost-cyan btn-cyber text-[9px] hidden sm:flex"
        >
          <Tv className="w-3 h-3" />
          <span className="hidden md:inline">STREAM</span>
        </button>
      </div>

      {/* ── CENTER GROUP: Presets, Mode, TRIGGER ────────────────────── */}
      <div className="flex items-center gap-2 flex-1 justify-center max-w-lg">
        {/* Preset Selector */}
        <div className="relative hidden sm:block">
          <label className="absolute -top-3.5 left-0 text-[8px] text-gray-500 tracking-widest uppercase">PRESET</label>
          <select
            value={selectedPreset}
            onChange={(e) => onChangePreset(e.target.value as EditPreset)}
            className="select-cyber pr-6"
          >
            {Object.entries(PRESET_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* Trigger Mode Selector */}
        <div className="relative hidden md:block">
          <label className="absolute -top-3.5 left-0 text-[8px] text-gray-500 tracking-widest uppercase">MODE</label>
          <select
            value={triggerMode}
            onChange={(e) => onChangeTriggerMode(e.target.value as TriggerMode)}
            className="select-cyber pr-6"
          >
            {Object.entries(MODE_LABELS).map(([val, label]) => (
              <option key={val} value={val}>{label}</option>
            ))}
          </select>
        </div>

        {/* ── MAIN TRIGGER BUTTON ── */}
        <button
          onClick={onForceTrigger}
          disabled={isEditing}
          title="Trigger edit (or press SPACEBAR)"
          className={`
            btn-cyber text-[11px] px-4 py-2 relative overflow-hidden transition-all
            ${isEditing
              ? 'bg-amber-400/15 border border-amber-400/50 text-amber-300 cursor-wait animate-pulse'
              : 'btn-primary animate-neon-pulse hover:animate-none'
            }
          `}
        >
          {isEditing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              EDITING...
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-current" />
              TRIGGER
              <span className="hidden lg:inline ml-1 text-[8px] opacity-60">[ SPACE ]</span>
            </>
          )}
        </button>
      </div>

      {/* ── RIGHT GROUP: Sensitivity + Download + Fullscreen ─────── */}
      <div className="flex items-center gap-2">

        {/* Sensitivity Slider */}
        <div className="hidden lg:flex flex-col items-center gap-0.5">
          <div className="flex items-center gap-1">
            <Sliders className="w-2.5 h-2.5 text-gray-500" />
            <span className="text-[8px] text-gray-500 uppercase tracking-widest">SENS {sensitivity.toFixed(1)}×</span>
          </div>
          <input
            type="range" min="0.5" max="2" step="0.1"
            value={sensitivity}
            onChange={(e) => onChangeSensitivity(parseFloat(e.target.value))}
            className="slider-cyber w-20"
          />
        </div>

        {/* Download Button */}
        {hasDownloadableClip && (
          <button
            onClick={onDownloadClip}
            disabled={isConverting}
            title={isConverting ? 'Processing MP4...' : 'Download last clip'}
            className={`p-1.5 rounded border transition-all ${
              isConverting
                ? 'border-amber-400/40 text-amber-400 animate-pulse cursor-wait'
                : 'btn-ghost-green border border-cyber-green/40 hover:bg-cyber-green hover:text-black'
            }`}
          >
            {isConverting
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Download className="w-3.5 h-3.5" />
            }
          </button>
        )}

        {/* Fullscreen */}
        <IconBtn onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
          {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
        </IconBtn>
      </div>
    </div>
  );
};
