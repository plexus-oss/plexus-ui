import type { BinMethod, HistogramBin } from "../lib/data-utils";
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
export declare function HistogramChart({ data, binCount, binMethod, mode, showNormalCurve, color, normalCurveColor, width, height, xAxis, yAxis, showGrid, showAxes, showTooltip, preferWebGPU, className, binEdge, }: HistogramChartProps): import("react/jsx-runtime").JSX.Element;
/**
 * Generate histogram example data (for testing/demos)
 */
export declare function generateNormalData(n: number, mean?: number, stdDev?: number): number[];
/**
 * Generate uniform random data
 */
export declare function generateUniformData(n: number, min?: number, max?: number): number[];
/**
 * Generate exponential distribution data
 */
export declare function generateExponentialData(n: number, lambda?: number): number[];
export default HistogramChart;
//# sourceMappingURL=histogram-chart.d.ts.map