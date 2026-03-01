import { ChartAxes, type Point } from "./base-chart";
export type DataPoint = Point & {
    size?: number;
    label?: string;
};
export interface Series {
    name: string;
    data: DataPoint[];
    color?: string;
    size?: number;
    opacity?: number;
}
export interface ScatterChartProps {
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
}
export declare function ScatterChart({ series, xAxis, yAxis, width, height, showGrid, showAxes, showTooltip, preferWebGPU, className, }: ScatterChartProps): import("react/jsx-runtime").JSX.Element;
export declare namespace ScatterChart {
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
export interface ScatterChartRootProps {
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
export interface ScatterChartCanvasProps {
    showGrid?: boolean;
}
export default ScatterChart;
//# sourceMappingURL=scatter-chart.d.ts.map