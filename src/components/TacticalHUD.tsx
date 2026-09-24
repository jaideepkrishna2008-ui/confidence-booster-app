import React, { useState } from 'react';
import { FaceData, HandData, DetectionMetrics } from '../types';
import { deviceManager } from '../services/deviceManager';
import { Maximize2, Minimize2, Sparkles, Zap, Brain, Activity } from 'lucide-react';

export function renderHeadWireframe(
  ctx: CanvasRenderingContext2D,
  face: FaceData,
  canvasW: number,
  canvasH: number,
  isMirrored: boolean = false,
  viewportScale?: {
    sx: number;
    sy: number;
    sw: number;
    sh: number;
    dx: number;
    dy: number;
    dw: number;
    dh: number;
    vw: number;
    vh: number;
  }
): void {
  if (!face.detected) return;

  const eyeMidX = (face.leftEye.x + face.rightEye.x) / 2;
  const eyeMidY = ((face.leftEye.y + face.rightEye.y) / 2) * 0.75 + face.noseBridge.y * 0.25;

  let fx: number, fy: number, scaleFactor: number;
  if (viewportScale && viewportScale.sw > 0 && viewportScale.sh > 0) {
    const { sx, sy, sw, sh, dx, dy, dw, dh, vw, vh } = viewportScale;
    const px = eyeMidX * vw;
    const py = eyeMidY * vh;
    const rx = (px - sx) / sw;
    const ry = (py - sy) / sh;
    const normX = isMirrored ? 1 - rx : rx;
    fx = dx + normX * dw;
    fy = dy + ry * dh;
    scaleFactor = dw * (vw / sw);
  } else {
    fx = (isMirrored ? 1 - eyeMidX : eyeMidX) * canvasW;
    fy = eyeMidY * canvasH;
    scaleFactor = canvasW;
  }

  const boxW = Math.max(45, face.box.width * scaleFactor * 0.42);
  const m = boxW;
  const B = boxW * 0.95;
  const pitchRad = (face.pitch * Math.PI) / 180;
  const yawRad = (face.yaw * Math.PI) / 180;
  const effYaw = isMirrored ? -yawRad : yawRad;
  const rollRad = (face.roll * Math.PI) / 180;
  const effRoll = isMirrored ? -rollRad : rollRad;

  const rotate = (x: number, y: number, z: number): [number, number, number] => {
    const x1 = x * Math.cos(effYaw) + z * Math.sin(effYaw);
    const y1 = y;
    const z1 = -x * Math.sin(effYaw) + z * Math.cos(effYaw);

    const x2 = x1;
    const y2 = y1 * Math.cos(pitchRad) - z1 * Math.sin(pitchRad);
    const z2 = y1 * Math.sin(pitchRad) + z1 * Math.cos(pitchRad);

    const x3 = x2 * Math.cos(effRoll) - y2 * Math.sin(effRoll);
    const y3 = x2 * Math.sin(effRoll) + y2 * Math.cos(effRoll);
    const z3 = z2;

    return [x3, y3, z3];
  };

  const fov = 650;
  const project = (x: number, y: number, z: number): [number, number] => {
    const p = fov / (fov + z);
    return [fx + x * p, fy + y * p];
  };

  const cubeVertices: [number, number, number][] = [
    [-m, -m, -B],
    [m, -m, -B],
    [m, m, -B],
    [-m, m, -B],
    [-m, -m, B],
    [m, -m, B],
    [m, m, B],
    [-m, m, B],
  ];

  const projected = cubeVertices.map(([vx, vy, vz]) => {
    const [rx, ry, rz] = rotate(vx, vy, vz);
    return project(rx, ry, rz);
  });

  ctx.save();
  ctx.strokeStyle = '#00ff66';
  ctx.lineWidth = 2;
  if (!deviceManager.isMobile()) {
    ctx.shadowColor = '#00ff66';
    ctx.shadowBlur = 6;
  }

  ctx.beginPath();
  // Front face
  ctx.moveTo(projected[0][0], projected[0][1]);
  ctx.lineTo(projected[1][0], projected[1][1]);
  ctx.lineTo(projected[2][0], projected[2][1]);
  ctx.lineTo(projected[3][0], projected[3][1]);
  ctx.closePath();

  // Back face
  ctx.moveTo(projected[4][0], projected[4][1]);
  ctx.lineTo(projected[5][0], projected[5][1]);
  ctx.lineTo(projected[6][0], projected[6][1]);
  ctx.lineTo(projected[7][0], projected[7][1]);
  ctx.closePath();

  // Connecting edges
  ctx.moveTo(projected[0][0], projected[0][1]);
  ctx.lineTo(projected[4][0], projected[4][1]);
  ctx.moveTo(projected[1][0], projected[1][1]);
  ctx.lineTo(projected[5][0], projected[5][1]);
  ctx.moveTo(projected[2][0], projected[2][1]);
  ctx.lineTo(projected[6][0], projected[6][1]);
  ctx.moveTo(projected[3][0], projected[3][1]);
  ctx.lineTo(projected[7][0], projected[7][1]);

  // Center target crosshair
  ctx.moveTo(fx - 8, fy);
  ctx.lineTo(fx + 8, fy);
  ctx.moveTo(fx, fy - 8);
  ctx.lineTo(fx, fy + 8);
  ctx.stroke();

  const maxY = Math.max(...projected.map((pt) => pt[1]));
  ctx.fillStyle = '#00ff66';
  ctx.font = 'bold 12px "Share Tech Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SUBJECT: [LOCKED]', fx, maxY + 20);
  ctx.restore();
}

interface TacticalHUDProps {
  face: FaceData;
  hands: HandData;
  metrics: DetectionMetrics;
  isBroadcasting: boolean;
  audioLevel: number;
  matchedMeme?: { name: string; percentage: number; image: string } | null;
  aiThought?: string;
  showMemeCard?: boolean;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  face,
  metrics,
  isBroadcasting,
  audioLevel,
  matchedMeme,
  aiThought,
  showMemeCard,
}) => {
  const [isZoomExpanded, setIsZoomExpanded] = useState(false);

  // Rotate fallback meme so HUD is never blank-but-boring (pick based on second since epoch)
  const fallbackOptions = [
    { name: 'Patrick Bateman Smirk', percentage: 88, image: '/memes/batman_sigma_smirk.png' },
    { name: 'Heisenberg Keffiyeh',   percentage: 82, image: '/memes/heisenberg_arab.png' },
    { name: 'Sigma Thousand-Yard',   percentage: 91, image: '/memes/batman_sigma.jpg' },
  ];
  const displayMeme = matchedMeme || fallbackOptions[Math.floor(Date.now() / 8000) % fallbackOptions.length];

  const isLockingIn = metrics.statusText.includes('LOCKING IN');

  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none font-mono text-white z-10 crt-scanlines">
      {/* Top Bar Readouts */}
      <div className="flex items-start justify-between w-full flex-wrap gap-2">
        {/* Left Status HUD */}
        <div className="flex flex-col gap-1 bg-[#070b12]/90 border border-cyber-green/50 p-2.5 rounded-lg backdrop-blur-md shadow-lg shadow-cyber-green/10 max-w-[340px]">
          <div className="flex items-center gap-2 text-xs font-bold text-cyber-green">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping" />
            <span>TACTICAL HUD // CONFIDENCE BOOSTER</span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center gap-2">
            <span className="text-gray-400">STATUS:</span>
            <span
              className={`font-bold ${
                metrics.statusText.includes('TRIGGERED')
                  ? 'text-cyber-pink animate-bounce text-xs'
                  : isLockingIn
                  ? 'text-amber-400 animate-pulse text-xs'
                  : metrics.statusText.includes('EXPRESSION')
                  ? 'text-cyan-400'
                  : 'text-cyber-green'
              }`}
            >
              {metrics.statusText}
            </span>
          </div>
          <div className="text-[10px] text-gray-400 flex items-center gap-3">
            <span>PITCH: {face.pitch.toFixed(1)}°</span>
            <span>YAW: {face.yaw.toFixed(1)}°</span>
            <span>ROLL: {face.roll.toFixed(1)}°</span>
          </div>
          {metrics.detectedExpression && (
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-cyber-cyan bg-cyan-950/70 border border-cyan-500/50 px-2 py-0.5 rounded w-fit animate-pulse">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{metrics.detectedExpression}</span>
            </div>
          )}
        </div>

        {/* Center / Right: Live AI Meme Brain HUD Card */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          {/* Broadcasting Badge & Mic Level */}
          <div className="flex items-center gap-2 bg-[#070b12]/90 border border-cyber-green/40 px-3 py-1 rounded backdrop-blur-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                isBroadcasting ? 'bg-cyber-green animate-pulse' : 'bg-gray-500'
              }`}
            />
            <span className="text-[11px] font-bold text-cyber-green">
              {isBroadcasting ? 'CABLE BROADCAST: LIVE' : 'BROADCAST: STANDBY'}
            </span>
            {isBroadcasting && (
              <div className="w-16 h-1.5 bg-gray-800 rounded overflow-hidden ml-1">
                <div
                  className="h-full bg-cyber-green transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* DOCKED AI MEME BRAIN WIDGET */}
          {showMemeCard && (
            <div
              className={`relative bg-[#070b12]/95 border-2 border-cyan-400/90 rounded-xl p-2.5 shadow-2xl shadow-cyan-500/30 transition-all duration-300 ${
                isZoomExpanded ? 'scale-110 ring-4 ring-cyan-400/50' : 'hover:scale-105'
              } animate-jumin-jumout cursor-pointer select-none max-w-[320px]`}
              onClick={() => setIsZoomExpanded((prev) => !prev)}
              title="Click to Zoom In / Zoom Out meme preview"
            >
              <div className="flex items-center gap-3">
                {/* Meme Photo with Zoom Pulse */}
                <div className="relative overflow-hidden rounded-lg border-2 border-cyan-400/80 bg-black/60 shadow-md shadow-cyan-400/20 shrink-0">
                  <img
                    src={displayMeme.image}
                    alt={displayMeme.name}
                    className={`object-cover transition-all duration-500 ${
                      isZoomExpanded ? 'w-28 h-28 scale-110' : 'w-16 h-16 scale-100'
                    }`}
                  />
                  <div className="absolute top-0 right-0 p-0.5 bg-black/80 rounded-bl text-cyan-300">
                    {isZoomExpanded ? (
                      <Minimize2 className="w-3 h-3" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-[140px] flex-1">
                  <div className="flex items-center gap-1">
                    <Brain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-[10px] text-cyan-400 font-bold tracking-wider">
                      AI MEME BRAIN
                    </span>
                  </div>

                  <span className="text-xs font-bold text-white leading-tight truncate mt-0.5">
                    {displayMeme.name}
                  </span>

                  {/* AI Live Thought Line */}
                  <div className="text-[9px] text-amber-300/90 font-mono italic truncate mt-0.5 bg-black/50 px-1 py-0.5 rounded border border-amber-500/30">
                    {aiThought || 'AI: SELECTING BEST MEME & MUSIC...'}
                  </div>

                  {/* Match Confidence Bar */}
                  <div className="flex items-center gap-1.5 mt-1">
                    <div className="flex-1 h-2 bg-gray-900 rounded-full overflow-hidden border border-cyan-800">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${displayMeme.percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-cyan-300 font-bold">
                      {displayMeme.percentage}%
                    </span>
                  </div>

                  <span className="text-[8px] text-cyan-400/70 mt-0.5 font-sans text-right">
                    JUMIN & JUMOUT ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center Screen: Expression Lock-In Banner (When user holds face expression) */}
      {isLockingIn && (
        <div className="self-center flex flex-col items-center gap-1.5 bg-black/85 border-2 border-amber-400 px-5 py-2.5 rounded-xl backdrop-blur-md shadow-2xl shadow-amber-400/40 animate-pulse pointer-events-none">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
            <Activity className="w-4 h-4 text-amber-400 animate-spin" />
            <span>AI LOCKING IN EDIT TRIGGER...</span>
          </div>
          <span className="text-xs text-white font-mono">{metrics.statusText}</span>
        </div>
      )}

      {/* Middle Screen Multi-Factor Detection Gauges */}
      <div className="flex justify-between items-center w-full px-2">
        {/* Left Side: Drink Sip & Smile/Laugh Gauges */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Drink Progress Gauge */}
          <div className="flex flex-col items-center gap-1 bg-[#060a10]/85 p-2 rounded-lg border border-emerald-500/40 backdrop-blur-sm shadow-md">
            <span className="text-[9px] text-emerald-400 font-bold">DRINK</span>
            <div className="w-3 h-24 bg-gray-950 border border-emerald-500/50 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-xs ${
                  metrics.drinkScore > 0.65
                    ? 'bg-cyber-pink shadow-md shadow-cyber-pink'
                    : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.drinkScore * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">
              {Math.round(metrics.drinkScore * 100)}%
            </span>
          </div>

          {/* Smile / Laugh Gauge */}
          <div className="flex flex-col items-center gap-1 bg-[#060a10]/85 p-2 rounded-lg border border-amber-400/50 backdrop-blur-sm shadow-md">
            <span className="text-[9px] text-amber-400 font-bold">SMILE</span>
            <div className="w-3 h-24 bg-gray-950 border border-amber-400/50 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-xs ${
                  metrics.smileScore > 0.65
                    ? 'bg-amber-400 shadow-md shadow-amber-400'
                    : 'bg-gradient-to-t from-amber-600 to-amber-400'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.smileScore * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-amber-300 font-bold">
              {Math.round(metrics.smileScore * 100)}%
            </span>
          </div>
        </div>

        {/* Right Side: Glasses & Batman Sigma Gauges */}
        <div className="flex items-center gap-2.5 pointer-events-auto">
          {/* Batman Sigma Face Gauge */}
          <div className="flex flex-col items-center gap-1 bg-[#060a10]/85 p-2 rounded-lg border border-cyan-400/60 backdrop-blur-sm shadow-md shadow-cyan-500/20">
            <span className="text-[9px] text-cyan-400 font-bold">SIGMA</span>
            <div className="w-3 h-24 bg-gray-950 border border-cyan-400/60 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-xs ${
                  metrics.sigmaScore > 0.65
                    ? 'bg-cyan-300 shadow-lg shadow-cyan-400'
                    : 'bg-gradient-to-t from-blue-600 to-cyan-400'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.sigmaScore * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-cyan-300 font-bold">
              {Math.round(metrics.sigmaScore * 100)}%
            </span>
          </div>

          {/* Glasses Adjust Gauge */}
          <div className="flex flex-col items-center gap-1 bg-[#060a10]/85 p-2 rounded-lg border border-emerald-500/40 backdrop-blur-sm shadow-md">
            <span className="text-[9px] text-emerald-400 font-bold">GLASSES</span>
            <div className="w-3 h-24 bg-gray-950 border border-emerald-500/50 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-xs ${
                  metrics.glassesScore > 0.65
                    ? 'bg-cyber-pink shadow-md shadow-cyber-pink'
                    : 'bg-emerald-400 shadow-sm shadow-emerald-400'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.glassesScore * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-emerald-300 font-bold">
              {Math.round(metrics.glassesScore * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Bottom spacer for ControlBar */}
      <div className="h-16" />
    </div>
  );
};
