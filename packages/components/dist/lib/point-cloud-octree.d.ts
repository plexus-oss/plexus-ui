/**
 * Point Cloud Octree with LOD (Level of Detail)
 *
 * Hierarchical spatial indexing for efficient rendering of massive point clouds
 * Based on Potree architecture: https://github.com/potree/potree
 *
 * Key concepts:
 * - Octree: Recursive subdivision of 3D space into 8 octants
 * - LOD: Points are organized by resolution levels
 * - Frustum culling: Only render visible octree nodes
 * - Distance-based LOD: Render higher detail for closer nodes
 */
import * as THREE from "three";
import type { PointCloudData } from "../charts/point-cloud-viewer";
export interface OctreeNode {
    /**
     * Bounding box of this node
     */
    boundingBox: THREE.Box3;
    /**
     * Center point of this node
     */
    center: THREE.Vector3;
    /**
     * Size (half-width) of this node
     */
    size: number;
    /**
     * Level in the octree (0 = root, higher = more detailed)
     */
    level: number;
    /**
     * Point data in this node
     */
    positions: Float32Array;
    /**
     * Optional color data
     */
    colors?: Uint8Array;
    /**
     * Optional intensity data
     */
    intensities?: Float32Array;
    /**
     * Optional classification data
     */
    classifications?: Uint8Array;
    /**
     * Number of points in this node
     */
    numPoints: number;
    /**
     * Child nodes (8 octants) - null if leaf node
     */
    children: (OctreeNode | null)[];
    /**
     * Is this a leaf node?
     */
    isLeaf: boolean;
    /**
     * Spacing (minimum distance between points) at this level
     */
    spacing: number;
}
export interface OctreeOptions {
    /**
     * Maximum points per node before subdivision
     */
    maxPointsPerNode?: number;
    /**
     * Maximum depth of octree
     */
    maxDepth?: number;
    /**
     * Minimum node size (stop subdivision if node gets too small)
     */
    minNodeSize?: number;
    /**
     * Initial spacing (computed from bounding box if not provided)
     */
    initialSpacing?: number;
}
export interface LODOptions {
    /**
     * Point budget (maximum total points to render)
     */
    pointBudget?: number;
    /**
     * Camera for frustum culling and distance calculations
     */
    camera: THREE.Camera;
    /**
     * LOD multiplier (higher = more aggressive LOD, lower quality)
     */
    lodMultiplier?: number;
    /**
     * Minimum screen space error threshold
     */
    minScreenSpaceError?: number;
}
/**
 * Build octree from point cloud data
 */
export declare function buildOctree(data: PointCloudData, options?: OctreeOptions): OctreeNode;
/**
 * Select nodes to render based on LOD criteria
 */
export declare function selectNodesLOD(root: OctreeNode, options: LODOptions): OctreeNode[];
/**
 * Get all leaf nodes from octree
 */
export declare function getLeafNodes(node: OctreeNode): OctreeNode[];
/**
 * Get total point count in octree
 */
export declare function getTotalPoints(node: OctreeNode): number;
/**
 * Get octree depth
 */
export declare function getMaxDepth(node: OctreeNode): number;
/**
 * Merge point cloud data from selected nodes
 */
export declare function mergeNodeData(nodes: OctreeNode[]): PointCloudData;
//# sourceMappingURL=point-cloud-octree.d.ts.map