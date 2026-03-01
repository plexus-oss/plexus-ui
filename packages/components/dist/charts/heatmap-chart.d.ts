import { ChartAxes } from "./base-chart";
export interface DataPoint {
    x: number | string;
    y: number | string;
    value: number;
    label?: string;
}
export interface HeatmapChartProps {
    data: DataPoint[];
    xAxis?: {
        label?: string;
        categories?: (string | number)[];
        formatter?: (value: number | string) => string;
    };
    yAxis?: {
        label?: string;
        categories?: (string | number)[];
        formatter?: (value: number | string) => string;
    };
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    showGrid?: boolean;
    showAxes?: boolean;
    showTooltip?: boolean;
    className?: string;
    preferWebGPU?: boolean;
    colorScale?: (value: number) => string;
    minValue?: number;
    maxValue?: number;
    cellGap?: number;
}
export declare function HeatmapChart({ data, xAxis, yAxis, width, height, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, margin, showGrid, showAxes, showTooltip, preferWebGPU, colorScale, minValue, maxValue, cellGap, className, }: HeatmapChartProps): import("react/jsx-runtime").JSX.Element;
export declare namespace HeatmapChart {
    var Root: ({ data, xAxis, yAxis, width, height, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, margin, preferWebGPU, colorScale, minValue, maxValue, cellGap, className, children, }: {
        data: DataPoint[];
        xAxis?: {
            label?: string;
            categories?: (string | number)[];
            formatter?: (value: number | string) => string;
        };
        yAxis?: {
            label?: string;
            categories?: (string | number)[];
            formatter?: (value: number | string) => string;
        };
        width?: number | string;
        height?: number | string;
        minWidth?: number;
        minHeight?: number;
        maxWidth?: number;
        maxHeight?: number;
        aspectRatio?: number;
        margin?: {
            top: number;
            right: number;
            bottom: number;
            left: number;
        };
        preferWebGPU?: boolean;
        colorScale?: (value: number) => string;
        minValue?: number;
        maxValue?: number;
        cellGap?: number;
        className?: string;
        children?: React.ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Canvas: () => import("react/jsx-runtime").JSX.Element;
    var Grid: () => null;
    var Axes: typeof ChartAxes;
    var Tooltip: () => import("react/jsx-runtime").JSX.Element;
}
export interface HeatmapChartRootProps {
    data: DataPoint[];
    xAxis?: {
        label?: string;
        formatter?: (value: number | string) => string;
    };
    yAxis?: {
        label?: string;
        formatter?: (value: number | string) => string;
    };
    width?: number;
    height?: number;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
    margin?: {
        top: number;
        right: number;
        bottom: number;
        left: number;
    };
    preferWebGPU?: boolean;
    colorScale?: (t: number) => [number, number, number];
    minValue?: number;
    maxValue?: number;
    cellGap?: number;
    className?: string;
    children?: React.ReactNode;
}
export default HeatmapChart;
//# sourceMappingURL=heatmap-chart.d.ts.map