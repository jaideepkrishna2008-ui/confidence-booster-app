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
import { AppState, TriggerMode, EditPreset, FaceData, HandData, DetectionMetrics, TakeoverMode, FrameItem } from './types';

export const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('STANDBY');
  const appStateRef = useRef<AppState>('STANDBY');

  const [isMirrored, setIsMirrored] = useState(cameraService.getIsMirrored());
  const [isBroadcasting, setIsBroadcasting] = useState(broadcastAudio.getIsBroadcasting());
  const [audioLevel, setAudioLevel] = useState(0);
  const [soundMuted, setSoundMuted] = useState(phonkAudio.isMuted());
  const [volume, setVolume] = useState(phonkAudio.getVolume());

  const [triggerMode, setTriggerMode] = useState<TriggerMode>('both');
  const [selectedPreset, setSelectedPreset] = useState<EditPreset>('ghost_trail_impact');
  const [selectedTrack, setSelectedTrack] = useState<string>('montagem_tomada');
  const [sensitivity, setSensitivity] = useState(gestureDetector.getSensitivity());

  const [takeoverMode, setTakeoverMode] = useState<TakeoverMode>('fullscreen');
  const [autoCyclePresets, setAutoCyclePresets] = useState(true);
  const [isZeroUi, setIsZeroUi] = useState(false);

  const [isSoundboardOpen, setIsSoundboardOpen] = useState(false);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);

  // Meme Matcher Mode state
  const [isMemeMode, setIsMemeMode] = useState(false);
  const [matchedMeme, setMatchedMeme] = useState<{ name: string; percentage: number; image: string } | null>(null);

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
    statusText: 'INITIALIZING CAMERA & AI...',
  });

  // Keep state ref in sync
  const setSyncState = (newState: AppState) => {
    appStateRef.current = newState;
    setAppState(newState);
  };

  // State mirror ref for RAF callbacks
  const stateMirrorRef = useRef({
    selectedPreset,
    isMirrored,
    faceData: latestFaceRef.current,
  });
  stateMirrorRef.current = {
    selectedPreset,
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

  // Main trigger edit function (can be triggered by gesture or spacebar)
  const triggerEdit = useCallback(
    (actionType: string) => {
      if (appStateRef.current !== 'STANDBY') return;
      if (frameBuffer.getFrameCount() < 5) {
        console.warn('Frame buffer is still filling...');
        return;
      }

      console.log(`[ConfidenceBooster] Action triggered: ${actionType}`);

      const replayFrames = frameBuffer.getReplayClip(3500);
      actionFramesRef.current = replayFrames;
      frameBuffer.stopLiveSession();
      frameBuffer.startLiveSession(0);
      const sessionStartTime = frameBuffer.getSessionStartTimestamp();

      setSyncState('EDITING');

      const targetCanvas = editCanvasRef.current;
      if (!targetCanvas) return;

      targetCanvas.width = 1280;
      targetCanvas.height = 720;

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
            const presets: EditPreset[] = [
              'ghost_trail_impact',
              'dark_manga_strobe',
              'sigma_hard_snaps',
              'parallax_dual_speed',
            ];
            const nextIdx = (presets.indexOf(stateMirrorRef.current.selectedPreset) + 1) % presets.length;
            const nextPreset = presets[nextIdx];
            setSelectedPreset(nextPreset);
            if (nextPreset === 'ghost_trail_impact' || nextPreset === 'parallax_dual_speed') {
              setSelectedTrack('montagem_tomada');
            } else if (nextPreset === 'dark_manga_strobe') {
              setSelectedTrack('mogger');
            } else {
              setSelectedTrack('marlon_mogged');
            }
          }
        }
      };

      const onImpact = () => {
        // Impact triggers camera shake or custom audio punch
      };

      // Start recording the canvas edit
      recorderService.startRecording(targetCanvas, phonkAudio.getAudioStream());

      // Start sound sequence
      phonkAudio.playEditSequence(selectedTrack, onImpact, onEnd).then((soundInfo) => {
        setSyncState('PLAYING');

        editRenderer.startEdit({
          canvas: targetCanvas,
          preset: stateMirrorRef.current.selectedPreset,
          startTime: soundInfo.startTime,
          durationMs: soundInfo.durationMs,
          sessionStartTime,
          frames: actionFramesRef.current || [],
          actionFrames: actionFramesRef.current || [],
          isMirrored: stateMirrorRef.current.isMirrored,
          eyeCenter: {
            x: stateMirrorRef.current.isMirrored
              ? 1 - stateMirrorRef.current.faceData.noseBridge.x
              : stateMirrorRef.current.faceData.noseBridge.x,
            y: (stateMirrorRef.current.faceData.leftEye.y + stateMirrorRef.current.faceData.rightEye.y) / 2,
          },
          getCurrentEyeCenter: () => {
            const fd = stateMirrorRef.current.faceData;
            if (fd.detected) {
              return {
                x: stateMirrorRef.current.isMirrored ? 1 - fd.noseBridge.x : fd.noseBridge.x,
                y: (fd.leftEye.y + fd.rightEye.y) / 2,
              };
            }
            return undefined;
          },
          getSessionFrames: () => frameBuffer.getSessionFrames(),
          getPostTriggerMoments: (time) => frameBuffer.getPostTriggerMoments(time, soundInfo.durationMs),
          onDropImpact: onImpact,
          onComplete: onEnd,
        });
      });
    },
    [selectedTrack, autoCyclePresets]
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

          // Optional: Meme matching computation
          if (isMemeMode && result.face.detected) {
            const userFeatures: Record<string, number> = {
              surprise_score: result.metrics.drinkScore,
              smile_score: result.metrics.glassesScore,
              concern_score: 0.1,
              cheers_score: result.metrics.drinkScore * (result.hands.points.length > 0 ? 1 : 0),
              hand_raised: result.hands.points.length > 0 ? 1 : 0,
              num_hands: result.hands.points.length > 0 ? 1 : 0,
              eye_openness: 0.25,
              eyes_symmetry: 0.03,
              mouth_openness: 0.15,
              mouth_width_ratio: 0.55,
              mouth_elevation: 0.08,
              eyebrow_height: 0.08,
              brow_symmetry: 0.02,
            };
            const match = MemeMatcher.findBestMatch(userFeatures);
            if (match.meme) {
              setMatchedMeme({
                name: match.meme.name,
                percentage: match.percentage,
                image: match.meme.image,
              });
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

  const handlePresetChange = (preset: EditPreset) => {
    setSelectedPreset(preset);
    if (preset === 'ghost_trail_impact' || preset === 'parallax_dual_speed') {
      setSelectedTrack('montagem_tomada');
      phonkAudio.preloadTomadaAudio();
    } else if (preset === 'dark_manga_strobe') {
      setSelectedTrack('mogger');
      phonkAudio.preloadMoggerAudio();
    } else {
      setSelectedTrack('marlon_mogged');
      phonkAudio.preloadMoggedAudio();
    }
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
