export interface ClickEvent {
    dataX: number;
    dataY: number;
    screenX: number;
    screenY: number;
}
export interface BrushSelection {
    xStart: number;
    xEnd: number;
    yStart: number;
    yEnd: number;
}
export interface CrosshairPosition {
    dataX: number;
    dataY: number;
    screenX: number;
    screenY: number;
}
export interface ChartClickProps {
    /**
     * Callback when user clicks on the chart
     */
    onClick?: (event: ClickEvent) => void;
    /**
     * Callback when user double-clicks on the chart
     */
    onDoubleClick?: (event: ClickEvent) => void;
    /**
     * Visual feedback for clicks (optional)
     */
    showClickMarker?: boolean;
    /**
     * Click marker color
     */
    markerColor?: string;
    /**
     * Click marker duration in ms
     */
    markerDuration?: number;
}
export declare function ChartClick({ onClick, onDoubleClick, showClickMarker, markerColor, markerDuration, }: ChartClickProps): import("react/jsx-runtime").JSX.Element;
export interface ChartBrushProps {
    /**
     * Callback when brush selection is completed
     */
    onBrushEnd?: (selection: BrushSelection) => void;
    /**
     * Callback during brush (while dragging)
     */
    onBrushing?: (selection: BrushSelection) => void;
    /**
     * Brush fill color
     */
    brushColor?: string;
    /**
     * Brush opacity
     */
    brushOpacity?: number;
    /**
     * Brush border color
     */
    brushBorderColor?: string;
    /**
     * Enable horizontal brush (X-axis selection)
     */
    enableX?: boolean;
    /**
     * Enable vertical brush (Y-axis selection)
     */
    enableY?: boolean;
}
export declare function ChartBrush({ onBrushEnd, onBrushing, brushColor, brushOpacity, brushBorderColor, enableX, enableY, }: ChartBrushProps): import("react/jsx-runtime").JSX.Element;
export interface ChartCrosshairProps {
    /**
     * Show horizontal line
     */
    showHorizontal?: boolean;
    /**
     * Show vertical line
     */
    showVertical?: boolean;
    /**
     * Crosshair line color
     */
    lineColor?: string;
    /**
     * Crosshair line width
     */
    lineWidth?: number;
    /**
     * Crosshair line style
     */
    lineStyle?: "solid" | "dashed" | "dotted";
    /**
     * Show value labels on axes
     */
    showLabels?: boolean;
    /**
     * Label background color
     */
    labelBgColor?: string;
    /**
     * Label text color
     */
    labelTextColor?: string;
    /**
     * Callback when crosshair moves
     */
    onMove?: (position: CrosshairPosition) => void;
}
export declare function ChartCrosshair({ showHorizontal, showVertical, lineColor, lineWidth, lineStyle, showLabels, labelBgColor, labelTextColor, onMove, }: ChartCrosshairProps): import("react/jsx-runtime").JSX.Element;
export interface ChartBrushSelectorProps {
    /**
     * Start of selection range (in data coordinates)
     */
    start: number;
    /**
     * End of selection range (in data coordinates)
     */
    end: number;
    /**
     * Minimum value of full data range
     */
    fullMin: number;
    /**
     * Maximum value of full data range
     */
    fullMax: number;
    /**
     * Callback when selection changes
     */
    onSelectionChange: (newStart: number, newEnd: number) => void;
    /**
     * Format function for displaying dates
     */
    formatLabel?: (value: number) => string;
    /**
     * Selection color
     */
    color?: string;
    /**
     * Container class name (used for calculating positions)
     */
    containerClass?: string;
}
/**
 * Draggable brush selector for timeline navigation
 * Similar to video editing crop tools
 *
 * @example
 * ```tsx
 * <BarChart.Root series={minimapSeries}>
 *   <BarChart.Canvas />
 *   <ChartBrushSelector
 *     start={visibleRange.start}
 *     end={visibleRange.end}
 *     fullMin={fullTimeRange.min}
 *     fullMax={fullTimeRange.max}
 *     onSelectionChange={(start, end) =>
 *       setBrushSelection({ xStart: start, xEnd: end })
 *     }
 *   />
 * </BarChart.Root>
 * ```
 */
export declare function ChartBrushSelector({ start, end, fullMin, fullMax, onSelectionChange, formatLabel, color, containerClass, }: ChartBrushSelectorProps): import("react/jsx-runtime").JSX.Element;
export interface ChartInteractionsProps extends ChartClickProps, Partial<ChartBrushProps>, Partial<ChartCrosshairProps> {
    /**
     * Enable click interactions
     */
    enableClick?: boolean;
    /**
     * Enable brush selection
     */
    enableBrush?: boolean;
    /**
     * Enable crosshair
     */
    enableCrosshair?: boolean;
}
/**
 * Combined interaction component for convenience
 * Provides click, brush, and crosshair interactions in one component
 *
 * @example
 * ```tsx
 * <LineChart.Root series={data}>
 *   <LineChart.Canvas />
 *   <LineChart.Axes />
 *   <ChartInteractions
 *     enableClick
 *     onClick={(e) => console.log('Clicked at', e.dataX, e.dataY)}
 *     enableBrush
 *     onBrushEnd={(sel) => console.log('Selected', sel)}
 *     enableCrosshair
 *     showLabels
 *   />
 * </LineChart.Root>
 * ```
 */
export declare function ChartInteractions({ enableClick, enableBrush, enableCrosshair, onClick, onDoubleClick, showClickMarker, markerColor, markerDuration, onBrushEnd, onBrushing, brushColor, brushOpacity, brushBorderColor, enableX, enableY, showHorizontal, showVertical, lineColor, lineWidth, lineStyle, showLabels, labelBgColor, labelTextColor, onMove, }: ChartInteractionsProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=interactions.d.ts.map