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
 *    - HeatmapChart
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

export type {
  AreaChartCanvasProps,
  AreaChartProps,
  AreaChartRootProps,
  DataPoint as AreaDataPoint,
  Series as AreaSeries,
} from "./area-chart";
export { AreaChart } from "./area-chart";
export type { AttitudeIndicatorProps } from "./attitude-indicator";
export { AttitudeIndicator } from "./attitude-indicator";
export type {
  BarChartCanvasProps,
  BarChartProps,
  BarChartRootProps,
  DataPoint as BarDataPoint,
  Series as BarSeries,
} from "./bar-chart";
export { BarChart } from "./bar-chart";
export type {
  Column,
  ColumnAlignment,
  ColumnType,
  DataGridProps,
} from "./data-grid";
export { DataGrid } from "./data-grid";
export type { EphemerisCardProps } from "./ephemeris-card";
export { EphemerisCard } from "./ephemeris-card";
export type {
  GanttChartContainerProps,
  GanttChartControlsProps,
  GanttChartCurrentTimeProps,
  GanttChartGridProps,
  GanttChartHeaderProps,
  GanttChartLeftPanelProps,
  GanttChartRootProps,
  GanttChartTasksProps,
  GanttChartViewportProps,
  Task,
  TaskStatus,
} from "./gantt";
export { GanttChart } from "./gantt";
export type {
  GroundStation2D,
  GroundTrack2DProps,
  GroundTrack2DSatellite,
} from "./ground-track-2d";
export { GroundTrack2D } from "./ground-track-2d";
export type {
  DataPoint as HeatmapDataPoint,
  HeatmapChartProps,
  HeatmapChartRootProps,
} from "./heatmap-chart";
export { HeatmapChart } from "./heatmap-chart";
export type {
  DataPoint as LineDataPoint,
  LineChartCanvasProps,
  LineChartProps,
  LineChartRootProps,
  Series as LineSeries,
} from "./line-chart";
export { LineChart } from "./line-chart";
export type {
  PolarSkyPlotProps,
  SkyPlotObserver,
  SkyPlotSatellite,
} from "./polar-sky-plot";
export { PolarSkyPlot } from "./polar-sky-plot";
export type {
  RadarChartProps,
  RadarDataPoint,
  RadarSeries,
} from "./radar-chart";
export { RadarChart } from "./radar-chart";
export type {
  DataPoint as ScatterDataPoint,
  ScatterChartCanvasProps,
  ScatterChartProps,
  ScatterChartRootProps,
  Series as ScatterSeries,
} from "./scatter-chart";
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
export {
  type Complex,
  calculateBounds,
  calculateNiceBounds,
  createOrResizeVertexBuffer,
  data3DToVertexArray,
  dataToVertexArray,
  downsampleLTTB,
  downsampleMinMax,
  generateCategoricalData,
  generateSineWave,
  generateTelemetryData,
  normalizeData,
  type SpectrogramPoint as DataSpectrogramPoint,
} from "../lib/data-utils";
export type { AlertBand, AlertBandsProps } from "./alert-bands";
// Alert bands overlay
export { AlertBands } from "./alert-bands";
export type {
  Annotation,
  ChartAnnotationsProps,
  ChartReferenceLineProps,
  ChartRegionProps,
  ChartRulerProps,
  Measurement,
  // Annotations' array wrapper is renamed to avoid colliding with the
  // severity-based `ReferenceLines` (which pairs with the `ReferenceLine` type).
  ReferenceLinesProps as ChartReferenceLinesProps,
} from "./annotations";
// Chart annotations and helpers
export {
  ChartAnnotations,
  ChartReferenceLine,
  ChartRegion,
  ChartRuler,
  ReferenceLines as ChartReferenceLines,
} from "./annotations";
export type {
  Axis,
  BaseChartContext,
  BaseChartRootProps,
  HoveredPoint,
  Margin,
  Point,
  RendererProps,
  TimeSeriesState,
  TooltipData,
  WebGLRenderer,
  WebGPURenderer,
} from "./base-chart";
// Base chart infrastructure (reusable for all chart types)
export {
  ChartAxes,
  ChartRoot,
  ChartTooltip,
  formatValue,
  getDomain,
  getTicks,
  hexToRgb,
  useBaseChart,
} from "./base-chart";
// ============================================================================
// Config-driven Chart (matches the Plexus frontend's UnifiedChart)
// ============================================================================
export type {
  ChartProps,
  ChartType,
  UnifiedChartProps,
  UnifiedSeries,
} from "./chart";
export { Chart, UnifiedChart } from "./chart";
// Shared GPU device — wrap a chart subtree in <GPUDeviceProvider> so every
// chart reuses one GPUDevice instead of each acquiring its own.
export { GPUDeviceProvider, useGPUDevice } from "./gpu-device-provider";
export type {
  BrushSelection,
  ChartBrushProps,
  ChartClickProps,
  ChartCrosshairProps,
  ChartInteractionsProps,
  ChartPanZoomProps,
  ClickEvent,
  CrosshairPosition,
} from "./interactions";
// Chart interactions (pan/zoom is always on inside <Chart>)
export {
  ChartBrush,
  ChartClick,
  ChartCrosshair,
  ChartInteractions,
  ChartPanZoom,
} from "./interactions";
export type { ReferenceLine } from "./reference-lines";
// The canonical `ReferenceLines` is the severity-based overlay that pairs with
// the exported `ReferenceLine` type. (Annotations' axis-based array wrapper is
// exported as `ChartReferenceLines`.)
export { limitsToReferenceLines, ReferenceLines } from "./reference-lines";
export type { UnifiedRendererProps } from "./unified-renderer";
export {
  createUnifiedWebGLRenderer,
  createUnifiedWebGPURenderer,
} from "./unified-renderer";
export type {
  UseChartPanZoomOptions,
  UseChartPanZoomResult,
} from "./use-chart-pan-zoom";
// Pan/zoom interaction primitive
export { useChartPanZoom } from "./use-chart-pan-zoom";
