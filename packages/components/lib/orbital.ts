/**
 * Orbital mechanics — TLE parsing, SGP4 propagation, and coordinate transforms.
 *
 * Framework-agnostic and dependency-light: the only runtime dependency is
 * `satellite.js` (SGP4). Scene positions are returned as plain `{ x, y, z }`
 * vectors in a right-handed, Y-up frame scaled so Earth's radius ≈ 6.371 units
 * — callers (e.g. a Three.js globe) convert these to their own vector type.
 *
 * Internally everything is computed in the inertial (ECI) frame and converted
 * to scene coordinates only when needed. Orbital paths are returned in the ECI
 * frame: a renderer must rotate them by `-gmstAngle(date)` about the Y axis
 * each frame to align them with the Earth-fixed (ECEF) globe.
 */

import * as satellite from "satellite.js";

/** Mean Earth radius, km. */
export const EARTH_RADIUS_KM = 6371;
/** Scene units per km (globe radius ≈ 6.371 units at 1:1000). */
export const SCENE_SCALE = 0.001;
/** Earth gravitational parameter, km³/s². */
const MU_EARTH = 398600.4418;

/** A plain 3-component vector in scene space (Y-up). */
export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

/** A geographic point on (or above) Earth's surface. */
export interface LatLng {
  lat: number;
  lng: number;
}

/** A Two-Line Element set. */
export interface Tle {
  line1: string;
  line2: string;
}

// ─── TLE parsing ─────────────────────────────────────────────────────────────

/** Parse the epoch from TLE line 1 (chars 18–32: 2-digit year + fractional day). */
export function getTleEpoch(tleLine1: string): Date {
  const epochStr = tleLine1.substring(18, 32).trim();
  const year2 = parseInt(epochStr.substring(0, 2), 10);
  const dayFraction = parseFloat(epochStr.substring(2));
  // 57–99 → 1957–1999, 00–56 → 2000–2056
  const year = year2 >= 57 ? 1900 + year2 : 2000 + year2;
  const epoch = new Date(Date.UTC(year, 0, 1));
  epoch.setTime(epoch.getTime() + (dayFraction - 1) * 86_400_000);
  return epoch;
}

/** Whether a TLE's epoch is older than `maxAgeDays` from now. */
export function isTleStale(tleLine1: string, maxAgeDays = 14): boolean {
  try {
    const ageDays = (Date.now() - getTleEpoch(tleLine1).getTime()) / 86_400_000;
    return ageDays > maxAgeDays;
  } catch {
    return true;
  }
}

const rad2deg = (rad: number): number => rad * (180 / Math.PI);
const deg2rad = (deg: number): number => deg * (Math.PI / 180);

export interface OrbitalElements {
  /** Inclination, degrees. */
  inclination: number;
  /** Eccentricity, dimensionless. */
  eccentricity: number;
  /** Right ascension of the ascending node, degrees. */
  raan: number;
  /** Argument of perigee, degrees. */
  argPerigee: number;
  /** Mean anomaly, degrees. */
  meanAnomaly: number;
  /** Mean motion, revolutions per day. */
  meanMotion: number;
  /** Orbital period, minutes. */
  period: number;
  /** Semi-major axis, km. */
  semiMajorAxis: number;
  /** Mean altitude above Earth's surface, km. */
  altitude: number;
  /** Apogee altitude, km. */
  apogeeAlt: number;
  /** Perigee altitude, km. */
  perigeeAlt: number;
  /** Drag term (B*), 1/earth-radii. */
  bstar: number;
}

/** Derive classical orbital elements from a TLE. */
export function getOrbitalElements(tleLine1: string, tleLine2: string): OrbitalElements {
  const satrec = satellite.twoline2satrec(tleLine1, tleLine2);

  const meanMotionRevPerDay = satrec.no * (1440 / (2 * Math.PI));
  const periodMinutes = 1440 / meanMotionRevPerDay;

  const periodSeconds = periodMinutes * 60;
  const semiMajorAxis = Math.cbrt(
    (MU_EARTH * periodSeconds * periodSeconds) / (4 * Math.PI * Math.PI)
  );

  const ecc = satrec.ecco;

  return {
    inclination: rad2deg(satrec.inclo),
    eccentricity: ecc,
    raan: rad2deg(satrec.nodeo),
    argPerigee: rad2deg(satrec.argpo),
    meanAnomaly: rad2deg(satrec.mo),
    meanMotion: meanMotionRevPerDay,
    period: periodMinutes,
    semiMajorAxis,
    altitude: semiMajorAxis - EARTH_RADIUS_KM,
    apogeeAlt: semiMajorAxis * (1 + ecc) - EARTH_RADIUS_KM,
    perigeeAlt: semiMajorAxis * (1 - ecc) - EARTH_RADIUS_KM,
    bstar: satrec.bstar,
  };
}

/**
 * A key identifying an orbit's shape + plane. Satellites in the same
 * constellation shell share nearly identical elements; rounding absorbs small
 * perturbation deltas so identical orbits can share one generated path.
 */
export function orbitKey(tleLine1: string, tleLine2: string): string {
  try {
    const el = getOrbitalElements(tleLine1, tleLine2);
    const mm = el.meanMotion.toFixed(1);
    const inc = el.inclination.toFixed(0);
    const ecc = el.eccentricity.toFixed(3);
    const raan = (Math.round(el.raan / 5) * 5).toString(); // 5° buckets
    return `${mm}|${inc}|${ecc}|${raan}`;
  } catch {
    return `${tleLine1}|${tleLine2}`; // unique fallback → always render
  }
}

// ─── Coordinate transforms ────────────────────────────────────────────────────

/** Greenwich Mean Sidereal Time at `date`, radians. */
export function gmstAngle(date: Date): number {
  return satellite.gstime(date);
}

/**
 * Geodetic (lat/lng/alt) → scene position (ECEF, Earth-fixed), true 1:1000
 * scale with no altitude exaggeration.
 */
export function latLngAltToPosition(lat: number, lng: number, altitudeKm: number): Vec3 {
  const phi = deg2rad(90 - lat);
  const theta = deg2rad(lng + 180);
  const radius = (EARTH_RADIUS_KM + altitudeKm) * SCENE_SCALE;
  return {
    x: -radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/**
 * ECI position (km) → scene position. Result is in the ECI frame and must be
 * rotated by `-gmstAngle(date)` about Y to align with the ECEF globe.
 */
export function eciToScenePosition(eci: Vec3): Vec3 {
  // ECI axes (x,y equatorial, z north) → scene axes (x,z equatorial, y north).
  return {
    x: eci.x * SCENE_SCALE,
    y: eci.z * SCENE_SCALE,
    z: -eci.y * SCENE_SCALE,
  };
}

// ─── Sun position ─────────────────────────────────────────────────────────────

/**
 * Subsolar point (the geographic point where the Sun is directly overhead) at
 * `date`. Uses the NOAA solar-position approximation (declination + equation of
 * time), accurate to well under a degree — enough for a physically correct
 * day/night terminator.
 */
export function subsolarPoint(date: Date): LatLng {
  const start = Date.UTC(date.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start) / 86_400_000);
  const hUtc = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600;

  // Fractional year, radians.
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1 + (hUtc - 12) / 24);
  // Equation of time, minutes.
  const eqTime =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  // Solar declination, radians.
  const decl =
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g);

  const lat = rad2deg(decl);
  // Longitude where true solar time is noon.
  const lng = -(hUtc * 60 + eqTime - 720) / 4;
  const lngNorm = ((((lng + 180) % 360) + 360) % 360) - 180;
  return { lat, lng: lngNorm };
}

/**
 * Unit vector pointing from Earth's centre toward the Sun at `date`, in the same
 * scene frame as `latLngAltToPosition` — so it lights the textured globe with a
 * terminator that lines up with real geography.
 */
export function sunDirection(date: Date): Vec3 {
  const { lat, lng } = subsolarPoint(date);
  const v = latLngAltToPosition(lat, lng, 0);
  const len = Math.hypot(v.x, v.y, v.z) || 1;
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

// ─── SGP4 propagation ─────────────────────────────────────────────────────────

export interface PropagationResult {
  /** Scene position in the ECEF (Earth-fixed) frame. */
  position: Vec3;
  /** Raw ECI position, km. */
  positionEci: Vec3;
  /** Sub-satellite geodetic point + altitude (km). */
  geodetic: { lat: number; lng: number; alt: number };
  /** ECI velocity expressed in scene axes, km/s. */
  velocityEci: Vec3;
}

/** A parsed SGP4 record. Build once with {@link parseSatrec}, reuse per tick. */
export type SatRec = ReturnType<typeof satellite.twoline2satrec>;

/**
 * Parse a TLE into a reusable SGP4 record. `twoline2satrec` is the expensive
 * part of propagation, so build the satrec once (e.g. memoized per TLE) and feed
 * it to {@link propagateSatrec} on every tick instead of re-parsing each frame.
 */
export function parseSatrec(tle: Tle): SatRec | null {
  try {
    return satellite.twoline2satrec(tle.line1, tle.line2);
  } catch {
    return null;
  }
}

/** Propagate a satellite to `date` via SGP4. Returns `null` on decay/failure. */
export function propagateSGP4(tle: Tle, date: Date): PropagationResult | null {
  const satrec = parseSatrec(tle);
  return satrec ? propagateSatrec(satrec, date) : null;
}

/** Propagate a pre-parsed satrec to `date`. Returns `null` on decay/failure. */
export function propagateSatrec(satrec: SatRec, date: Date): PropagationResult | null {
  try {
    const pv = satellite.propagate(satrec, date);
    if (!pv || !pv.position || typeof pv.position === "boolean") return null;

    const posEci = pv.position as satellite.EciVec3<number>;
    const velEci = (pv.velocity || { x: 0, y: 0, z: 0 }) as satellite.EciVec3<number>;

    const gmst = satellite.gstime(date);
    const gd = satellite.eciToGeodetic(posEci, gmst);
    const lat = satellite.degreesLat(gd.latitude);
    const lng = satellite.degreesLong(gd.longitude);
    const alt = gd.height;

    return {
      position: latLngAltToPosition(lat, lng, alt),
      positionEci: { x: posEci.x, y: posEci.y, z: posEci.z },
      geodetic: { lat, lng, alt },
      // Same ECI→scene basis change as eciToScenePosition (x, z, -y).
      velocityEci: { x: velEci.x, y: velEci.z, z: -velEci.y },
    };
  } catch {
    return null;
  }
}

/**
 * A full orbital path as a closed ring in ECI scene-space, propagated over one
 * period from `epochMs` (default now). Render inside a `-gmstAngle`-rotated
 * group to keep it glued to the live satellite over the ECEF globe.
 */
export function generateOrbitalPath(tle: Tle, segments = 120, epochMs?: number): Vec3[] {
  const points: Vec3[] = [];
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const mmRevDay = satrec.no * (1440 / (2 * Math.PI));
    const periodMs = (86_400 / mmRevDay) * 1000;
    const startTime = epochMs ?? Date.now();

    for (let i = 0; i < segments; i++) {
      const t = new Date(startTime + (i / segments) * periodMs);
      const pv = satellite.propagate(satrec, t);
      if (!pv || !pv.position || typeof pv.position === "boolean") continue;
      const p = pv.position as satellite.EciVec3<number>;
      points.push(eciToScenePosition({ x: p.x, y: p.y, z: p.z }));
    }
  } catch {
    // return whatever propagated successfully
  }
  return points;
}

/** Sub-satellite ground track (lat/lng) over `durationMinutes` from `epochMs`. */
export function generateGroundTrack(
  tle: Tle,
  durationMinutes = 90,
  segments = 120,
  epochMs?: number
): LatLng[] {
  const track: LatLng[] = [];
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const startTime = epochMs ?? Date.now();
    for (let i = 0; i <= segments; i++) {
      const d = new Date(startTime + (i / segments) * durationMinutes * 60_000);
      const pv = satellite.propagate(satrec, d);
      if (!pv || !pv.position || typeof pv.position === "boolean") continue;
      const p = pv.position as satellite.EciVec3<number>;
      const gd = satellite.eciToGeodetic(p, satellite.gstime(d));
      track.push({
        lat: satellite.degreesLat(gd.latitude),
        lng: satellite.degreesLong(gd.longitude),
      });
    }
  } catch {
    // return whatever propagated successfully
  }
  return track;
}

// ─── Look angles (azimuth / elevation) ────────────────────────────────────────

export interface LookAngle {
  /** Azimuth from the observer, degrees [0, 360). */
  azimuth: number;
  /** Elevation above the observer's horizon, degrees [-90, 90]. */
  elevation: number;
  /** Slant range to the satellite, km. */
  rangeKm: number;
}

/**
 * Topocentric look angles from a ground station to a satellite at `date`.
 * Elevation < 0 means the satellite is below the horizon (not visible).
 */
export function getLookAngle(
  tle: Tle,
  observer: { lat: number; lng: number; altKm?: number },
  date: Date
): LookAngle | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const pv = satellite.propagate(satrec, date);
    if (!pv || !pv.position || typeof pv.position === "boolean") return null;

    const gmst = satellite.gstime(date);
    const observerGd = {
      longitude: deg2rad(observer.lng),
      latitude: deg2rad(observer.lat),
      height: observer.altKm ?? 0,
    };
    const ecf = satellite.eciToEcf(pv.position as satellite.EciVec3<number>, gmst);
    const look = satellite.ecfToLookAngles(observerGd, ecf);
    return {
      azimuth: rad2deg(look.azimuth),
      elevation: rad2deg(look.elevation),
      rangeKm: look.rangeSat,
    };
  } catch {
    return null;
  }
}

// ─── Keplerian fallback (no TLE) ──────────────────────────────────────────────

export interface KeplerianElements {
  inclination: number;
  raan: number;
  /** Orbital period, minutes. */
  orbitalPeriod: number;
  /** Initial phase angle along the orbit, degrees. */
  initialPhase?: number;
  /** Altitude above the surface, km (default 550). */
  altitudeKm?: number;
}

function keplerianAt(el: KeplerianElements, phaseDeg: number): Vec3 {
  const angle = deg2rad(phaseDeg);
  const incRad = deg2rad(el.inclination);
  const raanRad = deg2rad(el.raan);
  const radius = (EARTH_RADIUS_KM + (el.altitudeKm ?? 550)) * SCENE_SCALE;

  const x0 = radius * Math.cos(angle);
  const z0 = radius * Math.sin(angle);
  // Tilt by inclination, then rotate the plane by RAAN.
  const y1 = -z0 * Math.sin(incRad);
  const z1 = z0 * Math.cos(incRad);
  return {
    x: x0 * Math.cos(raanRad) + z1 * Math.sin(raanRad),
    y: y1,
    z: -x0 * Math.sin(raanRad) + z1 * Math.cos(raanRad),
  };
}

/** Scene position from basic Keplerian elements (circular-orbit fallback). */
export function calculateKeplerianPosition(elapsedMs: number, el: KeplerianElements): Vec3 {
  const periodMs = el.orbitalPeriod * 60_000;
  const phase = ((elapsedMs / periodMs) * 360 + (el.initialPhase ?? 0)) % 360;
  return keplerianAt(el, phase);
}

/** A Keplerian orbital ring (circular-orbit fallback). */
export function generateKeplerianPath(el: KeplerianElements, segments = 120): Vec3[] {
  const points: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    points.push(keplerianAt(el, (i / segments) * 360));
  }
  return points;
}
