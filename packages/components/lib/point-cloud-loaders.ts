/**
 * Point Cloud File Loaders
 *
 * Utilities for loading various point cloud file formats:
 * - XYZ: Simple text format (x y z [intensity] [r g b])
 * - PCD: Point Cloud Data format (ASCII and binary)
 * - LAS/LAZ: LIDAR data format (requires decompression for LAZ)
 */

import type { PointCloudData } from "../charts/point-cloud-viewer";

// ============================================================================
// XYZ Loader (Simple text format)
// ============================================================================

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
export async function loadXYZ(fileOrUrl: File | string): Promise<PointCloudData> {
  const text =
    typeof fileOrUrl === "string"
      ? await fetch(fileOrUrl).then((r) => r.text())
      : await fileOrUrl.text();

  const lines = text.split("\n").filter((line) => line.trim().length > 0);

  const positions: number[] = [];
  const intensities: number[] = [];
  const colors: number[] = [];

  let hasIntensity = false;
  let hasColor = false;

  for (const line of lines) {
    const parts = line.trim().split(/\s+/).map(Number);

    if (parts.length < 3) continue;

    // x, y, z (required)
    positions.push(parts[0], parts[1], parts[2]);

    // Optional intensity
    if (parts.length >= 4) {
      intensities.push(parts[3]);
      hasIntensity = true;
    }

    // Optional RGB
    if (parts.length >= 7) {
      colors.push(parts[4], parts[5], parts[6]);
      hasColor = true;
    }
  }

  const data: PointCloudData = {
    positions: new Float32Array(positions),
  };

  if (hasIntensity) {
    data.intensities = new Float32Array(intensities);
  }

  if (hasColor) {
    data.colors = new Uint8Array(colors);
  }

  return data;
}

// ============================================================================
// PCD Loader (Point Cloud Data format)
// ============================================================================

interface PCDHeader {
  version: string;
  fields: string[];
  size: number[];
  type: string[];
  count: number[];
  width: number;
  height: number;
  viewpoint: number[];
  points: number;
  data: "ascii" | "binary" | "binary_compressed";
}

/**
 * Parse PCD header
 */
function parsePCDHeader(text: string): {
  header: PCDHeader;
  dataStart: number;
} {
  const lines = text.split("\n");
  const header: Partial<PCDHeader> = {};
  let dataStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith("#")) continue;
    if (line === "") continue;

    const [key, ...values] = line.split(/\s+/);

    switch (key) {
      case "VERSION":
        header.version = values.join(" ");
        break;
      case "FIELDS":
        header.fields = values;
        break;
      case "SIZE":
        header.size = values.map(Number);
        break;
      case "TYPE":
        header.type = values;
        break;
      case "COUNT":
        header.count = values.map(Number);
        break;
      case "WIDTH":
        header.width = Number(values[0]);
        break;
      case "HEIGHT":
        header.height = Number(values[0]);
        break;
      case "VIEWPOINT":
        header.viewpoint = values.map(Number);
        break;
      case "POINTS":
        header.points = Number(values[0]);
        break;
      case "DATA":
        header.data = values[0] as "ascii" | "binary" | "binary_compressed";
        dataStart = text.indexOf(line) + line.length + 1;
        break;
    }

    if (key === "DATA") break;
  }

  return {
    header: header as PCDHeader,
    dataStart,
  };
}

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
export async function loadPCD(fileOrUrl: File | string): Promise<PointCloudData> {
  const text =
    typeof fileOrUrl === "string"
      ? await fetch(fileOrUrl).then((r) => r.text())
      : await fileOrUrl.text();

  const { header, dataStart } = parsePCDHeader(text);

  if (header.data === "binary" || header.data === "binary_compressed") {
    throw new Error("Binary PCD format not yet supported. Use ASCII format or convert file.");
  }

  // Parse ASCII data
  const dataText = text.substring(dataStart);
  const lines = dataText.split("\n").filter((line) => line.trim().length > 0);

  const xIndex = header.fields.indexOf("x");
  const yIndex = header.fields.indexOf("y");
  const zIndex = header.fields.indexOf("z");
  const intensityIndex = header.fields.indexOf("intensity");
  const rgbIndex = header.fields.indexOf("rgb");
  const rIndex = header.fields.indexOf("r");
  const gIndex = header.fields.indexOf("g");
  const bIndex = header.fields.indexOf("b");

  const positions: number[] = [];
  const intensities: number[] = [];
  const colors: number[] = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/).map(Number);

    if (xIndex !== -1 && yIndex !== -1 && zIndex !== -1) {
      positions.push(parts[xIndex], parts[yIndex], parts[zIndex]);
    }

    if (intensityIndex !== -1) {
      intensities.push(parts[intensityIndex]);
    }

    // Handle RGB packed as single uint32
    if (rgbIndex !== -1) {
      const rgb = parts[rgbIndex];
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = rgb & 0xff;
      colors.push(r, g, b);
    }
    // Handle separate R, G, B fields
    else if (rIndex !== -1 && gIndex !== -1 && bIndex !== -1) {
      colors.push(parts[rIndex], parts[gIndex], parts[bIndex]);
    }
  }

  const data: PointCloudData = {
    positions: new Float32Array(positions),
  };

  if (intensities.length > 0) {
    data.intensities = new Float32Array(intensities);
  }

  if (colors.length > 0) {
    data.colors = new Uint8Array(colors);
  }

  return data;
}

// ============================================================================
// LAS Loader (LIDAR format - simplified)
// ============================================================================

/**
 * LAS Point Data Record Format 0-3
 * This is a simplified parser for demonstration
 * For production use, consider using a library like "laz-perf" or "copc.js"
 */

interface LASHeader {
  fileSignature: string;
  pointDataFormat: number;
  pointDataRecordLength: number;
  numberOfPointRecords: number;
  offsetToPointData: number;
  scaleX: number;
  scaleY: number;
  scaleZ: number;
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  minX: number;
  minY: number;
  minZ: number;
  maxX: number;
  maxY: number;
  maxZ: number;
}

/**
 * Parse LAS header (1.2-1.4 format)
 */
function parseLASHeader(buffer: ArrayBuffer): LASHeader {
  const view = new DataView(buffer);

  // File signature (should be "LASF")
  const fileSignature = String.fromCharCode(
    view.getUint8(0),
    view.getUint8(1),
    view.getUint8(2),
    view.getUint8(3)
  );

  if (fileSignature !== "LASF") {
    throw new Error("Invalid LAS file: Missing LASF signature");
  }

  // Header fields
  const offsetToPointData = view.getUint32(96, true);
  const pointDataFormat = view.getUint8(104);
  const pointDataRecordLength = view.getUint16(105, true);
  const numberOfPointRecords = view.getUint32(107, true);

  // Scale and offset
  const scaleX = view.getFloat64(131, true);
  const scaleY = view.getFloat64(139, true);
  const scaleZ = view.getFloat64(147, true);
  const offsetX = view.getFloat64(155, true);
  const offsetY = view.getFloat64(163, true);
  const offsetZ = view.getFloat64(171, true);

  // Bounds
  const maxX = view.getFloat64(179, true);
  const minX = view.getFloat64(187, true);
  const maxY = view.getFloat64(195, true);
  const minY = view.getFloat64(203, true);
  const maxZ = view.getFloat64(211, true);
  const minZ = view.getFloat64(219, true);

  return {
    fileSignature,
    pointDataFormat,
    pointDataRecordLength,
    numberOfPointRecords,
    offsetToPointData,
    scaleX,
    scaleY,
    scaleZ,
    offsetX,
    offsetY,
    offsetZ,
    minX,
    minY,
    minZ,
    maxX,
    maxY,
    maxZ,
  };
}

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
export async function loadLAS(
  fileOrUrl: File | string,
  options: {
    maxPoints?: number;
    stride?: number; // Load every Nth point
  } = {}
): Promise<PointCloudData> {
  const buffer =
    typeof fileOrUrl === "string"
      ? await fetch(fileOrUrl).then((r) => r.arrayBuffer())
      : await fileOrUrl.arrayBuffer();

  const header = parseLASHeader(buffer);
  const { maxPoints = header.numberOfPointRecords, stride = 1 } = options;

  const view = new DataView(buffer);
  const positions: number[] = [];
  const intensities: number[] = [];
  const classifications: number[] = [];
  const colors: number[] = [];

  const pointsToLoad = Math.min(maxPoints, Math.floor(header.numberOfPointRecords / stride));

  let offset = header.offsetToPointData;

  for (let i = 0; i < header.numberOfPointRecords && positions.length / 3 < pointsToLoad; i++) {
    // Skip points based on stride
    if (i % stride !== 0) {
      offset += header.pointDataRecordLength;
      continue;
    }

    // Read X, Y, Z (32-bit integers)
    const x = view.getInt32(offset, true);
    const y = view.getInt32(offset + 4, true);
    const z = view.getInt32(offset + 8, true);

    // Apply scale and offset
    const scaledX = x * header.scaleX + header.offsetX;
    const scaledY = y * header.scaleY + header.offsetY;
    const scaledZ = z * header.scaleZ + header.offsetZ;

    positions.push(scaledX, scaledY, scaledZ);

    // Read intensity (16-bit)
    const intensity = view.getUint16(offset + 12, true);
    intensities.push(intensity / 65535); // Normalize to 0-1

    // Read classification (byte)
    let classification: number;
    if (header.pointDataFormat <= 5) {
      classification = view.getUint8(offset + 15);
    } else {
      classification = view.getUint8(offset + 16);
    }
    classifications.push(classification);

    // Read RGB if available (formats 2, 3, 5, 7, 8)
    if (
      header.pointDataFormat === 2 ||
      header.pointDataFormat === 3 ||
      header.pointDataFormat === 5 ||
      header.pointDataFormat === 7 ||
      header.pointDataFormat === 8
    ) {
      const rgbOffset = header.pointDataFormat <= 5 ? offset + 20 : offset + 30;
      const r = view.getUint16(rgbOffset, true) / 256; // Scale 16-bit to 8-bit
      const g = view.getUint16(rgbOffset + 2, true) / 256;
      const b = view.getUint16(rgbOffset + 4, true) / 256;
      colors.push(r, g, b);
    }

    offset += header.pointDataRecordLength;
  }

  const data: PointCloudData = {
    positions: new Float32Array(positions),
    intensities: new Float32Array(intensities),
    classifications: new Uint8Array(classifications),
  };

  if (colors.length > 0) {
    data.colors = new Uint8Array(colors);
  }

  return data;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Detect point cloud file format from filename or file
 */
export function detectFormat(fileOrUrl: File | string): "xyz" | "pcd" | "las" | "laz" | "unknown" {
  const filename = typeof fileOrUrl === "string" ? fileOrUrl : fileOrUrl.name;
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "xyz":
      return "xyz";
    case "pcd":
      return "pcd";
    case "las":
      return "las";
    case "laz":
      return "laz";
    default:
      return "unknown";
  }
}

/**
 * Auto-load point cloud based on file extension
 */
export async function loadPointCloud(
  fileOrUrl: File | string,
  options: {
    maxPoints?: number;
    stride?: number;
  } = {}
): Promise<PointCloudData> {
  const format = detectFormat(fileOrUrl);

  switch (format) {
    case "xyz":
      return loadXYZ(fileOrUrl);
    case "pcd":
      return loadPCD(fileOrUrl);
    case "las":
      return loadLAS(fileOrUrl, options);
    case "laz":
      throw new Error(
        "LAZ (compressed) format requires decompression library. Use LAS format or decompress first."
      );
    default:
      throw new Error(`Unsupported file format: ${format}`);
  }
}

/**
 * Subsample point cloud (simple uniform subsampling)
 */
export function subsamplePointCloud(data: PointCloudData, targetPoints: number): PointCloudData {
  const numPoints = data.positions.length / 3;
  if (numPoints <= targetPoints) return data;

  const stride = Math.ceil(numPoints / targetPoints);
  const positions: number[] = [];
  const intensities: number[] = [];
  const classifications: number[] = [];
  const colors: number[] = [];

  for (let i = 0; i < numPoints; i += stride) {
    positions.push(data.positions[i * 3], data.positions[i * 3 + 1], data.positions[i * 3 + 2]);

    if (data.intensities) {
      intensities.push(data.intensities[i]);
    }

    if (data.classifications) {
      classifications.push(data.classifications[i]);
    }

    if (data.colors) {
      colors.push(data.colors[i * 3], data.colors[i * 3 + 1], data.colors[i * 3 + 2]);
    }
  }

  const result: PointCloudData = {
    positions: new Float32Array(positions),
  };

  if (intensities.length > 0) {
    result.intensities = new Float32Array(intensities);
  }

  if (classifications.length > 0) {
    result.classifications = new Uint8Array(classifications);
  }

  if (colors.length > 0) {
    result.colors = new Uint8Array(colors);
  }

  return result;
}
