import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from './components/CameraView';
import { TacticalHUD, renderHeadWireframe } from './components/TacticalHUD';
import { ControlBar } from './components/ControlBar';
import { SoundboardModal } from './components/SoundboardModal';
import { ObsSettingsModal } from './components/ObsSettingsModal';
import { cameraService } from './services/cameraService';
import { deviceManager } from './services/deviceManager';
import { frameBuffer } from './services/frameBufferManager';
import { gestureDetector } from './services/gestureDetector';
import { broadcastAudio, SOUND_TRACKS } from './services/broadcastAudioEngine';
import { phonkAudio } from './services/phonkAudioEngine';
import { workerTickTimer } from './services/workerTickTimer';
import { editRenderer } from './services/editRenderer';
import { recorderService } from './services/recorderService';
import { MemeMatcher, MemeInfo } from './services/memeMatcher';
import { AiMemeBrain } from './services/aiMemeBrain';
import { memeAssets } from './services/memeAssets';
import { ShuffleBag } from './services/shuffleBag';
import { AppState, TriggerMode, EditPreset, FaceData, HandData, DetectionMetrics, TakeoverMode, FrameItem, TrackId } from './types';

const globalPresetsBag = new ShuffleBag<EditPreset>([
  'ghost_trail_impact',
  'dark_manga_strobe',
  'sigma_hard_snaps',
  'parallax_dual_speed'
]);

const globalTracksBag = new ShuffleBag<TrackId>([
  'montagem_tomada',
  'mogger',
  'marlon_mogged',
  'tokyo_drift',
  'cyber_sigma',
  'gigachad_anthem'
]);

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('STANDBY');
  const appStateRef = useRef<AppState>('STANDBY');

  const [isMirrored, setIsMirrored] = useState(cameraService.getIsMirrored());
  const [isBroadcasting, setIsBroadcasting] = useState(broadcastAudio.getIsBroadcasting());
  const [audioLevel, setAudioLevel] = useState(0);
  const [soundMuted, setSoundMuted] = useState(phonkAudio.isMuted());
  const [volume, setVolume] = useState(phonkAudio.getVolume());

  const [triggerMode, setTriggerMode] = useState<TriggerMode>('all');
  const [selectedPreset, setSelectedPreset] = useState<EditPreset>('ghost_trail_impact');
  const [selectedTrack, setSelectedTrack] = useState<string>('montagem_tomada');
  const [sensitivity, setSensitivity] = useState(gestureDetector.getSensitivity());

  const [takeoverMode, setTakeoverMode] = useState<TakeoverMode>('fullscreen');
  const [autoCyclePresets, setAutoCyclePresets] = useState(true);
  const [isZeroUi, setIsZeroUi] = useState(false);

  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);

  // Meme Matcher & AI Brain state
  const [isMemeMode, setIsMemeMode] = useState(true);
  const [matchedMeme, setMatchedMeme] = useState<{ name: string; percentage: number; image: string } | null>(null);
  const [aiThought, setAiThought] = useState<string>('AI SCANNING FACIAL TOPOLOGY...');
  const matchedMemeRef = useRef<{ name: string; percentage: number; image: string } | null>(null);

  // Download clip state
  const [hasDownloadableClip, setHasDownloadableClip] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  // References
  const videoRef = useRef<HTMLVideoElement>(null);
  const liveCanvasRef = useRef<HTMLCanvasElement>(null);
  const editCanvasRef = useRef<HTMLCanvasElement>(null);
  const liveCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const projectorWinRef = useRef<Window | null>(null);
  const projectorCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isProjectorOpenRef = useRef(false);

  const actionFramesRef = useRef<FrameItem[] | null>(null);
  const latestFaceRef = useRef<FaceData>({
    detected: false,
    box: { x: 0.25, y: 0.2, width: 0.5, height: 0.6 },
    pitch: 0,
    yaw: 0,
    roll: 0,
    mouthCenter: { x: 0.5, y: 0.65 },
    noseBridge: { x: 0.5, y: 0.45 },
    leftEye: { x: 0.4, y: 0.4 },
    rightEye: { x: 0.6, y: 0.4 },
  });

  const [faceData, setFaceData] = useState<FaceData>(latestFaceRef.current);
  const [handData, setHandData] = useState<HandData>({ detected: false, points: [] });
  const [metrics, setMetrics] = useState<DetectionMetrics>({
    drinkScore: 0,
    glassesScore: 0,
    smileScore: 0,
    mouthOpenness: 0,
    surpriseScore: 0,
    sigmaScore: 0,
    crazyScore: 0,
    detectedExpression: null,
    statusText: 'INITIALIZING CAMERA & AI...',
  });

  // Keep state ref in sync
  const setSyncState = (newState: AppState) => {
    appStateRef.current = newState;
    setAppState(newState);
  };

  const handlePresetChange = useCallback((preset: EditPreset) => {
    setSelectedPreset(preset);
  }, []);

  // State mirror ref for RAF callbacks
  const stateMirrorRef = useRef({
    selectedPreset,
    selectedTrack,
    takeoverMode,
    isMirrored,
    faceData: latestFaceRef.current,
  });
  stateMirrorRef.current = {
    selectedPreset,
    selectedTrack,
    takeoverMode,
    isMirrored,
    faceData: latestFaceRef.current,
  };

  // Initialize camera and models
  useEffect(() => {
    let mounted = true;

    async function setup() {
      if (videoRef.current) {
        phonkAudio.preloadMoggedAudio();
        phonkAudio.preloadTomadaAudio();
        phonkAudio.preloadMoggerAudio();
        phonkAudio.startKeepAlive();

        await cameraService.init(videoRef.current);
        if (!mounted) return;
        setIsMirrored(cameraService.getIsMirrored());

        await gestureDetector.initialize();
        if (!mounted) return;
      }
    }

    setup();

    recorderService.setOnStateChange((converting) => {
      setIsConverting(converting);
    });

    const unsubBroadcast = broadcastAudio.subscribe((active) => {
      setIsBroadcasting(active);
    });

    return () => {
      mounted = false;
      unsubBroadcast();
      cameraService.stopStream();
      broadcastAudio.stopBroadcast();
      phonkAudio.stop();
      editRenderer.stop();
    };
  }, []);

  // Update canvas dimensions on window resize
  useEffect(() => {
    const handleResize = () => {
      const c = liveCanvasRef.current;
      if (c) {
        c.width = window.innerWidth;
        c.height = window.innerHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Audio level polling for broadcast
  useEffect(() => {
    let animId: number;
    const pollAudio = () => {
      if (broadcastAudio.getIsBroadcasting()) {
        setAudioLevel(broadcastAudio.getAudioLevel());
      }
      animId = requestAnimationFrame(pollAudio);
    };
    animId = requestAnimationFrame(pollAudio);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Preload all audio tracks & meme images into memory on startup
  useEffect(() => {
    phonkAudio.preloadAllAudios().catch(() => {});
    memeAssets.preloadAll();
  }, []);

  // Main trigger edit function (can be triggered by gesture or spacebar)
  const triggerEdit = useCallback(
    (actionType: string) => {
      if (appStateRef.current !== 'STANDBY') return;
      if (frameBuffer.getFrameCount() < 5) {
        console.warn('Frame buffer is still warming up, please wait a moment...');
        return;
      }

      const replayFrames = frameBuffer.getReplayClip(3500);
      actionFramesRef.current = replayFrames;
      frameBuffer.stopLiveSession();
      frameBuffer.startLiveSession(0);
      const sessionStartTime = frameBuffer.getSessionStartTimestamp();

      setSyncState('EDITING');
      console.log(`[ConfidenceBooster] Action triggered (${actionType.toUpperCase()})! Pre-roll action clip: ${replayFrames.length} frames.`);

      window.setTimeout(() => {
        setSyncState('PLAYING');
        window.setTimeout(() => {
          let targetCanvas = editCanvasRef.current;
          let isProjector = false;

          if (projectorWinRef.current && !projectorWinRef.current.closed) {
            try {
              const pWin = projectorWinRef.current;
              let pCanvas = projectorCanvasRef.current;
              if (!pCanvas || !pCanvas.isConnected) {
                pCanvas = pWin.document.getElementById('projectorCanvas') as HTMLCanvasElement;
                if (pCanvas) projectorCanvasRef.current = pCanvas;
              }
              if (pCanvas) {
                targetCanvas = pCanvas;
                isProjector = true;
              }
            } catch {}
          }

          if (!targetCanvas || frameBuffer.getFrameCount() === 0) {
            console.warn('Canvas or camera frames not available, returning to standby');
            frameBuffer.stopLiveSession();
            setSyncState('STANDBY');
            return;
          }

          if (isProjector) {
            targetCanvas.width = 1280;
            targetCanvas.height = 720;
          } else if (stateMirrorRef.current.takeoverMode === 'fullscreen') {
            targetCanvas.width = window.innerWidth;
            targetCanvas.height = window.innerHeight;
          } else {
            targetCanvas.width = 640;
            targetCanvas.height = 640;
          }

          recorderService.startRecording(targetCanvas, phonkAudio.getAudioStream());

          let isFinished = false;
          const onEnd = () => {
            if (!isFinished) {
              isFinished = true;
              recorderService.stopRecording();
              setHasDownloadableClip(true);
              phonkAudio.stop();
              gestureDetector.resetCooldown();
              setSyncState('STANDBY');
              frameBuffer.stopLiveSession();
              if (actionFramesRef.current) {
                frameBuffer.releaseClip(actionFramesRef.current);
                actionFramesRef.current = null;
              }

              if (autoCyclePresets) {
                const nextPreset = globalPresetsBag.next();
                const nextTrack = globalTracksBag.next();
                
                handlePresetChange(nextPreset);
                setSelectedTrack(nextTrack);
                console.log(`[AutoCycle] Cycled to completely random theme: ${nextPreset} + ${nextTrack}`);
              }

              // Force the AI meme brain and matcher to re-roll on the next frame
              // so they don't overwrite the auto-cycle with old locked tracks!
              AiMemeBrain.forceReRoll();
              MemeMatcher.forceReRoll();
            }
          };

          const onImpact = () => {
            if ('vibrate' in navigator) {
              navigator.vibrate([100, 50, 150]);
            }
          };

          phonkAudio.playEditSequence(stateMirrorRef.current.selectedTrack, onImpact, onEnd).then((soundInfo) => {
            const face = stateMirrorRef.current.faceData;
            const mirrored = stateMirrorRef.current.isMirrored;

            editRenderer.startEdit({
              canvas: targetCanvas!,
              preset: stateMirrorRef.current.selectedPreset,
              startTime: soundInfo.startTime,
              durationMs: soundInfo.durationMs,
              sessionStartTime,
              frames: replayFrames,
              actionFrames: replayFrames,
              videoElement: videoRef.current,
              isMirrored: mirrored,
              eyeCenter: face.detected
                ? {
                    x: mirrored ? 1 - face.noseBridge.x : face.noseBridge.x,
                    y: (face.leftEye.y + face.rightEye.y) / 2,
                  }
                : undefined,
              getCurrentEyeCenter: () => {
                const fd = stateMirrorRef.current.faceData;
                const m = stateMirrorRef.current.isMirrored;
                if (fd.detected) {
                  return {
                    x: m ? 1 - fd.noseBridge.x : fd.noseBridge.x,
                    y: (fd.leftEye.y + fd.rightEye.y) / 2,
                  };
                }
                return undefined;
              },
              getSessionFrames: () => frameBuffer.getSessionFrames(),
              getPostTriggerMoments: (now) => frameBuffer.getPostTriggerMoments(sessionStartTime, now),
              matchedMemeImage: matchedMemeRef.current?.image || '/memes/jaideep_smile.png',
              onDropImpact: onImpact,
              onComplete: onEnd,
            });
          });
        }, 50);
      }, 200);
    },
    [autoCyclePresets, handlePresetChange]
  );

  // Continuous Camera Detection and Live Rendering Loop
  useEffect(() => {
    let animId: number;
    let lastPushTime = 0;
    let lastDetectTime = 0;

    const tick = (now: number) => {
      const video = videoRef.current;
      const canvas = liveCanvasRef.current;

      if (video && video.readyState >= 2 && video.videoWidth > 0 && canvas) {
        if (video.paused) {
          video.play().catch(() => {});
        }

        const vw = video.videoWidth;
        const vh = video.videoHeight;
        const pushInterval = deviceManager.getBufferPushIntervalMs();

        // 1. Push frame to circular buffer
        if (now - lastPushTime >= pushInterval) {
          lastPushTime = now;
          frameBuffer.pushFrame(video);
        }

        // 2. Run AI detection on interval
        const detectInterval = deviceManager.getAiDetectIntervalMs();
        if (now - lastDetectTime >= detectInterval) {
          lastDetectTime = now;
          const result = gestureDetector.detect(video, now, triggerMode);
          latestFaceRef.current = result.face;
          setFaceData(result.face);
          setHandData(result.hands);
          setMetrics(result.metrics);

          // Real-time AI Meme Brain Analysis using actual face landmarks
          if (isMemeMode && result.face.detected && result.faceFeatures) {
            const decision = AiMemeBrain.analyze(result.faceFeatures);
            setAiThought(decision.aiThought);

            if (decision.matchedMeme) {
              const matchedData = {
                name: decision.matchedMeme.name,
                percentage: decision.confidence,
                image: decision.matchedMeme.image,
              };
              matchedMemeRef.current = matchedData;
              setMatchedMeme(matchedData);
            }

            // Intelligently pair preset & music with the user's expression
            if (decision.isFunnyFace && appStateRef.current === 'STANDBY') {
              if (decision.recommendedTrack !== selectedTrack) {
                setSelectedTrack(decision.recommendedTrack);
              }
              if (decision.recommendedPreset !== selectedPreset) {
                handlePresetChange(decision.recommendedPreset);
              }
            }
          }

          // Trigger on action detection
          if (result.triggeredAction && appStateRef.current === 'STANDBY') {
            triggerEdit(result.triggeredAction);
          }
        }

        // 3. Render live video and tactical wireframe onto canvas
        const ctx = liveCtxRef.current || canvas.getContext('2d');
        if (ctx) {
          liveCtxRef.current = ctx;
          const cw = canvas.width || window.innerWidth;
          const ch = canvas.height || window.innerHeight;

          ctx.save();
          ctx.clearRect(0, 0, cw, ch);

          const scale = Math.max(cw / vw, ch / vh);
          const drawW = vw * scale;
          const drawH = vh * scale;
          let drawX = (cw - drawW) / 2;
          let drawY = (ch - drawH) / 2;

          const currentFace = latestFaceRef.current;
          if (isMirrored) {
            ctx.translate(cw, 0);
            ctx.scale(-1, 1);
            drawX = (cw - drawW) / 2;
          }

          ctx.drawImage(video, drawX, drawY, drawW, drawH);
          ctx.restore();

          // Render Tactical 3D Wireframe Cube over user's head
          if (currentFace.detected && appStateRef.current === 'STANDBY') {
            renderHeadWireframe(ctx, currentFace, cw, ch, isMirrored);
          }
        }

        // 4. Update projector canvas if open
        if (isProjectorOpenRef.current && projectorCanvasRef.current) {
          const pCanvas = projectorCanvasRef.current;
          const pCtx = pCanvas.getContext('2d');
          if (pCtx) {
            pCtx.save();
            pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
            if (appStateRef.current === 'PLAYING' && editCanvasRef.current) {
              pCtx.drawImage(editCanvasRef.current, 0, 0, pCanvas.width, pCanvas.height);
            } else {
              if (isMirrored) {
                pCtx.translate(pCanvas.width, 0);
                pCtx.scale(-1, 1);
              }
              pCtx.drawImage(video, 0, 0, pCanvas.width, pCanvas.height);
            }
            pCtx.restore();
          }
        }
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [triggerMode, isMirrored, isMemeMode, triggerEdit]);

  // Keyboard Shortcuts (SPACE to trigger, ESC to exit Zero UI)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        triggerEdit('manual');
      } else if (e.code === 'Escape') {
        setIsZeroUi(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerEdit]);

  // Projector launcher (Document Picture-in-Picture or Popup window)
  const openProjectorWindow = useCallback(async (mode: 'pip' | 'window' = 'pip') => {
    if (projectorWinRef.current && !projectorWinRef.current.closed) {
      projectorWinRef.current.focus();
      return;
    }

    let win: Window | null = null;
    if (mode === 'pip' && typeof window !== 'undefined' && 'documentPictureInPicture' in window) {
      try {
        win = await (window as any).documentPictureInPicture.requestWindow({
          width: 480,
          height: 270,
          preferInitialWindowPlacement: true,
        });
      } catch (e) {
        console.warn('PiP failed, falling back to window.open:', e);
      }
    }

    if (!win) {
      win = window.open(
        '',
        'OBS_Projector_ConfidenceBooster',
        'width=640,height=360,left=40,top=40,menubar=no,status=no,toolbar=no,location=no'
      );
    }

    if (!win) {
      alert('Pop-up was blocked by browser! Please allow pop-ups for this site.');
      return;
    }

    projectorWinRef.current = win;
    isProjectorOpenRef.current = true;

    try {
      win.document.title = 'Confidence Booster - OBS Feed';
      if (win.document.body) {
        win.document.body.style.margin = '0';
        win.document.body.style.padding = '0';
        win.document.body.style.background = '#000';
        win.document.body.style.overflow = 'hidden';
        win.document.body.style.display = 'flex';
        win.document.body.style.alignItems = 'center';
        win.document.body.style.justifyContent = 'center';

        const pCanvas = win.document.createElement('canvas');
        pCanvas.id = 'projectorCanvas';
        pCanvas.width = 1280;
        pCanvas.height = 720;
        pCanvas.style.width = '100%';
        pCanvas.style.height = '100%';
        pCanvas.style.objectFit = 'cover';
        win.document.body.appendChild(pCanvas);
        projectorCanvasRef.current = pCanvas;
      }

      const onCloseWin = () => {
        isProjectorOpenRef.current = false;
        projectorWinRef.current = null;
        projectorCanvasRef.current = null;
      };
      win.addEventListener('beforeunload', onCloseWin);
      win.addEventListener('pagehide', onCloseWin);
    } catch (e) {
      console.warn('Could not style projector window:', e);
    }
  }, []);

  const handleSkipEdit = () => {
    editRenderer.stop();
    phonkAudio.stop();
    recorderService.stopRecording();
    setHasDownloadableClip(true);
    gestureDetector.resetCooldown();
    setSyncState('STANDBY');
    frameBuffer.stopLiveSession();
    if (actionFramesRef.current) {
      frameBuffer.releaseClip(actionFramesRef.current);
      actionFramesRef.current = null;
    }

    AiMemeBrain.forceReRoll();
    MemeMatcher.forceReRoll();
  };

  const handleDownloadClip = async () => {
    let filename = `sigma_mog_edit_${Date.now()}.mp4`;
    if (selectedPreset === 'ghost_trail_impact' || selectedPreset === 'parallax_dual_speed') {
      filename = `ghost_trail_edit_${Date.now()}.mp4`;
    } else if (selectedPreset === 'dark_manga_strobe') {
      filename = `dark_manga_edit_${Date.now()}.mp4`;
    }
    await recorderService.downloadLastClip(filename);
  };

  const handleSwitchCamera = async () => {
    try {
      await cameraService.toggleFacingMode();
      setIsMirrored(cameraService.getIsMirrored());
    } catch (e) {
      console.warn('Switch camera error:', e);
    }
  };

  const handleToggleMirror = () => {
    const newVal = cameraService.toggleMirror();
    setIsMirrored(newVal);
  };

  const handleToggleSound = () => {
    const newVal = !soundMuted;
    setSoundMuted(newVal);
    phonkAudio.setMuted(newVal);
  };

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden select-none font-mono text-white">
      {/* Video & Canvas View */}
      <CameraView
        state={appState}
        videoRef={videoRef}
        liveCanvasRef={liveCanvasRef}
        editCanvasRef={editCanvasRef}
        onSkipEdit={handleSkipEdit}
        onDownloadClip={handleDownloadClip}
        canDownload={hasDownloadableClip}
        isConverting={isConverting}
        takeoverMode={takeoverMode}
        isZeroUi={isZeroUi}
      />

      {/* Tactical HUD Overlay (Visible in STANDBY and when not in Zero UI) */}
      {!isZeroUi && appState === 'STANDBY' && (
        <TacticalHUD
          face={faceData}
          hands={handData}
          metrics={metrics}
          isBroadcasting={isBroadcasting}
          audioLevel={audioLevel}
          matchedMeme={matchedMeme}
          aiThought={aiThought}
          showMemeCard={isMemeMode}
        />
      )}

      {/* Control Bar (Hidden in Zero UI) */}
      {!isZeroUi && (
        <ControlBar
          onSwitchCamera={handleSwitchCamera}
          onToggleMirror={handleToggleMirror}
          isMirrored={isMirrored}
          soundMuted={soundMuted}
          onToggleSound={handleToggleSound}
          onOpenSoundboard={() => setIsSoundboardOpen(true)}
          onOpenObsModal={() => setIsObsModalOpen(true)}
          triggerMode={triggerMode}
          onChangeTriggerMode={setTriggerMode}
          selectedPreset={selectedPreset}
          onChangePreset={handlePresetChange}
          onForceTrigger={() => triggerEdit('manual')}
          onDownloadClip={handleDownloadClip}
          hasDownloadableClip={hasDownloadableClip}
          isConverting={isConverting}
          sensitivity={sensitivity}
          onChangeSensitivity={(s) => {
            setSensitivity(s);
            gestureDetector.setSensitivity(s);
          }}
          isEditing={appState === 'EDITING'}
          isMemeMode={isMemeMode}
          onToggleMemeMode={() => setIsMemeMode(!isMemeMode)}
        />
      )}

      {/* Soundboard Modal */}
      <SoundboardModal
        isOpen={isSoundboardOpen}
        onClose={() => setIsSoundboardOpen(false)}
        selectedTrack={selectedTrack}
        onSelectTrack={setSelectedTrack}
        volume={volume}
        onVolumeChange={(v) => {
          setVolume(v);
          phonkAudio.setVolume(v);
        }}
      />

      {/* OBS & Stream Takeover Modal */}
      <ObsSettingsModal
        isOpen={isObsModalOpen}
        onClose={() => setIsObsModalOpen(false)}
        streamTakeoverMode={takeoverMode}
        onToggleTakeoverMode={() =>
          setTakeoverMode((m) => (m === 'fullscreen' ? 'pip' : 'fullscreen'))
        }
        autoCyclePresets={autoCyclePresets}
        onToggleAutoCycle={() => setAutoCyclePresets((p) => !p)}
        onEnterZeroUi={() => setIsZeroUi(true)}
        onOpenProjector={openProjectorWindow}
        currentPreset={selectedPreset}
      />
    </div>
  );
};
