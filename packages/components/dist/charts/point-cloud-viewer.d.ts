import { type ReactNode } from "react";
import { type OctreeOptions } from "../lib/point-cloud-octree";
/**
 * Point Cloud Viewer for 3D point cloud visualization
 *
 * Use cases:
 * - LIDAR scans (terrain mapping, building scanning)
 * - Photogrammetry output
 * - 3D scanning (industrial inspection, reverse engineering)
 * - Satellite/aerial imaging point clouds
 * - Medical imaging (CT/MRI 3D reconstructions)
 * - Robotics perception (depth sensors, SLAM)
 */
export type ColorMode = "height" | "intensity" | "rgb" | "classification";
export interface PointCloudData {
    /**
     * Point positions [x1, y1, z1, x2, y2, z2, ...]
     */
    positions: Float32Array | number[];
    /**
     * Optional RGB colors [r1, g1, b1, r2, g2, b2, ...] (0-255)
     */
    colors?: Uint8Array | number[];
    /**
     * Optional intensity values per point (0-255 or 0-1)
     */
    intensities?: Float32Array | number[];
    /**
     * Optional classification values per point
     */
    classifications?: Uint8Array | number[];
}
export interface PointCloudViewerProps {
    /**
     * Point cloud data
     */
    data: PointCloudData;
    /**
     * Color mode for points
     */
    colorMode?: ColorMode;
    /**
     * Color scale function for height/intensity mapping
     */
    colorScale?: (value: number) => string;
    /**
     * Point size in pixels
     */
    pointSize?: number;
    /**
     * Minimum value for color scale normalization
     */
    minValue?: number;
    /**
     * Maximum value for color scale normalization
     */
    maxValue?: number;
    /**
     * Width of the viewer
     */
    width?: number | string;
    /**
     * Height of the viewer
     */
    height?: number | string;
    /**
     * Show grid
     */
    showGrid?: boolean;
    /**
     * Show axes helper
     */
    showAxes?: boolean;
    /**
     * Camera position [x, y, z]
     */
    cameraPosition?: [number, number, number];
    /**
     * Background color
     */
    backgroundColor?: string;
    /**
     * Auto-rotate camera
     */
    autoRotate?: boolean;
    /**
     * Enable camera damping for smooth controls
     */
    enableDamping?: boolean;
    /**
     * Maximum camera distance
     */
    maxDistance?: number;
    /**
     * Minimum camera distance
     */
    minDistance?: number;
    /**
     * Enable Level of Detail (LOD) rendering for large point clouds
     * Recommended for datasets with >1M points
     */
    enableLOD?: boolean;
    /**
     * Point budget for LOD (maximum points to render)
     * Default: 1,000,000
     */
    pointBudget?: number;
    /**
     * LOD multiplier (higher = more aggressive LOD)
     * Default: 1.0
     */
    lodMultiplier?: number;
    /**
     * Octree construction options
     */
    octreeOptions?: OctreeOptions;
    /**
     * Class name
     */
    className?: string;
}
export declare function PointCloudViewer({ data, colorMode, colorScale, pointSize, minValue, maxValue, showGrid, showAxes, cameraPosition, backgroundColor, autoRotate, enableDamping, maxDistance, minDistance, enableLOD, pointBudget, lodMultiplier, octreeOptions, width, height, className, }: PointCloudViewerProps): import("react/jsx-runtime").JSX.Element;
export declare namespace PointCloudViewer {
    var Root: ({ data, colorMode, colorScale, pointSize, minValue, maxValue, showGrid, showAxes, cameraPosition, backgroundColor, autoRotate, enableDamping, maxDistance, minDistance, enableLOD, pointBudget, lodMultiplier, octreeOptions, width, height, className, children, }: PointCloudViewerProps & {
        children?: ReactNode;
    }) => import("react/jsx-runtime").JSX.Element;
    var Scene: () => import("react/jsx-runtime").JSX.Element;
    var Controls: () => import("react/jsx-runtime").JSX.Element;
    var PointCloud: () => import("react/jsx-runtime").JSX.Element;
}
export default PointCloudViewer;
//# sourceMappingURL=point-cloud-viewer.d.ts.map