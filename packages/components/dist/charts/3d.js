/**
 * Plexus UI - 3D Charts
 *
 * 3D chart components that require Three.js.
 * Import from this module separately to avoid including Three.js in your main bundle.
 *
 * @module charts/3d
 *
 * ## Bundle Optimization
 *
 * This module is separate to allow code splitting and avoid loading Three.js
 * unless you actually use 3D components.
 *
 * ## Usage
 *
 * **Good** (only loads Three.js if needed):
 * ```tsx
 * import { LineChart } from "@plexusui/components/charts";
 * import { PointCloudViewer } from "@plexusui/components/charts/3d";
 * ```
 *
 * **Bad** (loads Three.js in main bundle):
 * ```tsx
 * // Don't do this if you're not using 3D charts
 * import { LineChart, PointCloudViewer } from "@plexusui/components/charts";
 * ```
 */
// Point cloud utilities
export { detectFormat, loadLAS, loadPCD, loadPointCloud, loadXYZ, subsamplePointCloud, } from "../lib/point-cloud-loaders";
export { buildOctree, getLeafNodes, getMaxDepth, getTotalPoints, mergeNodeData, selectNodesLOD, } from "../lib/point-cloud-octree";
// 3D Model Viewer
export { ModelViewer } from "./3d-model-viewer";
// Point Cloud Interactions
export { BoundingBox3D, MeasurementTool, PlaneFit, PointCloudInteractions, PointSelection, SegmentationBrush, } from "./point-cloud-interactions";
// Point Cloud Viewer
export { PointCloudViewer } from "./point-cloud-viewer";
//# sourceMappingURL=3d.js.map