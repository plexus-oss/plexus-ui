/**
 * Plexus UI - Charts
 *
 * High-performance WebGL/WebGPU-accelerated chart components for mission-critical
 * visualization in aerospace, medical, and industrial applications.
 *
 * @module charts
 *
 * ## Architecture
 *
 * The chart system is built on three layers:
 *
 * 1. **Base Chart Layer** (`ChartRoot`, `ChartAxes`, `ChartTooltip`)
 *    - WebGL/WebGPU renderer management with automatic fallback
 *    - Responsive sizing with devicePixelRatio support
 *    - Coordinate transformations (data space ↔ screen space)
 *    - Shared context for all chart primitives
 *
 * 2. **Component Layer** (Chart Primitives)
 *    - LineChart, BarChart, ScatterChart, AreaChart
 *    - HeatmapChart, Histogram
 *    - RadarChart, AttitudeIndicator
 *    - DataGrid, GanttChart, ModelViewer
 *
 * 3. **Utility Layer** (`data-utils`, `interactions`)
 *    - Data transformation functions (downsampling, binning, FFT)
 *    - Interaction primitives (click, brush, crosshair)
 *    - Buffer management and GPU optimization
 *
 * ## Usage Patterns
 *
 * **Simple API** (Monolithic component):
 * ```tsx
 * import { LineChart } from "@plexusui/components/charts";
 *
 * <LineChart
 *   series={[{ name: "Temperature", data: telemetryData, color: "#00ff00" }]}
 *   width={800}
 *   height={400}
 *   showAxes
 *   showTooltip
 * />
 * ```
 *
 * **Composable API** (Primitive-first):
 * ```tsx
 * import { LineChart } from "@plexusui/components/charts";
 *
 * <LineChart.Root
 *   series={[{ name: "Sensor 1", data: data1, color: "#00ff00" }]}
 *   width={800}
 *   height={400}
 * >
 *   <LineChart.Canvas />
 *   <LineChart.Axes />
 *   <LineChart.Tooltip />
 * </LineChart.Root>
 * ```
 *
 * **Multi-series with Interactions**:
 * ```tsx
 * import { LineChart, ChartInteractions } from "@plexusui/components/charts";
 *
 * <LineChart.Root series={multiSeriesData}>
 *   <LineChart.Canvas />
 *   <LineChart.Axes />
 *   <ChartInteractions>
 *     <ChartInteractions.Brush onBrush={(selection) => console.log(selection)} />
 *     <ChartInteractions.Crosshair />
 *     <ChartInteractions.Click onClick={(point) => console.log(point)} />
 *   </ChartInteractions>
 * </LineChart.Root>
 * ```
 */
export { AreaChart } from "./area-chart";
export { AttitudeIndicator } from "./attitude-indicator";
export { BarChart } from "./bar-chart";
export { DataGrid } from "./data-grid";
export { GanttChart } from "./gantt";
export { HeatmapChart } from "./heatmap-chart";
export { HistogramChart } from "./histogram-chart";
// Chart components
export { LineChart } from "./line-chart";
export { RadarChart } from "./radar-chart";
export { ScatterChart } from "./scatter-chart";
// ============================================================================
// 3D Components (Three.js)
// ============================================================================
//
// NOTE: 3D components are now in a separate entry point to optimize bundle size.
// Import them from "@plexusui/components/charts/3d" instead:
//
//   import { PointCloudViewer, ModelViewer } from "@plexusui/components/charts/3d";
//
// This prevents Three.js from being included in your main bundle if you're
// only using 2D charts.
// ============================================================================
// Data utilities
export { calculateBinCount, calculateBounds, calculateNiceBounds, calculateNormalCurve, createHistogramBins, createOrResizeVertexBuffer, data3DToVertexArray, dataToVertexArray, downsampleLTTB, downsampleMinMax, generateCategoricalData, generateSineWave, generateTelemetryData, normalizeData, } from "../lib/data-utils";
// Chart annotations and helpers
export { ChartAnnotations, ChartReferenceLine, ChartRegion, ChartRuler, } from "./annotations";
// Base chart infrastructure (reusable for all chart types)
export { ChartAxes, ChartRoot, ChartTooltip, formatValue, getDomain, getTicks, hexToRgb, useBaseChart, } from "./base-chart";
// Chart minimap
export { ChartMinimap, MinimapContainer } from "./chart-minimap";
// Chart interactions
export { ChartBrush, ChartBrushSelector, ChartClick, ChartCrosshair, ChartInteractions, } from "./interactions";
//# sourceMappingURL=index.js.map