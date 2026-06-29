/** biome-ignore-all lint/a11y/noStaticElementInteractions: <group>/<points> are react-three-fiber primitives (3D scene objects), not DOM elements, so DOM a11y rules don't apply. */
/**
 * Globe — a premium, framework-generic 3D Earth + satellite visualisation.
 *
 * Renders a dark, Linear-grade globe with a glowing atmosphere, orbital paths,
 * crisp satellite markers (individual glowing meshes or a single GPU `Points`
 * cloud for large constellations), ground stations and ground tracks.
 *
 * Built on `three` + `@react-three/fiber` + `@react-three/drei` and the pure
 * orbital-mechanics core in `lib/orbital`. No framework, API or device coupling.
 *
 * ## Compound API
 *
 * ```tsx
 * import { Globe } from "@plexusui/components/charts/3d";
 *
 * // All-in-one
 * <Globe satellites={sats} groundStations={stations} />
 *
 * // Composable
 * <Globe.Root satellites={sats}>
 *   <Globe.Surface />
 *   <Globe.Atmosphere />
 *   <Globe.OrbitPaths />
 *   <Globe.Satellites />
 *   <Globe.GroundStations />
 *   <Globe.Controls />
 * </Globe.Root>
 * ```
 *
 * ## Coordinate frames (the GMST crux)
 *
 * SGP4 yields positions in the inertial ECI frame; orbital paths are likewise
 * ECI. To glue them to the Earth-fixed (ECEF) globe, satellites **and** their
 * orbit paths are rendered inside a group whose `rotation.y` is set to
 * `-gmstAngle(date)` every frame. Ground stations and ground tracks are already
 * Earth-fixed (geodetic → ECEF) and render outside that group.
 *
 * @module charts/globe
 */
"use client";

import { OrbitControls, useTexture } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  createContext,
  type ReactNode,
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useRef,
} from "react";
import * as THREE from "three";
import {
  calculateKeplerianPosition,
  EARTH_RADIUS_KM,
  eciToScenePosition,
  generateGroundTrack,
  generateKeplerianPath,
  generateOrbitalPath,
  gmstAngle,
  type KeplerianElements,
  latLngAltToPosition,
  orbitKey,
  parseSatrec,
  propagateSatrec,
  SCENE_SCALE,
  sunDirection,
  type Vec3,
} from "../lib/orbital";
import { usePropagationWorker } from "./use-propagation-worker";

// ============================================================================
// Public types
// ============================================================================

/** A satellite to plot: either a TLE (SGP4) or basic Keplerian elements. */
export interface SatelliteInput {
  /** Stable identifier (returned to `onSelectSatellite`). */
  id: string;
  /** Two-Line Element set — propagated with SGP4 (preferred). */
  tle?: { line1: string; line2: string };
  /** Keplerian elements — a circular-orbit fallback when no TLE is available. */
  elements?: {
    inclination: number;
    raan: number;
    orbitalPeriod: number;
    initialPhase?: number;
    altitudeKm?: number;
  };
  /** Marker colour (CSS string). */
  color?: string;
  /** Optional human-readable label. */
  label?: string;
}

/** A fixed point on the surface (ground station, site of interest, …). */
export interface GroundMarker {
  id: string;
  lat: number;
  lng: number;
  color?: string;
  label?: string;
}

export interface GlobeProps {
  /** Satellites to render. */
  satellites?: SatelliteInput[];
  /** Earth-fixed ground markers. */
  groundStations?: GroundMarker[];
  /** Optional day-surface texture URL (procedural shading is used if omitted). */
  textureUrl?: string;
  /** Optional night-surface texture URL (city lights). */
  nightTextureUrl?: string;
  /** Optional cloud texture URL. With day+night+clouds+bump set, the globe uses
   * the realistic day/night shader with a physically-placed sun terminator. */
  cloudsTextureUrl?: string;
  /** Optional bump/elevation texture URL (terrain relief). */
  bumpTextureUrl?: string;
  /** Render the cloud layer when a cloud texture is supplied. @default true */
  showClouds?: boolean;
  /** Show the glowing atmosphere shell. @default true */
  showAtmosphere?: boolean;
  /** Show orbital paths. @default true */
  showOrbitalPaths?: boolean;
  /** Show sub-satellite ground tracks. @default false */
  showGroundTracks?: boolean;
  /** Ground-track duration, minutes. @default 90 */
  groundTrackDurationMin?: number;
  /** Switch to single-draw GPU points at/above this satellite count. @default 30 */
  pointsThreshold?: number;
  /** Cap on rendered orbital paths (identical orbits are deduped). @default 100 */
  maxOrbitalPaths?: number;
  /**
   * Use a Web Worker for propagation. Defaults to `true` only when the
   * satellite count exceeds `pointsThreshold`; falls back to the main thread.
   */
  useWorker?: boolean;
  /** Propagation throttle, ms. @default 200 */
  propagationIntervalMs?: number;
  /** Freeze time at this epoch (ms). Omit for live propagation. */
  epochOverride?: number;
  /** Container width. @default "100%" */
  width?: number | string;
  /** Container height. @default "500px" */
  height?: number | string;
  /** Initial camera position. @default [0, 6, 22] */
  cameraPosition?: [number, number, number];
  /** Minimum zoom distance. @default 8 */
  minDistance?: number;
  /** Maximum zoom distance. @default 300 */
  maxDistance?: number;
  /** Canvas background (CSS colour or "transparent"). @default "#05070d" */
  backgroundColor?: string;
  /** Auto-rotate the camera. @default false */
  autoRotate?: boolean;
  /** Allow drag-to-orbit. @default true */
  enableRotate?: boolean;
  /** Allow mouse-wheel / pinch zoom. Set false in a scrollable page so the
   * wheel scrolls the page instead of zooming the globe. @default true */
  enableZoom?: boolean;
  /** Called with a satellite id when its marker is clicked. */
  onSelectSatellite?: (id: string) => void;
  /** Container class name. */
  className?: string;
  /** Composable children (when using `Globe.Root` directly). */
  children?: ReactNode;
}

// ============================================================================
// Context
// ============================================================================

interface GlobeContextValue {
  satellites: SatelliteInput[];
  groundStations: GroundMarker[];
  textureUrl?: string;
  nightTextureUrl?: string;
  cloudsTextureUrl?: string;
  bumpTextureUrl?: string;
  showClouds: boolean;
  showAtmosphere: boolean;
  showOrbitalPaths: boolean;
  showGroundTracks: boolean;
  groundTrackDurationMin: number;
  pointsThreshold: number;
  maxOrbitalPaths: number;
  useWorker?: boolean;
  propagationIntervalMs: number;
  epochOverride?: number;
  minDistance: number;
  maxDistance: number;
  autoRotate: boolean;
  enableRotate: boolean;
  enableZoom: boolean;
  onSelectSatellite?: (id: string) => void;
}

const GlobeContext = createContext<GlobeContextValue | null>(null);

function useGlobe(): GlobeContextValue {
  const ctx = useContext(GlobeContext);
  if (!ctx) {
    throw new Error("Globe components must be used within Globe.Root");
  }
  return ctx;
}

// ============================================================================
// Constants & helpers
// ============================================================================

const GLOBE_RADIUS = EARTH_RADIUS_KM * SCENE_SCALE; // ≈ 6.371 scene units
const DEFAULT_SAT_COLOR = "#22d3ee";
const DEFAULT_PATH_COLOR = "#3b82f6";
const DEFAULT_STATION_COLOR = "#f59e0b";
const ATMOSPHERE_COLOR = "#4ea1ff";
const PATH_SEGMENTS = 128;

/** Current epoch for this frame (frozen if `epochOverride` is set). */
function nowMs(epochOverride?: number): number {
  return epochOverride ?? Date.now();
}

function toVector3(v: Vec3): THREE.Vector3 {
  return new THREE.Vector3(v.x, v.y, v.z);
}

/** Soft round radial-gradient sprite so GPU points read as dots, not squares. */
function makeCircleTexture(): THREE.CanvasTexture | null {
  if (typeof document === "undefined") return null;
  const SIZE = 64;
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const grad = ctx.createRadialGradient(SIZE / 2, SIZE / 2, 0, SIZE / 2, SIZE / 2, SIZE / 2);
  grad.addColorStop(0, "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.85)");
  grad.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, SIZE, SIZE);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

/**
 * A group rotated by `-gmstAngle` each frame so ECI children (satellites and
 * orbit paths) stay glued to the Earth-fixed globe. Each part owns one; since
 * the rotation is a pure function of time they remain perfectly in sync.
 */
function GmstGroup({ children }: { children: ReactNode }) {
  const { epochOverride } = useGlobe();
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.y = -gmstAngle(new Date(nowMs(epochOverride)));
    }
  });
  return <group ref={ref}>{children}</group>;
}

// ============================================================================
// Surface
// ============================================================================

// Day/night earth shader: day map on the sunlit side, city lights on the dark
// side, a soft terminator, clouds and bump relief. `sunDirection` is driven from
// the real subsolar point so the terminator matches actual geography + time.
const EARTH_VERT = /* glsl */ `
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vPositionWorld;
varying vec3 vTangent;
varying vec3 vBitangent;
void main() {
  vUv = uv;
  vNormalWorld = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vPositionWorld = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 t = normalize(cross(vec3(0.0, 1.0, 0.0), normal));
  if (length(t) < 0.01) t = normalize(cross(vec3(1.0, 0.0, 0.0), normal));
  vec3 b = normalize(cross(normal, t));
  vTangent = normalize((modelMatrix * vec4(t, 0.0)).xyz);
  vBitangent = normalize((modelMatrix * vec4(b, 0.0)).xyz);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const EARTH_FRAG = /* glsl */ `
uniform sampler2D dayMap;
uniform sampler2D nightMap;
uniform sampler2D cloudsMap;
uniform sampler2D bumpMap;
uniform vec3 sunDirection;
uniform float cloudOpacity;
varying vec2 vUv;
varying vec3 vNormalWorld;
varying vec3 vPositionWorld;
varying vec3 vTangent;
varying vec3 vBitangent;
void main() {
  vec4 dayColor = texture2D(dayMap, vUv);
  vec4 nightColor = texture2D(nightMap, vUv);
  vec4 clouds = texture2D(cloudsMap, vUv);

  float bumpScale = 0.02;
  vec2 texelSize = vec2(1.0 / 2048.0);
  float heightL = texture2D(bumpMap, vUv - vec2(texelSize.x, 0.0)).r;
  float heightR = texture2D(bumpMap, vUv + vec2(texelSize.x, 0.0)).r;
  float heightD = texture2D(bumpMap, vUv - vec2(0.0, texelSize.y)).r;
  float heightU = texture2D(bumpMap, vUv + vec2(0.0, texelSize.y)).r;

  vec3 bumpNormal = normalize(vNormalWorld);
  bumpNormal += vTangent * (heightL - heightR) * bumpScale;
  bumpNormal += vBitangent * (heightD - heightU) * bumpScale;
  bumpNormal = normalize(bumpNormal);

  vec3 sunDir = normalize(sunDirection);
  float sunDot = dot(bumpNormal, sunDir);
  float sunDotBase = dot(normalize(vNormalWorld), sunDir);

  float dayFactor = smoothstep(-0.1, 0.2, sunDotBase);

  vec3 dayLit = dayColor.rgb * (0.15 + 0.85 * max(0.0, sunDot));

  float nightLightIntensity = max(nightColor.r, max(nightColor.g, nightColor.b));
  vec3 cityLights = nightColor.rgb * nightLightIntensity * 0.5;
  vec3 nightAmbient = dayColor.rgb * 0.03;
  vec3 nightLit = nightAmbient + cityLights;

  vec3 earthColor = mix(nightLit, dayLit, dayFactor);

  float cloudAlpha = clouds.r * cloudOpacity;
  float cloudBrightness = 0.95 + 0.05 * max(0.0, sunDotBase);
  vec3 cloudColor = vec3(cloudBrightness);
  float cloudVisibility = mix(0.15, 1.0, dayFactor);
  earthColor = mix(earthColor, cloudColor, cloudAlpha * cloudVisibility);

  vec3 viewDir = normalize(cameraPosition - vPositionWorld);
  float rim = 1.0 - max(0.0, dot(viewDir, bumpNormal));
  rim = pow(rim, 4.0);
  vec3 rimColor = vec3(0.2, 0.4, 0.8) * rim * 0.2 * dayFactor;

  gl_FragColor = vec4(earthColor + rimColor, 1.0);
}
`;

function RealisticSurface() {
  const {
    textureUrl,
    nightTextureUrl,
    cloudsTextureUrl,
    bumpTextureUrl,
    showClouds,
    epochOverride,
  } = useGlobe();
  // useTexture suspends; Globe.Root wraps the scene in <Suspense>.
  const tex = useTexture({
    day: textureUrl as string,
    night: nightTextureUrl as string,
    clouds: cloudsTextureUrl as string,
    bump: bumpTextureUrl as string,
  });
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(() => {
    // Match the frontend: feed the maps to the custom shader raw (no sRGB
    // decode). A custom ShaderMaterial bypasses three's output encoding, so an
    // sRGB-decoded texture would render dark/flat instead of display-ready.
    tex.day.colorSpace = THREE.NoColorSpace;
    tex.night.colorSpace = THREE.NoColorSpace;
    return {
      dayMap: { value: tex.day },
      nightMap: { value: tex.night },
      cloudsMap: { value: tex.clouds },
      bumpMap: { value: tex.bump },
      sunDirection: { value: new THREE.Vector3(1, 0.2, 0).normalize() },
      cloudOpacity: { value: showClouds ? 0.5 : 0 },
    };
  }, [tex, showClouds]);

  useFrame(() => {
    if (!matRef.current) return;
    const s = sunDirection(new Date(nowMs(epochOverride)));
    matRef.current.uniforms.sunDirection.value.set(s.x, s.y, s.z);
  });

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 256, 128]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={EARTH_VERT}
        fragmentShader={EARTH_FRAG}
      />
    </mesh>
  );
}

function TexturedSurface({ url, nightUrl }: { url: string; nightUrl?: string }) {
  const urls = nightUrl ? [url, nightUrl] : [url];
  const textures = useTexture(urls);
  const [dayMap, nightMap] = Array.isArray(textures) ? textures : [textures];
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <meshStandardMaterial
        map={dayMap}
        emissiveMap={nightMap ?? undefined}
        emissive={nightMap ? new THREE.Color("#ffffff") : new THREE.Color("#000000")}
        emissiveIntensity={nightMap ? 0.6 : 0}
        roughness={0.85}
        metalness={0.0}
      />
    </mesh>
  );
}

function ProceduralSurface() {
  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS, 96, 96]} />
      <meshStandardMaterial
        color="#0b2545"
        emissive="#04101f"
        emissiveIntensity={0.6}
        roughness={0.9}
        metalness={0.05}
      />
    </mesh>
  );
}

function Surface() {
  const { textureUrl, nightTextureUrl, cloudsTextureUrl, bumpTextureUrl } = useGlobe();
  if (textureUrl && nightTextureUrl && cloudsTextureUrl && bumpTextureUrl) {
    return <RealisticSurface />;
  }
  if (textureUrl) {
    return <TexturedSurface url={textureUrl} nightUrl={nightTextureUrl} />;
  }
  return <ProceduralSurface />;
}

// ============================================================================
// Atmosphere
// ============================================================================

const ATMOSPHERE_VERT = /* glsl */ `
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
void main() {
  vWorldNormal = normalize(mat3(modelMatrix) * normal);
  vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// A thin Fresnel limb that scatters where the atmosphere is lit: bright on the
// sunward edge, fading into the night side — not a fixed screen-axis halo.
const ATMOSPHERE_FRAG = /* glsl */ `
uniform vec3 glowColor;
uniform vec3 sunDirection;
varying vec3 vWorldNormal;
varying vec3 vWorldPos;
void main() {
  vec3 N = normalize(vWorldNormal);
  vec3 viewDir = normalize(cameraPosition - vWorldPos);
  float rim = pow(1.0 - max(dot(viewDir, N), 0.0), 3.5);
  float dayside = smoothstep(-0.35, 0.45, dot(N, normalize(sunDirection)));
  float intensity = rim * mix(0.04, 1.0, dayside);
  gl_FragColor = vec4(glowColor * intensity, intensity);
}
`;

function Atmosphere() {
  const { epochOverride } = useGlobe();
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(
    () => ({
      glowColor: { value: new THREE.Color(ATMOSPHERE_COLOR) },
      sunDirection: { value: new THREE.Vector3(1, 0.2, 0).normalize() },
    }),
    []
  );

  useFrame(() => {
    if (!matRef.current) return;
    const s = sunDirection(new Date(nowMs(epochOverride)));
    matRef.current.uniforms.sunDirection.value.set(s.x, s.y, s.z);
  });

  return (
    <mesh>
      <sphereGeometry args={[GLOBE_RADIUS * 1.025, 64, 64]} />
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        vertexShader={ATMOSPHERE_VERT}
        fragmentShader={ATMOSPHERE_FRAG}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// Satellites
// ============================================================================

/** A single glowing satellite marker (emissive core + soft glow shell). */
function MeshSatellite({ sat, mode }: { sat: SatelliteInput; mode: "eci" | "kepler" }) {
  const { propagationIntervalMs, epochOverride, onSelectSatellite } = useGlobe();
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const lastProp = useRef(0);
  const { camera } = useThree();
  const color = sat.color ?? DEFAULT_SAT_COLOR;
  // Parse the TLE once per satellite, not on every propagation tick.
  const satrec = useMemo(
    () => (sat.tle ? parseSatrec(sat.tle) : null),
    [sat.tle?.line1, sat.tle?.line2]
  );

  useFrame((state) => {
    const t = state.clock.elapsedTime * 1000;
    if (t - lastProp.current >= propagationIntervalMs) {
      lastProp.current = t;
      const ms = nowMs(epochOverride);
      let v: Vec3 | null = null;
      if (mode === "eci" && satrec) {
        const r = propagateSatrec(satrec, new Date(ms));
        if (r) v = eciToScenePosition(r.positionEci);
      } else if (mode === "kepler" && sat.elements) {
        v = calculateKeplerianPosition(ms, sat.elements);
      }
      if (v && groupRef.current) groupRef.current.position.set(v.x, v.y, v.z);
    }

    if (groupRef.current) {
      const camDist = camera.position.distanceTo(groupRef.current.position);
      const scale = THREE.MathUtils.clamp(camDist / 24, 0.35, 1.4);
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.08;
      coreRef.current?.scale.setScalar(scale * pulse);
      glowRef.current?.scale.setScalar(scale * pulse);
    }
  });

  return (
    <group
      ref={groupRef}
      onClick={(e) => {
        e.stopPropagation();
        onSelectSatellite?.(sat.id);
      }}
      onPointerOver={() => {
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (typeof document !== "undefined") document.body.style.cursor = "auto";
      }}
    >
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.16, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.22} depthWrite={false} />
      </mesh>
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/** Large constellations: one GPU `Points` draw call, soft round dots. */
function SatellitePoints({ sats }: { sats: SatelliteInput[] }) {
  const { pointsThreshold, useWorker, propagationIntervalMs, epochOverride, onSelectSatellite } =
    useGlobe();
  const count = sats.length;
  const pointsRef = useRef<THREE.Points>(null);
  // Start "behind" the far plane so unfilled points (before the first
  // propagation / worker round-trip) are clipped rather than piling up as a
  // blob at the globe's center.
  const lastProp = useRef(Number.NEGATIVE_INFINITY);
  const boundsSet = useRef(false);

  const useWorkerResolved = useWorker ?? count > pointsThreshold;
  const workerInput = useMemo(
    () =>
      useWorkerResolved && typeof window !== "undefined"
        ? sats.map((s) => ({ id: s.id, line1: s.tle!.line1, line2: s.tle!.line2 }))
        : [],
    [sats, useWorkerResolved]
  );
  const { positionsRef, propagate, ready } = usePropagationWorker(workerInput);

  const positionArray = useMemo(() => {
    // Park unfilled points far beyond the far plane (clipped → invisible).
    const arr = new Float32Array(count * 3);
    arr.fill(1e6);
    return arr;
  }, [count]);
  const colorArray = useMemo(() => {
    const arr = new Float32Array(count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < count; i++) {
      c.set(sats[i].color ?? DEFAULT_SAT_COLOR);
      arr[i * 3] = c.r;
      arr[i * 3 + 1] = c.g;
      arr[i * 3 + 2] = c.b;
    }
    return arr;
  }, [sats, count]);

  // Parse each TLE once for the main-thread fallback (reused per tick instead of
  // re-running twoline2satrec every frame). Skip entirely when the worker owns
  // propagation — it parses the TLEs off-thread, so doing it here would just
  // block the main thread with redundant work on every satellite-set change.
  const satrecs = useMemo(
    () => (useWorkerResolved ? [] : sats.map((s) => (s.tle ? parseSatrec(s.tle) : null))),
    [sats, useWorkerResolved]
  );

  const circleTexture = useMemo(() => makeCircleTexture(), []);
  useEffect(() => () => circleTexture?.dispose(), [circleTexture]);

  useFrame((state) => {
    if (!pointsRef.current) return;

    // Pin a fixed broad-phase bounding sphere once. Points.raycast lazily
    // computes (and caches forever) the bounding sphere on first hover; if that
    // happens before the buffer is filled it locks to ~radius 0 and silently
    // breaks click-selection. A fixed sphere covering any orbit avoids that.
    if (!boundsSet.current) {
      pointsRef.current.geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 100);
      boundsSet.current = true;
    }

    // Zoom-aware point size (screen pixels, sizeAttenuation disabled).
    const material = pointsRef.current.material as THREE.PointsMaterial;
    const d = state.camera.position.length();
    material.size = THREE.MathUtils.lerp(3.0, 7.5, THREE.MathUtils.clamp((d - 8) / 142, 0, 1));

    const now = state.clock.elapsedTime * 1000;
    const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;

    if (useWorkerResolved && ready) {
      if (now - lastProp.current >= propagationIntervalMs) {
        lastProp.current = now;
        propagate(nowMs(epochOverride));
      }
      const positions = positionsRef.current;
      if (positions && positions.length === arr.length) {
        arr.set(positions);
        attr.needsUpdate = true;
      }
    } else if (now - lastProp.current >= propagationIntervalMs) {
      // Main-thread fallback.
      lastProp.current = now;
      const date = new Date(nowMs(epochOverride));
      for (let i = 0; i < count; i++) {
        const rec = satrecs[i];
        if (!rec) continue;
        const r = propagateSatrec(rec, date);
        if (!r) continue;
        const v = eciToScenePosition(r.positionEci);
        arr[i * 3] = v.x;
        arr[i * 3 + 1] = v.y;
        arr[i * 3 + 2] = v.z;
      }
      attr.needsUpdate = true;
    }
  });

  return (
    <points
      ref={pointsRef}
      onClick={(e) => {
        e.stopPropagation();
        if (e.index != null && e.index < count) onSelectSatellite?.(sats[e.index].id);
      }}
      onPointerOver={() => {
        if (typeof document !== "undefined") document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        if (typeof document !== "undefined") document.body.style.cursor = "auto";
      }}
    >
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positionArray, 3]} />
        <bufferAttribute attach="attributes-color" args={[colorArray, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={4}
        vertexColors
        sizeAttenuation={false}
        transparent
        opacity={0.95}
        map={circleTexture ?? undefined}
        alphaTest={0.01}
        depthWrite={false}
      />
    </points>
  );
}

function Satellites() {
  const { satellites, pointsThreshold } = useGlobe();

  const tleSats = useMemo(() => satellites.filter((s) => s.tle), [satellites]);
  const keplerSats = useMemo(() => satellites.filter((s) => !s.tle && s.elements), [satellites]);
  const usePoints = tleSats.length >= pointsThreshold;

  return (
    <>
      {/* TLE satellites live in the ECI (GMST-rotated) frame. */}
      <GmstGroup>
        {usePoints ? (
          <SatellitePoints sats={tleSats} />
        ) : (
          tleSats.map((s) => <MeshSatellite key={s.id} sat={s} mode="eci" />)
        )}
      </GmstGroup>
      {/* Keplerian fallbacks are inertial — rendered in world space. */}
      {keplerSats.map((s) => (
        <MeshSatellite key={s.id} sat={s} mode="kepler" />
      ))}
    </>
  );
}

// ============================================================================
// Orbit paths
// ============================================================================

function OrbitLine({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const object = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.35 });
    return new THREE.LineLoop(geometry, material);
  }, [points, color]);

  useEffect(
    () => () => {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    },
    [object]
  );

  return <primitive object={object} />;
}

function OrbitPaths() {
  const { satellites, maxOrbitalPaths, epochOverride } = useGlobe();
  // Capture a stable epoch in live mode so paths don't regenerate every frame.
  const liveEpochRef = useRef(Date.now());
  const epochMs = epochOverride ?? liveEpochRef.current;

  const tlePaths = useMemo(() => {
    const seen = new Set<string>();
    const out: { id: string; color: string; points: THREE.Vector3[] }[] = [];
    for (const s of satellites) {
      if (!s.tle) continue;
      if (out.length >= maxOrbitalPaths) break;
      const key = orbitKey(s.tle.line1, s.tle.line2);
      if (seen.has(key)) continue;
      seen.add(key);
      const pts = generateOrbitalPath(s.tle, PATH_SEGMENTS, epochMs).map(toVector3);
      if (pts.length > 1) out.push({ id: s.id, color: s.color ?? DEFAULT_PATH_COLOR, points: pts });
    }
    return out;
  }, [satellites, maxOrbitalPaths, epochMs]);

  const keplerPaths = useMemo(() => {
    const out: { id: string; color: string; points: THREE.Vector3[] }[] = [];
    for (const s of satellites) {
      if (s.tle || !s.elements) continue;
      if (out.length >= maxOrbitalPaths) break;
      const el: KeplerianElements = s.elements;
      const pts = generateKeplerianPath(el, PATH_SEGMENTS).map(toVector3);
      if (pts.length > 1) out.push({ id: s.id, color: s.color ?? DEFAULT_PATH_COLOR, points: pts });
    }
    return out;
  }, [satellites, maxOrbitalPaths]);

  return (
    <>
      {/* TLE paths are ECI — rotate with the satellites. */}
      <GmstGroup>
        {tlePaths.map((p) => (
          <OrbitLine key={p.id} points={p.points} color={p.color} />
        ))}
      </GmstGroup>
      {/* Keplerian paths are inertial — world space. */}
      {keplerPaths.map((p) => (
        <OrbitLine key={p.id} points={p.points} color={p.color} />
      ))}
    </>
  );
}

// ============================================================================
// Ground stations & tracks (Earth-fixed)
// ============================================================================

function GroundStationMarker({ marker }: { marker: GroundMarker }) {
  const position = useMemo(
    () => toVector3(latLngAltToPosition(marker.lat, marker.lng, 0)),
    [marker.lat, marker.lng]
  );
  const glowRef = useRef<THREE.Mesh>(null);
  const color = marker.color ?? DEFAULT_STATION_COLOR;

  useFrame((state) => {
    if (glowRef.current) {
      glowRef.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 2) * 0.18);
    }
  });

  return (
    <group position={position}>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>
    </group>
  );
}

function GroundStations() {
  const { groundStations } = useGlobe();
  return (
    <>
      {groundStations.map((g) => (
        <GroundStationMarker key={g.id} marker={g} />
      ))}
    </>
  );
}

function TrackLine({ points, color }: { points: THREE.Vector3[]; color: string }) {
  const object = useMemo(() => {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.5 });
    return new THREE.Line(geometry, material);
  }, [points, color]);

  useEffect(
    () => () => {
      object.geometry.dispose();
      (object.material as THREE.Material).dispose();
    },
    [object]
  );

  return <primitive object={object} />;
}

function GroundTracks() {
  const { satellites, groundTrackDurationMin, epochOverride } = useGlobe();
  const liveEpochRef = useRef(Date.now());
  const epochMs = epochOverride ?? liveEpochRef.current;

  const tracks = useMemo(() => {
    const out: { id: string; color: string; points: THREE.Vector3[] }[] = [];
    for (const s of satellites) {
      if (!s.tle) continue;
      const ll = generateGroundTrack(s.tle, groundTrackDurationMin, PATH_SEGMENTS, epochMs);
      // Lift 5 km off the surface to avoid z-fighting with the globe.
      const pts = ll.map((p) => toVector3(latLngAltToPosition(p.lat, p.lng, 5)));
      if (pts.length > 1) out.push({ id: s.id, color: s.color ?? DEFAULT_PATH_COLOR, points: pts });
    }
    return out;
  }, [satellites, groundTrackDurationMin, epochMs]);

  return (
    <>
      {tracks.map((t) => (
        <TrackLine key={t.id} points={t.points} color={t.color} />
      ))}
    </>
  );
}

// ============================================================================
// Controls
// ============================================================================

function Controls() {
  const { minDistance, maxDistance, autoRotate, enableRotate, enableZoom } = useGlobe();
  return (
    <OrbitControls
      enableDamping
      dampingFactor={0.08}
      enablePan={false}
      enableRotate={enableRotate}
      enableZoom={enableZoom}
      minDistance={minDistance}
      maxDistance={maxDistance}
      autoRotate={autoRotate}
      autoRotateSpeed={0.3}
    />
  );
}

// ============================================================================
// Root
// ============================================================================

function Root(props: GlobeProps) {
  const {
    satellites = [],
    groundStations = [],
    textureUrl,
    nightTextureUrl,
    cloudsTextureUrl,
    bumpTextureUrl,
    showClouds = true,
    showAtmosphere = true,
    showOrbitalPaths = true,
    showGroundTracks = false,
    groundTrackDurationMin = 90,
    pointsThreshold = 30,
    maxOrbitalPaths = 100,
    useWorker,
    propagationIntervalMs = 200,
    epochOverride,
    width = "100%",
    height = "500px",
    cameraPosition = [0, 6, 22],
    minDistance = 8,
    maxDistance = 300,
    backgroundColor = "#05070d",
    autoRotate = false,
    enableRotate = true,
    enableZoom = true,
    onSelectSatellite,
    className,
    children,
  } = props;

  const value = useMemo<GlobeContextValue>(
    () => ({
      satellites,
      groundStations,
      textureUrl,
      nightTextureUrl,
      cloudsTextureUrl,
      bumpTextureUrl,
      showClouds,
      showAtmosphere,
      showOrbitalPaths,
      showGroundTracks,
      groundTrackDurationMin,
      pointsThreshold,
      maxOrbitalPaths,
      useWorker,
      propagationIntervalMs,
      epochOverride,
      minDistance,
      maxDistance,
      autoRotate,
      enableRotate,
      enableZoom,
      onSelectSatellite,
    }),
    [
      satellites,
      groundStations,
      textureUrl,
      nightTextureUrl,
      cloudsTextureUrl,
      bumpTextureUrl,
      showClouds,
      showAtmosphere,
      showOrbitalPaths,
      showGroundTracks,
      groundTrackDurationMin,
      pointsThreshold,
      maxOrbitalPaths,
      useWorker,
      propagationIntervalMs,
      epochOverride,
      minDistance,
      maxDistance,
      autoRotate,
      enableRotate,
      enableZoom,
      onSelectSatellite,
    ]
  );

  const transparent = backgroundColor === "transparent";

  return (
    <GlobeContext.Provider value={value}>
      <div
        className={className}
        style={{
          width: typeof width === "number" ? `${width}px` : width,
          height: typeof height === "number" ? `${height}px` : height,
          position: "relative",
        }}
      >
        <Canvas
          camera={{ position: cameraPosition, fov: 45, near: 0.1, far: 4000 }}
          gl={{
            antialias: true,
            alpha: transparent,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 2.0,
          }}
          style={{ background: transparent ? "transparent" : backgroundColor }}
        >
          <ambientLight intensity={1.2} color="#ffffff" />
          <Suspense fallback={null}>{children}</Suspense>
        </Canvas>
      </div>
    </GlobeContext.Provider>
  );
}

// ============================================================================
// Composed component
// ============================================================================

/**
 * All-in-one Globe. Renders Surface, Atmosphere, OrbitPaths, Satellites,
 * GroundStations (+ optional GroundTracks) and Controls.
 */
export function Globe(props: GlobeProps) {
  const showAtmosphere = props.showAtmosphere ?? true;
  const showOrbitalPaths = props.showOrbitalPaths ?? true;
  const showGroundTracks = props.showGroundTracks ?? false;

  return (
    <Root {...props}>
      <Surface />
      {showAtmosphere && <Atmosphere />}
      {showOrbitalPaths && <OrbitPaths />}
      <Satellites />
      <GroundStations />
      {showGroundTracks && <GroundTracks />}
      <Controls />
    </Root>
  );
}

Globe.Root = Root;
Globe.Surface = Surface;
Globe.Atmosphere = Atmosphere;
Globe.Satellites = Satellites;
Globe.OrbitPaths = OrbitPaths;
Globe.GroundStations = GroundStations;
Globe.GroundTracks = GroundTracks;
Globe.Controls = Controls;

/** Alias for {@link Globe}. */
export const EarthGlobe = Globe;

export default Globe;
