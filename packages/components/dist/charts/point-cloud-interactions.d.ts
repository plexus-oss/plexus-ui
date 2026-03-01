import { type ReactNode } from "react";
import * as THREE from "three";
export interface Point3D {
    x: number;
    y: number;
    z: number;
    index?: number;
}
export interface BoundingBox3D {
    center: Point3D;
    size: Point3D;
    rotation: {
        x: number;
        y: number;
        z: number;
    };
    label?: string;
}
export interface Measurement {
    points: Point3D[];
    distance: number;
    unit?: string;
}
export interface PlaneData {
    normal: THREE.Vector3;
    point: THREE.Vector3;
    equation: {
        a: number;
        b: number;
        c: number;
        d: number;
    };
    selectedPoints: Point3D[];
}
export interface SegmentationRegion {
    points: number[];
    label: string;
    color: string;
}
export interface PointSelectionProps {
    /**
     * Callback when point is selected
     */
    onSelect?: (point: Point3D) => void;
    /**
     * Callback when multiple points are selected
     */
    onMultiSelect?: (points: Point3D[]) => void;
    /**
     * Enable multi-select mode (hold Shift)
     */
    enableMultiSelect?: boolean;
    /**
     * Selection sphere radius
     */
    selectionRadius?: number;
    /**
     * Highlight color for selected points
     */
    highlightColor?: string;
    /**
     * Selection marker size
     */
    markerSize?: number;
}
export declare function PointSelection({ onSelect, onMultiSelect, enableMultiSelect, selectionRadius, highlightColor, markerSize, }: PointSelectionProps): import("react/jsx-runtime").JSX.Element;
export interface BoundingBox3DProps {
    /**
     * Callback when box is created/updated
     */
    onBoxComplete?: (box: BoundingBox3D) => void;
    /**
     * Callback during box creation
     */
    onBoxUpdate?: (box: BoundingBox3D) => void;
    /**
     * Box line color
     */
    boxColor?: string;
    /**
     * Box fill opacity
     */
    boxOpacity?: number;
    /**
     * Enable box editing after creation
     */
    enableEdit?: boolean;
    /**
     * Default box size
     */
    defaultSize?: Point3D;
}
export declare function BoundingBox3D({ onBoxComplete, onBoxUpdate, boxColor, boxOpacity, enableEdit, defaultSize, }: BoundingBox3DProps): import("react/jsx-runtime").JSX.Element | null;
export interface MeasurementToolProps {
    /**
     * Callback when measurement is complete
     */
    onMeasure?: (measurement: Measurement) => void;
    /**
     * Line color
     */
    lineColor?: string;
    /**
     * Point marker color
     */
    markerColor?: string;
    /**
     * Show distance label
     */
    showLabel?: boolean;
    /**
     * Distance unit
     */
    unit?: string;
    /**
     * Decimal places for distance
     */
    decimals?: number;
}
export declare function MeasurementTool({ onMeasure, lineColor, markerColor, showLabel, unit, decimals, }: MeasurementToolProps): import("react/jsx-runtime").JSX.Element;
export interface SegmentationBrushProps {
    /**
     * Callback when region is labeled
     */
    onRegionComplete?: (region: SegmentationRegion) => void;
    /**
     * Brush radius
     */
    brushRadius?: number;
    /**
     * Current label
     */
    label?: string;
    /**
     * Brush color
     */
    brushColor?: string;
    /**
     * Show brush cursor
     */
    showCursor?: boolean;
}
export declare function SegmentationBrush({ onRegionComplete, brushRadius, label, brushColor, showCursor, }: SegmentationBrushProps): import("react/jsx-runtime").JSX.Element;
export interface PlaneFitProps {
    /**
     * Callback when plane is fitted
     */
    onPlaneFit?: (plane: PlaneData) => void;
    /**
     * Minimum points required to fit plane
     */
    minPoints?: number;
    /**
     * Plane color
     */
    planeColor?: string;
    /**
     * Plane opacity
     */
    planeOpacity?: number;
    /**
     * Plane size
     */
    planeSize?: number;
}
export declare function PlaneFit({ onPlaneFit, minPoints, planeColor, planeOpacity, planeSize, }: PlaneFitProps): import("react/jsx-runtime").JSX.Element;
interface PointCloudInteractionsContextType {
    activeInteraction: "select" | "box" | "measure" | "segment" | "plane" | null;
    setActiveInteraction: (interaction: "select" | "box" | "measure" | "segment" | "plane" | null) => void;
}
export declare function usePointCloudInteractions(): PointCloudInteractionsContextType;
export interface PointCloudInteractionsProps {
    /**
     * Active interaction mode
     */
    mode?: "select" | "box" | "measure" | "segment" | "plane" | null;
    /**
     * Children (individual interaction components)
     */
    children?: ReactNode;
    /**
     * Point selection callbacks
     */
    onPointSelect?: (point: Point3D) => void;
    onPointsSelect?: (points: Point3D[]) => void;
    /**
     * Bounding box callbacks
     */
    onBoxComplete?: (box: BoundingBox3D) => void;
    /**
     * Measurement callbacks
     */
    onMeasure?: (measurement: Measurement) => void;
    /**
     * Segmentation callbacks
     */
    onSegmentComplete?: (region: SegmentationRegion) => void;
    /**
     * Plane fit callbacks
     */
    onPlaneFit?: (plane: PlaneData) => void;
}
/**
 * Combined 3D interaction component
 *
 * @example Simple mode-based usage
 * ```tsx
 * <PointCloudViewer.Root data={data}>
 *   <PointCloudViewer.Scene />
 *   <PointCloudViewer.Controls />
 *   <PointCloudInteractions
 *     mode="box"
 *     onBoxComplete={(box) => saveAnnotation(box)}
 *   />
 * </PointCloudViewer.Root>
 * ```
 *
 * @example Composable usage
 * ```tsx
 * <PointCloudViewer.Root data={data}>
 *   <PointCloudViewer.Scene />
 *   <PointCloudViewer.Controls />
 *   <PointCloudInteractions>
 *     <PointCloudInteractions.BoundingBox3D onBoxComplete={...} />
 *     <PointCloudInteractions.MeasurementTool onMeasure={...} />
 *   </PointCloudInteractions>
 * </PointCloudViewer.Root>
 * ```
 */
export declare function PointCloudInteractions({ mode, children, onPointSelect, onPointsSelect, onBoxComplete, onMeasure, onSegmentComplete, onPlaneFit, }: PointCloudInteractionsProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PointCloudInteractions {
    var PointSelection: typeof import("./point-cloud-interactions").PointSelection;
    var BoundingBox3D: typeof import("./point-cloud-interactions").BoundingBox3D;
    var MeasurementTool: typeof import("./point-cloud-interactions").MeasurementTool;
    var SegmentationBrush: typeof import("./point-cloud-interactions").SegmentationBrush;
    var PlaneFit: typeof import("./point-cloud-interactions").PlaneFit;
}
export {};
//# sourceMappingURL=point-cloud-interactions.d.ts.map