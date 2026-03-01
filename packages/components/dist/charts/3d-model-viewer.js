"use client";
import { jsx as _jsx, Fragment as _Fragment, jsxs as _jsxs } from "react/jsx-runtime";
import { Grid, OrbitControls } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { createContext, Suspense, useContext, useMemo, useRef, useState, } from "react";
import * as THREE from "three";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { viridis } from "../lib/color-scales";
const ModelViewerContext = createContext(null);
function useModelViewerData() {
    const ctx = useContext(ModelViewerContext);
    if (!ctx) {
        throw new Error("ModelViewer components must be used within ModelViewer.Root");
    }
    return ctx;
}
// ============================================================================
// 3D Model Component
// ============================================================================
function Model3D() {
    const { modelUrl, modelType, modelData, vertexColors, colorScale, minValue, maxValue, wireframe, metalness, roughness, } = useModelViewerData();
    const meshRef = useRef(null);
    const [geometry, setGeometry] = useState(null);
    // Load model from URL or data
    useMemo(() => {
        if (modelData) {
            // Load from ArrayBuffer/Float32Array
            if (modelType === "stl") {
                const loader = new STLLoader();
                const geo = loader.parse(modelData);
                setGeometry(geo);
            }
            else if (modelType === "obj") {
                const loader = new OBJLoader();
                const text = new TextDecoder().decode(modelData);
                const object = loader.parse(text);
                const firstMesh = object.children.find((child) => child instanceof THREE.Mesh);
                if (firstMesh) {
                    setGeometry(firstMesh.geometry);
                }
            }
        }
        else if (modelUrl) {
            // Load from URL
            if (modelType === "stl") {
                const loader = new STLLoader();
                loader.load(modelUrl, (geo) => {
                    setGeometry(geo);
                });
            }
            else if (modelType === "obj") {
                const loader = new OBJLoader();
                loader.load(modelUrl, (object) => {
                    const firstMesh = object.children.find((child) => child instanceof THREE.Mesh);
                    if (firstMesh) {
                        setGeometry(firstMesh.geometry);
                    }
                });
            }
        }
    }, [modelUrl, modelType, modelData]);
    // Apply vertex colors if provided
    useMemo(() => {
        if (!geometry || !vertexColors)
            return;
        const positions = geometry.attributes.position;
        const vertexCount = positions.count;
        const colors = new Float32Array(vertexCount * 3);
        for (let i = 0; i < vertexCount; i++) {
            const value = vertexColors[i] || 0;
            const normalized = (value - minValue) / (maxValue - minValue);
            const colorHex = colorScale(normalized);
            const color = new THREE.Color(colorHex);
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }
        geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
        geometry.attributes.color.needsUpdate = true;
    }, [geometry, vertexColors, colorScale, minValue, maxValue]);
    // Center and scale the model
    useMemo(() => {
        if (!geometry)
            return;
        geometry.computeBoundingBox();
        geometry.computeVertexNormals();
        const boundingBox = geometry.boundingBox;
        if (boundingBox) {
            const center = new THREE.Vector3();
            boundingBox.getCenter(center);
            geometry.translate(-center.x, -center.y, -center.z);
            // Scale to fit in a unit box
            const size = new THREE.Vector3();
            boundingBox.getSize(size);
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = 2 / maxDim;
            geometry.scale(scale, scale, scale);
        }
    }, [geometry]);
    if (!geometry) {
        return null;
    }
    return (_jsx("mesh", { ref: meshRef, geometry: geometry, children: _jsx("meshStandardMaterial", { vertexColors: !!vertexColors, wireframe: wireframe, metalness: metalness, roughness: roughness, side: THREE.DoubleSide }) }));
}
// ============================================================================
// Scene Component
// ============================================================================
function Scene() {
    const { showGrid, showAxes, autoRotate } = useModelViewerData();
    const meshRef = useRef(null);
    useFrame(() => {
        if (autoRotate && meshRef.current) {
            meshRef.current.rotation.y += 0.005;
        }
    });
    return (_jsxs(_Fragment, { children: [_jsx("ambientLight", { intensity: 0.5 }), _jsx("directionalLight", { position: [10, 10, 5], intensity: 1 }), _jsx("directionalLight", { position: [-10, -10, -5], intensity: 0.3 }), _jsx("group", { ref: meshRef, children: _jsx(Model3D, {}) }), showGrid && _jsx(Grid, { args: [10, 10], cellColor: "#6B7280", sectionColor: "#374151" }), showAxes && _jsx("axesHelper", { args: [3] })] }));
}
// ============================================================================
// Canvas Container Component
// ============================================================================
function ModelCanvas() {
    const { cameraPosition, backgroundColor } = useModelViewerData();
    return (_jsx("div", { style: { width: "100%", height: "100%", backgroundColor }, children: _jsx(Canvas, { camera: { position: cameraPosition, fov: 50 }, style: { width: "100%", height: "100%" }, children: _jsxs(Suspense, { fallback: null, children: [_jsx(Scene, {}), _jsx(OrbitControls, { enableDamping: true, dampingFactor: 0.05 })] }) }) }));
}
// ============================================================================
// Root Component
// ============================================================================
function Root({ children, modelUrl, modelType = "stl", modelData, vertexColors, colorScale = viridis, minValue = 0, maxValue = 100, showGrid = true, showAxes = false, cameraPosition = [3, 3, 3], backgroundColor = "#111111", autoRotate = false, wireframe = false, metalness = 0.5, roughness = 0.5, width = 800, height = 600, className = "", }) {
    const contextValue = {
        modelUrl,
        modelType,
        modelData,
        vertexColors,
        colorScale,
        minValue,
        maxValue,
        showGrid,
        showAxes,
        cameraPosition,
        backgroundColor,
        autoRotate,
        wireframe,
        metalness,
        roughness,
    };
    return (_jsx(ModelViewerContext.Provider, { value: contextValue, children: _jsx("div", { className: className, style: {
                width: typeof width === "number" ? `${width}px` : width,
                height: typeof height === "number" ? `${height}px` : height,
            }, children: children || _jsx(ModelCanvas, {}) }) }));
}
// ============================================================================
// Compound Component Export
// ============================================================================
export const ModelViewer = Object.assign(function ModelViewer(props) {
    return (_jsx(Root, { ...props, children: _jsx(ModelCanvas, {}) }));
}, {
    Root,
    Canvas: ModelCanvas,
    Scene,
});
// ============================================================================
// Utilities
// ============================================================================
/**
 * Generate a simple cube STL for testing
 */
export function generateCubeSTL() {
    const vertices = [
        // Front face
        -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1, 1,
        // Back face
        -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1, -1,
        // Top face
        -1, 1, -1, -1, 1, 1, 1, 1, 1, -1, 1, -1, 1, 1, 1, 1, 1, -1,
        // Bottom face
        -1, -1, -1, 1, -1, -1, 1, -1, 1, -1, -1, -1, 1, -1, 1, -1, -1, 1,
        // Right face
        1, -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, -1, 1, 1, 1, 1, -1, 1,
        // Left face
        -1, -1, -1, -1, -1, 1, -1, 1, 1, -1, -1, -1, -1, 1, 1, -1, 1, -1,
    ];
    const triangleCount = vertices.length / 9;
    const headerSize = 80;
    const triangleDataSize = 50; // 12 floats (normal + 3 vertices) + 2 bytes attribute
    const bufferSize = headerSize + 4 + triangleCount * triangleDataSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    // Write triangle count
    view.setUint32(80, triangleCount, true);
    let offset = 84;
    for (let i = 0; i < triangleCount; i++) {
        const i0 = i * 9;
        // Calculate normal
        const v1 = [
            vertices[i0 + 3] - vertices[i0],
            vertices[i0 + 4] - vertices[i0 + 1],
            vertices[i0 + 5] - vertices[i0 + 2],
        ];
        const v2 = [
            vertices[i0 + 6] - vertices[i0],
            vertices[i0 + 7] - vertices[i0 + 1],
            vertices[i0 + 8] - vertices[i0 + 2],
        ];
        // Cross product for normal
        const normal = [
            v1[1] * v2[2] - v1[2] * v2[1],
            v1[2] * v2[0] - v1[0] * v2[2],
            v1[0] * v2[1] - v1[1] * v2[0],
        ];
        const len = Math.sqrt(normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2);
        normal[0] /= len;
        normal[1] /= len;
        normal[2] /= len;
        // Write normal
        view.setFloat32(offset, normal[0], true);
        view.setFloat32(offset + 4, normal[1], true);
        view.setFloat32(offset + 8, normal[2], true);
        offset += 12;
        // Write 3 vertices
        for (let j = 0; j < 3; j++) {
            view.setFloat32(offset, vertices[i0 + j * 3], true);
            view.setFloat32(offset + 4, vertices[i0 + j * 3 + 1], true);
            view.setFloat32(offset + 8, vertices[i0 + j * 3 + 2], true);
            offset += 12;
        }
        // Write attribute byte count (unused, typically 0)
        view.setUint16(offset, 0, true);
        offset += 2;
    }
    return buffer;
}
/**
 * Generate a beam/bracket STL with realistic stress distribution
 */
export function generateBeamSTL(divisions = 20) {
    const vertices = [];
    const stressValues = [];
    const length = 10;
    const width = 2;
    const height = 1;
    // Generate a simple beam mesh (rectangle)
    // We'll create a grid of quads along the length
    for (let i = 0; i < divisions; i++) {
        for (let j = 0; j < divisions; j++) {
            const x1 = (i / divisions) * length - length / 2;
            const x2 = ((i + 1) / divisions) * length - length / 2;
            const y1 = (j / divisions) * width - width / 2;
            const y2 = ((j + 1) / divisions) * width - width / 2;
            // Top face (two triangles per quad)
            // Triangle 1
            vertices.push(x1, y1, height / 2);
            vertices.push(x2, y1, height / 2);
            vertices.push(x2, y2, height / 2);
            // Triangle 2
            vertices.push(x1, y1, height / 2);
            vertices.push(x2, y2, height / 2);
            vertices.push(x1, y2, height / 2);
            // Calculate stress - higher at ends (cantilever beam)
            // For simplicity, stress is proportional to distance from center
            const centerX = (x1 + x2) / 2;
            const distFromCenter = Math.abs(centerX);
            const stress = (distFromCenter / (length / 2)) * 100; // 0-100 MPa
            // Each triangle = 3 vertices, so add stress 6 times (2 triangles)
            for (let k = 0; k < 6; k++) {
                stressValues.push(stress);
            }
        }
    }
    // Convert to STL
    const triangleCount = vertices.length / 9;
    const headerSize = 80;
    const triangleDataSize = 50;
    const bufferSize = headerSize + 4 + triangleCount * triangleDataSize;
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    // Write triangle count
    view.setUint32(80, triangleCount, true);
    let offset = 84;
    for (let i = 0; i < triangleCount; i++) {
        const i0 = i * 9;
        // Calculate normal (pointing up for all top faces)
        view.setFloat32(offset, 0, true);
        view.setFloat32(offset + 4, 0, true);
        view.setFloat32(offset + 8, 1, true);
        offset += 12;
        // Write 3 vertices
        for (let j = 0; j < 3; j++) {
            view.setFloat32(offset, vertices[i0 + j * 3], true);
            view.setFloat32(offset + 4, vertices[i0 + j * 3 + 1], true);
            view.setFloat32(offset + 8, vertices[i0 + j * 3 + 2], true);
            offset += 12;
        }
        // Write attribute byte count
        view.setUint16(offset, 0, true);
        offset += 2;
    }
    return { buffer, stressValues };
}
//# sourceMappingURL=3d-model-viewer.js.map