# Plexus UI

**GPU-accelerated React components for real-time visualization of physical systems.** WebGPU/WebGL2 charts, 3D viewers, and flight instruments that render 100k+ data points at 60fps — built for hardware dashboards, aerospace HUDs, robotics, and industrial monitoring.

[![npm](https://img.shields.io/npm/v/@plexusui/cli)](https://www.npmjs.com/package/@plexusui/cli)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

```tsx
<LineChart.Root
  series={[
    {
      name: "Temperature",
      data: points,
      color: "#3b82f6",
    },
  ]}
  xAxis={{ label: "Time (s)", domain: "auto" }}
  yAxis={{ label: "°C" }}
  height={400}
  preferWebGPU={true}
>
  <LineChart.Canvas showGrid />
  <LineChart.Axes />
  <LineChart.Tooltip />
</LineChart.Root>
```

## Install

```bash
npx plexusui init
npx plexusui add line-chart
```

Copy-paste components into your project — no runtime dependency to manage.

## Components

### Charts

| Component          | Description                                                      |
| ------------------ | ---------------------------------------------------------------- |
| **LineChart**      | Multi-series line chart, 100k+ points, real-time streaming       |
| **AreaChart**      | Filled area chart with stacking                                  |
| **BarChart**       | Vertical/horizontal bars, grouped & stacked layouts              |
| **ScatterChart**   | Scatter plot with variable point sizes/colors, 50k+ points       |
| **HistogramChart** | Distribution with auto-binning (Sturges/Scott/Freedman-Diaconis) |
| **HeatmapChart**   | 2D grid heatmap for thermal/pressure arrays                      |

### 3D Visualization

| Component            | Description                                                            |
| -------------------- | ---------------------------------------------------------------------- |
| **PointCloudViewer** | 10M+ points, LIDAR/photogrammetry, color mapping by height/intensity   |
| **3DModelViewer**    | STL/OBJ/GLTF/GLB with vertex color overlay for stress/thermal analysis |

### Instruments

| Component             | Description                                            |
| --------------------- | ------------------------------------------------------ |
| **AttitudeIndicator** | Artificial horizon (pitch/roll) for aerospace displays |
| **RadarChart**        | Polar radar sweep for air traffic, sonar, LIDAR        |

### Data & Timeline

| Component    | Description                                                         |
| ------------ | ------------------------------------------------------------------- |
| **DataGrid** | Virtual scrolling table for 10k+ rows of telemetry logs             |
| **Gantt**    | Interactive timeline with zoom/infinite scroll for mission planning |

### Interactive Overlays

| Component            | Description                                               |
| -------------------- | --------------------------------------------------------- |
| **ChartAnnotations** | Click-to-add text labels on data points                   |
| **ChartRegion**      | Shaded vertical regions to mark time ranges/flight phases |
| **ChartRuler**       | Interactive measurement tool (ΔX, ΔY, distance)           |

## Why Plexus UI

- **GPU-accelerated rendering** — WebGPU with WebGL2 fallback. Charts stay at 60fps even with 100k+ points.
- **Zero-copy buffer updates** — Stream data directly to the GPU without serialization overhead.
- **Copy-paste, not install** — Components live in your codebase. No version conflicts, no lock-in.
- **TypeScript + React** — Full type safety, composable primitives, dark mode built in.

## Development

```bash
git clone https://github.com/plexus-oss/ui.git
cd ui
npm install
npm run dev
```

Open http://localhost:3000 to see the playground and demos.

## Contributing

- Report bugs via [GitHub Issues](https://github.com/plexus-oss/ui/issues)
- Request features via [Discussions](https://github.com/plexus-oss/ui/discussions)
- Submit PRs for bug fixes or new components

## License

MIT License — see [LICENSE](./LICENSE) for details.
