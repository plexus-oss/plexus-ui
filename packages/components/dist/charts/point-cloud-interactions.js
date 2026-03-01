"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";
export function PointSelection({ onSelect, onMultiSelect, enableMultiSelect = true, selectionRadius = 0.5, highlightColor = "#00ff00", markerSize = 0.3, }) {
    const { camera, raycaster, scene } = useThree();
    const [selectedPoints, setSelectedPoints] = useState([]);
    useEffect(() => {
        const handleClick = (event) => {
            // Convert mouse position to NDC
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            // Find intersected points
            const objects = scene.children.filter((obj) => obj.type === "Points" || obj.name === "point-cloud");
            if (objects.length === 0)
                return;
            const intersects = raycaster.intersectObjects(objects, true);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const selectedPoint = {
                    x: point.x,
                    y: point.y,
                    z: point.z,
                    index: intersects[0].index,
                };
                onSelect?.(selectedPoint);
                if (enableMultiSelect && event.shiftKey) {
                    setSelectedPoints((prev) => {
                        const newPoints = [...prev, selectedPoint];
                        onMultiSelect?.(newPoints);
                        return newPoints;
                    });
                }
                else {
                    setSelectedPoints([selectedPoint]);
                }
            }
        };
        const canvas = document.querySelector("canvas");
        canvas?.addEventListener("click", handleClick);
        return () => canvas?.removeEventListener("click", handleClick);
    }, [camera, raycaster, scene, onSelect, onMultiSelect, enableMultiSelect]);
    return (_jsx(_Fragment, { children: selectedPoints.map((point, idx) => (_jsxs("mesh", { position: [point.x, point.y, point.z], children: [_jsx("sphereGeometry", { args: [markerSize, 16, 16] }), _jsx("meshBasicMaterial", { color: highlightColor, transparent: true, opacity: 0.6, depthTest: false })] }, idx))) }));
}
export function BoundingBox3D({ onBoxComplete, onBoxUpdate, boxColor = "#00ffff", boxOpacity = 0.2, enableEdit = true, defaultSize = { x: 2, y: 2, z: 2 }, }) {
    const { camera, raycaster, scene } = useThree();
    const [currentBox, setCurrentBox] = useState(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [startPoint, setStartPoint] = useState(null);
    const boxRef = useRef(null);
    useEffect(() => {
        const handleMouseDown = (event) => {
            if (event.button !== 0)
                return; // Left click only
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            // Raycast to find ground plane or existing geometry
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                setStartPoint({ x: point.x, y: point.y, z: point.z });
                setIsDrawing(true);
            }
        };
        const handleMouseMove = (event) => {
            if (!isDrawing || !startPoint)
                return;
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const endPoint = intersects[0].point;
                // Calculate box parameters
                const centerX = (startPoint.x + endPoint.x) / 2;
                const centerY = (startPoint.y + endPoint.y) / 2;
                const centerZ = (startPoint.z + endPoint.z) / 2;
                const sizeX = Math.abs(endPoint.x - startPoint.x);
                const sizeY = Math.abs(endPoint.y - startPoint.y);
                const sizeZ = Math.abs(endPoint.z - startPoint.z);
                const box = {
                    center: { x: centerX, y: centerY, z: centerZ },
                    size: { x: sizeX || 0.1, y: sizeY || defaultSize.y, z: sizeZ || 0.1 },
                    rotation: { x: 0, y: 0, z: 0 },
                };
                setCurrentBox(box);
                onBoxUpdate?.(box);
            }
        };
        const handleMouseUp = () => {
            if (isDrawing && currentBox) {
                onBoxComplete?.(currentBox);
            }
            setIsDrawing(false);
            setStartPoint(null);
        };
        const canvas = document.querySelector("canvas");
        canvas?.addEventListener("mousedown", handleMouseDown);
        canvas?.addEventListener("mousemove", handleMouseMove);
        canvas?.addEventListener("mouseup", handleMouseUp);
        return () => {
            canvas?.removeEventListener("mousedown", handleMouseDown);
            canvas?.removeEventListener("mousemove", handleMouseMove);
            canvas?.removeEventListener("mouseup", handleMouseUp);
        };
    }, [
        camera,
        raycaster,
        scene,
        isDrawing,
        startPoint,
        currentBox,
        onBoxComplete,
        onBoxUpdate,
        defaultSize,
    ]);
    if (!currentBox)
        return null;
    return (_jsxs("mesh", { ref: boxRef, position: [currentBox.center.x, currentBox.center.y, currentBox.center.z], rotation: [currentBox.rotation.x, currentBox.rotation.y, currentBox.rotation.z], children: [_jsx("boxGeometry", { args: [currentBox.size.x, currentBox.size.y, currentBox.size.z] }), _jsx("meshBasicMaterial", { color: boxColor, transparent: true, opacity: boxOpacity, side: THREE.DoubleSide }), _jsxs("lineSegments", { children: [_jsx("edgesGeometry", { args: [new THREE.BoxGeometry(currentBox.size.x, currentBox.size.y, currentBox.size.z)] }), _jsx("lineBasicMaterial", { color: boxColor, linewidth: 2 })] })] }));
}
export function MeasurementTool({ onMeasure, lineColor = "#ffff00", markerColor = "#ffff00", showLabel = true, unit = "m", decimals = 2, }) {
    const { camera, raycaster, scene } = useThree();
    const [points, setPoints] = useState([]);
    const [_distance, _setDistance] = useState(0);
    useEffect(() => {
        const handleClick = (event) => {
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const newPoint = { x: point.x, y: point.y, z: point.z };
                setPoints((prev) => {
                    const newPoints = [...prev, newPoint];
                    // If we have 2 points, calculate distance
                    if (newPoints.length === 2) {
                        const p1 = new THREE.Vector3(newPoints[0].x, newPoints[0].y, newPoints[0].z);
                        const p2 = new THREE.Vector3(newPoints[1].x, newPoints[1].y, newPoints[1].z);
                        const dist = p1.distanceTo(p2);
                        _setDistance(dist);
                        const measurement = {
                            points: newPoints,
                            distance: dist,
                            unit,
                        };
                        onMeasure?.(measurement);
                        // Reset for next measurement
                        setTimeout(() => {
                            setPoints([]);
                            _setDistance(0);
                        }, 3000);
                    }
                    return newPoints.length >= 2 ? [] : newPoints;
                });
            }
        };
        const canvas = document.querySelector("canvas");
        canvas?.addEventListener("click", handleClick);
        return () => canvas?.removeEventListener("click", handleClick);
    }, [camera, raycaster, scene, onMeasure, unit]);
    return (_jsxs(_Fragment, { children: [points.map((point, idx) => (_jsxs("mesh", { position: [point.x, point.y, point.z], children: [_jsx("sphereGeometry", { args: [0.2, 16, 16] }), _jsx("meshBasicMaterial", { color: markerColor, depthTest: false })] }, idx))), points.length === 2 && (_jsxs("line", { children: [_jsx("bufferGeometry", { children: _jsx("bufferAttribute", { args: [
                                new Float32Array([
                                    points[0].x,
                                    points[0].y,
                                    points[0].z,
                                    points[1].x,
                                    points[1].y,
                                    points[1].z,
                                ]),
                                3,
                            ], attach: "attributes-position", count: 2, array: new Float32Array([
                                points[0].x,
                                points[0].y,
                                points[0].z,
                                points[1].x,
                                points[1].y,
                                points[1].z,
                            ]), itemSize: 3 }) }), _jsx("lineBasicMaterial", { color: lineColor, linewidth: 2 })] }))] }));
}
export function SegmentationBrush({ onRegionComplete, brushRadius = 1.0, label = "default", brushColor = "#ff00ff", showCursor = true, }) {
    const { camera, raycaster, scene } = useThree();
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [isPainting, setIsPainting] = useState(false);
    const [cursorPosition, setCursorPosition] = useState(null);
    useEffect(() => {
        const handleMouseMove = (event) => {
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                setCursorPosition({ x: point.x, y: point.y, z: point.z });
                if (isPainting) {
                    // Find points within brush radius
                    // This is simplified - in production you'd query the point cloud octree
                    const pointIndex = intersects[0].index;
                    if (pointIndex !== undefined) {
                        setSelectedIndices((prev) => {
                            if (!prev.includes(pointIndex)) {
                                return [...prev, pointIndex];
                            }
                            return prev;
                        });
                    }
                }
            }
        };
        const handleMouseDown = (event) => {
            if (event.button === 0) {
                setIsPainting(true);
            }
        };
        const handleMouseUp = () => {
            if (isPainting && selectedIndices.length > 0) {
                const region = {
                    points: selectedIndices,
                    label,
                    color: brushColor,
                };
                onRegionComplete?.(region);
            }
            setIsPainting(false);
        };
        const canvas = document.querySelector("canvas");
        canvas?.addEventListener("mousemove", handleMouseMove);
        canvas?.addEventListener("mousedown", handleMouseDown);
        canvas?.addEventListener("mouseup", handleMouseUp);
        return () => {
            canvas?.removeEventListener("mousemove", handleMouseMove);
            canvas?.removeEventListener("mousedown", handleMouseDown);
            canvas?.removeEventListener("mouseup", handleMouseUp);
        };
    }, [camera, raycaster, scene, isPainting, selectedIndices, brushColor, label, onRegionComplete]);
    return (_jsx(_Fragment, { children: showCursor && cursorPosition && (_jsxs("mesh", { position: [cursorPosition.x, cursorPosition.y, cursorPosition.z], children: [_jsx("sphereGeometry", { args: [brushRadius, 16, 16] }), _jsx("meshBasicMaterial", { color: brushColor, transparent: true, opacity: 0.3, wireframe: true, depthTest: false })] })) }));
}
export function PlaneFit({ onPlaneFit, minPoints = 3, planeColor = "#00ffff", planeOpacity = 0.4, planeSize = 10, }) {
    const { camera, raycaster, scene } = useThree();
    const [selectedPoints, setSelectedPoints] = useState([]);
    const [fittedPlane, setFittedPlane] = useState(null);
    useEffect(() => {
        const handleClick = (event) => {
            const rect = event.target.getBoundingClientRect();
            const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
            raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
            const intersects = raycaster.intersectObjects(scene.children, true);
            if (intersects.length > 0) {
                const point = intersects[0].point;
                const newPoint = { x: point.x, y: point.y, z: point.z };
                setSelectedPoints((prev) => {
                    const newPoints = [...prev, newPoint];
                    // Fit plane if we have enough points
                    if (newPoints.length >= minPoints) {
                        const plane = fitPlaneToPoints(newPoints);
                        setFittedPlane(plane);
                        onPlaneFit?.(plane);
                        return []; // Reset
                    }
                    return newPoints;
                });
            }
        };
        const canvas = document.querySelector("canvas");
        canvas?.addEventListener("click", handleClick);
        return () => canvas?.removeEventListener("click", handleClick);
    }, [camera, raycaster, scene, minPoints, onPlaneFit]);
    return (_jsxs(_Fragment, { children: [selectedPoints.map((point, idx) => (_jsxs("mesh", { position: [point.x, point.y, point.z], children: [_jsx("sphereGeometry", { args: [0.2, 16, 16] }), _jsx("meshBasicMaterial", { color: "#ffffff", depthTest: false })] }, idx))), fittedPlane && (_jsxs("mesh", { position: [fittedPlane.point.x, fittedPlane.point.y, fittedPlane.point.z], children: [_jsx("planeGeometry", { args: [planeSize, planeSize] }), _jsx("meshBasicMaterial", { color: planeColor, transparent: true, opacity: planeOpacity, side: THREE.DoubleSide })] }))] }));
}
// ============================================================================
// Helper Functions
// ============================================================================
/**
 * Fit plane to points using least squares
 */
function fitPlaneToPoints(points) {
    // Calculate centroid
    const centroid = new THREE.Vector3();
    for (const p of points) {
        centroid.add(new THREE.Vector3(p.x, p.y, p.z));
    }
    centroid.divideScalar(points.length);
    // Simple plane fitting (for demonstration)
    // In production, use SVD or proper least squares
    const normal = new THREE.Vector3(0, 1, 0); // Simplified - should compute from points
    // Plane equation: ax + by + cz + d = 0
    const d = -normal.dot(centroid);
    return {
        normal,
        point: centroid,
        equation: {
            a: normal.x,
            b: normal.y,
            c: normal.z,
            d,
        },
        selectedPoints: points,
    };
}
const PointCloudInteractionsContext = createContext(null);
export function usePointCloudInteractions() {
    const ctx = useContext(PointCloudInteractionsContext);
    if (!ctx) {
        throw new Error("usePointCloudInteractions must be used within PointCloudInteractionsProvider");
    }
    return ctx;
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
export function PointCloudInteractions({ mode = null, children, onPointSelect, onPointsSelect, onBoxComplete, onMeasure, onSegmentComplete, onPlaneFit, }) {
    const [_activeInteraction, setActiveInteraction] = useState(mode);
    useEffect(() => {
        setActiveInteraction(mode);
    }, [mode]);
    // If children provided, use composable API
    if (children) {
        return _jsx(_Fragment, { children: children });
    }
    // Otherwise use mode-based API
    return (_jsxs(_Fragment, { children: [mode === "select" && (_jsx(PointSelection, { onSelect: onPointSelect, onMultiSelect: onPointsSelect })), mode === "box" && _jsx(BoundingBox3D, { onBoxComplete: onBoxComplete }), mode === "measure" && _jsx(MeasurementTool, { onMeasure: onMeasure }), mode === "segment" && _jsx(SegmentationBrush, { onRegionComplete: onSegmentComplete }), mode === "plane" && _jsx(PlaneFit, { onPlaneFit: onPlaneFit })] }));
}
// Export primitive components
PointCloudInteractions.PointSelection = PointSelection;
PointCloudInteractions.BoundingBox3D = BoundingBox3D;
PointCloudInteractions.MeasurementTool = MeasurementTool;
PointCloudInteractions.SegmentationBrush = SegmentationBrush;
PointCloudInteractions.PlaneFit = PlaneFit;
//# sourceMappingURL=point-cloud-interactions.js.map