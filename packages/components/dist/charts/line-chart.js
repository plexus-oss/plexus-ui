"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ChartAxes, ChartRoot, ChartTooltip, createWebGLRenderer, createWebGPURenderer, getDomain, hexToRgb, useBaseChart, } from "./base-chart";
const LineChartContext = createContext(null);
function useLineChartData() {
    const ctx = useContext(LineChartContext);
    if (!ctx) {
        throw new Error("LineChart components must be used within LineChart.Root");
    }
    return ctx;
}
function useLineChart() {
    const baseCtx = useBaseChart();
    const lineCtx = useLineChartData();
    return { ...baseCtx, ...lineCtx };
}
// ============================================================================
// Shaders
// ============================================================================
const VERTEX_SHADER = `
attribute vec2 a_position;
attribute vec4 a_color;
attribute vec2 a_normal;
attribute float a_width;

uniform vec2 u_resolution;
uniform mat3 u_matrix;

varying vec4 v_color;

void main() {
  vec2 position = (u_matrix * vec3(a_position, 1.0)).xy;
  vec2 offset = a_normal * a_width * 0.5;
  vec2 clipSpace = ((position + offset) / u_resolution) * 2.0 - 1.0;
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
  @location(2) normal: vec2f,
  @location(3) width: f32,
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
  let offset = input.normal * input.width * 0.5;
  var clipSpace = ((transformed.xy + offset) / uniforms.resolution) * 2.0 - 1.0;
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
// Helper function to create line geometry
function createLineGeometry(points, xScale, yScale, color, lineWidth) {
    const positions = [];
    const colors = [];
    const normals = [];
    const widths = [];
    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const x1 = xScale(p1.x);
        const y1 = yScale(p1.y);
        const x2 = xScale(p2.x);
        const y2 = yScale(p2.y);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.sqrt(dx * dx + dy * dy);
        const nx = -dy / len;
        const ny = dx / len;
        positions.push(x1, y1, x2, y2, x1, y1);
        normals.push(-nx, -ny, -nx, -ny, nx, ny);
        widths.push(lineWidth, lineWidth, lineWidth);
        colors.push(...color, 1, ...color, 1, ...color, 1);
        positions.push(x2, y2, x1, y1, x2, y2);
        normals.push(-nx, -ny, nx, ny, nx, ny);
        widths.push(lineWidth, lineWidth, lineWidth);
        colors.push(...color, 1, ...color, 1, ...color, 1);
    }
    return { positions, colors, normals, widths };
}
// Factory function to create WebGL line renderer
function createWebGLLineRenderer(canvas) {
    const buffers = {
        position: null,
        color: null,
        normal: null,
        width: null,
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
            // Draw grid if enabled
            if (showGrid) {
                const positions = [];
                const colors = [];
                const normals = [];
                const widths = [];
                const isDark = document.documentElement.classList.contains("dark");
                const gridColor = isDark ? [0.4, 0.4, 0.4] : [0.6, 0.6, 0.6];
                const gridWidth = 1;
                for (const tick of xTicks) {
                    const x = xScale(tick);
                    positions.push(x, 0, x, height, x, 0);
                    positions.push(x, height, x, 0, x, height);
                    normals.push(1, 0, 1, 0, -1, 0, 1, 0, -1, 0, -1, 0);
                    widths.push(gridWidth, gridWidth, gridWidth, gridWidth, gridWidth, gridWidth);
                    colors.push(...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2);
                }
                for (const tick of yTicks) {
                    const y = yScaleFlipped(tick);
                    positions.push(0, y, innerWidth, y, 0, y);
                    positions.push(innerWidth, y, 0, y, innerWidth, y);
                    normals.push(0, 1, 0, 1, 0, -1, 0, 1, 0, -1, 0, -1);
                    widths.push(gridWidth, gridWidth, gridWidth, gridWidth, gridWidth, gridWidth);
                    colors.push(...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2);
                }
                if (positions.length > 0) {
                    if (!buffers.position)
                        buffers.position = gl.createBuffer();
                    if (!buffers.color)
                        buffers.color = gl.createBuffer();
                    if (!buffers.normal)
                        buffers.normal = gl.createBuffer();
                    if (!buffers.width)
                        buffers.width = gl.createBuffer();
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
                    const positionLoc = gl.getAttribLocation(program, "a_position");
                    gl.enableVertexAttribArray(positionLoc);
                    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);
                    const colorLoc = gl.getAttribLocation(program, "a_color");
                    gl.enableVertexAttribArray(colorLoc);
                    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
                    const normalLoc = gl.getAttribLocation(program, "a_normal");
                    gl.enableVertexAttribArray(normalLoc);
                    gl.vertexAttribPointer(normalLoc, 2, gl.FLOAT, false, 0, 0);
                    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.width);
                    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(widths), gl.STATIC_DRAW);
                    const widthLoc = gl.getAttribLocation(program, "a_width");
                    gl.enableVertexAttribArray(widthLoc);
                    gl.vertexAttribPointer(widthLoc, 1, gl.FLOAT, false, 0, 0);
                    gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
                }
            }
            // Draw lines
            for (const s of series) {
                if (s.data.length < 2) {
                    continue;
                }
                const color = hexToRgb(s.color || "#3b82f6");
                const lineWidth = s.strokeWidth || 1.5;
                const geometry = createLineGeometry(s.data, xScale, yScaleFlipped, color, lineWidth);
                if (!buffers.position)
                    buffers.position = gl.createBuffer();
                if (!buffers.color)
                    buffers.color = gl.createBuffer();
                if (!buffers.normal)
                    buffers.normal = gl.createBuffer();
                if (!buffers.width)
                    buffers.width = gl.createBuffer();
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.positions), gl.DYNAMIC_DRAW);
                const positionLoc = gl.getAttribLocation(program, "a_position");
                gl.enableVertexAttribArray(positionLoc);
                gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.colors), gl.DYNAMIC_DRAW);
                const colorLoc = gl.getAttribLocation(program, "a_color");
                gl.enableVertexAttribArray(colorLoc);
                gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.normals), gl.DYNAMIC_DRAW);
                const normalLoc = gl.getAttribLocation(program, "a_normal");
                gl.enableVertexAttribArray(normalLoc);
                gl.vertexAttribPointer(normalLoc, 2, gl.FLOAT, false, 0, 0);
                gl.bindBuffer(gl.ARRAY_BUFFER, buffers.width);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry.widths), gl.DYNAMIC_DRAW);
                const widthLoc = gl.getAttribLocation(program, "a_width");
                gl.enableVertexAttribArray(widthLoc);
                gl.vertexAttribPointer(widthLoc, 1, gl.FLOAT, false, 0, 0);
                gl.drawArrays(gl.TRIANGLES, 0, geometry.positions.length / 2);
            }
        },
        onDestroy: (gl) => {
            if (buffers.position)
                gl.deleteBuffer(buffers.position);
            if (buffers.color)
                gl.deleteBuffer(buffers.color);
            if (buffers.normal)
                gl.deleteBuffer(buffers.normal);
            if (buffers.width)
                gl.deleteBuffer(buffers.width);
        },
    });
    return renderer;
}
// Factory function to create WebGPU line renderer
function createWebGPULineRenderer(canvas, device) {
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
        normal: null,
        width: null,
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
                        {
                            arrayStride: 4,
                            attributes: [{ shaderLocation: 3, offset: 0, format: "float32" }],
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
                const normals = [];
                const widths = [];
                const isDark = document.documentElement.classList.contains("dark");
                const gridColor = isDark ? [0.4, 0.4, 0.4] : [0.6, 0.6, 0.6];
                const gridWidth = 1;
                for (const tick of xTicks) {
                    const x = xScale(tick);
                    positions.push(x, 0, x, innerHeight, x, 0, x, innerHeight, x, 0, x, innerHeight);
                    normals.push(1, 0, 1, 0, -1, 0, 1, 0, -1, 0, -1, 0);
                    widths.push(gridWidth, gridWidth, gridWidth, gridWidth, gridWidth, gridWidth);
                    colors.push(...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2);
                }
                for (const tick of yTicks) {
                    const y = yScaleFlipped(tick);
                    positions.push(0, y, innerWidth, y, 0, y, innerWidth, y, 0, y, innerWidth, y);
                    normals.push(0, 1, 0, 1, 0, -1, 0, 1, 0, -1, 0, -1);
                    widths.push(gridWidth, gridWidth, gridWidth, gridWidth, gridWidth, gridWidth);
                    colors.push(...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2, ...gridColor, 0.2);
                }
                if (positions.length > 0) {
                    const positionData = new Float32Array(positions);
                    const colorData = new Float32Array(colors);
                    const normalData = new Float32Array(normals);
                    const widthData = new Float32Array(widths);
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
                    // Create or resize normal buffer with 1.5x growth factor
                    if (!gridBuffers.normal || gridBuffers.normal.size < normalData.byteLength * 1.5) {
                        gridBuffers.normal?.destroy();
                        gridBuffers.normal = device.createBuffer({
                            size: Math.ceil(normalData.byteLength * 1.5),
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                    }
                    // Create or resize width buffer with 1.5x growth factor
                    if (!gridBuffers.width || gridBuffers.width.size < widthData.byteLength * 1.5) {
                        gridBuffers.width?.destroy();
                        gridBuffers.width = device.createBuffer({
                            size: Math.ceil(widthData.byteLength * 1.5),
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                    }
                    // Write data to buffers
                    device.queue.writeBuffer(gridBuffers.position, 0, positionData);
                    device.queue.writeBuffer(gridBuffers.color, 0, colorData);
                    device.queue.writeBuffer(gridBuffers.normal, 0, normalData);
                    device.queue.writeBuffer(gridBuffers.width, 0, widthData);
                    passEncoder.setVertexBuffer(0, gridBuffers.position);
                    passEncoder.setVertexBuffer(1, gridBuffers.color);
                    passEncoder.setVertexBuffer(2, gridBuffers.normal);
                    passEncoder.setVertexBuffer(3, gridBuffers.width);
                    passEncoder.draw(positions.length / 2);
                }
            }
            // Draw lines with buffer pooling
            let seriesIndex = 0;
            for (const s of series) {
                if (s.data.length < 2) {
                    continue;
                }
                const color = hexToRgb(s.color || "#3b82f6");
                const lineWidth = s.strokeWidth || 1.5;
                const geometry = createLineGeometry(s.data, xScale, yScaleFlipped, color, lineWidth);
                const requiredSizes = {
                    position: geometry.positions.length * 4,
                    color: geometry.colors.length * 4,
                    normal: geometry.normals.length * 4,
                    width: geometry.widths.length * 4,
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
                        normal: device.createBuffer({
                            size: requiredSizes.normal,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        }),
                        width: device.createBuffer({
                            size: requiredSizes.width,
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
                    if (bufferSet.sizes.normal < requiredSizes.normal) {
                        bufferSet.normal.destroy();
                        bufferSet.normal = device.createBuffer({
                            size: requiredSizes.normal,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                        bufferSet.sizes.normal = requiredSizes.normal;
                    }
                    if (bufferSet.sizes.width < requiredSizes.width) {
                        bufferSet.width.destroy();
                        bufferSet.width = device.createBuffer({
                            size: requiredSizes.width,
                            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                        });
                        bufferSet.sizes.width = requiredSizes.width;
                    }
                }
                // Write data to buffers (reusing existing buffers)
                device.queue.writeBuffer(bufferSet.position, 0, new Float32Array(geometry.positions));
                device.queue.writeBuffer(bufferSet.color, 0, new Float32Array(geometry.colors));
                device.queue.writeBuffer(bufferSet.normal, 0, new Float32Array(geometry.normals));
                device.queue.writeBuffer(bufferSet.width, 0, new Float32Array(geometry.widths));
                passEncoder.setVertexBuffer(0, bufferSet.position);
                passEncoder.setVertexBuffer(1, bufferSet.color);
                passEncoder.setVertexBuffer(2, bufferSet.normal);
                passEncoder.setVertexBuffer(3, bufferSet.width);
                passEncoder.draw(geometry.positions.length / 2);
                seriesIndex++;
            }
            // Clean up excess buffers if series count decreased
            while (seriesBufferPool.length > seriesIndex) {
                const removed = seriesBufferPool.pop();
                if (removed) {
                    removed.position.destroy();
                    removed.color.destroy();
                    removed.normal.destroy();
                    removed.width.destroy();
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
            gridBuffers.normal?.destroy();
            gridBuffers.width?.destroy();
            // Clean up series buffer pool
            for (const bufferSet of seriesBufferPool) {
                bufferSet.position.destroy();
                bufferSet.color.destroy();
                bufferSet.normal.destroy();
                bufferSet.width.destroy();
            }
            seriesBufferPool.length = 0;
        },
    });
    return renderer;
}
// ============================================================================
// Line Chart Components
// ============================================================================
function Root({ series, xAxis = {}, yAxis = {}, width = 800, height = 400, preferWebGPU = true, className, children, }) {
    const allPoints = series.flatMap((s) => s.data);
    const xDomain = xAxis.domain === "auto" || !xAxis.domain ? getDomain(allPoints, (p) => p.x, 0) : xAxis.domain;
    const yDomain = yAxis.domain === "auto" || !yAxis.domain ? getDomain(allPoints, (p) => p.y, 0) : yAxis.domain;
    return (_jsx(ChartRoot, { width: width, height: height, xAxis: xAxis, yAxis: yAxis, xDomain: xDomain, yDomain: yDomain, preferWebGPU: preferWebGPU, className: className, children: _jsx(LineChartContext.Provider, { value: { series }, children: children }) }));
}
function Canvas({ showGrid = false }) {
    const ctx = useLineChart();
    const rendererRef = useRef(null);
    const [_rendererReady, setRendererReady] = useState(false);
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
        setRendererReady(false);
        async function initRenderer() {
            if (!canvas)
                return;
            try {
                if (ctx.preferWebGPU && "gpu" in navigator) {
                    const adapter = await navigator.gpu?.requestAdapter();
                    if (adapter) {
                        const device = await adapter.requestDevice();
                        const renderer = createWebGPULineRenderer(canvas, device);
                        if (!mounted) {
                            renderer.destroy();
                            return;
                        }
                        rendererRef.current = renderer;
                        ctx.setRenderMode("webgpu");
                        setRendererReady(true);
                        return;
                    }
                }
            }
            catch (error) {
                console.warn("WebGPU failed, falling back to WebGL:", error);
            }
            try {
                const renderer = createWebGLLineRenderer(canvas);
                if (!mounted) {
                    renderer.destroy();
                    return;
                }
                rendererRef.current = renderer;
                ctx.setRenderMode("webgl");
                setRendererReady(true);
            }
            catch (error) {
                console.error("WebGL failed:", error);
            }
        }
        initRenderer();
        return () => {
            mounted = false;
            setRendererReady(false);
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
    // Render when data changes (skip if not visible)
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
            await currentRenderer.render(renderProps);
            rendering = false;
        }
        // Use RAF to sync with browser repaint
        rafId = requestAnimationFrame(() => render());
        return () => {
            if (rafId !== null) {
                cancelAnimationFrame(rafId);
            }
        };
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
        ctx.renderMode,
        ctx.canvasRef,
        ctx.isVisible,
        showGrid,
    ]);
    return (_jsx("canvas", { ref: ctx.canvasRef, className: "absolute inset-0", style: {
            width: `${ctx.width}px`,
            height: `${ctx.height}px`,
        } }));
}
// Separate Grid component for composable API
function Grid() {
    // Grid is now rendered via Canvas with showGrid prop
    // This component exists for API consistency but doesn't render anything
    // The actual grid rendering happens in Canvas when showGrid={true}
    return null;
}
// Helper to find closest X coordinate for multi-series tooltips
function findClosestXCoordinate(series, mouseX, xScale, xDomain) {
    let closestXDist = Infinity;
    let closestXValue = 0;
    let closestScreenX = 0;
    // Calculate adaptive threshold based on domain and screen space
    const domainRange = xDomain[1] - xDomain[0];
    const pixelToDataRatio = domainRange / 800; // Approximate screen width
    const threshold = Math.max(50, pixelToDataRatio * 100); // Min 50px or adaptive
    series.forEach((s) => {
        s.data.forEach((point) => {
            const px = xScale(point.x);
            const xDist = Math.abs(px - mouseX);
            if (xDist < threshold && xDist < closestXDist) {
                closestXDist = xDist;
                closestXValue = point.x;
                closestScreenX = px;
            }
        });
    });
    return closestXDist !== Infinity ? { xValue: closestXValue, screenX: closestScreenX } : null;
}
// Helper to find all series points at a given X value
function findSeriesPointsAtX(series, xValue, yScale, xScale, xDomain) {
    const seriesPoints = [];
    // Calculate adaptive threshold based on data range
    const domainRange = xDomain[1] - xDomain[0];
    const threshold = domainRange * 0.001; // 0.1% of domain range
    series.forEach((s, seriesIdx) => {
        // Find closest point to the xValue in this series
        let closestPoint = null;
        let closestDist = Infinity;
        s.data.forEach((p) => {
            const dist = Math.abs(p.x - xValue);
            if (dist < threshold && dist < closestDist) {
                closestDist = dist;
                closestPoint = p;
            }
        });
        if (closestPoint !== null) {
            const point = closestPoint;
            const py = yScale(point.y);
            const px = xScale(point.x);
            seriesPoints.push({
                seriesIdx,
                point: point,
                screenY: py,
                screenX: px,
            });
        }
    });
    return seriesPoints;
}
// Helper to handle multi-series tooltip
function handleMultiSeriesHover(ctx, mouseX) {
    const closestX = findClosestXCoordinate(ctx.series, mouseX, ctx.xScale, ctx.xDomain);
    if (!closestX)
        return false;
    const seriesPoints = findSeriesPointsAtX(ctx.series, closestX.xValue, ctx.yScale, ctx.xScale, ctx.xDomain);
    if (seriesPoints.length === 0)
        return false;
    const primaryPoint = seriesPoints[0];
    const currentX = ctx.hoveredPoint?.data?.xValue;
    // Calculate adaptive threshold based on domain
    const domainRange = ctx.xDomain[1] - ctx.xDomain[0];
    const threshold = domainRange * 0.001;
    // Only update if X value has changed significantly
    if (currentX === undefined || Math.abs(currentX - closestX.xValue) > threshold) {
        ctx.setHoveredPoint({
            seriesIdx: primaryPoint.seriesIdx,
            pointIdx: 0, // Not used anymore, but keeping for backwards compatibility
            screenX: closestX.screenX,
            screenY: primaryPoint.screenY,
            data: {
                xValue: closestX.xValue,
                seriesPoints: seriesPoints,
            },
        });
        const xFormatter = ctx.xAxis?.formatter;
        const yFormatter = ctx.yAxis?.formatter;
        ctx.setTooltipData({
            title: xFormatter ? xFormatter(closestX.xValue) : closestX.xValue.toFixed(2),
            items: seriesPoints.map((sp) => {
                const series = ctx.series[sp.seriesIdx];
                return {
                    label: series.name,
                    value: yFormatter ? yFormatter(sp.point.y) : sp.point.y.toFixed(2),
                    color: series.color || "#3b82f6",
                };
            }),
        });
    }
    return true;
}
// Helper to handle single series tooltip
function handleSingleSeriesHover(ctx, mouseX, mouseY) {
    let closestDist = Infinity;
    let closestSeriesIdx = -1;
    let closestPoint;
    let closestScreenX = 0;
    let closestScreenY = 0;
    ctx.series.forEach((s, seriesIdx) => {
        s.data.forEach((point) => {
            const px = ctx.xScale(point.x);
            const py = ctx.yScale(point.y);
            const dist = Math.sqrt((px - mouseX) ** 2 + (py - mouseY) ** 2);
            if (dist < 50 && dist < closestDist) {
                closestDist = dist;
                closestSeriesIdx = seriesIdx;
                closestPoint = { ...point };
                closestScreenX = px;
                closestScreenY = py;
            }
        });
    });
    if (closestSeriesIdx === -1 || closestPoint === undefined)
        return false;
    const point = closestPoint;
    const currentX = ctx.hoveredPoint?.data?.xValue;
    const currentSeriesIdx = ctx.hoveredPoint?.seriesIdx;
    // Calculate adaptive threshold
    const domainRange = ctx.xDomain[1] - ctx.xDomain[0];
    const threshold = domainRange * 0.001;
    // Only update if hovered point has changed
    if (currentX === undefined ||
        currentSeriesIdx !== closestSeriesIdx ||
        Math.abs(currentX - point.x) > threshold) {
        const series = ctx.series[closestSeriesIdx];
        ctx.setHoveredPoint({
            seriesIdx: closestSeriesIdx,
            pointIdx: 0, // Not used, keeping for backwards compatibility
            screenX: closestScreenX,
            screenY: closestScreenY,
            data: {
                xValue: point.x,
                seriesPoints: [
                    {
                        seriesIdx: closestSeriesIdx,
                        point: point,
                        screenX: closestScreenX,
                        screenY: closestScreenY,
                    },
                ],
            },
        });
        const xFormatter = ctx.xAxis?.formatter;
        const yFormatter = ctx.yAxis?.formatter;
        ctx.setTooltipData({
            title: series.name,
            items: [
                {
                    label: "X",
                    value: xFormatter ? xFormatter(point.x) : point.x.toFixed(2),
                },
                {
                    label: "Y",
                    value: yFormatter ? yFormatter(point.y) : point.y.toFixed(2),
                    color: series.color,
                },
            ],
        });
    }
    return true;
}
function Tooltip() {
    const ctx = useLineChart();
    const handleHover = (e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // Check if mouse is within chart bounds
        if (x < ctx.margin.left ||
            x > ctx.width - ctx.margin.right ||
            y < ctx.margin.top ||
            y > ctx.height - ctx.margin.bottom) {
            ctx.setHoveredPoint(null);
            ctx.setTooltipData(null);
            return;
        }
        // Multi-series: find closest X and show all series values
        const found = ctx.series.length > 1 ? handleMultiSeriesHover(ctx, x) : handleSingleSeriesHover(ctx, x, y);
        // Clear hover state if no point found
        if (!found && ctx.hoveredPoint !== null) {
            ctx.setHoveredPoint(null);
            ctx.setTooltipData(null);
        }
    };
    // Recalculate dot positions based on current data for streaming scenarios
    const dots = useMemo(() => {
        const hoveredData = ctx.hoveredPoint?.data;
        if (!hoveredData?.seriesPoints)
            return null;
        const seriesPoints = hoveredData.seriesPoints;
        // Recalculate positions based on current data and scales
        return seriesPoints
            .map((sp) => {
            const series = ctx.series[sp.seriesIdx];
            // Find current position of this point (in case data shifted)
            const currentPoint = series.data.find((p) => Math.abs(p.x - sp.point.x) < 0.0001);
            if (currentPoint) {
                return {
                    screenX: ctx.xScale(currentPoint.x),
                    screenY: ctx.yScale(currentPoint.y),
                    color: series.color || "#3b82f6",
                };
            }
            return null;
        })
            .filter((d) => d !== null);
    }, [ctx.hoveredPoint, ctx.series, ctx.xScale, ctx.yScale]);
    return (_jsxs(_Fragment, { children: [_jsx(ChartTooltip, { onHover: handleHover }), ctx.hoveredPoint && ctx.tooltipData && dots && (_jsx(_Fragment, { children: dots.map((dot, idx) => (_jsx("div", { className: "absolute pointer-events-none z-20", style: {
                        left: dot.screenX - 6,
                        top: dot.screenY - 6,
                    }, children: _jsx("div", { className: "w-3 h-3 rounded-full border-2 border-white dark:border-zinc-900", style: { backgroundColor: dot.color } }) }, idx))) }))] }));
}
// ============================================================================
// Composed Component (Simple API)
// ============================================================================
export function LineChart({ series, xAxis = {}, yAxis = {}, width = 800, height = 400, showGrid = true, showAxes = true, showTooltip = false, preferWebGPU = true, className, }) {
    return (_jsxs(Root, { series: series, xAxis: xAxis, yAxis: yAxis, width: width, height: height, preferWebGPU: preferWebGPU, className: className, children: [_jsx(Canvas, { showGrid: showGrid }), showAxes && _jsx(ChartAxes, {}), showTooltip && _jsx(Tooltip, {})] }));
}
// ============================================================================
// Primitive API (Composable)
// ============================================================================
/**
 * LineChart Primitives - Composable chart components for custom layouts
 *
 * @example Simple usage (monolithic)
 * ```tsx
 * <LineChart series={data} showGrid showAxes showTooltip />
 * ```
 *
 * @example Advanced usage (composable)
 * ```tsx
 * <LineChart.Root series={data} width={800} height={400}>
 *   <LineChart.Canvas showGrid />
 *   <LineChart.Axes />
 *   <LineChart.Tooltip />
 * </LineChart.Root>
 * ```
 */
LineChart.Root = Root;
LineChart.Canvas = Canvas;
LineChart.Grid = Grid;
LineChart.Axes = ChartAxes;
LineChart.Tooltip = Tooltip;
export default LineChart;
//# sourceMappingURL=line-chart.js.map