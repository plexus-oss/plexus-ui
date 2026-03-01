export interface RadarDataPoint {
    /**
     * Angular position in degrees (0-360)
     * 0° is North, increases clockwise
     */
    angle: number;
    /**
     * Distance from center (normalized 0-1)
     * 0 = center, 1 = outer edge
     */
    distance: number;
    /**
     * Optional label for this data point
     */
    label?: string;
    /**
     * Color intensity for this point (0-1)
     * @default 1
     */
    intensity?: number;
}
export interface RadarSeries {
    /**
     * Display name for this data series
     * @required
     */
    name: string;
    /**
     * Array of data points for this series
     * @required
     */
    data: RadarDataPoint[];
    /**
     * Color for this series
     * Supports any valid CSS color value
     * @default "#3b82f6"
     */
    color?: string;
    /**
     * Display trail effect for moving targets
     * @default false
     */
    showTrail?: boolean;
    /**
     * Length of trail in number of points
     * @default 5
     */
    trailLength?: number;
}
export interface RadarChartProps {
    /**
     * Array of data series to display on the radar
     * @required
     */
    series: RadarSeries[];
    /**
     * Number of concentric rings (distance markers)
     * @default 4
     */
    rings?: number;
    /**
     * Number of radial sectors (angular divisions)
     * @default 12
     */
    sectors?: number;
    /**
     * Enable animated radar sweep effect
     * @default true
     */
    showSweep?: boolean;
    /**
     * Radar sweep rotation speed (degrees per second)
     * @default 2
     */
    sweepSpeed?: number;
    /**
     * Display grid lines (rings and sectors)
     * @default true
     */
    showGrid?: boolean;
    /**
     * Display cardinal direction labels (N, E, S, W)
     * @default true
     */
    showLabels?: boolean;
    /**
     * Width of the radar chart
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vw")
     * @default 500
     */
    width?: number | string;
    /**
     * Height of the radar chart
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vh")
     * @default 500
     */
    height?: number | string;
    /**
     * Additional CSS classes to apply to the container
     */
    className?: string;
    /**
     * Prefer WebGPU over WebGL for rendering
     * Falls back to WebGL if WebGPU is not available
     * @default false
     */
    preferWebGPU?: boolean;
}
interface RootProps extends RadarChartProps {
    children: React.ReactNode;
}
export declare function RadarChart(props: RadarChartProps): import("react/jsx-runtime").JSX.Element;
export declare namespace RadarChart {
    var Root: ({ children, series, rings, sectors, showSweep, sweepSpeed, showGrid, showLabels, width, height, preferWebGPU, className, }: RootProps) => import("react/jsx-runtime").JSX.Element;
    var Canvas: () => import("react/jsx-runtime").JSX.Element;
    var Labels: () => import("react/jsx-runtime").JSX.Element | null;
    var Tooltip: () => import("react/jsx-runtime").JSX.Element;
}
export default RadarChart;
//# sourceMappingURL=radar-chart.d.ts.map