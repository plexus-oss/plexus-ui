/**
 * Point Cloud File Loaders
 *
 * Utilities for loading various point cloud file formats:
 * - XYZ: Simple text format (x y z [intensity] [r g b])
 * - PCD: Point Cloud Data format (ASCII and binary)
 * - LAS/LAZ: LIDAR data format (requires decompression for LAZ)
 */
import type { PointCloudData } from "../charts/point-cloud-viewer";
/**
 * Parse XYZ format point cloud
 * Format: x y z [intensity] [r g b]
 *
 * @example
 * ```
 * 1.0 2.0 3.0
 * 1.5 2.5 3.5 0.8
 * 2.0 3.0 4.0 0.9 255 128 64
 * ```
 */
export declare function loadXYZ(fileOrUrl: File | string): Promise<PointCloudData>;
/**
 * Load PCD format point cloud (ASCII only for now)
 *
 * @example PCD format:
 * ```
 * VERSION .7
 * FIELDS x y z rgb
 * SIZE 4 4 4 4
 * TYPE F F F U
 * COUNT 1 1 1 1
 * WIDTH 213
 * HEIGHT 1
 * POINTS 213
 * DATA ascii
 * 0.93773 0.33763 0 4.2108e+06
 * ```
 */
export declare function loadPCD(fileOrUrl: File | string): Promise<PointCloudData>;
/**
 * Load LAS format point cloud (basic support for format 0-3)
 *
 * Note: LAZ (compressed) files require decompression library
 * For production, use libraries like:
 * - copc.js (for COPC/LAZ)
 * - laz-perf (for LAZ decompression)
 * - potree-converter (for tiled octree generation)
 *
 * @param maxPoints - Limit points loaded (for performance)
 */
export declare function loadLAS(fileOrUrl: File | string, options?: {
    maxPoints?: number;
    stride?: number;
}): Promise<PointCloudData>;
/**
 * Detect point cloud file format from filename or file
 */
export declare function detectFormat(fileOrUrl: File | string): "xyz" | "pcd" | "las" | "laz" | "unknown";
/**
 * Auto-load point cloud based on file extension
 */
export declare function loadPointCloud(fileOrUrl: File | string, options?: {
    maxPoints?: number;
    stride?: number;
}): Promise<PointCloudData>;
/**
 * Subsample point cloud (simple uniform subsampling)
 */
export declare function subsamplePointCloud(data: PointCloudData, targetPoints: number): PointCloudData;
//# sourceMappingURL=point-cloud-loaders.d.ts.map