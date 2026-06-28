/** biome-ignore-all lint/a11y/noSvgWithoutTitle: <explanation> */
"use client";

import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useChartVisibility } from "../lib/visibility";

/**
 * Default GPU error fallback component
 */
function GPUErrorFallback({
  error,
  resetErrorBoundary,
}: {
  error: unknown;
  resetErrorBoundary: () => void;
}) {
  const message = error instanceof Error ? error.message : String(error);
  const isGPUError =
    message.includes("WebGPU") || message.includes("WebGL") || message.includes("GPU");

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[300px] bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
      <div className="text-center px-6 py-8 max-w-lg">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-amber-100 dark:bg-amber-900/20 rounded-full">
          <svg
            className="h-8 w-8 text-amber-600 dark:text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2">
          {isGPUError ? "GPU Acceleration Unavailable" : "Chart Rendering Error"}
        </h3>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-6">
          {isGPUError
            ? "This chart requires GPU acceleration (WebGPU or WebGL2) which is not available in your browser."
            : "An error occurred while rendering this chart."}
        </p>

        {isGPUError && (
          <div className="text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">
              Troubleshooting Steps:
            </h4>
            <ul className="space-y-2 text-xs text-zinc-600 dark:text-zinc-400">
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 dark:text-zinc-600 mt-0.5">1.</span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Update your browser:</strong>{" "}
                  Chrome 113+, Edge 113+, or Safari 18+
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 dark:text-zinc-600 mt-0.5">2.</span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">
                    Enable hardware acceleration:
                  </strong>{" "}
                  Check browser settings
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-zinc-400 dark:text-zinc-600 mt-0.5">3.</span>
                <span>
                  <strong className="text-zinc-900 dark:text-zinc-100">Update GPU drivers:</strong>{" "}
                  Visit your graphics card manufacturer's website
                </span>
              </li>
            </ul>
          </div>
        )}

        {error != null && (
          <details className="text-left mb-4">
            <summary className="text-xs text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300">
              Error details
            </summary>
            <pre className="mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-auto max-h-32 text-left text-zinc-800 dark:text-zinc-200">
              {message}
            </pre>
          </details>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={resetErrorBoundary}
            className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            type="button"
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors"
            type="button"
          >
            Reload Page
          </button>
        </div>
      </div>
    </div>
  );
}

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
  items: { label: string; value: string; color?: string }[];
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

const BaseChartContext = React.createContext<BaseChartContext | null>(null);

export function useBaseChart() {
  const ctx = React.useContext(BaseChartContext);
  if (!ctx) {
    throw new Error("Chart components must be used within Chart.Root");
  }
  return ctx;
}

/**
 * Calculate domain (min/max) with optional padding
 */
export function getDomain(
  points: Point[],
  accessor: (p: Point) => number,
  paddingPercent: number = 0.05
): [number, number] {
  if (points.length === 0) return [0, 1];

  let min = accessor(points[0]);
  let max = accessor(points[0]);

  for (const point of points) {
    const value = accessor(point);
    if (value < min) min = value;
    if (value > max) max = value;
  }

  const range = max - min;
  const padding = range * paddingPercent || 1;
  const domainMin = min >= 0 ? Math.max(0, min - padding) : min - padding;
  const domainMax = max + padding;

  return [domainMin, domainMax];
}

/**
 * Generate evenly spaced tick values for axis
 */
export function getTicks(domain: [number, number], count: number): number[] {
  const [min, max] = domain;
  const step = (max - min) / (count - 1);
  const ticks: number[] = [];

  for (let i = 0; i < count; i++) {
    ticks.push(min + step * i);
  }

  return ticks;
}

/**
 * Format numeric value with k suffix for thousands
 */
export function formatValue(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(1)}k`;
  }
  return value.toFixed(1);
}

/**
 * Convert hex or rgb color to normalized RGB values [0-1]
 */
export function hexToRgb(color: string): [number, number, number] {
  const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
  if (rgbMatch) {
    return [parseInt(rgbMatch[1]) / 255, parseInt(rgbMatch[2]) / 255, parseInt(rgbMatch[3]) / 255];
  }

  const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
  return hexMatch
    ? [
        parseInt(hexMatch[1], 16) / 255,
        parseInt(hexMatch[2], 16) / 255,
        parseInt(hexMatch[3], 16) / 255,
      ]
    : [0, 0, 1];
}

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
export function createWebGLRenderer<TProps extends RendererProps = RendererProps>(
  config: WebGLRendererConfig<TProps>
): WebGLRenderer<TProps> {
  const gl = config.canvas.getContext("webgl2", {
    alpha: true,
    antialias: true,
    premultipliedAlpha: false,
  });

  if (!gl) {
    throw new Error("WebGL2 not supported");
  }

  const createShader = (type: number, source: string): WebGLShader | null => {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error("Shader compile error:", gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }

    return shader;
  };

  const createProgram = (vertexSource: string, fragmentSource: string): WebGLProgram => {
    const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
    const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);

    if (!vertexShader || !fragmentShader) {
      throw new Error("Failed to create shaders");
    }

    const program = gl.createProgram();
    if (!program) throw new Error("Failed to create program");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("Program link error:", gl.getProgramInfoLog(program));
      throw new Error("Failed to link program");
    }

    return program;
  };

  const setupBlending = () => {
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  };

  const clear = (width: number, height: number) => {
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0); // Transparent
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  // Initialize program
  const { vertexSource, fragmentSource } = config.createShaders(gl);
  const program = createProgram(vertexSource, fragmentSource);
  setupBlending();

  return {
    render: (props: TProps) => {
      clear(props.width, props.height);
      config.onRender(gl, program, props);
    },
    destroy: () => {
      if (config.onDestroy) {
        config.onDestroy(gl, program);
      }
      if (program) {
        gl.deleteProgram(program);
      }
    },
    getGL: () => gl,
    getProgram: () => program,
  };
}

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
  onRender: (
    device: GPUDevice,
    context: GPUCanvasContext,
    pipeline: GPURenderPipeline,
    props: TProps
  ) => Promise<void>;
  onDestroy?: (device: GPUDevice, pipeline: GPURenderPipeline | null) => void;
}

/**
 * Create a WebGPU renderer with custom pipeline and render logic
 */
export function createWebGPURenderer<TProps extends RendererProps = RendererProps>(
  config: WebGPURendererConfig<TProps>
): WebGPURenderer<TProps> {
  const device = config.device;
  const format = config.format ?? "bgra8unorm";

  const context = config.canvas.getContext("webgpu");
  if (!context) {
    throw new Error("WebGPU context not available");
  }

  const gpuContext = context as GPUCanvasContext;
  gpuContext.configure({
    device,
    format,
    alphaMode: "premultiplied",
  });

  // Initialize pipeline
  const pipeline = config.createPipeline(device, format);

  return {
    render: async (props: TProps) => {
      await config.onRender(device, gpuContext, pipeline, props);
    },
    destroy: () => {
      if (config.onDestroy) {
        config.onDestroy(device, pipeline);
      }
    },
    getDevice: () => device,
    getContext: () => gpuContext,
    getPipeline: () => pipeline,
  };
}

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
  onError?: (error: unknown, errorInfo: React.ErrorInfo) => void;
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
export function ChartRoot({
  width: widthProp = 800,
  height: heightProp = 400,
  minWidth = 200,
  minHeight = 150,
  maxWidth,
  maxHeight,
  aspectRatio,
  margin = { top: 20, right: 20, bottom: 50, left: 60 },
  xAxis = {},
  yAxis = {},
  xDomain: xDomainProp,
  yDomain: yDomainProp,
  xTicks: xTicksProp,
  yTicks: yTicksProp,
  preferWebGPU = true,
  className,
  children,
  enableTimeSeries = false,
  timeRange,
  disableErrorBoundary = false,
  errorFallback,
  onError,
  autoHide = true,
}: BaseChartRootProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const overlayRef = React.useRef<HTMLCanvasElement>(null);

  // Visibility detection for auto-pausing when off-screen
  const { isVisible: visibilityState } = useChartVisibility(containerRef);
  const isVisible = autoHide ? visibilityState : true;

  const [dimensions, setDimensions] = React.useState<{
    width: number;
    height: number;
  }>(() => {
    const w = typeof widthProp === "number" ? widthProp : 800;
    const h = typeof heightProp === "number" ? heightProp : 400;
    return { width: w, height: h };
  });

  const [hoveredPoint, setHoveredPoint] = React.useState<HoveredPoint<unknown> | null>(null);
  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const [renderMode, setRenderMode] = React.useState<"webgpu" | "webgl" | null>(null);

  const [gpuDevice, setGpuDevice] = React.useState<GPUDevice | null>(null);

  React.useEffect(() => {
    if (!preferWebGPU) {
      setRenderMode("webgl");
      return;
    }

    if (!navigator.gpu) {
      console.warn("WebGPU not supported, falling back to WebGL");
      setRenderMode("webgl");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          if (!cancelled) {
            console.warn("No WebGPU adapter found, falling back to WebGL");
            setRenderMode("webgl");
          }
          return;
        }

        const device = await adapter.requestDevice();
        if (!cancelled) {
          setGpuDevice(device);
          setRenderMode("webgpu");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to initialize WebGPU:", error);
          setRenderMode("webgl");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [preferWebGPU]);

  const [timeSeriesState, setTimeSeriesState] = React.useState<TimeSeriesState | null>(() => {
    if (!enableTimeSeries || !timeRange) return null;
    return {
      isPlaying: false,
      currentTime: timeRange[0],
      startTime: timeRange[0],
      endTime: timeRange[1],
      playbackSpeed: 1,
    };
  });

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;

      const { width: observedWidth, height: observedHeight } = entry.contentRect;

      let newWidth = observedWidth;
      let newHeight = observedHeight;

      if (newWidth === 0 && newHeight === 0) {
        newWidth = typeof widthProp === "number" ? widthProp : 800;
        newHeight = typeof heightProp === "number" ? heightProp : 400;
      }

      if (minWidth !== undefined) newWidth = Math.max(minWidth, newWidth);
      if (maxWidth !== undefined) newWidth = Math.min(maxWidth, newWidth);
      if (minHeight !== undefined) newHeight = Math.max(minHeight, newHeight);
      if (maxHeight !== undefined) newHeight = Math.min(maxHeight, newHeight);

      if (typeof widthProp === "number") {
        newWidth = Math.min(widthProp, newWidth);
      }
      if (typeof heightProp === "number") {
        newHeight = Math.min(heightProp, newHeight);
      }

      if (aspectRatio !== undefined) {
        const currentRatio = newWidth / newHeight;
        if (currentRatio > aspectRatio) {
          newWidth = newHeight * aspectRatio;
        } else {
          newHeight = newWidth / aspectRatio;
        }
      }

      setDimensions({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [widthProp, heightProp, minWidth, minHeight, maxWidth, maxHeight, aspectRatio]);

  const { width, height } = dimensions;

  const xDomain: [number, number] = xDomainProp === "auto" || !xDomainProp ? [0, 100] : xDomainProp;
  const yDomain: [number, number] = yDomainProp === "auto" || !yDomainProp ? [0, 100] : yDomainProp;

  const xTicks = React.useMemo(() => xTicksProp || getTicks(xDomain, 6), [xTicksProp, xDomain]);
  const yTicks = React.useMemo(() => yTicksProp || getTicks(yDomain, 6), [yTicksProp, yDomain]);

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = React.useCallback(
    (x: number) => margin.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth,
    [xDomain, margin.left, innerWidth]
  );

  const yScale = React.useCallback(
    (y: number) =>
      margin.top + innerHeight - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight,
    [yDomain, margin.top, innerHeight]
  );

  const [devicePixelRatio, setDevicePixelRatio] = React.useState(1);

  React.useEffect(() => {
    setDevicePixelRatio(window.devicePixelRatio || 1);
  }, []);

  const contextValue: BaseChartContext = {
    width,
    height,
    margin,
    devicePixelRatio,
    xAxis,
    yAxis,
    xDomain,
    yDomain,
    xTicks,
    yTicks,
    xScale,
    yScale,
    canvasRef,
    overlayRef,
    containerRef,
    preferWebGPU,
    renderMode,
    setRenderMode,
    gpuDevice,
    hoveredPoint,
    setHoveredPoint,
    tooltipData,
    setTooltipData,
    timeSeriesState,
    setTimeSeriesState,
    isVisible,
  };

  // Container style with responsive support
  // For responsive behavior: always use 100% width/height and let constraints control size
  const containerStyle: React.CSSProperties = {
    position: "relative",
    width:
      typeof widthProp === "string"
        ? widthProp
        : typeof widthProp === "number"
          ? `${widthProp}px`
          : "100%",
    height:
      typeof heightProp === "string"
        ? heightProp
        : typeof heightProp === "number"
          ? `${heightProp}px`
          : "100%",
    minWidth: minWidth,
    minHeight: minHeight,
    maxWidth: typeof widthProp === "number" ? widthProp : maxWidth,
    maxHeight: typeof heightProp === "number" ? heightProp : maxHeight,
    overflow: "visible",
  };

  const chartContent = (
    <BaseChartContext.Provider value={contextValue}>
      <div
        ref={containerRef}
        className={`bg-white dark:bg-zinc-950 rounded-lg ${className || ""}`}
        style={containerStyle}
      >
        {children}
      </div>
    </BaseChartContext.Provider>
  );

  if (disableErrorBoundary) {
    return chartContent;
  }

  return (
    <ErrorBoundary
      fallbackRender={
        errorFallback
          ? () => <>{errorFallback}</>
          : ({ error, resetErrorBoundary }) => (
              <GPUErrorFallback error={error} resetErrorBoundary={resetErrorBoundary} />
            )
      }
      onError={onError}
      resetKeys={[preferWebGPU, renderMode]}
    >
      {chartContent}
    </ErrorBoundary>
  );
}

// ============================================================================
// Axes Component
// ============================================================================

export function ChartAxes() {
  const ctx = useBaseChart();

  React.useEffect(() => {
    const canvas = ctx.overlayRef.current;
    if (!canvas) return;

    const dpr = ctx.devicePixelRatio;
    canvas.width = ctx.width * dpr;
    canvas.height = ctx.height * dpr;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.scale(dpr, dpr);
    context.clearRect(0, 0, ctx.width, ctx.height);

    const isDark = document.documentElement.classList.contains("dark");
    const textColor = isDark ? "#6e6e6e" : "#999999";

    context.strokeStyle = textColor;
    context.fillStyle = textColor;
    context.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";

    context.beginPath();
    context.moveTo(ctx.margin.left, ctx.height - ctx.margin.bottom);
    context.lineTo(ctx.width - ctx.margin.right, ctx.height - ctx.margin.bottom);
    context.stroke();

    const getFilteredXTicks = () => {
      if (ctx.xTicks.length === 0) return [];

      const sampleLabel = ctx.xAxis.formatter
        ? ctx.xAxis.formatter(ctx.xTicks[0])
        : formatValue(ctx.xTicks[0]);
      const labelWidth = context.measureText(sampleLabel).width;
      const minSpacing = labelWidth + 20;

      const innerWidth = ctx.width - ctx.margin.left - ctx.margin.right;
      const availableSpace = innerWidth / ctx.xTicks.length;

      if (availableSpace >= minSpacing) {
        return ctx.xTicks;
      }

      const skipFactor = Math.ceil(minSpacing / availableSpace);
      return ctx.xTicks.filter((_, i) => i % skipFactor === 0);
    };

    const visibleXTicks = getFilteredXTicks();

    ctx.xTicks.forEach((tick) => {
      const x = ctx.xScale(tick);
      context.beginPath();
      context.moveTo(x, ctx.height - ctx.margin.bottom);
      context.lineTo(x, ctx.height - ctx.margin.bottom + 6);
      context.stroke();
    });

    visibleXTicks.forEach((tick) => {
      const x = ctx.xScale(tick);
      context.textAlign = "center";
      const label = ctx.xAxis.formatter ? ctx.xAxis.formatter(tick) : formatValue(tick);
      context.fillText(label, x, ctx.height - ctx.margin.bottom + 20);
    });

    if (ctx.xAxis.label) {
      context.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      context.textAlign = "center";
      context.fillText(ctx.xAxis.label, ctx.width / 2, ctx.height - 5);
    }

    context.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
    context.beginPath();
    context.moveTo(ctx.margin.left, ctx.margin.top);
    context.lineTo(ctx.margin.left, ctx.height - ctx.margin.bottom);
    context.stroke();

    ctx.yTicks.forEach((tick) => {
      const y = ctx.yScale(tick);
      context.beginPath();
      context.moveTo(ctx.margin.left - 6, y);
      context.lineTo(ctx.margin.left, y);
      context.stroke();

      context.textAlign = "right";
      context.textBaseline = "middle";
      const label = ctx.yAxis.formatter ? ctx.yAxis.formatter(tick) : formatValue(tick);
      context.fillText(label, ctx.margin.left - 10, y);
    });

    if (ctx.yAxis.label) {
      context.save();
      context.translate(15, ctx.height / 2);
      context.rotate(-Math.PI / 2);
      context.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      context.textAlign = "center";
      context.fillText(ctx.yAxis.label, 0, 0);
      context.restore();
    }
  }, [ctx]);

  return (
    <canvas
      ref={ctx.overlayRef}
      className="absolute inset-0 pointer-events-none"
      style={{ width: ctx.width, height: ctx.height }}
    />
  );
}

// ============================================================================
// Tooltip Component
// ============================================================================

export function ChartTooltip({
  onHover,
}: {
  onHover?: (e: React.MouseEvent<HTMLDivElement>) => void;
}) {
  const ctx = useBaseChart();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onHover) {
      onHover(e);
    }
  };

  const handleMouseLeave = () => {
    ctx.setHoveredPoint(null);
    ctx.setTooltipData(null);
  };

  if (!ctx.hoveredPoint || !ctx.tooltipData) {
    return (
      // biome-ignore lint/a11y/noStaticElementInteractions: Tooltip overlay requires mouse tracking
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />
    );
  }

  // Calculate tooltip position
  const tooltipWidth = 160;
  const tooltipHeight = 20 + ctx.tooltipData.items.length * 20 + 10;
  let tooltipX = ctx.hoveredPoint.screenX + 12;
  let tooltipY = ctx.hoveredPoint.screenY - tooltipHeight / 2;

  if (tooltipX + tooltipWidth > ctx.width) {
    tooltipX = ctx.hoveredPoint.screenX - tooltipWidth - 12;
  }
  if (tooltipY < 0) tooltipY = 4;
  if (tooltipY + tooltipHeight > ctx.height) {
    tooltipY = ctx.height - tooltipHeight - 4;
  }

  return (
    <>
      {/* biome-ignore lint/a11y/noStaticElementInteractions: Tooltip overlay requires mouse tracking */}
      <div
        className="absolute inset-0"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      />

      {/* Crosshair */}
      <svg
        className="absolute inset-0 pointer-events-none"
        style={{ width: ctx.width, height: ctx.height }}
        aria-label="Crosshair indicator"
      >
        <title>Crosshair indicator</title>
        <line
          x1={ctx.hoveredPoint.screenX}
          y1={ctx.margin.top}
          x2={ctx.hoveredPoint.screenX}
          y2={ctx.height - ctx.margin.bottom}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-zinc-400 dark:text-zinc-600"
          opacity="0.5"
        />
        <line
          x1={ctx.margin.left}
          y1={ctx.hoveredPoint.screenY}
          x2={ctx.width - ctx.margin.right}
          y2={ctx.hoveredPoint.screenY}
          stroke="currentColor"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="text-zinc-400 dark:text-zinc-600"
          opacity="0.5"
        />
      </svg>

      {/* Tooltip */}
      <div
        className="absolute z-50 px-3 py-2 bg-white dark:bg-zinc-950 text-sm rounded-lg shadow-xl pointer-events-none border border-zinc-200 dark:border-zinc-800"
        style={{ left: tooltipX, top: tooltipY }}
      >
        <div className="font-semibold mb-1">{ctx.tooltipData.title}</div>
        {ctx.tooltipData.items.map((item, idx) => (
          <div
            key={idx}
            className="text-zinc-700 dark:text-zinc-200 text-xs flex items-center gap-2"
          >
            {item.color && (
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
            )}
            <span className="dark:text-zinc-200">
              {item.label}: <span className="font-mono">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
