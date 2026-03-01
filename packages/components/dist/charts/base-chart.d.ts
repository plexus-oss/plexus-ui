import * as React from "react";
export interface Point {
    x: number;
    y: number;
}
export interface Axis {
    label?: string;
    domain?: [number, number] | "auto";
    type?: "number" | "time";
    formatter?: (value: number) => string;
}
export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}
export interface HoveredPoint<TData = unknown> {
    seriesIdx: number;
    pointIdx: number;
    screenX: number;
    screenY: number;
    data?: TData;
}
export interface TooltipData {
    title: string;
    items: {
        label: string;
        value: string;
        color?: string;
    }[];
}
export interface TimeSeriesState {
    isPlaying: boolean;
    currentTime: number;
    startTime: number;
    endTime: number;
    playbackSpeed: number;
}
export interface BaseChartContext {
    width: number;
    height: number;
    margin: Margin;
    devicePixelRatio: number;
    xAxis: Axis;
    yAxis: Axis;
    xDomain: [number, number];
    yDomain: [number, number];
    xTicks: number[];
    yTicks: number[];
    xScale: (x: number) => number;
    yScale: (y: number) => number;
    canvasRef: React.RefObject<HTMLCanvasElement | null>;
    overlayRef: React.RefObject<HTMLCanvasElement | null>;
    containerRef: React.RefObject<HTMLDivElement | null>;
    preferWebGPU: boolean;
    renderMode: "webgpu" | "webgl" | null;
    setRenderMode: (mode: "webgpu" | "webgl" | null) => void;
    gpuDevice: GPUDevice | null;
    hoveredPoint: HoveredPoint<unknown> | null;
    setHoveredPoint: (point: HoveredPoint<unknown> | null) => void;
    tooltipData: TooltipData | null;
    setTooltipData: (data: TooltipData | null) => void;
    timeSeriesState: TimeSeriesState | null;
    setTimeSeriesState: React.Dispatch<React.SetStateAction<TimeSeriesState | null>>;
    /** Whether the chart is visible (in viewport and tab active). Use to pause expensive rendering. */
    isVisible: boolean;
}
export declare function useBaseChart(): BaseChartContext;
/**
 * Calculate domain (min/max) with optional padding
 */
export declare function getDomain(points: Point[], accessor: (p: Point) => number, paddingPercent?: number): [number, number];
/**
 * Generate evenly spaced tick values for axis
 */
export declare function getTicks(domain: [number, number], count: number): number[];
/**
 * Format numeric value with k suffix for thousands
 */
export declare function formatValue(value: number): string;
/**
 * Convert hex or rgb color to normalized RGB values [0-1]
 */
export declare function hexToRgb(color: string): [number, number, number];
export interface RendererProps {
    canvas: HTMLCanvasElement;
    width: number;
    height: number;
    margin: Margin;
    xDomain: [number, number];
    yDomain: [number, number];
    xTicks: number[];
    yTicks: number[];
    showGrid: boolean;
}
export interface WebGLRenderer<TProps extends RendererProps = RendererProps> {
    render: (props: TProps) => void;
    destroy: () => void;
    getGL: () => WebGL2RenderingContext;
    getProgram: () => WebGLProgram | null;
}
export interface WebGLRendererConfig<TProps extends RendererProps = RendererProps> {
    canvas: HTMLCanvasElement;
    createShaders: (gl: WebGL2RenderingContext) => {
        vertexSource: string;
        fragmentSource: string;
    };
    onRender: (gl: WebGL2RenderingContext, program: WebGLProgram, props: TProps) => void;
    onDestroy?: (gl: WebGL2RenderingContext, program: WebGLProgram | null) => void;
}
/**
 * Create a WebGL2 renderer with custom shaders and render logic
 */
export declare function createWebGLRenderer<TProps extends RendererProps = RendererProps>(config: WebGLRendererConfig<TProps>): WebGLRenderer<TProps>;
export interface WebGPURenderer<TProps extends RendererProps = RendererProps> {
    render: (props: TProps) => Promise<void>;
    destroy: () => void;
    getDevice: () => GPUDevice;
    getContext: () => GPUCanvasContext;
    getPipeline: () => GPURenderPipeline | null;
}
export interface WebGPURendererConfig<TProps extends RendererProps = RendererProps> {
    canvas: HTMLCanvasElement;
    device: GPUDevice;
    format?: GPUTextureFormat;
    createPipeline: (device: GPUDevice, format: GPUTextureFormat) => GPURenderPipeline;
    onRender: (device: GPUDevice, context: GPUCanvasContext, pipeline: GPURenderPipeline, props: TProps) => Promise<void>;
    onDestroy?: (device: GPUDevice, pipeline: GPURenderPipeline | null) => void;
}
/**
 * Create a WebGPU renderer with custom pipeline and render logic
 */
export declare function createWebGPURenderer<TProps extends RendererProps = RendererProps>(config: WebGPURendererConfig<TProps>): WebGPURenderer<TProps>;
export interface BaseChartRootProps {
    width?: number | string;
    height?: number | string;
    minWidth?: number;
    minHeight?: number;
    maxWidth?: number;
    maxHeight?: number;
    aspectRatio?: number;
    margin?: Margin;
    xAxis?: Axis;
    yAxis?: Axis;
    xDomain?: [number, number] | "auto";
    yDomain?: [number, number] | "auto";
    xTicks?: number[];
    yTicks?: number[];
    preferWebGPU?: boolean;
    className?: string;
    children?: React.ReactNode;
    enableTimeSeries?: boolean;
    timeRange?: [number, number];
    disableErrorBoundary?: boolean;
    errorFallback?: React.ReactNode;
    onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
    /**
     * Automatically pause rendering when chart is off-screen or tab is hidden.
     * Improves performance by skipping GPU work for invisible charts.
     * @default true
     */
    autoHide?: boolean;
}
/**
 * Root chart component providing context and responsive container
 */
export declare function ChartRoot({ width: widthProp, height: heightProp, minWidth, minHeight, maxWidth, maxHeight, aspectRatio, margin, xAxis, yAxis, xDomain: xDomainProp, yDomain: yDomainProp, xTicks: xTicksProp, yTicks: yTicksProp, preferWebGPU, className, children, enableTimeSeries, timeRange, disableErrorBoundary, errorFallback, onError, autoHide, }: BaseChartRootProps): import("react/jsx-runtime").JSX.Element;
export declare function ChartAxes(): import("react/jsx-runtime").JSX.Element;
export declare function ChartTooltip({ onHover, }: {
    onHover?: (e: React.MouseEvent<HTMLDivElement>) => void;
}): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=base-chart.d.ts.map