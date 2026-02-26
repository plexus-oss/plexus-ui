# Plexus UI Playground

Interactive demos of all Plexus UI components with real-time streaming data.

## Quick Start

```bash
npm install
npm run dev
```

Open http://localhost:3000

## What's Included

The playground showcases interactive demos of all Plexus UI chart components with real-time streaming data. Browse the home page for a live telemetry demo, or explore individual example components.

## Example Components

Browse `/examples/*` for individual component demos:

- `attitude-indicator.tsx` - Aviation attitude display
- `point-cloud-viewer.tsx` - 3D LIDAR visualization
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
