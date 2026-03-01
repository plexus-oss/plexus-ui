/**
 * Color Scale Utilities
 *
 * Shared color mapping functions for data visualization components.
 * These scales map normalized values (0-1) to colors, providing consistent
 * color schemes across different chart types.
 *
 * @module color-scales
 */
/**
 * Color stop for gradient-based scales
 */
export interface ColorStop {
    /** Position in the gradient (0-1) */
    position: number;
    /** RGB color values [r, g, b] where each value is 0-255 */
    color: [number, number, number];
}
/**
 * Creates a color scale function from an array of color stops
 *
 * @param stops Array of color stops defining the gradient
 * @returns Function that maps values (0-1) to RGB color strings
 *
 * @example
 * ```ts
 * const scale = createColorScale([
 *   { position: 0, color: [0, 0, 255] },   // Blue at 0
 *   { position: 0.5, color: [0, 255, 0] }, // Green at 0.5
 *   { position: 1, color: [255, 0, 0] }    // Red at 1
 * ]);
 *
 * scale(0)    // "rgb(0, 0, 255)"
 * scale(0.25) // "rgb(0, 127, 127)"
 * scale(0.5)  // "rgb(0, 255, 0)"
 * scale(1)    // "rgb(255, 0, 0)"
 * ```
 */
export declare function createColorScale(stops: ColorStop[]): (value: number) => string;
/**
 * Creates a sequential color scale from an array of colors
 * Colors are evenly distributed across the 0-1 range
 *
 * @param colors Array of RGB colors
 * @returns Function that maps values (0-1) to RGB color strings
 *
 * @example
 * ```ts
 * const scale = createSequentialScale([
 *   [68, 1, 84],     // Purple
 *   [59, 82, 139],   // Blue
 *   [33, 145, 140],  // Cyan
 *   [94, 201, 98],   // Green
 *   [253, 231, 37]   // Yellow
 * ]);
 * ```
 */
export declare function createSequentialScale(colors: Array<[number, number, number]>): (value: number) => string;
/**
 * Viridis color scale (perceptually uniform, colorblind-friendly)
 * Maps from purple → blue → cyan → green → yellow
 *
 * Excellent for:
 * - Scientific visualization
 * - Heatmaps
 * - Any data where perceptual uniformity matters
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={viridis} />
 * ```
 */
export declare const viridis: (value: number) => string;
/**
 * Plasma color scale (perceptually uniform)
 * Maps from purple → pink → orange → yellow
 *
 * Excellent for:
 * - Thermal data
 * - Intensity maps
 * - Eye-catching visualizations
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={plasma} />
 * ```
 */
export declare const plasma: (value: number) => string;
/**
 * Inferno color scale (perceptually uniform, high contrast)
 * Maps from black → purple → red → orange → yellow
 *
 * Excellent for:
 * - Heat visualization
 * - Fire/energy data
 * - High-contrast needs
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={inferno} />
 * ```
 */
export declare const inferno: (value: number) => string;
/**
 * Cool color scale
 * Maps from cyan → blue → purple
 *
 * Excellent for:
 * - Water/ocean data
 * - Low-temperature visualization
 * - Calming aesthetics
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={cool} />
 * ```
 */
export declare const cool: (value: number) => string;
/**
 * Warm color scale
 * Maps from yellow → orange → red
 *
 * Excellent for:
 * - Temperature data
 * - Energy visualization
 * - Alert levels
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={warm} />
 * ```
 */
export declare const warm: (value: number) => string;
/**
 * Diverging color scale (blue → white → red)
 *
 * Excellent for:
 * - Data with a meaningful center point (e.g., 0)
 * - Showing deviation from a baseline
 * - Comparing above/below average
 *
 * @example
 * ```tsx
 * // For data centered around 0
 * const scale = (value: number) => diverging((value + 1) / 2);
 * <HeatmapChart data={data} colorScale={scale} />
 * ```
 */
export declare const diverging: (value: number) => string;
/**
 * Grayscale color scale
 * Maps from black → white
 *
 * Excellent for:
 * - Printing
 * - Intensity/density data
 * - Minimalist aesthetics
 * - Accessibility (when color isn't needed)
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={grayscale} />
 * ```
 */
export declare const grayscale: (value: number) => string;
/**
 * Turbo color scale (rainbow-like but more perceptually uniform than traditional rainbow)
 * Maps across the full visible spectrum with better luminance distribution
 *
 * Excellent for:
 * - Eye-catching visualizations
 * - Wide data ranges
 * - When you need maximum visual distinction
 *
 * Note: Use with caution - rainbow scales can be misleading and
 * are not colorblind-friendly. Prefer viridis/plasma when possible.
 *
 * @example
 * ```tsx
 * <HeatmapChart data={data} colorScale={turbo} />
 * ```
 */
export declare const turbo: (value: number) => string;
/**
 * Default color scale (alias for viridis)
 * This is used as the default in components when no scale is specified
 */
export declare const defaultColorScale: (value: number) => string;
/**
 * All available color scales as a named map
 * Useful for dynamic scale selection in UI controls
 *
 * @example
 * ```tsx
 * const [scaleName, setScaleName] = useState<keyof typeof colorScales>('viridis');
 *
 * <select onChange={(e) => setScaleName(e.target.value)}>
 *   {Object.keys(colorScales).map(name => (
 *     <option key={name} value={name}>{name}</option>
 *   ))}
 * </select>
 *
 * <HeatmapChart data={data} colorScale={colorScales[scaleName]} />
 * ```
 */
export declare const colorScales: {
    readonly viridis: (value: number) => string;
    readonly plasma: (value: number) => string;
    readonly inferno: (value: number) => string;
    readonly cool: (value: number) => string;
    readonly warm: (value: number) => string;
    readonly diverging: (value: number) => string;
    readonly grayscale: (value: number) => string;
    readonly turbo: (value: number) => string;
};
export type ColorScaleName = keyof typeof colorScales;
//# sourceMappingURL=color-scales.d.ts.map