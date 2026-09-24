import React, { useState, useEffect, useRef } from 'react';
import { FaceData, HandData, DetectionMetrics } from '../types';
import { deviceManager } from '../services/deviceManager';
import { Maximize2, Minimize2, Sparkles, Zap, Brain, Activity, Cpu, Radio } from 'lucide-react';

// ─── 3-D Head Wireframe (unchanged logic) ────────────────────────────────────
export function renderHeadWireframe(
  ctx: CanvasRenderingContext2D,
  face: FaceData,
  canvasW: number,
  canvasH: number,
  isMirrored: boolean = false,
  viewportScale?: {
    sx: number; sy: number; sw: number; sh: number;
    dx: number; dy: number; dw: number; dh: number;
    vw: number; vh: number;
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
  const pitchRad  = (face.pitch * Math.PI) / 180;
  const yawRad    = (face.yaw   * Math.PI) / 180;
  const effYaw    = isMirrored ? -yawRad : yawRad;
  const rollRad   = (face.roll  * Math.PI) / 180;
  const effRoll   = isMirrored ? -rollRad : rollRad;

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
    [-m, -m, -B], [m, -m, -B], [m, m, -B], [-m, m, -B],
    [-m, -m,  B], [m, -m,  B], [m, m,  B], [-m, m,  B],
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

  const edges = [
    [0,1],[1,2],[2,3],[3,0],
    [4,5],[5,6],[6,7],[7,4],
    [0,4],[1,5],[2,6],[3,7],
  ];

  edges.forEach(([a, b]) => {
    ctx.beginPath();
    ctx.moveTo(projected[a][0], projected[a][1]);
    ctx.lineTo(projected[b][0], projected[b][1]);
    ctx.stroke();
  });

  // Cross-hair at eye center
  ctx.strokeStyle = '#00f0ff';
  ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00f0ff';
  ctx.shadowBlur = 8;
  const cx = fx, cy = fy;
  const ch = 10;
  ctx.beginPath();
  ctx.moveTo(cx - ch, cy); ctx.lineTo(cx + ch, cy);
  ctx.moveTo(cx, cy - ch); ctx.lineTo(cx, cy + ch);
  ctx.stroke();

  // Corner brackets on front face
  ctx.strokeStyle = '#00ff6690';
  ctx.lineWidth = 1;
  ctx.shadowBlur = 3;
  const bracketLen = boxW * 0.3;
  const corners = [0, 1, 2, 3];
  corners.forEach(i => {
    const [px, py] = projected[i];
    ctx.beginPath();
    if (i === 0) { ctx.moveTo(px + bracketLen, py); ctx.lineTo(px, py); ctx.lineTo(px, py + bracketLen); }
    if (i === 1) { ctx.moveTo(px - bracketLen, py); ctx.lineTo(px, py); ctx.lineTo(px, py + bracketLen); }
    if (i === 2) { ctx.moveTo(px - bracketLen, py); ctx.lineTo(px, py); ctx.lineTo(px, py - bracketLen); }
    if (i === 3) { ctx.moveTo(px + bracketLen, py); ctx.lineTo(px, py); ctx.lineTo(px, py - bracketLen); }
    ctx.stroke();
  });

  ctx.restore();
}

// ─── Gauge bar component ──────────────────────────────────────────────────────
const GaugeBar: React.FC<{
  label: string;
  value: number;
  color: string;
  glowColor: string;
  threshold?: number;
}> = ({ label, value, color, glowColor, threshold = 0.65 }) => {
  const pct = Math.min(100, Math.round(value * 100));
  const isHot = value > threshold;
  return (
    <div className="flex flex-col items-center gap-1 glass-panel px-2 py-1.5 rounded-lg">
      <span className={`text-[8px] font-bold tracking-widest uppercase`} style={{ color: glowColor }}>{label}</span>
      <div
        className="w-2.5 h-20 bg-black/70 rounded border overflow-hidden flex flex-col justify-end p-px"
        style={{ borderColor: `${glowColor}40` }}
      >
        <div
          className="w-full rounded-sm transition-all duration-100"
          style={{
            height: `${pct}%`,
            background: isHot
              ? `linear-gradient(to top, ${glowColor}, white)`
              : `linear-gradient(to top, ${glowColor}80, ${glowColor})`,
            boxShadow: isHot ? `0 0 6px ${glowColor}` : 'none',
          }}
        />
      </div>
      <span className="text-[9px] font-bold" style={{ color: glowColor }}>{pct}%</span>
    </div>
  );
};

// ─── HUD Props ────────────────────────────────────────────────────────────────
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

// ─── Main HUD Component ───────────────────────────────────────────────────────
export const TacticalHUD: React.FC<TacticalHUDProps> = ({
  face, metrics, isBroadcasting, audioLevel, matchedMeme, aiThought, showMemeCard,
}) => {
  const [isZoomExpanded, setIsZoomExpanded] = useState(false);
  const [tick, setTick] = useState(0);

  // Clock tick for live readout
  useEffect(() => {
    const id = setInterval(() => setTick(t => (t + 1) % 1000), 1000);
    return () => clearInterval(id);
  }, []);

  // Rotating fallback before face detected
  const fallbackOptions = [
    { name: 'Patrick Bateman Smirk', percentage: 88, image: '/memes/batman_sigma_smirk.png' },
    { name: 'Heisenberg Keffiyeh',   percentage: 82, image: '/memes/heisenberg_arab.png' },
    { name: 'Sigma Thousand-Yard',   percentage: 91, image: '/memes/batman_sigma.jpg' },
  ];
  const displayMeme = matchedMeme || fallbackOptions[Math.floor(Date.now() / 8000) % fallbackOptions.length];

  const isLockingIn = metrics.statusText.includes('LOCKING IN');
  const isTriggered = metrics.statusText.includes('TRIGGERED');

  return (
    <div className="absolute inset-0 pointer-events-none p-3 flex flex-col justify-between select-none font-mono text-white z-10 crt-scanlines">

      {/* ── TOP ROW ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between w-full gap-2">

        {/* LEFT: Status + Face Data Panel */}
        <div className="glass-panel rounded-xl p-3 shadow-lg shadow-cyber-green/10 max-w-[300px] flex flex-col gap-1.5">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <span className="relative flex">
              <span className="w-2 h-2 rounded-full bg-cyber-green animate-ping absolute" />
              <span className="w-2 h-2 rounded-full bg-cyber-green" />
            </span>
            <span className="text-[9px] font-bold text-cyber-green tracking-widest uppercase font-cyber glow-green">
              CONFIDENCE BOOSTER
            </span>
            <Cpu className="w-3 h-3 text-cyber-green/60 ml-auto" />
          </div>

          {/* Status text */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="text-gray-500">SYS:</span>
            <span className={`font-bold truncate ${
              isTriggered  ? 'text-cyber-pink animate-bounce glow-pink'
              : isLockingIn ? 'text-amber-400 animate-pulse glow-amber'
              : metrics.statusText.includes('EXPRESSION') ? 'text-cyber-cyan glow-cyan'
              : 'text-cyber-green'
            }`}>
              {metrics.statusText}
            </span>
          </div>

          {/* Face angles */}
          <div className="flex items-center gap-3 text-[9px] text-gray-500">
            <span>P <span className="text-gray-300">{face.pitch.toFixed(1)}°</span></span>
            <span>Y <span className="text-gray-300">{face.yaw.toFixed(1)}°</span></span>
            <span>R <span className="text-gray-300">{face.roll.toFixed(1)}°</span></span>
            <span className="ml-auto text-gray-600">{face.detected ? '●LOCK' : '○SCAN'}</span>
          </div>

          {/* Expression badge */}
          {metrics.detectedExpression && (
            <div className="inline-flex items-center gap-1.5 text-[9px] font-bold text-cyber-cyan bg-cyan-950/60 border border-cyan-500/40 px-2 py-0.5 rounded-full w-fit animate-pulse">
              <Zap className="w-2.5 h-2.5 text-cyan-400" />
              {metrics.detectedExpression}
            </div>
          )}
        </div>

        {/* RIGHT: Broadcast badge + AI Meme Card */}
        <div className="flex flex-col items-end gap-2 pointer-events-auto">

          {/* Broadcast badge */}
          <div className={`flex items-center gap-2 glass-panel px-3 py-1.5 rounded-full ${
            isBroadcasting ? 'border-cyber-green/50 animate-flicker' : 'border-gray-700/50'
          }`}>
            <Radio className={`w-3 h-3 ${isBroadcasting ? 'text-cyber-green' : 'text-gray-600'}`} />
            <span className={`text-[9px] font-bold tracking-widest ${isBroadcasting ? 'text-cyber-green glow-green' : 'text-gray-500'}`}>
              {isBroadcasting ? '● LIVE' : '○ STANDBY'}
            </span>
            {isBroadcasting && (
              <div className="w-14 h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyber-green/30">
                <div
                  className="h-full rounded-full bg-cyber-green transition-all duration-75"
                  style={{ width: `${Math.min(100, Math.round(audioLevel * 100))}%` }}
                />
              </div>
            )}
          </div>

          {/* AI MEME BRAIN CARD */}
          {showMemeCard && (
            <div
              className={`
                relative glass-panel-cyan rounded-xl overflow-hidden cursor-pointer
                transition-all duration-300 select-none
                ${isZoomExpanded ? 'scale-110 ring-2 ring-cyan-400/60 shadow-2xl shadow-cyan-400/40' : 'hover:scale-105 animate-jumin-jumout'}
                border-glow-cyan
              `}
              style={{ maxWidth: isZoomExpanded ? '300px' : '260px' }}
              onClick={() => setIsZoomExpanded(p => !p)}
              title="Click to zoom meme preview"
            >
              {/* Scanning line animation */}
              <div className="scan-line" />

              {/* Card header bar */}
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-cyan-500/20 bg-cyan-950/30">
                <Brain className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span className="text-[9px] font-bold text-cyan-400 tracking-widest uppercase font-cyber">AI MEME BRAIN</span>
                <span className="ml-auto text-[8px] text-cyan-600">v2.0</span>
                {isZoomExpanded
                  ? <Minimize2 className="w-2.5 h-2.5 text-cyan-400" />
                  : <Maximize2 className="w-2.5 h-2.5 text-cyan-400" />
                }
              </div>

              {/* Card body */}
              <div className="flex items-center gap-3 p-2.5">
                {/* Meme thumbnail */}
                <div className="relative shrink-0 rounded-lg overflow-hidden border border-cyan-400/60 shadow-lg shadow-cyan-400/20"
                  style={{ width: isZoomExpanded ? 96 : 60, height: isZoomExpanded ? 96 : 60 }}
                >
                  <img
                    src={displayMeme.image}
                    alt={displayMeme.name}
                    className="w-full h-full object-cover transition-all duration-400"
                  />
                  {/* Match % overlay */}
                  <div className="absolute bottom-0 inset-x-0 bg-black/75 text-center text-[8px] font-bold text-cyan-300 py-0.5">
                    {displayMeme.percentage}% MATCH
                  </div>
                </div>

                {/* Text info */}
                <div className="flex flex-col gap-1 flex-1 min-w-0">
                  <span className="text-[11px] font-bold text-white leading-tight truncate font-cyber">
                    {displayMeme.name}
                  </span>

                  {/* AI thought — typewriter feel with cursor */}
                  <div className="text-[8px] text-amber-300/85 font-mono bg-black/50 px-1.5 py-1 rounded border border-amber-500/25 leading-relaxed">
                    {(aiThought || 'AI: SCANNING MEME DATABASE...').substring(0, 52)}
                    <span className="animate-blink">█</span>
                  </div>

                  {/* Confidence bar */}
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1.5 bg-black/60 rounded-full overflow-hidden border border-cyan-800/50">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${displayMeme.percentage}%`,
                          background: `linear-gradient(90deg, #0891b2, #00f0ff)`,
                          boxShadow: '0 0 6px rgba(0,240,255,0.6)',
                        }}
                      />
                    </div>
                    <span className="text-[9px] text-cyan-300 font-bold w-8 text-right">{displayMeme.percentage}%</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 text-cyan-500/50" />
                    <span className="text-[7px] text-cyan-600 uppercase tracking-wider">JUMIN & JUMOUT ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MIDDLE: Lock-In Banner ───────────────────────────────────── */}
      {isLockingIn && (
        <div className="self-center flex flex-col items-center gap-1.5 bg-black/90 border-2 border-amber-400 px-6 py-3 rounded-2xl backdrop-blur-md shadow-2xl shadow-amber-400/40 animate-pulse pointer-events-none">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-sm font-cyber">
            <Activity className="w-4 h-4 text-amber-400 animate-spin" />
            <span>AI LOCKING IN EDIT TRIGGER</span>
            <Activity className="w-4 h-4 text-amber-400 animate-spin" />
          </div>
          <span className="text-[10px] text-white/80 font-mono">{metrics.statusText}</span>
        </div>
      )}

      {/* ── MIDDLE SIDES: Detection Gauges ──────────────────────────── */}
      <div className="flex justify-between items-center w-full px-2">

        {/* Left gauges */}
        <div className="flex items-end gap-2 pointer-events-auto">
          <GaugeBar label="DRINK"  value={metrics.drinkScore}  color="#00ff66" glowColor="#10b981" />
          <GaugeBar label="SMILE"  value={metrics.smileScore}  color="#fbbf24" glowColor="#fbbf24" />
        </div>

        {/* Right gauges */}
        <div className="flex items-end gap-2 pointer-events-auto">
          <GaugeBar label="SIGMA"   value={metrics.sigmaScore}   color="#00f0ff" glowColor="#00f0ff" />
          <GaugeBar label="GLASS"   value={metrics.glassesScore} color="#00ff66" glowColor="#34d399" />
        </div>
      </div>

      {/* ── BOTTOM SPACER for ControlBar ─────────────────────────────── */}
      <div className="h-14" />
    </div>
  );
};
