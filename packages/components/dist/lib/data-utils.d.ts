/**
 * Data transformation utilities for WebGPU charts
 *
 * Provides efficient data transformation, buffering, and streaming utilities
 * for high-performance visualization in aerospace/medical/defense applications.
 */
export interface DataPoint {
    x: number;
    y: number;
}
export type Point = DataPoint;
export interface DataPoint3D {
    x: number;
    y: number;
    z: number;
}
/**
 * Normalize data to [0, 1] range
 */
export declare function normalizeData(data: DataPoint[], xMin: number, xMax: number, yMin: number, yMax: number): DataPoint[];
/**
 * Convert data points to Float32Array for WebGPU
 */
export declare function dataToVertexArray(data: DataPoint[]): Float32Array;
/**
 * Convert 3D data points to Float32Array
 */
export declare function data3DToVertexArray(data: DataPoint3D[]): Float32Array;
/**
 * Downsample data using LTTB (Largest Triangle Three Buckets) algorithm
 * Optimized for time series data visualization
 */
export declare function downsampleLTTB(data: DataPoint[], targetPoints: number): DataPoint[];
/**
 * Simple min/max downsampling - faster but less accurate than LTTB
 */
export declare function downsampleMinMax(data: DataPoint[], targetPoints: number): DataPoint[];
/**
 * Create or resize a vertex buffer efficiently
 */
export declare function createOrResizeVertexBuffer(device: GPUDevice, data: Float32Array, oldBuffer?: GPUBuffer): GPUBuffer;
/**
 * Calculate data bounds
 */
export declare function calculateBounds(data: DataPoint[]): {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
};
/**
 * Calculate auto bounds with nice numbers for axis ticks
 */
export declare function calculateNiceBounds(data: DataPoint[], tickCount?: number): {
    xMin: number;
    xMax: number;
    yMin: number;
    yMax: number;
};
export interface HistogramBin {
    min: number;
    max: number;
    count: number;
    density: number;
    center: number;
}
/**
 * Bin calculation methods
 */
export type BinMethod = "sturges" | "scott" | "freedman-diaconis" | "sqrt" | number;
/**
 * Calculate optimal number of bins using various methods
 */
export declare function calculateBinCount(data: number[], method?: BinMethod): number;
/**
 * Create histogram bins from data
 */
export declare function createHistogramBins(data: number[], binCount?: number, method?: BinMethod): HistogramBin[];
/**
 * Calculate normal distribution curve for overlay
 */
export declare function calculateNormalCurve(data: number[], points?: number): DataPoint[];
/**
 * Generate sine wave data
 */
export declare function generateSineWave(points: number, amplitude?: number, frequency?: number, phase?: number): DataPoint[];
/**
 * Generate random telemetry-like data
 */
export declare function generateTelemetryData(points: number, baseline?: number, variance?: number, drift?: number): DataPoint[];
/**
 * Generate categorical data (for bar charts)
 */
export declare function generateCategoricalData(categories: string[], minValue?: number, maxValue?: number): Array<{
    category: string;
    value: number;
}>;
/**
 * Get domain (min, max) from data points
 */
export declare function getDomain(points: Point[], accessor: (p: Point) => number, addPadding?: boolean): [number, number];
/**
 * Create a linear scale function
 */
export declare function createScale(domain: [number, number], range: [number, number]): (value: number) => number;
/**
 * Format a numeric value for display
 */
export declare function formatValue(value: number): string;
/**
 * Format a timestamp value for display
 */
export declare function formatTime(value: number, timezone?: string): string;
/**
 * Generate nice tick values for an axis
 */
export declare function getTicks(domain: [number, number], count: number): number[];
/**
 * Complex number representation
 */
export interface Complex {
    re: number;
    im: number;
}
/**
 * Apply window function to reduce spectral leakage
 */
export type WindowFunction = "hann" | "hamming" | "blackman" | "none";
export interface WindowResult {
    windowed: number[];
    windowCorrection: number;
}
export declare function applyWindow(data: number[], windowType?: WindowFunction): number[];
/**
 * Apply window function with correction factor for accurate power spectrum
 */
export declare function applyWindowWithCorrection(data: number[], windowType?: WindowFunction): WindowResult;
/**
 * Convert power to decibels
 */
export declare function powerToDb(power: number, referenceLevel?: number): number;
/**
 * Spectrogram data point (time, frequency, magnitude)
 */
export interface SpectrogramPoint {
    time: number;
    frequency: number;
    magnitude: number;
}
/**
 * Find next power of 2 greater than or equal to n
 */
export declare function nextPowerOf2(n: number): number;
/**
 * Zero-pad array to next power of 2
 */
export declare function zeroPad(data: number[]): number[];
/**
 * GPU-accelerated FFT compute - Functional Pattern
 *
 * Manages WebGPU resources for FFT computation using closures
 */
export interface GPUFFTCompute {
    compute: (input: number[]) => Promise<Complex[]>;
    destroy: () => void;
}
export declare const createGPUFFTCompute: (device: GPUDevice, fftSize: number) => GPUFFTCompute;
//# sourceMappingURL=data-utils.d.ts.map