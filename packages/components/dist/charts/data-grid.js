/** biome-ignore-all lint/a11y/noStaticElementInteractions: data grid cells require custom pointer handling for selection */
/** biome-ignore-all lint/a11y/useKeyWithClickEvents: data grid interactions are pointer-driven */
"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChartRoot, createWebGLRenderer, createWebGPURenderer, hexToRgb, useBaseChart, } from "./base-chart";
const DataGridContext = createContext(null);
function useDataGridData() {
    const ctx = useContext(DataGridContext);
    if (!ctx) {
        throw new Error("DataGrid components must be used within DataGrid.Root");
    }
    return ctx;
}
function useDataGrid() {
    const baseCtx = useBaseChart();
    const gridCtx = useDataGridData();
    return { ...baseCtx, ...gridCtx };
}
// ============================================================================
// Shaders
// ============================================================================
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

varying vec4 v_color;

void main() {
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
  vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;

  gl_Position = vec4(clipSpace, 0.0, 1.0);
  v_color = a_color;
}
`;
const FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;

void main() {
  gl_FragColor = v_color;
}
`;
const WGSL_SHADER = `
struct VertexInput {
  @location(0) position: vec2f,
  @location(1) color: vec4f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
}

struct Uniforms {
  resolution: vec2f,
  transform: mat3x3f,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn vertexMain(input: VertexInput) -> VertexOutput {
  var output: VertexOutput;

  let transformed = uniforms.transform * vec3f(input.position, 1.0);
  var clipSpace = (transformed.xy / uniforms.resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;

  output.position = vec4f(clipSpace, 0.0, 1.0);
  output.color = input.color;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  return input.color;
}
`;
/**
 * Creates geometry data for grid backgrounds and borders
 */
function createGridGeometry(props) {
    const { columns, data, rowHeight, headerHeight, showHeader, alternateRows, scrollTop, hoveredRow, width, height, margin, } = props;
    const positions = [];
    const colors = [];
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    // Theme-aware colors
    const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
    const headerBg = hexToRgb(isDark ? "#18181b" : "#fafafa");
    const rowBg1 = hexToRgb(isDark ? "#09090b" : "#ffffff");
    const rowBg2 = hexToRgb(isDark ? "#0f0f12" : "#fafafa");
    const hoverBg = hexToRgb(isDark ? "#27272a" : "#f4f4f5");
    const borderColor = hexToRgb(isDark ? "#27272a" : "#e4e4e7");
    // Calculate column widths
    const totalWidth = innerWidth;
    const colWidths = columns.map((col) => col.width || totalWidth / columns.length);
    let yOffset = 0;
    // Draw header background
    if (showHeader) {
        const x1 = 0;
        const y1 = yOffset;
        const x2 = innerWidth;
        const y2 = yOffset + headerHeight;
        // Header rect (2 triangles)
        positions.push(x1, y1, x2, y1, x1, y2);
        positions.push(x2, y1, x2, y2, x1, y2);
        for (let i = 0; i < 6; i++) {
            colors.push(...headerBg, 1);
        }
        // Header bottom border (thicker line using rect)
        const borderHeight = 1;
        positions.push(x1, y2, x2, y2, x1, y2 + borderHeight);
        positions.push(x2, y2, x2, y2 + borderHeight, x1, y2 + borderHeight);
        for (let i = 0; i < 6; i++) {
            colors.push(...borderColor, 1);
        }
        yOffset += headerHeight;
    }
    // Calculate visible rows for virtual scrolling
    const startRow = Math.floor(scrollTop / rowHeight);
    const visibleRowCount = Math.ceil((innerHeight - yOffset) / rowHeight) + 1;
    const endRow = Math.min(data.length, startRow + visibleRowCount);
    // Draw visible row backgrounds
    for (let i = startRow; i < endRow; i++) {
        const y1 = yOffset + i * rowHeight - scrollTop + (showHeader ? headerHeight : 0);
        const y2 = y1 + rowHeight;
        // Skip if row is not visible
        if (y2 < yOffset || y1 > innerHeight)
            continue;
        // Row background
        const isHovered = i === hoveredRow;
        let bgColor;
        if (isHovered) {
            bgColor = hoverBg;
        }
        else if (alternateRows && i % 2 === 1) {
            bgColor = rowBg2;
        }
        else {
            bgColor = rowBg1;
        }
        positions.push(0, y1, innerWidth, y1, 0, y2);
        positions.push(innerWidth, y1, innerWidth, y2, 0, y2);
        for (let j = 0; j < 6; j++) {
            colors.push(...bgColor, 1);
        }
        // Row bottom border
        const borderHeight = 1;
        positions.push(0, y2, innerWidth, y2, 0, y2 + borderHeight);
        positions.push(innerWidth, y2, innerWidth, y2 + borderHeight, 0, y2 + borderHeight);
        for (let j = 0; j < 6; j++) {
            colors.push(...borderColor, 0.5);
        }
    }
    // Draw vertical column separators
    let xOffset = 0;
    for (let i = 0; i < columns.length - 1; i++) {
        xOffset += colWidths[i];
        const borderWidth = 1;
        const y1 = 0;
        const y2 = innerHeight;
        positions.push(xOffset, y1, xOffset + borderWidth, y1, xOffset, y2);
        positions.push(xOffset + borderWidth, y1, xOffset + borderWidth, y2, xOffset, y2);
        for (let j = 0; j < 6; j++) {
            colors.push(...borderColor, 0.3);
        }
    }
    return { positions, colors };
}
/**
 * WebGL renderer factory for data grid
 */
function createWebGLDataGridRenderer(canvas) {
    const buffers = {
        position: null,
        color: null,
    };
    const renderer = createWebGLRenderer({
        canvas,
        createShaders: () => ({
            vertexSource: VERTEX_SHADER,
            fragmentSource: FRAGMENT_SHADER,
        }),
        onRender: (gl, program, props) => {
            const { width, height, margin } = props;
            const matrix = [1, 0, 0, 0, 1, 0, margin.left, margin.top, 1];
            gl.useProgram(program);
            gl.uniform2f(gl.getUniformLocation(program, "u_resolution"), width, height);
            gl.uniformMatrix3fv(gl.getUniformLocation(program, "u_matrix"), false, matrix);
            const geometry = createGridGeometry(props);
            // Upload data to GPU
            if (!buffers.position) {
                buffers.position = gl.createBuffer();
            }
            if (!buffers.color) {
                buffers.color = gl.createBuffer();
            }
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.DYNAMIC_DRAW);
            const posLoc = gl.getAttribLocation(program, "a_position");
            gl.enableVertexAttribArray(posLoc);
            gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
            gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colors), gl.DYNAMIC_DRAW);
            const colorLoc = gl.getAttribLocation(program, "a_color");
            gl.enableVertexAttribArray(colorLoc);
            gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
            // Draw all triangles
            gl.drawArrays(gl.TRIANGLES, 0, geometry.positions.length / 2);
        },
        onDestroy: (gl) => {
            if (buffers.position)
                gl.deleteBuffer(buffers.position);
            if (buffers.color)
                gl.deleteBuffer(buffers.color);
        },
    });
    return renderer;
}
/**
 * WebGPU renderer factory for data grid
 */
function createWebGPUDataGridRenderer(canvas, device) {
    const shaderModule = device.createShaderModule({ code: WGSL_SHADER });
    const uniformBuffer = device.createBuffer({
        size: 64,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.VERTEX,
                buffer: { type: "uniform" },
            },
        ],
    });
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{ binding: 0, resource: { buffer: uniformBuffer } }],
    });
    const renderer = createWebGPURenderer({
        canvas,
        device,
        createPipeline: (device, format) => {
            return device.createRenderPipeline({
                layout: device.createPipelineLayout({
                    bindGroupLayouts: [bindGroupLayout],
                }),
                vertex: {
                    module: shaderModule,
                    entryPoint: "vertexMain",
                    buffers: [
                        {
                            arrayStride: 8,
                            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
                        },
                        {
                            arrayStride: 16,
                            attributes: [{ shaderLocation: 1, offset: 0, format: "float32x4" }],
                        },
                    ],
                },
                fragment: {
                    module: shaderModule,
                    entryPoint: "fragmentMain",
                    targets: [
                        {
                            format,
                            blend: {
                                color: {
                                    srcFactor: "src-alpha",
                                    dstFactor: "one-minus-src-alpha",
                                    operation: "add",
                                },
                                alpha: {
                                    srcFactor: "one",
                                    dstFactor: "one-minus-src-alpha",
                                    operation: "add",
                                },
                            },
                        },
                    ],
                },
                primitive: { topology: "triangle-list" },
            });
        },
        onRender: async (device, context, pipeline, props) => {
            const { width, height, margin } = props;
            const uniformData = new Float32Array([
                width,
                height,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                1,
                0,
                0,
                margin.left,
                margin.top,
                1,
                0,
            ]);
            device.queue.writeBuffer(uniformBuffer, 0, uniformData);
            const geometry = createGridGeometry(props);
            if (geometry.positions.length === 0)
                return;
            const positionBuffer = device.createBuffer({
                size: geometry.positions.length * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(positionBuffer, 0, new Float32Array(geometry.positions));
            const colorBuffer = device.createBuffer({
                size: geometry.colors.length * 4,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
            });
            device.queue.writeBuffer(colorBuffer, 0, new Float32Array(geometry.colors));
            const commandEncoder = device.createCommandEncoder();
            const textureView = context.getCurrentTexture().createView();
            const passEncoder = commandEncoder.beginRenderPass({
                colorAttachments: [
                    {
                        view: textureView,
                        clearValue: { r: 0, g: 0, b: 0, a: 0 },
                        loadOp: "clear",
                        storeOp: "store",
                    },
                ],
            });
            passEncoder.setPipeline(pipeline);
            passEncoder.setBindGroup(0, bindGroup);
            passEncoder.setVertexBuffer(0, positionBuffer);
            passEncoder.setVertexBuffer(1, colorBuffer);
            passEncoder.draw(geometry.positions.length / 2);
            passEncoder.end();
            device.queue.submit([commandEncoder.finish()]);
        },
        onDestroy: () => {
            uniformBuffer.destroy();
        },
    });
    return renderer;
}
function Root({ children, columns, data, width = 1000, height = 600, rowHeight = 48, headerHeight = 48, showHeader = true, alternateRows = false, highlightOnHover = true, virtualScrolling = true, sortable = false, preferWebGPU = true, className, onRowClick, onSort, }) {
    const [scrollTop, setScrollTop] = useState(0);
    const [hoveredRow, setHoveredRow] = useState(null);
    const [sortState, setSortState] = useState({
        columnId: null,
        direction: null,
    });
    // Sort data based on current sort state
    const sortedData = useMemo(() => {
        if (!sortState.columnId || !sortState.direction) {
            return data;
        }
        const column = columns.find((col) => col.id === sortState.columnId);
        if (!column)
            return data;
        const sorted = [...data].sort((a, b) => {
            const aVal = a[column.id];
            const bVal = b[column.id];
            // Use custom sort function if provided
            if (column.sortFn) {
                return sortState.direction === "asc"
                    ? column.sortFn(aVal, bVal)
                    : column.sortFn(bVal, aVal);
            }
            // Default sort logic based on type
            if (column.type === "number") {
                const aNum = typeof aVal === "number" ? aVal : parseFloat(String(aVal));
                const bNum = typeof bVal === "number" ? bVal : parseFloat(String(bVal));
                return sortState.direction === "asc" ? aNum - bNum : bNum - aNum;
            }
            // Text sort
            const aStr = String(aVal ?? "");
            const bStr = String(bVal ?? "");
            return sortState.direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
        });
        return sorted;
    }, [data, columns, sortState]);
    const gridData = {
        columns,
        data,
        sortedData,
        rowHeight,
        headerHeight,
        showHeader,
        alternateRows,
        highlightOnHover,
        virtualScrolling,
        sortable,
        scrollTop,
        setScrollTop,
        hoveredRow,
        setHoveredRow,
        sortState,
        setSortState,
        onRowClick,
        onSort,
    };
    return (_jsx(DataGridContext.Provider, { value: gridData, children: _jsx(ChartRoot, { width: width, height: height, preferWebGPU: preferWebGPU, className: className, margin: { top: 0, right: 0, bottom: 0, left: 0 }, children: children }) }));
}
// ============================================================================
// Canvas Component
// ============================================================================
function Canvas() {
    const ctx = useDataGrid();
    const rendererRef = useRef(null);
    // Initialize renderer once
    useEffect(() => {
        const canvas = ctx.canvasRef.current;
        if (!canvas)
            return;
        const dpr = ctx.devicePixelRatio;
        canvas.width = ctx.width * dpr;
        canvas.height = ctx.height * dpr;
        canvas.style.width = `${ctx.width}px`;
        canvas.style.height = `${ctx.height}px`;
        let mounted = true;
        async function initRenderer() {
            if (!canvas)
                return;
            try {
                if (ctx.preferWebGPU && "gpu" in navigator) {
                    const adapter = await navigator.gpu?.requestAdapter();
                    if (adapter) {
                        const device = await adapter.requestDevice();
                        const renderer = createWebGPUDataGridRenderer(canvas, device);
                        if (!mounted) {
                            renderer.destroy();
                            return;
                        }
                        rendererRef.current = renderer;
                        ctx.setRenderMode("webgpu");
                        return;
                    }
                }
            }
            catch (error) {
                console.warn("WebGPU failed, falling back to WebGL:", error);
            }
            try {
                const renderer = createWebGLDataGridRenderer(canvas);
                if (!mounted) {
                    renderer.destroy();
                    return;
                }
                rendererRef.current = renderer;
                ctx.setRenderMode("webgl");
            }
            catch (error) {
                console.error("WebGL failed:", error);
            }
        }
        initRenderer();
        return () => {
            mounted = false;
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, [
        ctx.preferWebGPU,
        ctx.width,
        ctx.height,
        ctx.devicePixelRatio,
        ctx.canvasRef,
        ctx.setRenderMode,
    ]);
    // Render when data or scroll position changes (skip if not visible)
    useEffect(() => {
        const canvas = ctx.canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer || !ctx.renderMode || !ctx.isVisible)
            return;
        const dpr = ctx.devicePixelRatio;
        let rafId = null;
        let rendering = false;
        async function render() {
            if (rendering)
                return;
            rendering = true;
            const currentRenderer = rendererRef.current;
            const currentCanvas = ctx.canvasRef.current;
            if (!currentRenderer || !currentCanvas) {
                rendering = false;
                return;
            }
            const renderProps = {
                canvas: currentCanvas,
                columns: ctx.columns,
                data: ctx.sortedData,
                rowHeight: ctx.rowHeight * dpr,
                headerHeight: ctx.headerHeight * dpr,
                showHeader: ctx.showHeader,
                alternateRows: ctx.alternateRows,
                scrollTop: ctx.scrollTop * dpr,
                hoveredRow: ctx.hoveredRow,
                width: ctx.width * dpr,
                height: ctx.height * dpr,
                margin: {
                    top: ctx.margin.top * dpr,
                    right: ctx.margin.right * dpr,
                    bottom: ctx.margin.bottom * dpr,
                    left: ctx.margin.left * dpr,
                },
                xDomain: [0, 1],
                yDomain: [0, 1],
                xTicks: [],
                yTicks: [],
                showGrid: false,
            };
            await currentRenderer.render(renderProps);
            rendering = false;
        }
        rafId = requestAnimationFrame(() => render());
        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
    }, [
        ctx.columns,
        ctx.sortedData,
        ctx.scrollTop,
        ctx.hoveredRow,
        ctx.rowHeight,
        ctx.headerHeight,
        ctx.showHeader,
        ctx.alternateRows,
        ctx.width,
        ctx.height,
        ctx.margin,
        ctx.devicePixelRatio,
        ctx.renderMode,
        ctx.canvasRef,
        ctx.isVisible,
    ]);
    return (_jsx("canvas", { ref: ctx.canvasRef, className: "absolute inset-0 pointer-events-none", style: {
            width: `${ctx.width}px`,
            height: `${ctx.height}px`,
        } }));
}
// ============================================================================
// Header Component
// ============================================================================
function Header() {
    const ctx = useDataGrid();
    if (!ctx.showHeader)
        return null;
    const totalWidth = ctx.width;
    const colWidths = ctx.columns.map((col) => col.width || totalWidth / ctx.columns.length);
    const handleSort = (columnId) => {
        if (!ctx.sortable)
            return;
        const column = ctx.columns.find((col) => col.id === columnId);
        if (!column || column.sortable === false)
            return;
        let newDirection = "asc";
        if (ctx.sortState.columnId === columnId) {
            if (ctx.sortState.direction === "asc") {
                newDirection = "desc";
            }
            else if (ctx.sortState.direction === "desc") {
                newDirection = null;
            }
        }
        const newState = {
            columnId: newDirection ? columnId : null,
            direction: newDirection,
        };
        ctx.setSortState(newState);
        ctx.onSort?.(columnId, newDirection);
    };
    return (_jsx("div", { className: "absolute top-0 left-0 right-0 flex items-center z-10", style: { height: ctx.headerHeight }, children: ctx.columns.map((col, i) => {
            const width = colWidths[i];
            const isSortable = ctx.sortable && col.sortable !== false;
            const isSorted = ctx.sortState.columnId === col.id;
            const sortDirection = isSorted ? ctx.sortState.direction : null;
            return (_jsxs("div", { className: `flex items-center h-full px-4 text-sm font-medium text-zinc-500 dark:text-zinc-400 ${isSortable ? "cursor-pointer hover:text-zinc-900 dark:hover:text-zinc-100" : ""}`, style: {
                    width,
                    textAlign: col.alignment || "left",
                    justifyContent: col.alignment === "right"
                        ? "flex-end"
                        : col.alignment === "center"
                            ? "center"
                            : "flex-start",
                }, onClick: () => isSortable && handleSort(col.id), children: [_jsx("span", { children: col.label }), isSortable && (_jsx("span", { className: "ml-2 text-xs", children: sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : "⇅" }))] }, col.id));
        }) }));
}
// ============================================================================
// Body Component
// ============================================================================
function Body() {
    const ctx = useDataGrid();
    const containerRef = useRef(null);
    const totalWidth = ctx.width;
    const colWidths = ctx.columns.map((col) => col.width || totalWidth / ctx.columns.length);
    const yOffset = ctx.showHeader ? ctx.headerHeight : 0;
    const visibleHeight = ctx.height - yOffset;
    // Calculate visible rows for virtual scrolling
    const startRow = Math.floor(ctx.scrollTop / ctx.rowHeight);
    const endRow = Math.min(ctx.sortedData.length, Math.ceil((ctx.scrollTop + visibleHeight) / ctx.rowHeight) + 1);
    const handleScroll = (e) => {
        ctx.setScrollTop(e.currentTarget.scrollTop);
    };
    const formatValue = (col, value) => {
        if (col.formatter)
            return col.formatter(value);
        if (value === null || value === undefined)
            return "—";
        // Default formatting based on type
        if (col.type === "number" && typeof value === "number") {
            return value.toLocaleString();
        }
        if (col.type === "timestamp" && typeof value === "number") {
            return new Date(value).toLocaleString();
        }
        return String(value);
    };
    return (_jsx("div", { ref: containerRef, className: "absolute inset-0 overflow-auto z-0", style: {
            top: yOffset,
        }, onScroll: handleScroll, children: _jsx("div", { style: { height: ctx.sortedData.length * ctx.rowHeight }, children: ctx.virtualScrolling
                ? ctx.sortedData.slice(startRow, endRow).map((row, idx) => {
                    const actualIdx = startRow + idx;
                    return (_jsx("div", { className: `absolute left-0 right-0 flex items-center ${ctx.onRowClick ? "cursor-pointer" : ""}`, style: {
                            height: ctx.rowHeight,
                            top: actualIdx * ctx.rowHeight,
                        }, onMouseEnter: () => ctx.highlightOnHover && ctx.setHoveredRow(actualIdx), onMouseLeave: () => ctx.highlightOnHover && ctx.setHoveredRow(null), onClick: () => ctx.onRowClick?.(row, actualIdx), children: ctx.columns.map((col, colIdx) => {
                            const value = row[col.id];
                            return (_jsx("div", { className: "flex items-center px-4 text-sm text-zinc-900 dark:text-zinc-100 overflow-hidden", style: {
                                    width: colWidths[colIdx],
                                    textAlign: col.alignment || "left",
                                    justifyContent: col.alignment === "right"
                                        ? "flex-end"
                                        : col.alignment === "center"
                                            ? "center"
                                            : "flex-start",
                                }, children: _jsx("span", { className: "truncate", children: formatValue(col, value) }) }, col.id));
                        }) }, actualIdx));
                })
                : ctx.sortedData.map((row, idx) => (_jsx("div", { className: `flex items-center ${ctx.onRowClick ? "cursor-pointer" : ""}`, style: {
                        height: ctx.rowHeight,
                    }, onMouseEnter: () => ctx.highlightOnHover && ctx.setHoveredRow(idx), onMouseLeave: () => ctx.highlightOnHover && ctx.setHoveredRow(null), onClick: () => ctx.onRowClick?.(row, idx), children: ctx.columns.map((col, colIdx) => {
                        const value = row[col.id];
                        return (_jsx("div", { className: "flex items-center px-4 text-sm text-zinc-900 dark:text-zinc-100 overflow-hidden", style: {
                                width: colWidths[colIdx],
                                textAlign: col.alignment || "left",
                                justifyContent: col.alignment === "right"
                                    ? "flex-end"
                                    : col.alignment === "center"
                                        ? "center"
                                        : "flex-start",
                            }, children: _jsx("span", { className: "truncate", children: formatValue(col, value) }) }, col.id));
                    }) }, idx))) }) }));
}
// ============================================================================
// Composed Component
// ============================================================================
export function DataGrid({ columns, data, width = 1000, height = 600, rowHeight = 48, headerHeight = 48, showHeader = true, alternateRows = false, highlightOnHover = true, virtualScrolling = true, sortable = false, preferWebGPU = true, className, onRowClick, onSort, }) {
    return (_jsxs(Root, { columns: columns, data: data, width: width, height: height, rowHeight: rowHeight, headerHeight: headerHeight, showHeader: showHeader, alternateRows: alternateRows, highlightOnHover: highlightOnHover, virtualScrolling: virtualScrolling, sortable: sortable, preferWebGPU: preferWebGPU, className: className, onRowClick: onRowClick, onSort: onSort, children: [_jsx(Canvas, {}), _jsx(Header, {}), _jsx(Body, {})] }));
}
DataGrid.Root = Root;
DataGrid.Canvas = Canvas;
DataGrid.Header = Header;
DataGrid.Body = Body;
export default DataGrid;
//# sourceMappingURL=data-grid.js.map