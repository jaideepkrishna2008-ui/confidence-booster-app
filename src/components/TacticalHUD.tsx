import React, { useState } from 'react';
import { FaceData, HandData, DetectionMetrics } from '../types';
import { deviceManager } from '../services/deviceManager';
import { Maximize2, Minimize2, Sparkles, Zap } from 'lucide-react';

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
  showMemeCard?: boolean;
}

export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  face,
  metrics,
  isBroadcasting,
  audioLevel,
  matchedMeme,
  showMemeCard,
}) => {
  const [isZoomExpanded, setIsZoomExpanded] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between select-none font-mono text-white z-10 crt-scanlines">
      {/* Top Bar Readouts */}
      <div className="flex items-start justify-between w-full">
        {/* Left Status HUD */}
        <div className="flex flex-col gap-1 bg-[#070b12]/85 border border-cyber-green/50 p-2.5 rounded backdrop-blur-md shadow-lg shadow-cyber-green/10">
          <div className="flex items-center gap-2 text-xs font-bold text-cyber-green">
            <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping" />
            <span>TACTICAL HUD // CONFIDENCE BOOSTER</span>
          </div>
          <div className="text-[11px] text-gray-300 flex items-center gap-2">
            <span>STATUS:</span>
            <span
              className={`font-bold ${
                metrics.statusText.includes('DETECTED')
                  ? 'text-cyber-pink animate-pulse text-xs'
                  : metrics.statusText.includes('DETECTING')
                  ? 'text-yellow-400'
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
            <div className="mt-0.5 inline-flex items-center gap-1.5 text-[10px] font-bold text-cyber-cyan bg-cyan-950/60 border border-cyan-500/40 px-1.5 py-0.5 rounded w-fit animate-pulse">
              <Zap className="w-3 h-3 text-cyan-400" />
              <span>{metrics.detectedExpression}</span>
            </div>
          )}
        </div>

        {/* Right Broadcasting & Audio Gauge & Matched Meme Card */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 bg-[#070b12]/80 border border-cyber-green/40 px-3 py-1.5 rounded backdrop-blur-sm">
            <span
              className={`w-2 h-2 rounded-full ${
                isBroadcasting ? 'bg-cyber-green animate-pulse' : 'bg-gray-500'
              }`}
            />
            <span className="text-xs font-bold text-cyber-green">
              {isBroadcasting ? 'CABLE BROADCAST: LIVE' : 'BROADCAST: STANDBY'}
            </span>
          </div>

          {/* Audio Visualizer Bar */}
          {isBroadcasting && (
            <div className="flex items-center gap-1 bg-black/60 px-2 py-1 rounded border border-cyber-green/30 w-36">
              <span className="text-[9px] text-cyber-green">MIC:</span>
              <div className="flex-1 h-1.5 bg-gray-800 rounded overflow-hidden">
                <div
                  className="h-full bg-cyber-green transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
                />
              </div>
            </div>
          )}

          {/* Matched Meme Card with "jumin and jumout" Zoom In/Out Animation */}
          {showMemeCard && matchedMeme && (
            <div
              className={`relative bg-[#070b12]/95 border-2 border-cyan-400/90 rounded-lg p-2.5 shadow-2xl shadow-cyan-500/30 transition-all duration-300 ${
                isZoomExpanded ? 'scale-110 ring-2 ring-cyan-300' : 'hover:scale-105'
              } animate-jumin-jumout cursor-pointer select-none`}
              onClick={() => setIsZoomExpanded((prev) => !prev)}
              title="Click to Zoom In / Zoom Out meme preview"
            >
              <div className="flex items-center gap-3">
                <div className="relative overflow-hidden rounded border border-cyan-400/80 bg-black/50">
                  <img
                    src={matchedMeme.image}
                    alt={matchedMeme.name}
                    className={`object-cover transition-all duration-500 ${
                      isZoomExpanded ? 'w-24 h-24 scale-110' : 'w-14 h-14'
                    }`}
                  />
                  <div className="absolute top-0 right-0 p-0.5 bg-black/70 rounded-bl text-cyan-300">
                    {isZoomExpanded ? (
                      <Minimize2 className="w-3 h-3" />
                    ) : (
                      <Maximize2 className="w-3 h-3" />
                    )}
                  </div>
                </div>

                <div className="flex flex-col min-w-[120px]">
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400 animate-spin" />
                    <span className="text-[10px] text-cyan-400/90 font-bold uppercase tracking-wide">
                      MEME MATCH
                    </span>
                  </div>
                  <span className="text-xs font-bold text-white leading-tight max-w-[150px] truncate">
                    {matchedMeme.name}
                  </span>

                  {/* Similarity score bar */}
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden border border-cyan-900">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-200"
                        style={{ width: `${matchedMeme.percentage}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-cyan-300 font-bold">
                      {matchedMeme.percentage}%
                    </span>
                  </div>
                  <span className="text-[8px] text-cyan-400/60 mt-0.5 text-right font-sans">
                    JUMIN & JUMOUT // ACTIVE
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Middle Screen Multi-Factor Detection Gauges */}
      <div className="flex justify-between items-center w-full px-2">
        {/* Left Side: Drink Sip & Smile/Laugh Gauges */}
        <div className="flex items-center gap-2">
          {/* Drink Progress Gauge */}
          <div className="flex flex-col items-center gap-1 bg-black/60 p-2 rounded border border-cyber-green/30 backdrop-blur-xs">
            <span className="text-[8px] text-cyber-green/80 font-bold">DRINK</span>
            <div className="w-2.5 h-20 bg-gray-900 border border-cyber-green/40 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-sm ${
                  metrics.drinkScore > 0.75
                    ? 'bg-cyber-pink shadow-md shadow-cyber-pink'
                    : 'bg-cyber-green'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.drinkScore * 100))}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-300">
              {Math.round(metrics.drinkScore * 100)}%
            </span>
          </div>

          {/* Smile / Laugh Gauge */}
          <div className="flex flex-col items-center gap-1 bg-black/60 p-2 rounded border border-amber-400/30 backdrop-blur-xs">
            <span className="text-[8px] text-amber-400/90 font-bold">SMILE</span>
            <div className="w-2.5 h-20 bg-gray-900 border border-amber-400/40 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-sm ${
                  metrics.smileScore > 0.70
                    ? 'bg-amber-400 shadow-md shadow-amber-400'
                    : 'bg-amber-500/70'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.smileScore * 100))}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-300">
              {Math.round(metrics.smileScore * 100)}%
            </span>
          </div>
        </div>

        {/* Right Side: Glasses & Batman Sigma Gauges */}
        <div className="flex items-center gap-2">
          {/* Batman Sigma Face Gauge */}
          <div className="flex flex-col items-center gap-1 bg-black/60 p-2 rounded border border-cyan-400/30 backdrop-blur-xs">
            <span className="text-[8px] text-cyan-400/90 font-bold">SIGMA</span>
            <div className="w-2.5 h-20 bg-gray-900 border border-cyan-400/40 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-sm ${
                  metrics.sigmaScore > 0.65
                    ? 'bg-cyan-400 shadow-md shadow-cyan-400'
                    : 'bg-cyan-600/70'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.sigmaScore * 100))}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-300">
              {Math.round(metrics.sigmaScore * 100)}%
            </span>
          </div>

          {/* Glasses Adjust Gauge */}
          <div className="flex flex-col items-center gap-1 bg-black/60 p-2 rounded border border-cyber-green/30 backdrop-blur-xs">
            <span className="text-[8px] text-cyber-green/80 font-bold">GLASSES</span>
            <div className="w-2.5 h-20 bg-gray-900 border border-cyber-green/40 rounded flex flex-col justify-end p-0.5">
              <div
                className={`w-full transition-all duration-100 rounded-sm ${
                  metrics.glassesScore > 0.75
                    ? 'bg-cyber-pink shadow-md shadow-cyber-pink'
                    : 'bg-cyber-green'
                }`}
                style={{ height: `${Math.min(100, Math.round(metrics.glassesScore * 100))}%` }}
              />
            </div>
            <span className="text-[9px] text-gray-300">
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
