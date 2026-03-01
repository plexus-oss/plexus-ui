"use client";

import { useThree } from "@react-three/fiber";
import { createContext, type ReactNode, useContext, useEffect, useRef, useState } from "react";
import * as THREE from "three";

// ============================================================================
// 3D Interaction Types
// ============================================================================

export interface Point3D {
  x: number;
  y: number;
  z: number;
  index?: number;
}

export interface BoundingBox3D {
  center: Point3D;
  size: Point3D;
  rotation: { x: number; y: number; z: number };
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
  equation: { a: number; b: number; c: number; d: number };
  selectedPoints: Point3D[];
}

export interface SegmentationRegion {
  points: number[]; // Point indices
  label: string;
  color: string;
}

// ============================================================================
// Point Selection Interaction
// ============================================================================

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

export function PointSelection({
  onSelect,
  onMultiSelect,
  enableMultiSelect = true,
  selectionRadius = 0.5,
  highlightColor = "#00ff00",
  markerSize = 0.3,
}: PointSelectionProps) {
  const { camera, raycaster, scene } = useThree();
  const [selectedPoints, setSelectedPoints] = useState<Point3D[]>([]);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      // Convert mouse position to NDC
      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

      // Find intersected points
      const objects = scene.children.filter(
        (obj) => obj.type === "Points" || obj.name === "point-cloud"
      );

      if (objects.length === 0) return;

      const intersects = raycaster.intersectObjects(objects, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const selectedPoint: Point3D = {
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
        } else {
          setSelectedPoints([selectedPoint]);
        }
      }
    };

    const canvas = document.querySelector("canvas");
    canvas?.addEventListener("click", handleClick);
    return () => canvas?.removeEventListener("click", handleClick);
  }, [camera, raycaster, scene, onSelect, onMultiSelect, enableMultiSelect]);

  return (
    <>
      {selectedPoints.map((point, idx) => (
        <mesh key={idx} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[markerSize, 16, 16]} />
          <meshBasicMaterial color={highlightColor} transparent opacity={0.6} depthTest={false} />
        </mesh>
      ))}
    </>
  );
}

// ============================================================================
// Bounding Box 3D Interaction
// ============================================================================

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

export function BoundingBox3D({
  onBoxComplete,
  onBoxUpdate,
  boxColor = "#00ffff",
  boxOpacity = 0.2,
  enableEdit = true,
  defaultSize = { x: 2, y: 2, z: 2 },
}: BoundingBox3DProps) {
  const { camera, raycaster, scene } = useThree();
  const [currentBox, setCurrentBox] = useState<BoundingBox3D | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point3D | null>(null);
  const boxRef = useRef<THREE.Mesh>(null);

  useEffect(() => {
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button !== 0) return; // Left click only

      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
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

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDrawing || !startPoint) return;

      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
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

        const box: BoundingBox3D = {
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

  if (!currentBox) return null;

  return (
    <mesh
      ref={boxRef}
      position={[currentBox.center.x, currentBox.center.y, currentBox.center.z]}
      rotation={[currentBox.rotation.x, currentBox.rotation.y, currentBox.rotation.z]}
    >
      <boxGeometry args={[currentBox.size.x, currentBox.size.y, currentBox.size.z]} />
      <meshBasicMaterial
        color={boxColor}
        transparent
        opacity={boxOpacity}
        side={THREE.DoubleSide}
      />
      <lineSegments>
        <edgesGeometry
          args={[new THREE.BoxGeometry(currentBox.size.x, currentBox.size.y, currentBox.size.z)]}
        />
        <lineBasicMaterial color={boxColor} linewidth={2} />
      </lineSegments>
    </mesh>
  );
}

// ============================================================================
// Measurement Tool
// ============================================================================

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

export function MeasurementTool({
  onMeasure,
  lineColor = "#ffff00",
  markerColor = "#ffff00",
  showLabel = true,
  unit = "m",
  decimals = 2,
}: MeasurementToolProps) {
  const { camera, raycaster, scene } = useThree();
  const [points, setPoints] = useState<Point3D[]>([]);
  const [_distance, _setDistance] = useState<number>(0);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const newPoint: Point3D = { x: point.x, y: point.y, z: point.z };

        setPoints((prev) => {
          const newPoints = [...prev, newPoint];

          // If we have 2 points, calculate distance
          if (newPoints.length === 2) {
            const p1 = new THREE.Vector3(newPoints[0].x, newPoints[0].y, newPoints[0].z);
            const p2 = new THREE.Vector3(newPoints[1].x, newPoints[1].y, newPoints[1].z);
            const dist = p1.distanceTo(p2);
            _setDistance(dist);

            const measurement: Measurement = {
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

  return (
    <>
      {/* Point markers */}
      {points.map((point, idx) => (
        <mesh key={idx} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color={markerColor} depthTest={false} />
        </mesh>
      ))}

      {/* Line between points */}
      {points.length === 2 && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              args={[
                new Float32Array([
                  points[0].x,
                  points[0].y,
                  points[0].z,
                  points[1].x,
                  points[1].y,
                  points[1].z,
                ]),
                3,
              ]}
              attach="attributes-position"
              count={2}
              array={
                new Float32Array([
                  points[0].x,
                  points[0].y,
                  points[0].z,
                  points[1].x,
                  points[1].y,
                  points[1].z,
                ])
              }
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color={lineColor} linewidth={2} />
        </line>
      )}
    </>
  );
}

// ============================================================================
// Segmentation Brush
// ============================================================================

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

export function SegmentationBrush({
  onRegionComplete,
  brushRadius = 1.0,
  label = "default",
  brushColor = "#ff00ff",
  showCursor = true,
}: SegmentationBrushProps) {
  const { camera, raycaster, scene } = useThree();
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [isPainting, setIsPainting] = useState(false);
  const [cursorPosition, setCursorPosition] = useState<Point3D | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
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

    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        setIsPainting(true);
      }
    };

    const handleMouseUp = () => {
      if (isPainting && selectedIndices.length > 0) {
        const region: SegmentationRegion = {
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

  return (
    <>
      {/* Brush cursor */}
      {showCursor && cursorPosition && (
        <mesh position={[cursorPosition.x, cursorPosition.y, cursorPosition.z]}>
          <sphereGeometry args={[brushRadius, 16, 16]} />
          <meshBasicMaterial
            color={brushColor}
            transparent
            opacity={0.3}
            wireframe
            depthTest={false}
          />
        </mesh>
      )}
    </>
  );
}

// ============================================================================
// Plane Fit Tool
// ============================================================================

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

export function PlaneFit({
  onPlaneFit,
  minPoints = 3,
  planeColor = "#00ffff",
  planeOpacity = 0.4,
  planeSize = 10,
}: PlaneFitProps) {
  const { camera, raycaster, scene } = useThree();
  const [selectedPoints, setSelectedPoints] = useState<Point3D[]>([]);
  const [fittedPlane, setFittedPlane] = useState<PlaneData | null>(null);

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const rect = (event.target as HTMLCanvasElement).getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        const point = intersects[0].point;
        const newPoint: Point3D = { x: point.x, y: point.y, z: point.z };

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

  return (
    <>
      {/* Selected point markers */}
      {selectedPoints.map((point, idx) => (
        <mesh key={idx} position={[point.x, point.y, point.z]}>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshBasicMaterial color="#ffffff" depthTest={false} />
        </mesh>
      ))}

      {/* Fitted plane visualization */}
      {fittedPlane && (
        <mesh position={[fittedPlane.point.x, fittedPlane.point.y, fittedPlane.point.z]}>
          <planeGeometry args={[planeSize, planeSize]} />
          <meshBasicMaterial
            color={planeColor}
            transparent
            opacity={planeOpacity}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Fit plane to points using least squares
 */
function fitPlaneToPoints(points: Point3D[]): PlaneData {
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

// ============================================================================
// Context for Interaction State (Optional)
// ============================================================================

interface PointCloudInteractionsContextType {
  activeInteraction: "select" | "box" | "measure" | "segment" | "plane" | null;
  setActiveInteraction: (
    interaction: "select" | "box" | "measure" | "segment" | "plane" | null
  ) => void;
}

const PointCloudInteractionsContext = createContext<PointCloudInteractionsContextType | null>(null);

export function usePointCloudInteractions() {
  const ctx = useContext(PointCloudInteractionsContext);
  if (!ctx) {
    throw new Error("usePointCloudInteractions must be used within PointCloudInteractionsProvider");
  }
  return ctx;
}

// ============================================================================
// Combined Interactions Component (Convenience)
// ============================================================================

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
export function PointCloudInteractions({
  mode = null,
  children,
  onPointSelect,
  onPointsSelect,
  onBoxComplete,
  onMeasure,
  onSegmentComplete,
  onPlaneFit,
}: PointCloudInteractionsProps) {
  const [_activeInteraction, setActiveInteraction] = useState(mode);

  useEffect(() => {
    setActiveInteraction(mode);
  }, [mode]);

  // If children provided, use composable API
  if (children) {
    return <>{children}</>;
  }

  // Otherwise use mode-based API
  return (
    <>
      {mode === "select" && (
        <PointSelection onSelect={onPointSelect} onMultiSelect={onPointsSelect} />
      )}
      {mode === "box" && <BoundingBox3D onBoxComplete={onBoxComplete} />}
      {mode === "measure" && <MeasurementTool onMeasure={onMeasure} />}
      {mode === "segment" && <SegmentationBrush onRegionComplete={onSegmentComplete} />}
      {mode === "plane" && <PlaneFit onPlaneFit={onPlaneFit} />}
    </>
  );
}

// Export primitive components
PointCloudInteractions.PointSelection = PointSelection;
PointCloudInteractions.BoundingBox3D = BoundingBox3D;
PointCloudInteractions.MeasurementTool = MeasurementTool;
PointCloudInteractions.SegmentationBrush = SegmentationBrush;
PointCloudInteractions.PlaneFit = PlaneFit;
