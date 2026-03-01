export interface Annotation {
    id: string;
    dataX: number;
    dataY: number;
    text: string;
}
export interface ChartAnnotationsProps {
    annotations: Annotation[];
    onChange: (annotations: Annotation[]) => void;
    enabled?: boolean;
    color?: string;
}
export declare function ChartAnnotations({ annotations, onChange, enabled, color, }: ChartAnnotationsProps): import("react/jsx-runtime").JSX.Element;
export interface ChartReferenceLineProps {
    value: number;
    axis: "x" | "y";
    label?: string;
    color?: string;
    lineStyle?: "solid" | "dashed" | "dotted";
    thickness?: number;
    labelPosition?: "start" | "end" | "center";
    showLabel?: boolean;
}
export declare function ChartReferenceLine({ value, axis, label, color, lineStyle, thickness, labelPosition, showLabel, }: ChartReferenceLineProps): import("react/jsx-runtime").JSX.Element;
export interface ChartRegionProps {
    /**
     * Start X coordinate in data space
     */
    startX: number;
    /**
     * End X coordinate in data space
     */
    endX: number;
    /**
     * Label for the region
     */
    label?: string;
    /**
     * Region color
     */
    color?: string;
    /**
     * Region opacity
     */
    opacity?: number;
    /**
     * Show label
     */
    showLabel?: boolean;
}
export declare function ChartRegion({ startX, endX, label, color, opacity, showLabel, }: ChartRegionProps): import("react/jsx-runtime").JSX.Element;
export interface Measurement {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    deltaX: number;
    deltaY: number;
    distance: number;
}
export interface ChartRulerProps {
    /**
     * Callback when measurement is complete
     */
    onMeasure?: (measurement: Measurement) => void;
    /**
     * Array of completed measurements to render on the chart
     */
    measurements?: Measurement[];
    /**
     * Ruler color
     */
    color?: string;
    /**
     * Enable ruler mode
     */
    enabled?: boolean;
    /**
     * Show measurement values on completed measurements
     */
    showValues?: boolean;
}
export declare function ChartRuler({ onMeasure, measurements, color, enabled, showValues, }: ChartRulerProps): import("react/jsx-runtime").JSX.Element | null;
//# sourceMappingURL=annotations.d.ts.map