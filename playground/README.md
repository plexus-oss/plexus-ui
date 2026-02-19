# Plexus UI Playground

Interactive demos of all Plexus UI components with real-time streaming data.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's Included

The playground showcases 6 dashboards with **real-time streaming data**:

### 1. Live Audio 🎵 (Real Streaming Data!)

- **Microphone input** - Real-time audio from your device
- **GPU-accelerated FFT spectrogram** - Time-frequency analysis
- **Frequency spectrum** - Live frequency content visualization
- **Statistical aggregation** - Volume and frequency tracking over time
- **No API keys required** - just click "Start Microphone"!

### 2. Motion Detection 📹 (Real Camera Data!)

- **Camera-based motion heatmap** - 20x20 grid analysis
- **Pixel-level motion tracking** - Frame-by-frame comparison
- **Real-time intensity metrics** - Current and average motion
- **Historical tracking** - Motion intensity over time
- **No setup required** - works with your webcam!

### 3. Device Tilt ✈️ (Real Gyroscope Data!)

- **Aviation attitude indicator** - Artificial horizon display
- **Real-time pitch and roll** - Device orientation tracking
- **Gyroscope/accelerometer data** - Hardware sensor integration
- **Historical orientation** - Track pitch/roll/heading over time
- **Mobile-first** - Best experienced on smartphones/tablets!

### 4. Health Monitoring

- Real-time ECG simulation
- EEG brainwave patterns (alpha, beta, theta)
- Vital signs (temperature, SpO₂, blood pressure)
- Streaming line charts

### 5. Robotics

- 6-motor speed monitoring
- Battery cell voltage tracking
- 100-sensor pressure array heatmap
- Real-time bar charts

### 6. Energy Management

- Power consumption by source (grid, solar, battery)
- Solar generation 24-hour cycle
- Energy storage metrics
- Multi-series line charts

## Why These Demos Matter

The **Live Audio**, **Motion Detection**, and **Device Tilt** dashboards showcase the real value of WebGPU-accelerated visualization:

- ✅ **True streaming data** - Not simulated, actual sensor input
- ✅ **60 FPS rendering** - Smooth GPU-accelerated charts
- ✅ **100k+ data points** - Handles massive datasets in real-time
- ✅ **Statistical analysis** - Aggregation and historical tracking
- ✅ **Zero setup** - Just browser permissions, no API keys

## Example Components

Browse `/examples/*` for individual component demos:

- `attitude-indicator.tsx` - Aviation attitude display
- `point-cloud-viewer.tsx` - 3D LIDAR visualization
- `waterfall-chart.tsx` - Time-frequency analysis
- `chart-annotations.tsx` - Interactive text labels and annotations
- `chart-ruler.tsx` - Measurement tool with ΔX/ΔY display
- `gantt.tsx` - Timeline scheduling
- `eeg-brain-interface.tsx` - EEG frequency analysis
- And many more!

## Architecture

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS + Radix UI
- **Rendering**: WebGPU + WebGL2 fallback
- **Charts**: Custom GPU-accelerated components
- **Audio**: Web Audio API with AnalyserNode
- **Camera**: MediaDevices getUserMedia API

## Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

## Adding Components

Use the Plexus UI CLI:

```bash
npx @plexusui/cli add line-chart
```

Components are copied into your project (not NPM dependencies).

## Learn More

- **Main docs**: [ui.plexus.company](https://ui.plexus.company)
- **Component library**: `/packages/components`
- **GitHub**: [github.com/plexus-oss/ui](https://github.com/plexus-oss/ui)

---

**Pro tip**: Start with the Live Audio dashboard - talk, sing, or play music to see real-time FFT analysis in action!
