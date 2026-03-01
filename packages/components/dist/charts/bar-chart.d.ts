import React from "react";
import { ChartAxes } from "./base-chart";
export interface DataPoint {
    x: number | string;
    y: number;
    label?: string;
}
export interface Series {
    name: string;
    data: DataPoint[];
    color?: string;
}
export interface BarChartProps {
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
    showGrid?: boolean;
    showAxes?: boolean;
    showTooltip?: boolean;
    className?: string;
    preferWebGPU?: boolean;
    orientation?: "vertical" | "horizontal";
    barWidth?: number;
    barGap?: number;
    grouped?: boolean;
}
export declare function BarChart({ series, xAxis, yAxis, width, height, showGrid, showAxes, showTooltip, preferWebGPU, orientation, barWidth, // Undefined by default - will use responsive calculation
barGap, grouped, className, }: BarChartProps): import("react/jsx-runtime").JSX.Element;
export declare namespace BarChart {
    var Root: ({ series, xAxis, yAxis, width, height, preferWebGPU, orientation, barWidth: barWidthProp, barGap, grouped, className, children, }: {
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
        orientation?: "vertical" | "horizontal";
        barWidth?: number;
        barGap?: number;
        grouped?: boolean;
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
export interface BarChartRootProps {
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
    orientation?: "vertical" | "horizontal";
    barWidth?: number;
    barGap?: number;
    grouped?: boolean;
    className?: string;
    children?: React.ReactNode;
}
export interface BarChartCanvasProps {
    showGrid?: boolean;
}
export default BarChart;
//# sourceMappingURL=bar-chart.d.ts.map