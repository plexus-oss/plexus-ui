/**
 * SGP4 propagation Web Worker.
 *
 * Moves satellite propagation off the main thread. Builds `satrec`s once from
 * the posted TLEs, then for each `propagate(timeMs)` message fills and posts
 * back a transferable `Float32Array` of **ECI scene positions** (one vec3 per
 * satellite, in the order they were initialised).
 *
 * Positions are returned in the inertial (ECI) scene frame — the consumer must
 * render them inside a group rotated by `-gmstAngle(date)` about Y to align
 * them with the Earth-fixed (ECEF) globe.
 *
 * Self-contained: no React, no Three.js. The only dependency is `satellite.js`
 * (plus the pure `eciToScenePosition` transform), so this bundles cleanly as a
 * module worker.
 */

import * as satellite from "satellite.js";
import { eciToScenePosition } from "./orbital";

type SatRec = ReturnType<typeof satellite.twoline2satrec>;

export interface WorkerSat {
  id: string;
  line1: string;
  line2: string;
}

export type WorkerInMessage =
  | { type: "init"; satellites: WorkerSat[] }
  | { type: "propagate"; time: number };

export type WorkerOutMessage = { type: "ready" } | { type: "positions"; buffer: Float32Array };

let satrecs: (SatRec | null)[] = [];
let count = 0;
let buffer = new Float32Array(0);

self.onmessage = (e: MessageEvent<WorkerInMessage>) => {
  const msg = e.data;

  if (msg.type === "init") {
    count = msg.satellites.length;
    buffer = new Float32Array(count * 3);
    satrecs = msg.satellites.map((s) => {
      try {
        return satellite.twoline2satrec(s.line1, s.line2);
      } catch {
        return null;
      }
    });
    (self as unknown as Worker).postMessage({
      type: "ready",
    } satisfies WorkerOutMessage);
    return;
  }

  if (msg.type === "propagate") {
    const date = new Date(msg.time);

    for (let i = 0; i < count; i++) {
      const rec = satrecs[i];
      if (!rec) continue;
      try {
        const pv = satellite.propagate(rec, date);
        if (!pv || !pv.position || typeof pv.position === "boolean") continue;
        const p = pv.position as satellite.EciVec3<number>;
        const v = eciToScenePosition({ x: p.x, y: p.y, z: p.z });
        const idx = i * 3;
        buffer[idx] = v.x;
        buffer[idx + 1] = v.y;
        buffer[idx + 2] = v.z;
      } catch {
        // Skip a failed propagation — that satellite keeps its last position.
      }
    }

    // Copy before transferring so the worker keeps its own working buffer.
    const copy = new Float32Array(buffer);
    (self as unknown as Worker).postMessage(
      { type: "positions", buffer: copy } satisfies WorkerOutMessage,
      [copy.buffer] as Transferable[]
    );
  }
};
