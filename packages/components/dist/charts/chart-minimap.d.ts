import * as React from "react";
import type { Point } from "./base-chart";
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
export declare function ChartMinimap<T = Point>({ series, visibleRange, fullRange, onRangeChange, ChartComponent, chartProps, height, width, maxPoints, downsampleMethod, formatLabel, selectionColor, containerClass, getX, getY, CanvasComponent, canvasProps, showAxes, AxesComponent, }: ChartMinimapProps<T>): import("react/jsx-runtime").JSX.Element;
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
export declare function MinimapContainer({ children, minimap, gap, className, }: MinimapContainerProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=chart-minimap.d.ts.map