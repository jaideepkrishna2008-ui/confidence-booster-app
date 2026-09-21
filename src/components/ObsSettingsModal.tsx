import React, { useState } from 'react';
import { X, Tv, ExternalLink, EyeOff, Camera, Mic, CheckCircle2, Sliders } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none font-mono">
      <div className="bg-[#0b0f17] border border-cyber-green/50 rounded-md max-w-2xl w-full shadow-2xl shadow-cyber-green/20 flex flex-col overflow-hidden text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyber-green/30 bg-[#070b12]">
          <div className="flex items-center gap-2.5">
            <Tv className="w-5 h-5 text-cyber-green" />
            <h2 className="font-cyber font-bold text-sm tracking-wider text-cyber-green">
              STREAM & OBS BROADCAST SETTINGS
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded-sm hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-800 bg-black/40">
          <button
            onClick={() => setActiveTab('options')}
            className={`flex-1 py-2.5 text-xs font-bold font-cyber tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'options'
                ? 'border-b-2 border-cyber-green text-cyber-green bg-cyber-green/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            STREAM & WINDOW MODES
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`flex-1 py-2.5 text-xs font-bold font-cyber tracking-wider transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'guide'
                ? 'border-b-2 border-cyber-green text-cyber-green bg-cyber-green/5'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            OBS / DISCORD / MEET GUIDE
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'options' ? (
            <div className="space-y-4">
              {/* Virtual Cable Audio Broadcast Option */}
              <div className="p-4 bg-gray-950 border border-cyber-green/40 rounded flex items-center justify-between gap-4 shadow-lg shadow-cyber-green/10">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-cyber-green font-bold text-sm">
                    <Mic className="w-4 h-4" />
                    <span>Virtual Audio Cable Broadcast</span>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Routes microphone audio mixed with Phonk music into Windows Virtual Audio Cable
                    for Discord, Zoom, or Google Meet.
                  </p>
                </div>
                <button
                  onClick={handleToggleBroadcast}
                  className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                    isBroadcasting
                      ? 'bg-cyber-pink text-white hover:bg-red-600'
                      : 'bg-cyber-green text-black hover:bg-white'
                  }`}
                >
                  {isBroadcasting ? 'STOP BROADCAST' : 'START BROADCAST'}
                </button>
              </div>

              {/* Mode Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* PiP Floating Window */}
                <div className="p-4 bg-gray-950 border border-cyber-green/40 rounded flex flex-col justify-between gap-3 shadow-lg shadow-cyber-green/10 md:col-span-2">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-green font-bold text-sm">
                      <ExternalLink className="w-4 h-4" />
                      <span>Always-On-Top PiP Window (Best for Google Meet / OmeTV)</span>
                      <span className="text-[10px] bg-cyber-green/20 text-cyber-green px-2 py-0.5 rounded font-mono">
                        RECOMMENDED
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
                    className="w-full py-2.5 bg-cyber-green hover:bg-white text-black font-cyber font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-md shadow-cyber-green/30 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>LAUNCH ALWAYS-ON-TOP PIP</span>
                  </button>
                </div>

                {/* Pop-out Projector Window */}
                <div className="p-4 bg-gray-950 border border-cyber-cyan/40 rounded flex flex-col justify-between gap-3 shadow-lg shadow-cyber-cyan/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-cyan font-bold text-sm">
                      <Tv className="w-4 h-4" />
                      <span>Clean Pop-out Projector</span>
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
                    className="w-full py-2 bg-cyber-cyan hover:bg-white text-black font-cyber font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-md shadow-cyber-cyan/20 cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>LAUNCH PROJECTOR WINDOW</span>
                  </button>
                </div>

                {/* Zero UI Mode */}
                <div className="p-4 bg-gray-950 border border-cyber-green/40 rounded flex flex-col justify-between gap-3 shadow-lg shadow-cyber-green/10">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-cyber-green font-bold text-sm">
                      <EyeOff className="w-4 h-4" />
                      <span>Zero-UI Broadcast Mode</span>
                    </div>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      Hides all controls on this screen for immediate OBS Window Capture. Press{' '}
                      <kbd className="px-1 py-0.5 bg-gray-800 text-cyber-green rounded text-[10px]">
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
                    className="w-full py-2 bg-cyber-green hover:bg-white text-black font-cyber font-bold text-xs rounded transition-all flex items-center justify-center gap-2 shadow-md shadow-cyber-green/20 cursor-pointer"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>ENTER ZERO-UI MODE</span>
                  </button>
                </div>
              </div>

              {/* Toggles */}
              <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded text-xs">
                <span className="text-gray-300">Edit Takeover Mode:</span>
                <button
                  onClick={onToggleTakeoverMode}
                  className="px-3 py-1 bg-gray-800 border border-cyber-green/40 text-cyber-green rounded uppercase font-bold"
                >
                  {streamTakeoverMode}
                </button>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-950 border border-gray-800 rounded text-xs">
                <span className="text-gray-300">Auto-Cycle Edit Presets on Trigger:</span>
                <button
                  onClick={onToggleAutoCycle}
                  className={`px-3 py-1 rounded font-bold transition-colors ${
                    autoCyclePresets
                      ? 'bg-cyber-green text-black'
                      : 'bg-gray-800 text-gray-400'
                  }`}
                >
                  {autoCyclePresets ? 'ENABLED' : 'DISABLED'}
                </button>
              </div>
            </div>
          ) : (
            /* Setup Guide */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-black/60 border border-gray-800 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-cyber-green text-sm">
                  <span className="w-5 h-5 rounded-full bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    1
                  </span>
                  <span>Capture Feed in OBS Studio</span>
                </div>
                <p className="text-gray-300 pl-7">
                  Open OBS Studio. Under <strong>Sources</strong>, click <strong>+</strong> ➔{' '}
                  <strong>Window Capture</strong>.<br />
                  Select either your browser window or the Clean Pop-out Projector Window.
                </p>
              </div>

              <div className="p-3.5 bg-black/60 border border-gray-800 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-cyber-green text-sm">
                  <span className="w-5 h-5 rounded-full bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    2
                  </span>
                  <span>Start OBS Virtual Camera</span>
                </div>
                <p className="text-gray-300 pl-7">
                  In OBS Studio (bottom right Controls dock), click{' '}
                  <strong className="text-white">"Start Virtual Camera"</strong>.<br />
                  This registers a virtual webcam in Windows named{' '}
                  <code className="text-cyber-green bg-gray-900 px-1 py-0.5 rounded">
                    OBS Virtual Camera
                  </code>
                  .
                </p>
              </div>

              <div className="p-3.5 bg-black/60 border border-gray-800 rounded space-y-2">
                <div className="flex items-center gap-2 font-bold text-cyber-green text-sm">
                  <span className="w-5 h-5 rounded-full bg-cyber-green/20 border border-cyber-green flex items-center justify-center text-xs">
                    3
                  </span>
                  <span>Connect to Google Meet, OmeTV, Discord, or Teams</span>
                </div>
                <div className="pl-7 space-y-2.5 text-gray-300">
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

              <div className="p-3 bg-cyber-green/10 border border-cyber-green/30 rounded flex items-center gap-2.5 text-cyber-green text-[11px]">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>
                  Now sip water or adjust your glasses in your video chat — the Phonk edit and hard bass
                  drop will trigger automatically!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-black/60 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
          <span>Confidence Booster Tactical Stream Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded transition-colors text-xs font-bold"
          >
            CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
