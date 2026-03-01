import { ChartAxes, type Point } from "./base-chart";
export type DataPoint = Point;
export interface Series {
    /**
     * Display name for this data series
     * @required
     */
    name: string;
    /**
     * Array of data points (x, y coordinates)
     * @required
     */
    data: Point[];
    /**
     * Line color
     * Supports any valid CSS color value
     * @default "#3b82f6"
     */
    color?: string;
    /**
     * Line stroke width in pixels
     * @default 1.5
     */
    strokeWidth?: number;
}
export interface LineChartProps {
    /**
     * Array of data series to display
     * @required
     */
    series: Series[];
    /**
     * X-axis configuration
     */
    xAxis?: {
        /** Axis label text */
        label?: string;
        /** Value domain [min, max] or "auto" for automatic */
        domain?: [number, number] | "auto";
        /** Custom value formatter function */
        formatter?: (value: number) => string;
    };
    /**
     * Y-axis configuration
     */
    yAxis?: {
        /** Axis label text */
        label?: string;
        /** Value domain [min, max] or "auto" for automatic */
        domain?: [number, number] | "auto";
        /** Custom value formatter function */
        formatter?: (value: number) => string;
    };
    /**
     * Chart width
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vw")
     * @default 800
     */
    width?: number | string;
    /**
     * Chart height
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vh")
     * @default 400
     */
    height?: number | string;
    /**
     * Display grid lines
     * @default true
     */
    showGrid?: boolean;
    /**
     * Display axes with labels and ticks
     * @default true
     */
    showAxes?: boolean;
    /**
     * Enable interactive tooltip on hover
     * @default false
     */
    showTooltip?: boolean;
    /**
     * Additional CSS classes to apply to the container
     */
    className?: string;
    /**
     * Prefer WebGPU over WebGL for rendering
     * Falls back to WebGL if WebGPU is not available
     * @default true
     */
    preferWebGPU?: boolean;
}
export declare function LineChart({ series, xAxis, yAxis, width, height, showGrid, showAxes, showTooltip, preferWebGPU, className, }: LineChartProps): import("react/jsx-runtime").JSX.Element;
export declare namespace LineChart {
    var Root: ({ series, xAxis, yAxis, width, height, preferWebGPU, className, children, }: {
        series: Series[];
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
        width?: number | string;
        height?: number | string;
        preferWebGPU?: boolean;
        className?: string;
        children?: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Canvas: ({ showGrid }: {
        showGrid?: boolean;
    }) => import("react/jsx-runtime").JSX.Element;
    var Grid: () => null;
    var Axes: typeof ChartAxes;
    var Tooltip: () => import("react/jsx-runtime").JSX.Element;
}
export interface LineChartRootProps {
    series: Series[];
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
    width?: number | string;
    height?: number | string;
    preferWebGPU?: boolean;
    className?: string;
    children?: React.ReactNode;
}
export interface LineChartCanvasProps {
    showGrid?: boolean;
}
export default LineChart;
//# sourceMappingURL=line-chart.d.ts.map