/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import { useMemo } from "react";
import type { BinMethod, DataPoint, HistogramBin } from "../lib/data-utils";
import { calculateNormalCurve, createHistogramBins } from "../lib/data-utils";
import type { Series } from "./bar-chart";
import { BarChart } from "./bar-chart";

// ============================================================================
// Histogram Types
// ============================================================================

export interface HistogramChartProps {
  /**
   * Raw data values to create histogram from
   */
  data: number[];

  /**
   * Number of bins (optional - will be calculated if not provided)
   */
  binCount?: number;

  /**
   * Bin calculation method
   * - sturges: Good for normal distributions
   * - scott: Good for continuous data
   * - freedman-diaconis: Good for non-normal distributions
   * - sqrt: Square root rule (simple, general purpose)
   * - number: Manual bin count
   */
  binMethod?: BinMethod;

  /**
   * Display mode
   * - count: Show raw counts
   * - density: Show probability density
   * - frequency: Show relative frequency (count / total)
   */
  mode?: "count" | "density" | "frequency";

  /**
   * Show normal distribution overlay
   */
  showNormalCurve?: boolean;

  /**
   * Color for histogram bars
   */
  color?: string;

  /**
   * Color for normal curve overlay
   */
  normalCurveColor?: string;

  /**
   * Chart dimensions
   */
  width?: number | string;
  height?: number | string;

  /**
   * Axis configuration
   */
  xAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };
  yAxis?: {
    label?: string;
    domain?: [number, number] | "auto";
    formatter?: (value: number) => string;
  };

  /**
   * Display options
   */
  showGrid?: boolean;
  showAxes?: boolean;
  showTooltip?: boolean;
  preferWebGPU?: boolean;
  className?: string;

  /**
   * Bin edge mode
   * - left: Bins include left edge (default)
   * - right: Bins include right edge
   */
  binEdge?: "left" | "right";
}

export type { HistogramBin };

// ============================================================================
// Histogram Component
// ============================================================================

export function HistogramChart({
  data,
  binCount,
  binMethod = "sturges",
  mode = "count",
  showNormalCurve = false,
  color = "#3b82f6",
  normalCurveColor = "#ef4444",
  width = 800,
  height = 400,
  xAxis = {},
  yAxis = {},
  showGrid = true,
  showAxes = true,
  showTooltip = true,
  preferWebGPU = true,
  className,
  binEdge = "left",
}: HistogramChartProps) {
  // Calculate bins from data
  const bins = useMemo(() => {
    return createHistogramBins(data, binCount, binMethod);
  }, [data, binCount, binMethod]);

  // Convert bins to bar chart series
  const series: Series[] = useMemo(() => {
    const histogramSeries: Series = {
      name: "Histogram",
      data: bins.map((bin) => {
        let yValue: number;
        switch (mode) {
          case "density":
            yValue = bin.density;
            break;
          case "frequency":
            yValue = bin.count / data.length;
            break;
          case "count":
          default:
            yValue = bin.count;
            break;
        }

        return {
          x: bin.center,
          y: yValue,
          label: `${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}`,
        };
      }),
      color,
    };

    return [histogramSeries];
  }, [bins, mode, data.length, color]);

  // Calculate normal curve overlay if requested
  const normalCurvePoints = useMemo(() => {
    if (!showNormalCurve || data.length === 0) return [];
    return calculateNormalCurve(data, 100);
  }, [showNormalCurve, data]);

  // Calculate bin width for proper bar sizing
  const binWidth = useMemo(() => {
    if (bins.length === 0) return 0;
    return bins[0].max - bins[0].min;
  }, [bins]);

  // Auto-calculate domain based on data
  const autoDomain = useMemo((): [number, number] => {
    if (data.length === 0) return [0, 1];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const padding = (max - min) * 0.05;
    return [min - padding, max + padding];
  }, [data]);

  // Auto-calculate Y domain based on mode
  const yDomain = useMemo((): [number, number] => {
    if (yAxis.domain && yAxis.domain !== "auto") {
      return yAxis.domain;
    }

    if (bins.length === 0) return [0, 1];

    let maxY = 0;
    for (const bin of bins) {
      let yValue: number;
      switch (mode) {
        case "density":
          yValue = bin.density;
          break;
        case "frequency":
          yValue = bin.count / data.length;
          break;
        case "count":
        default:
          yValue = bin.count;
          break;
      }
      if (yValue > maxY) maxY = yValue;
    }

    // Add 10% padding at top
    return [0, maxY * 1.1];
  }, [bins, mode, data.length, yAxis.domain]);

  // Auto-generate axis labels based on mode
  const yAxisLabel = useMemo(() => {
    if (yAxis.label) return yAxis.label;

    switch (mode) {
      case "density":
        return "Density";
      case "frequency":
        return "Frequency";
      case "count":
      default:
        return "Count";
    }
  }, [yAxis.label, mode]);

  // Render using BarChart with calculated bar width
  // We use orientation="vertical" and set barWidth to match bin width
  const chartWidth = typeof width === "string" ? parseInt(width) : width - 80; // Account for margins
  const xRange = autoDomain[1] - autoDomain[0];
  const pixelsPerUnit = chartWidth / xRange;
  const calculatedBarWidth = binWidth * pixelsPerUnit * 0.95; // 95% to add tiny gap

  return (
    <div className={className} style={{ position: "relative" }}>
      <BarChart
        series={series}
        xAxis={{
          ...xAxis,
          label: xAxis.label || "Value",
          domain: xAxis.domain === "auto" || !xAxis.domain ? autoDomain : xAxis.domain,
        }}
        yAxis={{
          ...yAxis,
          label: yAxisLabel,
          domain: yDomain,
        }}
        width={width}
        height={height}
        showGrid={showGrid}
        showAxes={showAxes}
        showTooltip={showTooltip}
        preferWebGPU={preferWebGPU}
        orientation="vertical"
        barWidth={calculatedBarWidth}
        barGap={2}
        grouped={false}
      />

      {/* Normal curve overlay (if requested) */}
      {showNormalCurve && normalCurvePoints.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={width}
          height={height}
          style={{ top: 0, left: 0 }}
        >
          <NormalCurveOverlay
            data={normalCurvePoints}
            xDomain={xAxis.domain === "auto" || !xAxis.domain ? autoDomain : xAxis.domain}
            yDomain={yDomain}
            width={typeof width === "string" ? parseInt(width) : width}
            height={typeof height === "string" ? parseInt(height) : height}
            color={normalCurveColor}
          />
        </svg>
      )}
    </div>
  );
}

// ============================================================================
// Normal Curve Overlay Component
// ============================================================================

function NormalCurveOverlay({
  data,
  xDomain,
  yDomain,
  width,
  height,
  color,
}: {
  data: DataPoint[];
  xDomain: [number, number];
  yDomain: [number, number];
  width: number;
  height: number;
  color: string;
}) {
  const margin = { top: 20, right: 20, bottom: 50, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = (x: number) =>
    margin.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
  const yScale = (y: number) =>
    height - margin.bottom - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;

  const pathData = data
    .map((point, i) => {
      const x = xScale(point.x);
      const y = yScale(point.y);
      return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
    })
    .join(" ");

  return (
    <g>
      <path
        d={pathData}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeDasharray="4 2"
        opacity={0.7}
      />
    </g>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate histogram example data (for testing/demos)
 */
export function generateNormalData(n: number, mean = 0, stdDev = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    // Box-Muller transform to generate normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    data.push(z0 * stdDev + mean);
  }
  return data;
}

/**
 * Generate uniform random data
 */
export function generateUniformData(n: number, min = 0, max = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    data.push(Math.random() * (max - min) + min);
  }
  return data;
}

/**
 * Generate exponential distribution data
 */
export function generateExponentialData(n: number, lambda = 1): number[] {
  const data: number[] = [];
  for (let i = 0; i < n; i++) {
    const u = Math.random();
    data.push(-Math.log(u) / lambda);
  }
  return data;
}

export default HistogramChart;
