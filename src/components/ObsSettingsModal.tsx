import React, { useState } from 'react';
import { X, Tv, ExternalLink, EyeOff, Camera, Mic, CheckCircle2, Sliders, ShieldCheck } from 'lucide-react';
import { broadcastAudio } from '../services/broadcastAudioEngine';
import { TakeoverMode } from '../types';

interface ObsSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  streamTakeoverMode: TakeoverMode;
  onToggleTakeoverMode: () => void;
  autoCyclePresets: boolean;
  onToggleAutoCycle: () => void;
  onEnterZeroUi: () => void;
  onOpenProjector: (mode: 'pip' | 'window') => void;
  currentPreset: string;
}

export const ObsSettingsModal: React.FC<ObsSettingsModalProps> = ({
  isOpen,
  onClose,
  streamTakeoverMode,
  onToggleTakeoverMode,
  autoCyclePresets,
  onToggleAutoCycle,
  onEnterZeroUi,
  onOpenProjector,
}) => {
  const [activeTab, setActiveTab] = useState<'options' | 'guide'>('options');
  const [isBroadcasting, setIsBroadcasting] = useState(broadcastAudio.getIsBroadcasting());

  if (!isOpen) return null;

  const handleToggleBroadcast = async () => {
    if (isBroadcasting) {
      broadcastAudio.stopBroadcast();
      setIsBroadcasting(false);
    } else {
      const res = await broadcastAudio.startBroadcast();
      setIsBroadcasting(res.success);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md select-none font-mono animate-modal-in">
      <div className="glass-panel rounded-2xl max-w-2xl w-full shadow-2xl shadow-cyber-green/20 flex flex-col overflow-hidden text-white border-glow-green">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-cyber-green/25 bg-[#060a12]/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyber-green/10 border border-cyber-green/30 text-cyber-green">
              <Tv className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="font-cyber font-bold text-sm tracking-wider text-cyber-green glow-green">
                STREAM ENGINE & OBS BROADCAST
              </h2>
              <p className="text-[10px] text-gray-400 font-mono">
                DISCORD // GOOGLE MEET // ZOOM // OBS VIRTUAL CAM INTEGRATION
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800/80 bg-black/50">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-3 text-xs font-bold font-cyber tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'options'
                ? 'border-b-2 border-cyber-green text-cyber-green bg-cyber-green/10 shadow-[inset_0_-2px_8px_rgba(0,255,102,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-4 h-4" />
            STREAM & WINDOW MODES
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-3 text-xs font-bold font-cyber tracking-wider transition-all flex items-center justify-center gap-2 ${
              activeTab === 'guide'
                ? 'border-b-2 border-cyber-green text-cyber-green bg-cyber-green/10 shadow-[inset_0_-2px_8px_rgba(0,255,102,0.2)]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            OBS / DISCORD / MEET SETUP GUIDE
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[68vh] overflow-y-auto space-y-4">
          {activeTab === 'options' ? (
            <div className="space-y-4">
              {/* Virtual Cable Audio Broadcast Option */}
              <div className="p-4 bg-gray-950/80 border border-cyber-green/30 rounded-xl flex items-center justify-between gap-4 shadow-lg shadow-cyber-green/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyber-green font-bold text-sm font-cyber">
                    <Mic className="w-4 h-4" />
                    <span>Virtual Audio Cable Broadcast</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    Routes live microphone audio mixed with Phonk music into Windows Virtual Audio Cable (VB-CABLE)
                    for Discord, Zoom, or Google Meet.
                  </p>
                </div>
                <button
                  onClick={handleToggleBroadcast}
                  className={`btn-cyber px-4 py-2 text-xs font-bold ${
                    isBroadcasting
                      ? 'bg-cyber-pink text-white border-cyber-pink shadow-md shadow-cyber-pink/30 hover:bg-red-600'
                      : 'btn-primary'
                  }`}
                >
                  {isBroadcasting ? 'STOP BROADCAST' : 'START BROADCAST'}
                </button>
              </div>

              {/* Mode Options Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* PiP Floating Window */}
                <div className="p-4 bg-gray-950/80 border border-cyber-green/30 rounded-xl flex flex-col justify-between gap-3 shadow-lg shadow-cyber-green/5 md:col-span-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-green font-bold text-sm font-cyber">
                      <ExternalLink className="w-4 h-4" />
                      <span>Always-On-Top PiP Window</span>
                      <span className="text-[9px] bg-cyber-green/20 text-cyber-green px-2 py-0.5 rounded font-mono border border-cyber-green/30">
                        BEST FOR MEET / OMETV
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-300 leading-relaxed">
                      Creates an unthrottled, <strong>always-on-top floating camera window</strong> in
                      the corner of your screen that floats directly over Google Meet, Teams, or OmeTV.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenProjector('pip');
                      onClose();
                    }}
                    className="w-full py-2.5 btn-primary btn-cyber text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-cyber-green/25"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>LAUNCH ALWAYS-ON-TOP PIP</span>
                  </button>
                </div>

                {/* Pop-out Projector Window */}
                <div className="p-4 bg-gray-950/80 border border-cyber-cyan/30 rounded-xl flex flex-col justify-between gap-3 shadow-lg shadow-cyber-cyan/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-cyan font-bold text-sm font-cyber">
                      <Tv className="w-4 h-4" />
                      <span>Pop-out Clean Projector</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Opens a clean, borderless 16:9 window with <strong>ZERO UI</strong> powered by an
                      independent 60 FPS video decoder. Perfect for secondary screens or OBS capture.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onOpenProjector('window');
                      onClose();
                    }}
                    className="w-full py-2 btn-ghost-cyan btn-cyber text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>LAUNCH PROJECTOR WINDOW</span>
                  </button>
                </div>

                {/* Zero UI Mode */}
                <div className="p-4 bg-gray-950/80 border border-cyber-green/30 rounded-xl flex flex-col justify-between gap-3 shadow-lg shadow-cyber-green/5">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-green font-bold text-sm font-cyber">
                      <EyeOff className="w-4 h-4" />
                      <span>Zero-UI Broadcast Mode</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Hides all controls on this screen for immediate OBS Window Capture. Press{' '}
                      <kbd className="px-1.5 py-0.5 bg-gray-900 border border-cyber-green/40 text-cyber-green rounded text-[10px] font-mono">
                        ESC
                      </kbd>{' '}
                      anytime to restore controls.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onEnterZeroUi();
                      onClose();
                    }}
                    className="w-full py-2 btn-ghost-green btn-cyber text-xs rounded-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ENTER ZERO-UI MODE</span>
                  </button>
                </div>
              </div>

              {/* Toggles Console */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center justify-between p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs">
                  <span className="text-gray-300 font-cyber">EDIT TAKEOVER:</span>
                  <button
                    onClick={onToggleTakeoverMode}
                    className="px-3 py-1 bg-cyber-green/10 border border-cyber-green/40 text-cyber-green rounded-lg uppercase font-bold font-mono hover:bg-cyber-green hover:text-black transition-colors"
                  >
                    {streamTakeoverMode}
                  </button>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-gray-950/80 border border-gray-800 rounded-xl text-xs">
                  <span className="text-gray-300 font-cyber">PRESET AUTO-CYCLE:</span>
                  <button
                    onClick={onToggleAutoCycle}
                    className={`px-3 py-1 rounded-lg font-bold font-mono transition-colors ${
                      autoCyclePresets
                        ? 'bg-cyber-green text-black shadow-md shadow-cyber-green/30'
                        : 'bg-gray-800 text-gray-400'
                    }`}
                  >
                    {autoCyclePresets ? 'ENABLED' : 'DISABLED'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Setup Guide */
            <div className="space-y-4 text-xs">
              <div className="p-4 bg-black/60 border border-cyber-green/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 font-bold text-cyber-green text-sm font-cyber">
                  <span className="w-6 h-6 rounded-lg bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Capture Feed in OBS Studio</span>
                </div>
                <p className="text-gray-300 pl-8.5 leading-relaxed">
                  Open OBS Studio. Under <strong>Sources</strong>, click <strong>+</strong> ➔{' '}
                  <strong>Window Capture</strong>.<br />
                  Select either your browser window or the Clean Pop-out Projector Window.
                </p>
              </div>

              <div className="p-4 bg-black/60 border border-cyber-green/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 font-bold text-cyber-green text-sm font-cyber">
                  <span className="w-6 h-6 rounded-lg bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Start OBS Virtual Camera</span>
                </div>
                <p className="text-gray-300 pl-8.5 leading-relaxed">
                  In OBS Studio (bottom right Controls dock), click{' '}
                  <strong className="text-white">"Start Virtual Camera"</strong>.<br />
                  This registers a virtual webcam in Windows named{' '}
                  <code className="text-cyber-green bg-gray-900 px-1.5 py-0.5 rounded border border-cyber-green/30">
                    OBS Virtual Camera
                  </code>.
                </p>
              </div>

              <div className="p-4 bg-black/60 border border-cyber-green/20 rounded-xl space-y-2">
                <div className="flex items-center gap-2.5 font-bold text-cyber-green text-sm font-cyber">
                  <span className="w-6 h-6 rounded-lg bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Connect to Google Meet, OmeTV, Discord, or Teams</span>
                </div>
                <div className="pl-8.5 space-y-2 text-gray-300 leading-relaxed">
                  <p>
                    In your meeting video settings, choose <strong>"OBS Virtual Camera"</strong>.
                  </p>
                  <p>
                    To stream both your voice AND the Phonk drop, install the free{' '}
                    <strong>VB-CABLE Virtual Audio Driver</strong>, set monitoring to CABLE Input,
                    and pick CABLE Output as your mic!
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-cyber-green/10 border border-cyber-green/30 rounded-xl flex items-center gap-3 text-cyber-green text-xs">
                <ShieldCheck className="w-5 h-5 flex-shrink-0 text-cyber-green" />
                <span>
                  Now sip water, adjust glasses, or make a sigma face in your meeting — the AI will detect it and trigger the drop automatically!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-black/80 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span className="font-cyber text-[10px] text-gray-500">CONFIDENCE BOOSTER ENGINE v2.0 // OBS CERTIFIED</span>
          <button
            onClick={onClose}
            className="btn-cyber btn-primary text-xs px-4 py-1.5"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
