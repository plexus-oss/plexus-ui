"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChartAxes, ChartRoot, ChartTooltip, createWebGLRenderer, createWebGPURenderer, getDomain, hexToRgb, useBaseChart, } from "./base-chart";
const ScatterChartContext = createContext(null);
function useScatterChartData() {
    const ctx = useContext(ScatterChartContext);
    if (!ctx) {
        throw new Error("ScatterChart components must be used within ScatterChart.Root");
    }
    return ctx;
}
function useScatterChart() {
    const baseCtx = useBaseChart();
    const scatterCtx = useScatterChartData();
    return { ...baseCtx, ...scatterCtx };
}
// ============================================================================
// Shaders
// ============================================================================
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;
attribute float a_size;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

varying vec4 v_color;

void main() {
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
  vec2 clipSpace = (position / u_resolution) * 2.0 - 1.0;
  clipSpace.y *= -1.0;

  gl_Position = vec4(clipSpace, 0.0, 1.0);
  gl_PointSize = a_size;
  v_color = a_color;
}
`;
const FRAGMENT_SHADER = `
precision mediump float;
varying vec4 v_color;

void main() {
  // Create circular points
  vec2 center = gl_PointCoord - vec2(0.5);
  float dist = length(center);

  if (dist > 0.5) {
    discard;
  }

  // Smooth edges with antialiasing
  float alpha = smoothstep(0.5, 0.45, dist);
  gl_FragColor = vec4(v_color.rgb, v_color.a * alpha);
}
`;
const WGSL_SHADER = `
struct VertexInput {
  @location(0) position: vec2f,
  @location(1) color: vec4f,
  @location(2) pointCoord: vec2f,
}

struct VertexOutput {
  @builtin(position) position: vec4f,
  @location(0) color: vec4f,
  @location(1) pointCoord: vec2f,
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
  output.pointCoord = input.pointCoord;
  return output;
}

@fragment
fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
  let center = input.pointCoord - vec2f(0.5);
  let dist = length(center);

  if (dist > 0.5) {
    discard;
  }

  let alpha = smoothstep(0.5, 0.45, dist);
  return vec4f(input.color.rgb, input.color.a * alpha);
}
`;
// Helper function to create point geometry
function createPointGeometry(points, xScale, yScale, color, defaultSize, opacity) {
    const positions = [];
    const colors = [];
    const sizes = [];
    for (const point of points) {
        const x = xScale(point.x);
        const y = yScale(point.y);
        const size = (point.size || 1) * defaultSize;
        positions.push(x, y);
        colors.push(...color, opacity);
        sizes.push(size);
    }
    return { positions, colors, sizes };
}
// Helper function to create point geometry for WebGPU (quads)
function createPointGeometryQuads(points, xScale, yScale, color, defaultSize, opacity) {
    const positions = [];
    const colors = [];
    const pointCoords = [];
    for (const point of points) {
        const x = xScale(point.x);
        const y = yScale(point.y);
        const size = (point.size || 1) * defaultSize;
        const halfSize = size / 2;
        // Create two triangles for a quad
        // Triangle 1
        positions.push(x - halfSize, y - halfSize);
        pointCoords.push(0, 0);
        colors.push(...color, opacity);
        positions.push(x + halfSize, y - halfSize);
        pointCoords.push(1, 0);
        colors.push(...color, opacity);
        positions.push(x - halfSize, y + halfSize);
        pointCoords.push(0, 1);
        colors.push(...color, opacity);
        // Triangle 2
        positions.push(x + halfSize, y - halfSize);
        pointCoords.push(1, 0);
        colors.push(...color, opacity);
        positions.push(x + halfSize, y + halfSize);
        pointCoords.push(1, 1);
        colors.push(...color, opacity);
        positions.push(x - halfSize, y + halfSize);
        pointCoords.push(0, 1);
        colors.push(...color, opacity);
    }
    return { positions, colors, pointCoords };
}
// Helper function to draw grid
function drawGrid(gl, program, xTicks, yTicks, xScale, yScale, width, height, positionBuffer, colorBuffer, sizeBuffer) {
    const positions = [];
    const colors = [];
    const sizes = [];
    const isDark = document.documentElement.classList.contains("dark");
    const gridColor = isDark ? [0.4, 0.4, 0.4] : [0.6, 0.6, 0.6];
    // We'll draw grid as points along lines - not ideal but works with point rendering
    for (const tick of xTicks) {
        const x = xScale(tick);
        for (let y = 0; y <= height; y += 5) {
            positions.push(x, y);
            colors.push(...gridColor, 0.1);
            sizes.push(1);
        }
    }
    for (const tick of yTicks) {
        const y = yScale(tick);
        for (let x = 0; x <= width; x += 5) {
            positions.push(x, y);
            colors.push(...gridColor, 0.1);
            sizes.push(1);
        }
    }
    if (positions.length === 0)
        return;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    const positionLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
    const colorLoc = gl.getAttribLocation(program, "a_color");
    gl.enableVertexAttribArray(colorLoc);
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(sizes), gl.STATIC_DRAW);
    const sizeLoc = gl.getAttribLocation(program, "a_size");
    gl.enableVertexAttribArray(sizeLoc);
    gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
    gl.drawArrays(gl.POINTS, 0, positions.length / 2);
}
// Factory function to create WebGL scatter renderer
function createWebGLScatterRenderer(canvas) {
    const buffers = {
        position: null,
        color: null,
        size: null,
    };
    const renderer = createWebGLRenderer({
        canvas,
        createShaders: () => ({
            vertexSource: VERTEX_SHADER,
            fragmentSource: FRAGMENT_SHADER,
        }),
        onRender: (gl, program, props) => {
            const { series, xDomain, yDomain, width, height, margin, showGrid, xTicks, yTicks } = props;
            gl.useProgram(program);
            const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
            gl.uniform2f(resolutionLoc, width, height);
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
            const matrix = [1, 0, 0, 0, 1, 0, margin.left, margin.top, 1];
            const matrixLoc = gl.getUniformLocation(program, "u_matrix");
            gl.uniformMatrix3fv(matrixLoc, false, matrix);
            const xScale = (x) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
            const yScale = (y) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
            const yScaleFlipped = (y) => innerHeight - yScale(y);
            if (showGrid) {
                if (!buffers.position)
                    buffers.position = gl.createBuffer();
                if (!buffers.color)
                    buffers.color = gl.createBuffer();
                if (!buffers.size)
                    buffers.size = gl.createBuffer();
                drawGrid(gl, program, xTicks, yTicks, xScale, yScaleFlipped, innerWidth, innerHeight, buffers.position, buffers.color, buffers.size);
            }
            for (const s of series) {
                if (s.data.length === 0)
                    continue;
                const color = hexToRgb(s.color || "#3b82f6");
                const defaultSize = s.size || 8;
                const opacity = s.opacity ?? 0.8;
                const geometry = createPointGeometry(s.data, xScale, yScaleFlipped, color, defaultSize, opacity);
                if (!buffers.position)
                    buffers.position = gl.createBuffer();
                if (!buffers.color)
                    buffers.color = gl.createBuffer();
                if (!buffers.size)
                    buffers.size = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.STATIC_DRAW);
                const positionLoc = gl.getAttribLocation(program, "a_position");
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colors), gl.STATIC_DRAW);
                const colorLoc = gl.getAttribLocation(program, "a_color");
                gl.enableVertexAttribArray(colorLoc);
                gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.size);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.sizes), gl.STATIC_DRAW);
                const sizeLoc = gl.getAttribLocation(program, "a_size");
                gl.enableVertexAttribArray(sizeLoc);
                gl.vertexAttribPointer(sizeLoc, 1, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.POINTS, 0, geometry.positions.length / 2);
            }
        },
        onDestroy: (gl) => {
            if (buffers.position)
                gl.deleteBuffer(buffers.position);
            if (buffers.color)
                gl.deleteBuffer(buffers.color);
            if (buffers.size)
                gl.deleteBuffer(buffers.size);
        },
    });
    return renderer;
}
// Factory function to create WebGPU scatter renderer
function createWebGPUScatterRenderer(canvas, device) {
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
    // Persistent buffers for grid rendering (reused across frames)
    const gridBuffers = {
        position: null,
        color: null,
        pointCoord: null,
    };
    const seriesBufferPool = [];
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
                        {
                            arrayStride: 8,
                            attributes: [{ shaderLocation: 2, offset: 0, format: "float32x2" }],
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
            const { series, xDomain, yDomain, width, height, margin, showGrid, xTicks, yTicks } = props;
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;
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
            const xScale = (x) => ((x - xDomain[0]) / (xDomain[1] - xDomain[0])) * innerWidth;
            const yScale = (y) => ((y - yDomain[0]) / (yDomain[1] - yDomain[0])) * innerHeight;
            const yScaleFlipped = (y) => innerHeight - yScale(y);
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
            // Draw grid if enabled
            if (showGrid) {
                const positions = [];
                const colors = [];
                const pointCoords = [];
                const isDark = document.documentElement.classList.contains("dark");
                const gridColor = isDark ? [0.4, 0.4, 0.4] : [0.6, 0.6, 0.6];
                const gridSize = 2; // Size of grid line dots
                // Vertical grid lines (x-axis ticks)
                for (const tick of xTicks) {
                    const x = xScale(tick);
                    // Draw vertical line as a series of points
                    for (let y = 0; y <= innerHeight; y += 2) {
                        // Create quad for grid point
                        const halfSize = gridSize / 2;
                        // Triangle 1
                        positions.push(x - halfSize, y - halfSize);
                        pointCoords.push(0, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x + halfSize, y - halfSize);
                        pointCoords.push(1, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x - halfSize, y + halfSize);
                        pointCoords.push(0, 1);
                        colors.push(...gridColor, 0.15);
                        // Triangle 2
                        positions.push(x + halfSize, y - halfSize);
                        pointCoords.push(1, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x + halfSize, y + halfSize);
                        pointCoords.push(1, 1);
                        colors.push(...gridColor, 0.15);
                        positions.push(x - halfSize, y + halfSize);
                        pointCoords.push(0, 1);
                        colors.push(...gridColor, 0.15);
                    }
                }
                // Horizontal grid lines (y-axis ticks)
                for (const tick of yTicks) {
                    const y = yScaleFlipped(tick);
                    // Draw horizontal line as a series of points
                    for (let x = 0; x <= innerWidth; x += 2) {
                        // Create quad for grid point
                        const halfSize = gridSize / 2;
                        // Triangle 1
                        positions.push(x - halfSize, y - halfSize);
                        pointCoords.push(0, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x + halfSize, y - halfSize);
                        pointCoords.push(1, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x - halfSize, y + halfSize);
                        pointCoords.push(0, 1);
                        colors.push(...gridColor, 0.15);
                        // Triangle 2
                        positions.push(x + halfSize, y - halfSize);
                        pointCoords.push(1, 0);
                        colors.push(...gridColor, 0.15);
                        positions.push(x + halfSize, y + halfSize);
                        pointCoords.push(1, 1);
                        colors.push(...gridColor, 0.15);
                        positions.push(x - halfSize, y + halfSize);
                        pointCoords.push(0, 1);
                        colors.push(...gridColor, 0.15);
                    }
                }
                if (positions.length > 0) {
                    const positionData = new Float32Array(positions);
                    const colorData = new Float32Array(colors);
                    const pointCoordData = new Float32Array(pointCoords);
                    // Create or resize position buffer with 1.5x growth factor
                    if (!gridBuffers.position || gridBuffers.position.size < positionData.byteLength * 1.5) {
                        gridBuffers.position?.destroy();
                        gridBuffers.position = device.createBuffer({
                            size: Math.ceil(positionData.byteLength * 1.5),
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                    }
                    // Create or resize color buffer with 1.5x growth factor
                    if (!gridBuffers.color || gridBuffers.color.size < colorData.byteLength * 1.5) {
                        gridBuffers.color?.destroy();
                        gridBuffers.color = device.createBuffer({
                            size: Math.ceil(colorData.byteLength * 1.5),
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                    }
                    // Create or resize pointCoord buffer with 1.5x growth factor
                    if (!gridBuffers.pointCoord ||
                        gridBuffers.pointCoord.size < pointCoordData.byteLength * 1.5) {
                        gridBuffers.pointCoord?.destroy();
                        gridBuffers.pointCoord = device.createBuffer({
                            size: Math.ceil(pointCoordData.byteLength * 1.5),
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                    }
                    // Write data to buffers
                    device.queue.writeBuffer(gridBuffers.position, 0, positionData);
                    device.queue.writeBuffer(gridBuffers.color, 0, colorData);
                    device.queue.writeBuffer(gridBuffers.pointCoord, 0, pointCoordData);
                    passEncoder.setVertexBuffer(0, gridBuffers.position);
                    passEncoder.setVertexBuffer(1, gridBuffers.color);
                    passEncoder.setVertexBuffer(2, gridBuffers.pointCoord);
                    passEncoder.draw(positions.length / 2);
                }
            }
            // Draw scatter points with buffer pooling
            let seriesIndex = 0;
            for (const s of series) {
                if (s.data.length === 0)
                    continue;
                const color = hexToRgb(s.color || "#3b82f6");
                const defaultSize = s.size || 8;
                const opacity = s.opacity ?? 0.8;
                const geometry = createPointGeometryQuads(s.data, xScale, yScaleFlipped, color, defaultSize, opacity);
                const requiredSizes = {
                    position: geometry.positions.length * 4,
                    color: geometry.colors.length * 4,
                    pointCoord: geometry.pointCoords.length * 4,
                };
                // Get or create buffer set for this series
                let bufferSet = seriesBufferPool[seriesIndex];
                if (!bufferSet) {
                    // Create new buffer set
                    bufferSet = {
                        position: device.createBuffer({
                            size: requiredSizes.position,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        }),
                        color: device.createBuffer({
                            size: requiredSizes.color,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        }),
                        pointCoord: device.createBuffer({
                            size: requiredSizes.pointCoord,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        }),
                        sizes: requiredSizes,
                    };
                    seriesBufferPool[seriesIndex] = bufferSet;
                }
                else {
                    // Resize buffers if needed
                    if (bufferSet.sizes.position < requiredSizes.position) {
                        bufferSet.position.destroy();
                        bufferSet.position = device.createBuffer({
                            size: requiredSizes.position,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                        bufferSet.sizes.position = requiredSizes.position;
                    }
                    if (bufferSet.sizes.color < requiredSizes.color) {
                        bufferSet.color.destroy();
                        bufferSet.color = device.createBuffer({
                            size: requiredSizes.color,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                        bufferSet.sizes.color = requiredSizes.color;
                    }
                    if (bufferSet.sizes.pointCoord < requiredSizes.pointCoord) {
                        bufferSet.pointCoord.destroy();
                        bufferSet.pointCoord = device.createBuffer({
                            size: requiredSizes.pointCoord,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                        bufferSet.sizes.pointCoord = requiredSizes.pointCoord;
                    }
                }
                // Write data to buffers (reusing existing buffers)
                device.queue.writeBuffer(bufferSet.position, 0, new Float32Array(geometry.positions));
                device.queue.writeBuffer(bufferSet.color, 0, new Float32Array(geometry.colors));
                device.queue.writeBuffer(bufferSet.pointCoord, 0, new Float32Array(geometry.pointCoords));
                passEncoder.setVertexBuffer(0, bufferSet.position);
                passEncoder.setVertexBuffer(1, bufferSet.color);
                passEncoder.setVertexBuffer(2, bufferSet.pointCoord);
                passEncoder.draw(geometry.positions.length / 2);
                seriesIndex++;
            }
            // Clean up excess buffers if series count decreased
            while (seriesBufferPool.length > seriesIndex) {
                const removed = seriesBufferPool.pop();
                if (removed) {
                    removed.position.destroy();
                    removed.color.destroy();
                    removed.pointCoord.destroy();
                }
            }
            passEncoder.end();
            device.queue.submit([commandEncoder.finish()]);
        },
        onDestroy: () => {
            uniformBuffer.destroy();
            // Clean up grid buffers
            gridBuffers.position?.destroy();
            gridBuffers.color?.destroy();
            gridBuffers.pointCoord?.destroy();
            // Clean up series buffer pool
            for (const bufferSet of seriesBufferPool) {
                bufferSet.position.destroy();
                bufferSet.color.destroy();
                bufferSet.pointCoord.destroy();
            }
            seriesBufferPool.length = 0;
        },
    });
    return renderer;
}
// ============================================================================
// Scatter Chart Components
// ============================================================================
function Root({ series, xAxis = {}, yAxis = {}, width = 800, height = 400, preferWebGPU = true, className, children, }) {
    const allPoints = series.flatMap((s) => s.data);
    const xDomain = xAxis.domain === "auto" || !xAxis.domain
        ? getDomain(allPoints, (p) => p.x, 0.02)
        : xAxis.domain;
    const yDomain = yAxis.domain === "auto" || !yAxis.domain
        ? getDomain(allPoints, (p) => p.y, 0.02)
        : yAxis.domain;
    return (_jsx(ChartRoot, { width: width, height: height, xAxis: xAxis, yAxis: yAxis, xDomain: xDomain, yDomain: yDomain, preferWebGPU: preferWebGPU, className: className, children: _jsx(ScatterChartContext.Provider, { value: { series }, children: children }) }));
}
function Canvas({ showGrid = false }) {
    const ctx = useScatterChart();
    const rendererRef = useRef(null);
    const mountedRef = useRef(true);
    const [rendererReady, setRendererReady] = useState(false);
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
        mountedRef.current = true;
        setRendererReady(false);
        async function initRenderer() {
            if (!canvas || rendererRef.current)
                return;
            try {
                if (ctx.preferWebGPU && "gpu" in navigator) {
                    const adapter = await navigator.gpu?.requestAdapter();
                    if (adapter) {
                        const device = await adapter.requestDevice();
                        const renderer = createWebGPUScatterRenderer(canvas, device);
                        if (!mountedRef.current) {
                            renderer.destroy();
                            return;
                        }
                        rendererRef.current = renderer;
                        ctx.setRenderMode("webgpu");
                        setRendererReady(true);
                        // Force immediate render after initialization
                        requestAnimationFrame(() => {
                            if (rendererRef.current && mountedRef.current) {
                                const dpr = ctx.devicePixelRatio;
                                const renderProps = {
                                    canvas,
                                    series: ctx.series,
                                    xDomain: ctx.xDomain,
                                    yDomain: ctx.yDomain,
                                    xTicks: ctx.xTicks,
                                    yTicks: ctx.yTicks,
                                    width: ctx.width * dpr,
                                    height: ctx.height * dpr,
                                    margin: {
                                        top: ctx.margin.top * dpr,
                                        right: ctx.margin.right * dpr,
                                        bottom: ctx.margin.bottom * dpr,
                                        left: ctx.margin.left * dpr,
                                    },
                                    showGrid,
                                };
                                rendererRef.current.render(renderProps);
                            }
                        });
                        return;
                    }
                }
            }
            catch (error) {
                console.warn("WebGPU failed, falling back to WebGL:", error);
            }
            try {
                const renderer = createWebGLScatterRenderer(canvas);
                if (!mountedRef.current) {
                    renderer.destroy();
                    return;
                }
                rendererRef.current = renderer;
                ctx.setRenderMode("webgl");
                setRendererReady(true);
                // Force immediate render after initialization
                requestAnimationFrame(() => {
                    if (rendererRef.current && mountedRef.current) {
                        const dpr = ctx.devicePixelRatio;
                        const renderProps = {
                            canvas,
                            series: ctx.series,
                            xDomain: ctx.xDomain,
                            yDomain: ctx.yDomain,
                            xTicks: ctx.xTicks,
                            yTicks: ctx.yTicks,
                            width: ctx.width * dpr,
                            height: ctx.height * dpr,
                            margin: {
                                top: ctx.margin.top * dpr,
                                right: ctx.margin.right * dpr,
                                bottom: ctx.margin.bottom * dpr,
                                left: ctx.margin.left * dpr,
                            },
                            showGrid,
                        };
                        rendererRef.current.render(renderProps);
                    }
                });
            }
            catch (error) {
                console.error("WebGL failed:", error);
            }
        }
        initRenderer();
        return () => {
            mountedRef.current = false;
            setRendererReady(false);
            if (rendererRef.current) {
                rendererRef.current.destroy();
                rendererRef.current = null;
            }
        };
    }, [
        ctx.canvasRef,
        ctx.width,
        ctx.height,
        ctx.devicePixelRatio,
        ctx.preferWebGPU,
        ctx.setRenderMode,
        ctx.margin.bottom,
        ctx.margin.left,
        ctx.margin.right,
        ctx.margin.top,
        ctx.series,
        ctx.xDomain,
        ctx.xTicks,
        ctx.yDomain,
        ctx.yTicks,
        showGrid,
    ]);
    // Render on data/config changes
    useEffect(() => {
        const canvas = ctx.canvasRef.current;
        const renderer = rendererRef.current;
        if (!canvas || !renderer || !rendererReady)
            return;
        const dpr = ctx.devicePixelRatio;
        const renderProps = {
            canvas,
            series: ctx.series,
            xDomain: ctx.xDomain,
            yDomain: ctx.yDomain,
            xTicks: ctx.xTicks,
            yTicks: ctx.yTicks,
            width: ctx.width * dpr,
            height: ctx.height * dpr,
            margin: {
                top: ctx.margin.top * dpr,
                right: ctx.margin.right * dpr,
                bottom: ctx.margin.bottom * dpr,
                left: ctx.margin.left * dpr,
            },
            showGrid,
        };
        // Call render without destroying the renderer
        const renderResult = renderer.render(renderProps);
        if (renderResult && "then" in renderResult) {
            // WebGPU renderer (async) - result is already rendering
            // No need to call again
        }
        else {
            // WebGL renderer (sync) - already rendered
        }
    }, [
        ctx.series,
        ctx.xDomain,
        ctx.yDomain,
        ctx.xTicks,
        ctx.yTicks,
        ctx.width,
        ctx.height,
        ctx.margin,
        ctx.devicePixelRatio,
        showGrid,
        ctx.canvasRef,
        rendererReady,
    ]);
    return (_jsx("canvas", { ref: ctx.canvasRef, className: "absolute inset-0", style: {
            width: `${ctx.width}px`,
            height: `${ctx.height}px`,
        } }));
}
function Tooltip() {
    const ctx = useScatterChart();
    const handleHover = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x < ctx.margin.left ||
            x > ctx.width - ctx.margin.right ||
            y < ctx.margin.top ||
            y > ctx.height - ctx.margin.bottom) {
            ctx.setHoveredPoint(null);
            ctx.setTooltipData(null);
            return;
        }
        let closestDist = Infinity;
        let closestSeriesIdx = -1;
        let closestPointIdx = -1;
        let closestScreenX = 0;
        let closestScreenY = 0;
        ctx.series.forEach((s, seriesIdx) => {
            s.data.forEach((point, pointIdx) => {
                const px = ctx.xScale(point.x);
                const py = ctx.yScale(point.y);
                const pointSize = (point.size || 1) * (s.size || 8);
                const dist = Math.sqrt((px - x) ** 2 + (py - y) ** 2);
                if (dist < pointSize && dist < closestDist) {
                    closestDist = dist;
                    closestSeriesIdx = seriesIdx;
                    closestPointIdx = pointIdx;
                    closestScreenX = px;
                    closestScreenY = py;
                }
            });
        });
        if (closestSeriesIdx !== -1 && closestPointIdx !== -1) {
            // Only update if the hovered point has changed
            if (!ctx.hoveredPoint ||
                ctx.hoveredPoint.seriesIdx !== closestSeriesIdx ||
                ctx.hoveredPoint.pointIdx !== closestPointIdx) {
                const closest = {
                    seriesIdx: closestSeriesIdx,
                    pointIdx: closestPointIdx,
                    screenX: closestScreenX,
                    screenY: closestScreenY,
                };
                ctx.setHoveredPoint(closest);
                const series = ctx.series[closestSeriesIdx];
                const point = series.data[closestPointIdx];
                const items = [
                    { label: "X", value: point.x.toFixed(2) },
                    { label: "Y", value: point.y.toFixed(2), color: series.color },
                ];
                if (point.label) {
                    items.unshift({ label: "Label", value: point.label });
                }
                ctx.setTooltipData({
                    title: series.name,
                    items,
                });
            }
        }
        else {
            if (ctx.hoveredPoint !== null) {
                ctx.setHoveredPoint(null);
                ctx.setTooltipData(null);
            }
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(ChartTooltip, { onHover: handleHover }), ctx.hoveredPoint && ctx.tooltipData && (_jsx("div", { className: "absolute pointer-events-none z-20", style: {
                    left: ctx.hoveredPoint.screenX - 8,
                    top: ctx.hoveredPoint.screenY - 8,
                }, children: _jsx("div", { className: "w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse", style: {
                        backgroundColor: ctx.series[ctx.hoveredPoint.seriesIdx].color || "#3b82f6",
                    } }) }))] }));
}
// Separate Grid component for composable API
function Grid() {
    // Grid is now rendered via Canvas with showGrid prop
    // This component exists for API consistency but doesn't render anything
    // The actual grid rendering happens in Canvas when showGrid={true}
    return null;
}
// ============================================================================
// Composed Component (Simple API)
// ============================================================================
export function ScatterChart({ series, xAxis = {}, yAxis = {}, width = 800, height = 400, showGrid = true, showAxes = true, showTooltip = false, preferWebGPU = true, className, }) {
    return (_jsxs(Root, { series: series, xAxis: xAxis, yAxis: yAxis, width: width, height: height, preferWebGPU: preferWebGPU, className: className, children: [_jsx(Canvas, { showGrid: showGrid }), showAxes && _jsx(ChartAxes, {}), showTooltip && _jsx(Tooltip, {})] }));
}
// ============================================================================
// Primitive API (Composable)
// ============================================================================
/**
 * ScatterChart Primitives - Composable chart components for custom layouts
 *
 * @example Simple usage (monolithic)
 * ```tsx
 * <ScatterChart series={data} showGrid showAxes showTooltip />
 * ```
 *
 * @example Advanced usage (composable)
 * ```tsx
 * <ScatterChart.Root series={data} width={800} height={400}>
 *   <ScatterChart.Canvas showGrid />
 *   <ScatterChart.Axes />
 *   <ScatterChart.Tooltip />
 * </ScatterChart.Root>
 * ```
 */
ScatterChart.Root = Root;
ScatterChart.Canvas = Canvas;
ScatterChart.Grid = Grid;
ScatterChart.Axes = ChartAxes;
ScatterChart.Tooltip = Tooltip;
export default ScatterChart;
//# sourceMappingURL=scatter-chart.js.map