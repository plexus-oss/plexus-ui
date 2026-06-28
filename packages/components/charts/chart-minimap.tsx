"use client";

import * as React from "react";
import { downsampleLTTB, downsampleMinMax } from "../lib/data-utils";
import type { Point } from "./base-chart";
import { ChartBrushSelector } from "./interactions";

// ============================================================================
// Types
// ============================================================================

export interface MinimapSeries<T = Point> {
  name: string;
  data: T[];
  color?: string;
}

export interface ChartMinimapProps<T = Point> {
  /**
   * Full dataset series
   */
  series: MinimapSeries<T>[];

  /**
   * Current visible range (in data coordinates)
   */
  visibleRange: {
    start: number;
    end: number;
  };

  /**
   * Full data range (min/max values in the dataset)
   */
  fullRange: {
    min: number;
    max: number;
  };

  /**
   * Callback when selection changes
   */
  onRangeChange: (start: number, end: number) => void;

  /**
   * Chart component to use for minimap (LineChart, BarChart, etc.)
   * Must be the Chart.Root component
   */
  ChartComponent: React.ComponentType<any>;

  /**
   * Props to pass to the chart component
   */
  chartProps?: Record<string, any>;

  /**
   * Height of the minimap in pixels
   */
  height?: number;

  /**
   * Width of the minimap (defaults to "100%")
   */
  width?: number | string;

  /**
   * Maximum number of data points to display in minimap (downsampling threshold)
   */
  maxPoints?: number;

  /**
   * Downsampling algorithm: "lttb" (Largest Triangle Three Buckets) or "minmax"
   */
  downsampleMethod?: "lttb" | "minmax";

  /**
   * Format function for date/value labels
   */
  formatLabel?: (value: number) => string;

  /**
   * Selection color
   */
  selectionColor?: string;

  /**
   * CSS class name for the container (used for ChartBrushSelector positioning)
   */
  containerClass?: string;

  /**
   * Extract x value from data point (for custom data types)
   */
  getX?: (point: T) => number;

  /**
   * Extract y value from data point (for custom data types)
   */
  getY?: (point: T) => number;

  /**
   * Custom Canvas component to use (e.g., LineChart.Canvas)
   */
  CanvasComponent?: React.ComponentType<any>;

  /**
   * Props to pass to Canvas component
   */
  canvasProps?: Record<string, any>;

  /**
   * Show axes in minimap (defaults to false for cleaner look)
   */
  showAxes?: boolean;

  /**
   * Axes component to use (e.g., LineChart.Axes)
   */
  AxesComponent?: React.ComponentType<any>;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Downsample a series of data points
 */
function downsampleSeries<T>(
  data: T[],
  maxPoints: number,
  method: "lttb" | "minmax",
  getX: (point: T) => number,
  getY: (point: T) => number
): Point[] {
  if (data.length <= maxPoints) {
    // No downsampling needed, convert to Point[]
    return data.map((point) => ({
      x: getX(point),
      y: getY(point),
    }));
  }

  // Convert to Point[] first
  const points: Point[] = data.map((point) => ({
    x: getX(point),
    y: getY(point),
  }));

  // Apply downsampling
  if (method === "lttb") {
    return downsampleLTTB(points, maxPoints);
  } else {
    return downsampleMinMax(points, maxPoints);
  }
}

// ============================================================================
// ChartMinimap Component
// ============================================================================

/**
 * Minimap component with range selector for navigating large datasets
 *
 * Displays a downsampled overview of the full dataset with a draggable
 * brush selector that allows users to select a visible range.
 *
 * @example Basic usage with LineChart
 * ```tsx
 * import { ChartMinimap } from "@plexusui/components/charts";
 * import { LineChart } from "@plexusui/components/charts";
 *
 * const [visibleRange, setVisibleRange] = useState({ start: 0, end: 1000 });
 *
 * <ChartMinimap
 *   series={fullDataSeries}
 *   visibleRange={visibleRange}
 *   fullRange={{ min: 0, max: 10000 }}
 *   onRangeChange={(start, end) => setVisibleRange({ start, end })}
 *   ChartComponent={LineChart.Root}
 *   CanvasComponent={LineChart.Canvas}
 *   height={80}
 * />
 * ```
 *
 * @example With BarChart and custom formatting
 * ```tsx
 * <ChartMinimap
 *   series={timeSeriesData}
 *   visibleRange={visibleRange}
 *   fullRange={{ min: startTimestamp, max: endTimestamp }}
 *   onRangeChange={(start, end) => setVisibleRange({ start, end })}
 *   ChartComponent={BarChart.Root}
 *   CanvasComponent={BarChart.Canvas}
 *   formatLabel={(timestamp) => new Date(timestamp).toLocaleDateString()}
 *   maxPoints={200}
 *   downsampleMethod="minmax"
 *   height={100}
 * />
 * ```
 */
export function ChartMinimap<T = Point>({
  series,
  visibleRange,
  fullRange,
  onRangeChange,
  ChartComponent,
  chartProps = {},
  height = 80,
  width = "100%",
  maxPoints = 200,
  downsampleMethod = "lttb",
  formatLabel,
  selectionColor = "#3b82f6",
  containerClass = "chart-minimap-container",
  getX = (point: any) => (point as Point).x,
  getY = (point: any) => (point as Point).y,
  CanvasComponent,
  canvasProps = {},
  showAxes = false,
  AxesComponent,
}: ChartMinimapProps<T>) {
  // Downsample the data for minimap display
  const downsampledSeries = React.useMemo(() => {
    return series.map((s) => ({
      name: s.name,
      data: downsampleSeries(s.data, maxPoints, downsampleMethod, getX, getY),
      color: s.color,
    }));
  }, [series, maxPoints, downsampleMethod, getX, getY]);

  // Debug logging
  React.useEffect(() => {
    console.log(
      "ChartMinimap - downsampledSeries:",
      downsampledSeries.map((s) => ({
        name: s.name,
        pointCount: s.data.length,
        firstPoint: s.data[0],
        lastPoint: s.data[s.data.length - 1],
      }))
    );
  }, [downsampledSeries]);

  // Calculate appropriate axis configuration for minimap
  const xAxisConfig = React.useMemo(() => {
    return {
      label: undefined, // No label in minimap to save space
      domain: [fullRange.min, fullRange.max] as [number, number],
      formatter: formatLabel,
    };
  }, [fullRange, formatLabel]);

  const yAxisConfig = React.useMemo(() => {
    // Calculate y-domain from downsampled data
    const allYValues = downsampledSeries.flatMap((s) => s.data.map((d) => d.y));
    const yMin = Math.min(...allYValues);
    const yMax = Math.max(...allYValues);

    console.log("ChartMinimap - yDomain:", {
      yMin,
      yMax,
      allYValues: allYValues.length,
    });

    return {
      label: undefined, // No label in minimap
      domain: [yMin, yMax] as [number, number],
    };
  }, [downsampledSeries]);

  return (
    <div className={`relative ${containerClass}`} style={{ width, height }}>
      <ChartComponent
        series={downsampledSeries}
        xAxis={xAxisConfig}
        yAxis={yAxisConfig}
        width={width}
        height={height}
        preferWebGPU={true}
        {...chartProps}
      >
        {CanvasComponent && <CanvasComponent showGrid={false} {...canvasProps} />}
        {showAxes && AxesComponent && <AxesComponent />}
        <ChartBrushSelector
          start={visibleRange.start}
          end={visibleRange.end}
          fullMin={fullRange.min}
          fullMax={fullRange.max}
          onSelectionChange={onRangeChange}
          formatLabel={formatLabel}
          color={selectionColor}
          containerClass={containerClass}
        />
      </ChartComponent>
    </div>
  );
}

// ============================================================================
// Minimap Container Component (for custom layouts)
// ============================================================================

export interface MinimapContainerProps {
  /**
   * Main chart content (the detailed chart)
   */
  children: React.ReactNode;

  /**
   * Minimap component
   */
  minimap: React.ReactNode;

  /**
   * Gap between main chart and minimap (in pixels)
   */
  gap?: number;

  /**
   * Container class name
   */
  className?: string;
}

/**
 * Container component that stacks a main chart with a minimap below it
 *
 * @example
 * ```tsx
 * <MinimapContainer
 *   minimap={
 *     <ChartMinimap
 *       series={fullData}
 *       visibleRange={range}
 *       onRangeChange={setRange}
 *       {...minimapProps}
 *     />
 *   }
 * >
 *   <LineChart series={visibleData} height={400} />
 * </MinimapContainer>
 * ```
 */
export function MinimapContainer({
  children,
  minimap,
  gap = 16,
  className = "",
}: MinimapContainerProps) {
  return (
    <div className={`flex flex-col ${className}`} style={{ gap: `${gap}px` }}>
      {/* Main chart */}
      <div className="flex-1">{children}</div>

      {/* Minimap */}
      <div className="flex-shrink-0">{minimap}</div>
    </div>
  );
}
