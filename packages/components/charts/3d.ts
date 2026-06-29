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

// Orbital mechanics core (re-exported for convenience)
export type {
  KeplerianElements,
  LatLng,
  OrbitalElements,
  PropagationResult,
  Tle,
  Vec3,
} from "../lib/orbital";
export {
  calculateKeplerianPosition,
  EARTH_RADIUS_KM,
  eciToScenePosition,
  generateGroundTrack,
  generateKeplerianPath,
  generateOrbitalPath,
  getOrbitalElements,
  gmstAngle,
  isTleStale,
  latLngAltToPosition,
  orbitKey,
  propagateSGP4,
  SCENE_SCALE,
} from "../lib/orbital";
// Point cloud utilities
export {
  detectFormat,
  loadLAS,
  loadPCD,
  loadPointCloud,
  loadXYZ,
  subsamplePointCloud,
} from "../lib/point-cloud-loaders";
export {
  buildOctree,
  getLeafNodes,
  getMaxDepth,
  getTotalPoints,
  type LODOptions,
  mergeNodeData,
  type OctreeNode,
  type OctreeOptions,
  selectNodesLOD,
} from "../lib/point-cloud-octree";
export type { ModelViewerProps } from "./3d-model-viewer";
// 3D Model Viewer
export { ModelViewer } from "./3d-model-viewer";
// Globe (3D Earth + satellite visualisation)
export type { GlobeProps, GroundMarker, SatelliteInput } from "./globe";
export { EarthGlobe, Globe } from "./globe";
export type {
  BoundingBox3D as BoundingBox3DType,
  BoundingBox3DProps,
  Measurement,
  MeasurementToolProps,
  PlaneData,
  PlaneFitProps,
  Point3D,
  PointCloudInteractionsProps,
  PointSelectionProps,
  SegmentationBrushProps,
  SegmentationRegion,
} from "./point-cloud-interactions";
// Point Cloud Interactions
export {
  BoundingBox3D,
  MeasurementTool,
  PlaneFit,
  PointCloudInteractions,
  PointSelection,
  SegmentationBrush,
} from "./point-cloud-interactions";
export type {
  ColorMode,
  PointCloudData,
  PointCloudViewerProps,
} from "./point-cloud-viewer";
// Point Cloud Viewer
export { PointCloudViewer } from "./point-cloud-viewer";
export type {
  PropagationWorkerHandle,
  PropagationWorkerSat,
} from "./use-propagation-worker";
export { usePropagationWorker } from "./use-propagation-worker";
