"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { createContext, Suspense, useContext, useMemo, useRef, useState, } from "react";
import * as THREE from "three";
import { viridis } from "../lib/color-scales";
import { buildOctree, mergeNodeData, selectNodesLOD, } from "../lib/point-cloud-octree";
const PointCloudViewerContext = createContext(null);
function usePointCloudViewerData() {
    const ctx = useContext(PointCloudViewerContext);
    if (!ctx) {
        throw new Error("PointCloudViewer components must be used within PointCloudViewer.Root");
    }
    return ctx;
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Calculate bounding box and center of point cloud
 */
function calculateBounds(positions) {
    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (let i = 0; i < positions.length; i += 3) {
        min.x = Math.min(min.x, positions[i]);
        min.y = Math.min(min.y, positions[i + 1]);
        min.z = Math.min(min.z, positions[i + 2]);
        max.x = Math.max(max.x, positions[i]);
        max.y = Math.max(max.y, positions[i + 1]);
        max.z = Math.max(max.z, positions[i + 2]);
    }
    const center = new THREE.Vector3();
    center.addVectors(min, max).multiplyScalar(0.5);
    const size = new THREE.Vector3();
    size.subVectors(max, min);
    return { min, max, center, size };
}
/**
 * Convert hex color to THREE.Color
 */
function hexToThreeColor(hex) {
    return new THREE.Color(hex);
}
/**
 * Generate colors based on color mode
 */
function generateColors(data, colorMode, colorScale, minValue, maxValue) {
    const numPoints = data.positions.length / 3;
    const colors = new Float32Array(numPoints * 3);
    if (colorMode === "rgb" && data.colors) {
        // Use provided RGB colors
        for (let i = 0; i < numPoints; i++) {
            const idx = i * 3;
            colors[idx] = data.colors[idx] / 255;
            colors[idx + 1] = data.colors[idx + 1] / 255;
            colors[idx + 2] = data.colors[idx + 2] / 255;
        }
    }
    else if (colorMode === "intensity" && data.intensities) {
        // Color by intensity
        const min = minValue ?? Math.min(...data.intensities);
        const max = maxValue ?? Math.max(...data.intensities);
        const range = max - min || 1;
        for (let i = 0; i < numPoints; i++) {
            const normalized = (data.intensities[i] - min) / range;
            const colorHex = colorScale(normalized);
            const color = hexToThreeColor(colorHex);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    }
    else if (colorMode === "classification" && data.classifications) {
        // Color by classification (discrete colors)
        const classColors = {
            0: new THREE.Color(0x888888), // Unclassified - gray
            1: new THREE.Color(0x000000), // Unclassified - black
            2: new THREE.Color(0x8b4513), // Ground - brown
            3: new THREE.Color(0x228b22), // Low vegetation - green
            4: new THREE.Color(0x32cd32), // Medium vegetation - lime
            5: new THREE.Color(0x006400), // High vegetation - dark green
            6: new THREE.Color(0xff0000), // Building - red
            7: new THREE.Color(0xffa500), // Low point - orange
            8: new THREE.Color(0x0000ff), // Reserved - blue
            9: new THREE.Color(0x00ffff), // Water - cyan
            10: new THREE.Color(0xff00ff), // Rail - magenta
            11: new THREE.Color(0xffff00), // Road surface - yellow
            12: new THREE.Color(0x808080), // Reserved - gray
        };
        for (let i = 0; i < numPoints; i++) {
            const classification = data.classifications[i];
            const color = classColors[classification] || classColors[0];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    }
    else {
        // Default: Color by height (Z coordinate)
        const heights = [];
        for (let i = 0; i < numPoints; i++) {
            heights.push(data.positions[i * 3 + 2]);
        }
        const min = minValue ?? Math.min(...heights);
        const max = maxValue ?? Math.max(...heights);
        const range = max - min || 1;
        for (let i = 0; i < numPoints; i++) {
            const height = data.positions[i * 3 + 2];
            const normalized = (height - min) / range;
            const colorHex = colorScale(normalized);
            const color = hexToThreeColor(colorHex);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
    }
    return colors;
}
// ============================================================================
// Point Cloud Component
// ============================================================================
function PointCloud() {
    const { data, colorMode, colorScale, pointSize, minValue, maxValue, autoRotate, enableLOD, pointBudget, lodMultiplier, octreeRoot, } = usePointCloudViewerData();
    const pointsRef = useRef(null);
    const { camera } = useThree();
    const [lodData, setLodData] = useState(data);
    // Update LOD selection each frame when LOD is enabled
    useFrame(() => {
        if (enableLOD && octreeRoot) {
            const selectedNodes = selectNodesLOD(octreeRoot, {
                camera,
                pointBudget,
                lodMultiplier,
                minScreenSpaceError: 1.0,
            });
            const mergedData = mergeNodeData(selectedNodes);
            setLodData(mergedData);
        }
        // Auto-rotate
        if (autoRotate && pointsRef.current) {
            pointsRef.current.rotation.y += 0.002;
        }
    });
    // Create geometry and colors
    const { geometry } = useMemo(() => {
        const activeData = enableLOD ? lodData : data;
        const geometry = new THREE.BufferGeometry();
        // Set positions
        const positions = activeData.positions instanceof Float32Array
            ? activeData.positions
            : new Float32Array(activeData.positions);
        geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
        // Generate colors
        const colors = generateColors(activeData, colorMode, colorScale, minValue, maxValue);
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        // Compute bounding sphere for proper camera framing
        geometry.computeBoundingSphere();
        return { geometry, colors };
    }, [colorMode, colorScale, minValue, maxValue, data, enableLOD, lodData]);
    return (_jsx("points", { ref: pointsRef, geometry: geometry, children: _jsx("pointsMaterial", { size: pointSize, vertexColors: true, sizeAttenuation: true, transparent: true, opacity: 0.8 }) }));
}
// ============================================================================
// Scene Component
// ============================================================================
function Scene() {
    const { data, showGrid, showAxes } = usePointCloudViewerData();
    // Calculate bounds for proper camera positioning
    const bounds = useMemo(() => {
        const positions = data.positions instanceof Float32Array ? data.positions : new Float32Array(data.positions);
        return calculateBounds(positions);
    }, [data.positions]);
    return (_jsxs(_Fragment, { children: [_jsx(PointCloud, {}), showGrid && (_jsx(Grid, { args: [bounds.size.x * 2, bounds.size.y * 2], position: [bounds.center.x, bounds.min.y, bounds.center.z], cellColor: "#6b7280", sectionColor: "#374151" })), showAxes && _jsx("axesHelper", { args: [bounds.size.length() * 0.5] }), _jsx("ambientLight", { intensity: 0.5 }), _jsx("directionalLight", { position: [10, 10, 5], intensity: 1 })] }));
}
// ============================================================================
// Controls Component
// ============================================================================
function Controls() {
    const { autoRotate, enableDamping, maxDistance, minDistance } = usePointCloudViewerData();
    return (_jsx(OrbitControls, { autoRotate: autoRotate, enableDamping: enableDamping, dampingFactor: 0.05, maxDistance: maxDistance, minDistance: minDistance }));
}
// ============================================================================
// Root Component
// ============================================================================
function Root({ data, colorMode = "height", colorScale = viridis, pointSize = 0.05, minValue, maxValue, showGrid = false, showAxes = false, cameraPosition, backgroundColor = "#0a0a0a", autoRotate = false, enableDamping = true, maxDistance, minDistance, enableLOD = false, pointBudget = 1000000, lodMultiplier = 1.0, octreeOptions, width = "100%", height = 600, className = "", children, }) {
    // Build octree if LOD is enabled
    const octreeRoot = useMemo(() => {
        if (!enableLOD)
            return undefined;
        console.log("Building octree for LOD...");
        const startTime = performance.now();
        const octree = buildOctree(data, octreeOptions);
        const endTime = performance.now();
        console.log(`Octree built in ${(endTime - startTime).toFixed(2)}ms`);
        return octree;
    }, [enableLOD, data, octreeOptions]);
    const contextValue = {
        data,
        colorMode,
        colorScale,
        pointSize,
        minValue,
        maxValue,
        showGrid,
        showAxes,
        cameraPosition: cameraPosition || [0, 0, 0],
        backgroundColor,
        autoRotate,
        enableDamping,
        maxDistance,
        minDistance,
        enableLOD,
        pointBudget,
        lodMultiplier,
        octreeRoot,
    };
    // Calculate bounds for proper camera setup
    const bounds = useMemo(() => {
        const positions = data.positions instanceof Float32Array ? data.positions : new Float32Array(data.positions);
        return calculateBounds(positions);
    }, [data.positions]);
    // Auto-calculate camera position if not provided
    const effectiveCameraPosition = useMemo(() => {
        if (cameraPosition)
            return cameraPosition;
        const diagonal = bounds.size.length();
        const distance = diagonal * 1.5;
        return [distance, distance, distance];
    }, [cameraPosition, bounds]);
    return (_jsx(PointCloudViewerContext.Provider, { value: contextValue, children: _jsx("div", { className: className, style: {
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
                position: "relative",
            }, children: _jsx(Canvas, { camera: {
                    position: effectiveCameraPosition,
                    fov: 50,
                    near: 0.1,
                    far: bounds.size.length() * 10,
                }, style: { background: backgroundColor }, children: _jsx(Suspense, { fallback: null, children: children }) }) }) }));
}
// ============================================================================
// Composed Component (Simple API)
// ============================================================================
export function PointCloudViewer({ data, colorMode = "height", colorScale = viridis, pointSize = 0.05, minValue, maxValue, showGrid = false, showAxes = false, cameraPosition, backgroundColor = "#0a0a0a", autoRotate = false, enableDamping = true, maxDistance, minDistance, enableLOD = false, pointBudget = 1000000, lodMultiplier = 1.0, octreeOptions, width = "100%", height = 600, className = "", }) {
    return (_jsxs(Root, { data: data, colorMode: colorMode, colorScale: colorScale, pointSize: pointSize, minValue: minValue, maxValue: maxValue, showGrid: showGrid, showAxes: showAxes, cameraPosition: cameraPosition, backgroundColor: backgroundColor, autoRotate: autoRotate, enableDamping: enableDamping, maxDistance: maxDistance, minDistance: minDistance, enableLOD: enableLOD, pointBudget: pointBudget, lodMultiplier: lodMultiplier, octreeOptions: octreeOptions, width: width, height: height, className: className, children: [_jsx(Scene, {}), _jsx(Controls, {})] }));
}
// ============================================================================
// Primitive API (Composable)
// ============================================================================
/**
 * PointCloudViewer Primitives - Composable components for custom layouts
 *
 * @example Simple usage (monolithic)
 * ```tsx
 * <PointCloudViewer
 *   data={{ positions: lidarPoints }}
 *   colorMode="height"
 *   pointSize={0.1}
 *   showGrid
 * />
 * ```
 *
 * @example Advanced usage (composable)
 * ```tsx
 * <PointCloudViewer.Root data={{ positions, intensities }} colorMode="intensity">
 *   <PointCloudViewer.Scene />
 *   <PointCloudViewer.Controls autoRotate />
 * </PointCloudViewer.Root>
 * ```
 */
PointCloudViewer.Root = Root;
PointCloudViewer.Scene = Scene;
PointCloudViewer.Controls = Controls;
PointCloudViewer.PointCloud = PointCloud;
export default PointCloudViewer;
//# sourceMappingURL=point-cloud-viewer.js.map