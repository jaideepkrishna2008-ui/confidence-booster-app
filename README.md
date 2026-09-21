# 🗿 Confidence Booster // Sigma Phonk Tactical Webcam & Meme Matcher

> **Live Reference:** [am1t-builds-rm3g.vercel.app](https://am1t-builds-rm3g.vercel.app/)  
> **Facial Expression Meme Matcher Engine:** Integrated with [kristelTech/make_me_a_meme](https://github.com/kristelTech/make_me_a_meme)

An AI-powered tactical webcam application built with **React**, **Vite**, **TypeScript**, **MediaPipe Vision AI**, and the **Web Audio API**. It tracks your head posture and hand gestures in real-time, calculates confidence metrics, and automatically unleashes high-energy Sigma Phonk edits, beat-synced visual hard snaps, and bass drops whenever you take a sip of water or push up your glasses!

---

## ⚡ Features

### 1. 🎯 Tactical HUD & 3D Head Tracking
- **Real-Time 3D Wireframe Cube:** Projects a 3D rotating bounding box over your head calculating pitch, yaw, and roll at 60 FPS using 478 MediaPipe landmarks.
- **Cyberpunk Tactical Aesthetics:** Authentic CRT scanlines, CRT vignette, neon reticles, and Orbitron / Share Tech Mono typography.
- **Dynamic Gauges:** Real-time progress bars for Drink Sip probability, Glasses Adjustment score, and microphone broadcast level.

### 2. 🤖 MediaPipe AI Gesture Triggers
- **Drink Sip Detection:** Triggers when your head tilts back while a hand moves near your mouth.
- **Glasses Adjustment Detection:** Triggers when your fingertips move near the bridge of your nose / eye line.
- **Manual Trigger:** Press `SPACEBAR` or click **TRIGGER** anytime for an instant confidence boost.

### 3. 😂 Real-Time Meme Matcher (kristelTech/make_me_a_meme)
- Analyzes 13 facial and hand features (eye openness, brow height, mouth curvature, hand gestures).
- Real-time exponential-decay similarity matching against 6 iconic internet memes:
  - 🥂 **Leonardo DiCaprio:** Great Gatsby champagne toast (cheers gesture & smile)
  - ✊ **Success Kid:** Determined baby fist pump
  - 🔥 **Disaster Girl:** Smirking sideways glance
  - 🤔 **Gene Wilder:** Willy Wonka sarcastic smirk with hand on chin
  - 👁️ **Overly Attached Girlfriend:** Wide-eyed intense stare
  - 😠 **Angry Baby:** Furrowed brows and stern expression

### 4. 🎬 High-Impact Sigma Phonk Edit Presets
- **Ghost Trail Impact:** Phonk ghost trails, 808 sub-bass shatter, and dramatic zoom (`Montagem Tomada`).
- **Dark Manga Invert:** High-contrast black & white manga strobe glitches (`Mogger`).
- **Sigma Hard Snaps:** Beat-synced visual hard snaps on 808 kicks with chromatic aberration and the iconic `MOGGED` overlay (`Marlon Gets Mogged`).
- **Parallax Dual Speed:** Dual-speed temporal frame blending for intense slow-motion playback.

### 5. 🎙️ Virtual Audio Cable Broadcast Engine
- Custom Web Audio API mixer featuring:
  - 80Hz Highpass filter + 7.8kHz Lowpass filter
  - Dual peaking formant and presence filters
  - Fast-attack dynamics compressor
  - Real-time microphone capture mixed directly with Phonk audio tracks
- Stream directly into **Discord**, **Zoom**, **Google Meet**, **OmeTV**, or **OBS** so your friends hear the bass drop over the call.

### 6. 🎥 OBS Studio & Streaming Integration
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

| Key | Action |
|---|---|
| `Space` | Manually trigger Sigma Phonk edit sequence |
| `Escape` | Exit Zero-UI mode |
| `Camera Icon` | Switch between front and rear cameras |
| `Mirror Icon` | Toggle horizontal mirror reflection |
| `Mute Icon` | Mute / Unmute Phonk music |
| `TRACKS` | Open Phonk soundboard & soundtrack selection |
| `STREAM / OBS`| Open OBS virtual camera and cable broadcast guide |
| `MEME MODE` | Toggle real-time Meme Matcher HUD preview |

---

## 🛠️ Tech Stack

- **Framework:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Custom CRT scanline shaders
- **Computer Vision & AI:** `@mediapipe/tasks-vision` (FaceLandmarker & HandLandmarker)
- **Audio Processing:** Web Audio API (BiquadFilterNodes, DynamicsCompressor, Custom WaveShaper distortion)
- **Icons:** `lucide-react`

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).
