import { type ReactNode } from "react";
export interface ModelViewerProps {
    modelUrl?: string;
    modelType?: "stl" | "obj" | "gltf" | "glb";
    modelData?: Float32Array | ArrayBuffer;
    vertexColors?: number[];
    colorScale?: (value: number) => string;
    minValue?: number;
    maxValue?: number;
    width?: number | string;
    height?: number | string;
    showGrid?: boolean;
    showAxes?: boolean;
    cameraPosition?: [number, number, number];
    backgroundColor?: string;
    className?: string;
    autoRotate?: boolean;
    wireframe?: boolean;
    metalness?: number;
    roughness?: number;
}
declare function Scene(): import("react/jsx-runtime").JSX.Element;
declare function ModelCanvas(): import("react/jsx-runtime").JSX.Element;
declare function Root({ children, modelUrl, modelType, modelData, vertexColors, colorScale, minValue, maxValue, showGrid, showAxes, cameraPosition, backgroundColor, autoRotate, wireframe, metalness, roughness, width, height, className, }: ModelViewerProps & {
    children?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare const ModelViewer: ((props: ModelViewerProps) => import("react/jsx-runtime").JSX.Element) & {
    Root: typeof Root;
    Canvas: typeof ModelCanvas;
    Scene: typeof Scene;
};
/**
 * Generate a simple cube STL for testing
 */
export declare function generateCubeSTL(): ArrayBuffer;
/**
 * Generate a beam/bracket STL with realistic stress distribution
 */
export declare function generateBeamSTL(divisions?: number): {
    buffer: ArrayBuffer;
    stressValues: number[];
};
export {};
//# sourceMappingURL=3d-model-viewer.d.ts.map