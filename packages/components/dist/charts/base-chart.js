/** biome-ignore-all lint/a11y/noSvgWithoutTitle: chart SVG elements are decorative and labeled via axes */
"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import * as React from "react";
import { ErrorBoundary } from "react-error-boundary";
import { useChartVisibility } from "../lib/visibility";
/**
 * Default GPU error fallback component
 */
function GPUErrorFallback({ error, resetErrorBoundary, }) {
    const isGPUError = error?.message.includes("WebGPU") ||
        error?.message.includes("WebGL") ||
        error?.message.includes("GPU");
    return (_jsx("div", { className: "flex items-center justify-center w-full h-full min-h-[300px] bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800", children: _jsxs("div", { className: "text-center px-6 py-8 max-w-lg", children: [_jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 mb-4 bg-amber-100 dark:bg-amber-900/20 rounded-full", children: _jsx("svg", { className: "h-8 w-8 text-amber-600 dark:text-amber-500", fill: "none", viewBox: "0 0 24 24", stroke: "currentColor", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" }) }) }), _jsx("h3", { className: "text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-2", children: isGPUError ? "GPU Acceleration Unavailable" : "Chart Rendering Error" }), _jsx("p", { className: "text-sm text-zinc-600 dark:text-zinc-400 mb-6", children: isGPUError
                        ? "This chart requires GPU acceleration (WebGPU or WebGL2) which is not available in your browser."
                        : "An error occurred while rendering this chart." }), isGPUError && (_jsxs("div", { className: "text-left bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 mb-6", children: [_jsx("h4", { className: "text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3", children: "Troubleshooting Steps:" }), _jsxs("ul", { className: "space-y-2 text-xs text-zinc-600 dark:text-zinc-400", children: [_jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-zinc-400 dark:text-zinc-600 mt-0.5", children: "1." }), _jsxs("span", { children: [_jsx("strong", { className: "text-zinc-900 dark:text-zinc-100", children: "Update your browser:" }), " ", "Chrome 113+, Edge 113+, or Safari 18+"] })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-zinc-400 dark:text-zinc-600 mt-0.5", children: "2." }), _jsxs("span", { children: [_jsx("strong", { className: "text-zinc-900 dark:text-zinc-100", children: "Enable hardware acceleration:" }), " ", "Check browser settings"] })] }), _jsxs("li", { className: "flex items-start gap-2", children: [_jsx("span", { className: "text-zinc-400 dark:text-zinc-600 mt-0.5", children: "3." }), _jsxs("span", { children: [_jsx("strong", { className: "text-zinc-900 dark:text-zinc-100", children: "Update GPU drivers:" }), " ", "Visit your graphics card manufacturer's website"] })] })] })] })), error && (_jsxs("details", { className: "text-left mb-4", children: [_jsx("summary", { className: "text-xs text-zinc-500 dark:text-zinc-500 cursor-pointer hover:text-zinc-700 dark:hover:text-zinc-300", children: "Error details" }), _jsx("pre", { className: "mt-2 text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded overflow-auto max-h-32 text-left text-zinc-800 dark:text-zinc-200", children: error.message })] })), _jsxs("div", { className: "flex gap-3 justify-center", children: [_jsx("button", { onClick: resetErrorBoundary, className: "px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors", type: "button", children: "Try Again" }), _jsx("button", { onClick: () => window.location.reload(), className: "px-4 py-2 text-sm font-medium text-white bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-lg hover:bg-zinc-700 dark:hover:bg-zinc-300 transition-colors", type: "button", children: "Reload Page" })] })] }) }));
}
const BaseChartContext = React.createContext(null);
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
export function getDomain(points, accessor, paddingPercent = 0.05) {
    if (points.length === 0)
        return [0, 1];
    let min = accessor(points[0]);
    let max = accessor(points[0]);
    for (const point of points) {
        const value = accessor(point);
        if (value < min)
            min = value;
        if (value > max)
            max = value;
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
export function getTicks(domain, count) {
    const [min, max] = domain;
    const step = (max - min) / (count - 1);
    const ticks = [];
    for (let i = 0; i < count; i++) {
        ticks.push(min + step * i);
    }
    return ticks;
}
/**
 * Format numeric value with k suffix for thousands
 */
export function formatValue(value) {
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toFixed(1)}k`;
    }
    return value.toFixed(1);
}
/**
 * Convert hex or rgb color to normalized RGB values [0-1]
 */
export function hexToRgb(color) {
    const rgbMatch = /^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.exec(color);
    if (rgbMatch) {
        return [
            parseInt(rgbMatch[1], 10) / 255,
            parseInt(rgbMatch[2], 10) / 255,
            parseInt(rgbMatch[3], 10) / 255,
        ];
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
/**
 * Create a WebGL2 renderer with custom shaders and render logic
 */
export function createWebGLRenderer(config) {
    const gl = config.canvas.getContext("webgl2", {
        alpha: true,
        antialias: true,
        premultipliedAlpha: false,
    });
    if (!gl) {
        throw new Error("WebGL2 not supported");
    }
    const createShader = (type, source) => {
        const shader = gl.createShader(type);
        if (!shader)
            return null;
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error("Shader compile error:", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    };
    const createProgram = (vertexSource, fragmentSource) => {
        const vertexShader = createShader(gl.VERTEX_SHADER, vertexSource);
        const fragmentShader = createShader(gl.FRAGMENT_SHADER, fragmentSource);
        if (!vertexShader || !fragmentShader) {
            throw new Error("Failed to create shaders");
        }
        const program = gl.createProgram();
        if (!program)
            throw new Error("Failed to create program");
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
    const clear = (width, height) => {
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 0); // Transparent
        gl.clear(gl.COLOR_BUFFER_BIT);
    };
    // Initialize program
    const { vertexSource, fragmentSource } = config.createShaders(gl);
    const program = createProgram(vertexSource, fragmentSource);
    setupBlending();
    return {
        render: (props) => {
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
/**
 * Create a WebGPU renderer with custom pipeline and render logic
 */
export function createWebGPURenderer(config) {
    const device = config.device;
    const format = config.format ?? "bgra8unorm";
    const context = config.canvas.getContext("webgpu");
    if (!context) {
        throw new Error("WebGPU context not available");
    }
    const gpuContext = context;
    gpuContext.configure({
        device,
        format,
        alphaMode: "premultiplied",
    });
    // Initialize pipeline
    const pipeline = config.createPipeline(device, format);
    return {
        render: async (props) => {
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
/**
 * Root chart component providing context and responsive container
 */
export function ChartRoot({ width: widthProp = 800, height: heightProp = 400, minWidth = 200, minHeight = 150, maxWidth, maxHeight, aspectRatio, margin = { top: 20, right: 20, bottom: 50, left: 60 }, xAxis = {}, yAxis = {}, xDomain: xDomainProp, yDomain: yDomainProp, xTicks: xTicksProp, yTicks: yTicksProp, preferWebGPU = true, className, children, enableTimeSeries = false, timeRange, disableErrorBoundary = false, errorFallback, onError, autoHide = true, }) {
    const containerRef = React.useRef(null);
    const canvasRef = React.useRef(null);
    const overlayRef = React.useRef(null);
    // Visibility detection for auto-pausing when off-screen
    const { isVisible: visibilityState } = useChartVisibility(containerRef);
    const isVisible = autoHide ? visibilityState : true;
    const [dimensions, setDimensions] = React.useState(() => {
        const w = typeof widthProp === "number" ? widthProp : 800;
        const h = typeof heightProp === "number" ? heightProp : 400;
        return { width: w, height: h };
    });
    const [hoveredPoint, setHoveredPoint] = React.useState(null);
    const [tooltipData, setTooltipData] = React.useState(null);
    const [renderMode, setRenderMode] = React.useState(null);
    const [gpuDevice, setGpuDevice] = React.useState(null);
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
            }
            catch (error) {
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
    const [timeSeriesState, setTimeSeriesState] = React.useState(() => {
        if (!enableTimeSeries || !timeRange)
            return null;
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
        if (!container)
            return;
        const observer = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (!entry)
                return;
            const { width: observedWidth, height: observedHeight } = entry.contentRect;
            let newWidth = observedWidth;
            let newHeight = observedHeight;
            if (newWidth === 0 && newHeight === 0) {
                newWidth = typeof widthProp === "number" ? widthProp : 800;
                newHeight = typeof heightProp === "number" ? heightProp : 400;
            }
            if (minWidth !== undefined)
                newWidth = Math.max(minWidth, newWidth);
            if (maxWidth !== undefined)
                newWidth = Math.min(maxWidth, newWidth);
            if (minHeight !== undefined)
                newHeight = Math.max(minHeight, newHeight);
            if (maxHeight !== undefined)
                newHeight = Math.min(maxHeight, newHeight);
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
                }
                else {
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
    const xDomain = xDomainProp === "auto" || !xDomainProp ? [0, 100] : xDomainProp;
    const yDomain = yDomainProp === "auto" || !yDomainProp ? [0, 100] : yDomainProp;
    const xTicks = React.useMemo(() => xTicksProp || getTicks(xDomain, 6), [xTicksProp, xDomain]);
    const yTicks = React.useMemo(() => yTicksProp || getTicks(yDomain, 6), [yTicksProp, yDomain]);
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const xScale = React.useCallback((x) => margin.left + ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth, [xDomain, margin.left, innerWidth]);
    const yScale = React.useCallback((y) => margin.top + innerHeight - ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight, [yDomain, margin.top, innerHeight]);
    const [devicePixelRatio, setDevicePixelRatio] = React.useState(1);
    React.useEffect(() => {
        setDevicePixelRatio(window.devicePixelRatio || 1);
    }, []);
    const contextValue = {
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
    const containerStyle = {
        position: "relative",
        width: typeof widthProp === "string"
            ? widthProp
            : typeof widthProp === "number"
                ? `${widthProp}px`
                : "100%",
        height: typeof heightProp === "string"
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
    const chartContent = (_jsx(BaseChartContext.Provider, { value: contextValue, children: _jsx("div", { ref: containerRef, className: `bg-white dark:bg-zinc-950 rounded-lg ${className || ""}`, style: containerStyle, children: children }) }));
    if (disableErrorBoundary) {
        return chartContent;
    }
    return (_jsx(ErrorBoundary, { fallbackRender: errorFallback
            ? () => _jsx(_Fragment, { children: errorFallback })
            : ({ error, resetErrorBoundary }) => (_jsx(GPUErrorFallback, { error: error, resetErrorBoundary: resetErrorBoundary })), onError: onError, resetKeys: [preferWebGPU, renderMode], children: chartContent }));
}
// ============================================================================
// Axes Component
// ============================================================================
export function ChartAxes() {
    const ctx = useBaseChart();
    React.useEffect(() => {
        const canvas = ctx.overlayRef.current;
        if (!canvas)
            return;
        const dpr = ctx.devicePixelRatio;
        canvas.width = ctx.width * dpr;
        canvas.height = ctx.height * dpr;
        const context = canvas.getContext("2d");
        if (!context)
            return;
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
            if (ctx.xTicks.length === 0)
                return [];
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
    return (_jsx("canvas", { ref: ctx.overlayRef, className: "absolute inset-0 pointer-events-none", style: { width: ctx.width, height: ctx.height } }));
}
// ============================================================================
// Tooltip Component
// ============================================================================
export function ChartTooltip({ onHover, }) {
    const ctx = useBaseChart();
    const handleMouseMove = (e) => {
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
        _jsx("div", { className: "absolute inset-0", onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }));
    }
    // Calculate tooltip position
    const tooltipWidth = 160;
    const tooltipHeight = 20 + ctx.tooltipData.items.length * 20 + 10;
    let tooltipX = ctx.hoveredPoint.screenX + 12;
    let tooltipY = ctx.hoveredPoint.screenY - tooltipHeight / 2;
    if (tooltipX + tooltipWidth > ctx.width) {
        tooltipX = ctx.hoveredPoint.screenX - tooltipWidth - 12;
    }
    if (tooltipY < 0)
        tooltipY = 4;
    if (tooltipY + tooltipHeight > ctx.height) {
        tooltipY = ctx.height - tooltipHeight - 4;
    }
    return (_jsxs(_Fragment, { children: [_jsx("div", { className: "absolute inset-0", onMouseMove: handleMouseMove, onMouseLeave: handleMouseLeave }), _jsxs("svg", { className: "absolute inset-0 pointer-events-none", style: { width: ctx.width, height: ctx.height }, "aria-label": "Crosshair indicator", children: [_jsx("title", { children: "Crosshair indicator" }), _jsx("line", { x1: ctx.hoveredPoint.screenX, y1: ctx.margin.top, x2: ctx.hoveredPoint.screenX, y2: ctx.height - ctx.margin.bottom, stroke: "currentColor", strokeWidth: "1", strokeDasharray: "4 4", className: "text-zinc-400 dark:text-zinc-600", opacity: "0.5" }), _jsx("line", { x1: ctx.margin.left, y1: ctx.hoveredPoint.screenY, x2: ctx.width - ctx.margin.right, y2: ctx.hoveredPoint.screenY, stroke: "currentColor", strokeWidth: "1", strokeDasharray: "4 4", className: "text-zinc-400 dark:text-zinc-600", opacity: "0.5" })] }), _jsxs("div", { className: "absolute z-50 px-3 py-2 bg-white dark:bg-zinc-950 text-sm rounded-lg shadow-xl pointer-events-none border border-zinc-200 dark:border-zinc-800", style: { left: tooltipX, top: tooltipY }, children: [_jsx("div", { className: "font-semibold mb-1", children: ctx.tooltipData.title }), ctx.tooltipData.items.map((item, idx) => (_jsxs("div", { className: "text-zinc-700 dark:text-zinc-200 text-xs flex items-center gap-2", children: [item.color && (_jsx("div", { className: "w-2 h-2 rounded-full", style: { backgroundColor: item.color } })), _jsxs("span", { className: "dark:text-zinc-200", children: [item.label, ": ", _jsx("span", { className: "font-mono", children: item.value })] })] }, idx)))] })] }));
}
//# sourceMappingURL=base-chart.js.map