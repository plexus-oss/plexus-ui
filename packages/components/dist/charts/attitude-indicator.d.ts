export interface AttitudeIndicatorProps {
    /**
     * Pitch angle in degrees (-90 to +90)
     * Positive values indicate nose up, negative values indicate nose down
     * @default 0
     */
    pitch?: number;
    /**
     * Roll angle in degrees (-180 to +180)
     * Positive values indicate right wing down, negative values indicate left wing down
     * @default 0
     */
    roll?: number;
    /**
     * Width of the indicator
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vw")
     * @default 400
     */
    width?: number | string;
    /**
     * Height of the indicator
     * Supports fixed pixel values or responsive units (e.g., "100%", "50vh")
     * @default 400
     */
    height?: number | string;
    /**
     * Display pitch ladder with degree markings
     * @default true
     */
    showPitchLadder?: boolean;
    /**
     * Display bank angle indicator arc
     * @default true
     */
    showBankIndicator?: boolean;
    /**
     * Degrees between each pitch ladder mark
     * @default 10
     */
    pitchStep?: number;
    /**
     * Sky hemisphere color
     * Supports any valid CSS color value
     * @default "transparent"
     */
    skyColor?: string;
    /**
     * Ground hemisphere color
     * Supports any valid CSS color value
     * @default "#19191c"
     */
    groundColor?: string;
    /**
     * Horizon line color
     * Supports any valid CSS color value
     * @default "#9ca3af"
     */
    horizonColor?: string;
    /**
     * Additional CSS classes to apply to the container
     */
    className?: string;
    /**
     * Prefer WebGPU over WebGL for rendering
     * Falls back to WebGL if WebGPU is not available
     * @default false
     */
    preferWebGPU?: boolean;
}
interface RootProps extends AttitudeIndicatorProps {
    children: React.ReactNode;
}
export declare function AttitudeIndicator(props: AttitudeIndicatorProps): import("react/jsx-runtime").JSX.Element;
export declare namespace AttitudeIndicator {
    var Root: ({ children, pitch, roll, width, height, showPitchLadder, showBankIndicator, pitchStep, skyColor, groundColor, horizonColor, preferWebGPU, className, }: RootProps) => import("react/jsx-runtime").JSX.Element;
    var Canvas: () => import("react/jsx-runtime").JSX.Element;
    var ValueDisplay: () => import("react/jsx-runtime").JSX.Element;
}
export default AttitudeIndicator;
//# sourceMappingURL=attitude-indicator.d.ts.map