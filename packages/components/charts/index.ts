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
  DataPoint as HeatmapDataPoint,
  HeatmapChartProps,
  HeatmapChartRootProps,
} from "./heatmap-chart";
export { HeatmapChart } from "./heatmap-chart";
export type { HistogramChartProps } from "./histogram-chart";
export { HistogramChart } from "./histogram-chart";
export type {
  DataPoint as LineDataPoint,
  LineChartCanvasProps,
  LineChartProps,
  LineChartRootProps,
  Series as LineSeries,
} from "./line-chart";
// Chart components
export { LineChart } from "./line-chart";
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
  type BinMethod,
  type Complex,
  calculateBinCount,
  calculateBounds,
  calculateNiceBounds,
  calculateNormalCurve,
  createHistogramBins,
  createOrResizeVertexBuffer,
  data3DToVertexArray,
  dataToVertexArray,
  downsampleLTTB,
  downsampleMinMax,
  generateCategoricalData,
  generateSineWave,
  generateTelemetryData,
  type HistogramBin,
  normalizeData,
  type SpectrogramPoint as DataSpectrogramPoint,
} from "../lib/data-utils";
export type {
  Annotation,
  ChartAnnotationsProps,
  ChartReferenceLineProps,
  ChartRegionProps,
  ChartRulerProps,
  Measurement,
} from "./annotations";
// Chart annotations and helpers
export {
  ChartAnnotations,
  ChartReferenceLine,
  ChartRegion,
  ChartRuler,
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
export type {
  ChartMinimapProps,
  MinimapContainerProps,
  MinimapSeries,
} from "./chart-minimap";

// Chart minimap
export { ChartMinimap, MinimapContainer } from "./chart-minimap";
export type {
  BrushSelection,
  ChartBrushProps,
  ChartBrushSelectorProps,
  ChartClickProps,
  ChartCrosshairProps,
  ChartInteractionsProps,
  ClickEvent,
  CrosshairPosition,
} from "./interactions";
// Chart interactions
export {
  ChartBrush,
  ChartBrushSelector,
  ChartClick,
  ChartCrosshair,
  ChartInteractions,
} from "./interactions";
