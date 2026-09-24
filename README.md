# 🗿 Confidence Booster // Sigma Phonk Tactical Webcam & Meme Matcher

[![Netlify Status](https://api.netlify.com/api/v1/badges/55df2956-02f8-469e-b20e-8e18fe3cf77c/deploy-status)](https://app.netlify.com/projects/sigma-jaks360/deploys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

> 🚀 **Live Production Link:** [https://sigma-jaks360.netlify.app](https://sigma-jaks360.netlify.app)  
> ⚡ **Creator & Superhero Theme:** Jaideep Jaks 360 Edition

An AI-powered tactical webcam application built with **React**, **Vite**, **TypeScript**, **MediaPipe Vision AI**, and the **Web Audio API**. It tracks your head posture, facial expressions, and hand gestures in real-time, calculates tactical confidence metrics, and automatically unleashes high-energy Sigma Phonk edits, 360° rotating vortex drops, beat-synced visual hard snaps, and bass drops whenever you lock in!

---

## ⚡ Features

### 1. 🎯 Tactical HUD & 3D Head Tracking
- **Real-Time 3D Wireframe Cube:** Projects a 3D rotating bounding box over your head calculating pitch, yaw, and roll at 60 FPS using 478 MediaPipe landmarks.
- **Cyberpunk Tactical Aesthetics:** Authentic CRT scanlines, CRT vignette, neon reticles, and Orbitron / Share Tech Mono typography.
- **Dynamic Gauges:** Real-time progress bars for Drink Sip probability, Glasses Adjustment score, and microphone broadcast level.

### 2. 🌀 Rotating Face Vortex & Sigma Themes
- **Rotating Sigma Vortex (`rotating_sigma_vortex`):** Explosive -360° to 0° rotational spin-in, rhythmic wobble on drop, and alternating beat-kick rotational snaps.
- **Lightning God Aura (`lightning_god_aura`):** Pulsing neon purple & gold electric lightning arcs radiating from your face on 808 kicks.
- **Ghost Trail Impact (`ghost_trail_impact`):** Phonk ghost trails, 808 sub-bass shatter, and dramatic zoom (`Montagem Tomada`).
- **Dark Manga Strobe (`dark_manga_strobe`):** High-contrast black & white manga strobe glitches with inverted negatives (`Mogger`).
- **Sigma Hard Snaps (`sigma_hard_snaps`):** Beat-synced visual hard snaps on 808 kicks with chromatic aberration and the iconic `MOGGED` overlay.
- **Parallax Dual Speed (`parallax_dual_speed`):** Dual-speed temporal frame blending for intense slow-motion playback.

### 3. 👑 100% Masculine & Creator Sigma Meme Lineup
- **Jaideep Jaks Superhero:** Bodybuilder pose with bandana & shades.
- **Sigma Lightning God:** Purple divine aura & neon electric eyes.
- **Arab Sigma Duo:** Keffiyeh duo pointing to victory with fire aura.
- **Heisenberg Keffiyeh:** Walter White in desert keffiyeh and glasses.
- **Beanie Cold Stare:** Thousand-yard stare in red spotted beanie.
- **Patrick Bateman Smirk & Pout:** Christian Bale iconic American Psycho sigma facial expressions.
- **Jaideep Confident Mogger & Pure Smile:** High-confidence creator poses.
- **Divine Lord Krishna & Leo DiCaprio:** S-tier classic masculine legends.

### 4. 🎙️ Virtual Audio Cable Broadcast Engine
- Custom Web Audio API mixer featuring:
  - 80Hz Highpass filter + 7.8kHz Lowpass filter
  - Dual peaking formant and presence filters
  - Fast-attack dynamics compressor
  - Real-time microphone capture mixed directly with Phonk audio tracks
- Stream directly into **Discord**, **Zoom**, **Google Meet**, **OmeTV**, or **OBS** so your friends hear the bass drop over the call.

### 5. 🎥 OBS Studio & Streaming Integration
- **Clean Pop-Out Projector Window:** Borderless 16:9 projector with an independent 60 FPS video decoder for OBS Window Capture.
- **Always-on-Top PiP Mode:** Uses modern Document Picture-in-Picture to float over your video calls without tab throttling.
- **Zero-UI Broadcast Mode:** Press `ESC` to toggle off all controls for instant clean screen capture.
- **Clip Recorder:** Automatic recording with instant MP4/WebM download.

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- A working webcam and microphone

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jaideepkrishna2008-ui/confidence-booster-app.git
cd confidence-booster-app
```

2. Install dependencies:
```bash
npm install
```

3. Launch local development server:
```bash
npm run dev
```

4. Open `http://localhost:3000` in Google Chrome or any Chromium-based browser (for Web Audio API & Document Picture-in-Picture support).

---

## 🎮 Hotkeys & Controls

| Key / Control | Action |
|---|---|
| `Space` | Manually trigger Sigma Phonk edit sequence |
| `Escape` | Toggle Zero-UI mode for clean screen recordings |
| `Camera Icon` | Switch between front and rear cameras |
| `Mirror Icon` | Toggle horizontal mirror reflection |
| `Audio Icon` | Mute / Unmute Phonk music |
| `TRACKS` | Open Phonk soundboard & soundtrack selection |
| `STREAM` | Open OBS virtual camera and cable broadcast guide |
| `PRESET` | Select between 6 dynamic editing themes |
| `MODE` | Switch trigger mode (`ALL`, `FACE EXPR`, `CRAZY MOV`, `DRINK SIP`, `GLASSES`) |

---

## 🛠️ Tech Stack

- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Custom CRT scanline shaders
- **Computer Vision & AI:** `@mediapipe/tasks-vision` (FaceLandmarker & HandLandmarker)
- **Audio Processing:** Web Audio API (BiquadFilterNodes, DynamicsCompressor, Custom WaveShaper distortion)
- **Icons:** `lucide-react`
- **Hosting:** Netlify Edge

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
