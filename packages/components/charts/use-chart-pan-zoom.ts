"use client";

import * as React from "react";

/**
 * Self-contained pan/zoom interaction hook for a numeric chart axis.
 *
 * Works for any numeric domain — time (ms) OR value axes. It has zero coupling
 * to a dashboard, time-range, or view-window concept: you give it a numeric
 * `[start, end]` domain and it hands back an updated one.
 *
 * Gestures (all configurable):
 *  - **Zoom**: modifier + wheel — zooms centered at the cursor so the value
 *    under the pointer stays fixed.
 *  - **Pan**: modifier + drag — slides the domain after `dragThreshold` px.
 *  - **Brush**: shift + drag — rubber-band a sub-range to zoom into it.
 *
 * Two-tier callbacks let you keep interaction at 60fps while throttling
 * expensive work (e.g. a data re-fetch):
 *  - `onPreview` fires synchronously on every move (instant visual feedback).
 *  - `onCommit` fires debounced (`commitDebounceMs`) and on pointer-up.
 *
 * Supports both controlled (`domain`) and uncontrolled (`defaultDomain`) use.
 *
 * Listeners attach once to `containerRef.current`; the latest props are read
 * through refs so there's no listener churn mid-gesture (which would drop
 * events). SSR-safe — all DOM access happens inside effects.
 */

type ModifierKey = "ctrl" | "meta" | "ctrlOrMeta" | "none";

export interface UseChartPanZoomOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  /** Plot-area insets (px) so cursor math accounts for axes. Default 0/0. */
  margin?: { left: number; right: number };
  /** Controlled domain. When provided, the hook never mutates internal state. */
  domain?: [number, number];
  /** Uncontrolled seed domain. */
  defaultDomain?: [number, number];
  /** Hard clamp — the domain can never travel outside these bounds. */
  bounds?: [number, number];
  /** Minimum span (end - start). */
  minSpan?: number;
  /** Maximum span (end - start). */
  maxSpan?: number;
  /** Master enable switch. Default true. */
  enabled?: boolean;
  /** Modifier required for wheel-zoom. Default "ctrlOrMeta". */
  zoomKey?: ModifierKey;
  /** Modifier required for drag-pan. Default "ctrlOrMeta". */
  panKey?: ModifierKey;
  /** Enable shift+drag brush-to-zoom. Default true. */
  enableBrush?: boolean;
  /** Pixels of movement before a drag counts as a pan. Default 4. */
  dragThreshold?: number;
  /** Debounce (ms) before `onCommit` fires after a zoom. Default 300. */
  commitDebounceMs?: number;
  /** Instant, per-move callback (60fps). */
  onPreview?: (domain: [number, number]) => void;
  /** Debounced / pointer-up callback — gate expensive work here. */
  onCommit?: (domain: [number, number]) => void;
  /** Convenience callback for uncontrolled use (fires alongside onCommit). */
  onChange?: (domain: [number, number]) => void;
  /** Fires once when a gesture begins (clear tooltips, etc.). */
  onInteractionStart?: () => void;
  /** Toggle grab/grabbing cursor feedback during pan. Default true. */
  cursorFeedback?: boolean;
}

export interface UseChartPanZoomResult {
  /** The current effective domain (controlled prop or internal state). */
  domain: [number, number];
  /** True while a pan drag is in progress. */
  isPanning: React.MutableRefObject<boolean>;
  /** Active brush rectangle in container-relative px, or null. */
  brushRect: { left: number; width: number } | null;
  /** Reset back to `defaultDomain` (or `bounds`). */
  reset: () => void;
}

const DEFAULT_MARGIN = { left: 0, right: 0 };

function modifierMatches(e: { ctrlKey: boolean; metaKey: boolean }, key: ModifierKey): boolean {
  switch (key) {
    case "none":
      return true;
    case "ctrl":
      return e.ctrlKey;
    case "meta":
      return e.metaKey;
    default:
      return e.ctrlKey || e.metaKey;
  }
}

export function useChartPanZoom(opts: UseChartPanZoomOptions): UseChartPanZoomResult {
  const {
    containerRef,
    margin = DEFAULT_MARGIN,
    domain: controlledDomain,
    defaultDomain,
    bounds,
    minSpan,
    maxSpan,
    enabled = true,
    zoomKey = "ctrlOrMeta",
    panKey = "ctrlOrMeta",
    enableBrush = true,
    dragThreshold = 4,
    commitDebounceMs = 300,
    onPreview,
    onCommit,
    onChange,
    onInteractionStart,
    cursorFeedback = true,
  } = opts;

  const isControlled = controlledDomain !== undefined;

  const seedDomain = React.useMemo<[number, number]>(
    () => defaultDomain ?? controlledDomain ?? bounds ?? [0, 1],
    // Only seed once — subsequent prop changes flow through controlledDomain.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const [internalDomain, setInternalDomain] = React.useState<[number, number]>(seedDomain);
  const [brushRect, setBrushRect] = React.useState<{ left: number; width: number } | null>(null);

  const effectiveDomain = isControlled ? (controlledDomain as [number, number]) : internalDomain;

  // ── Latest-value refs (read by listeners without re-attaching) ───────────
  const domainRef = React.useRef(effectiveDomain);
  domainRef.current = effectiveDomain;

  const optsRef = React.useRef({
    margin,
    bounds,
    minSpan,
    maxSpan,
    enabled,
    zoomKey,
    panKey,
    enableBrush,
    dragThreshold,
    commitDebounceMs,
    isControlled,
    cursorFeedback,
    onPreview,
    onCommit,
    onChange,
    onInteractionStart,
  });
  React.useEffect(() => {
    optsRef.current = {
      margin,
      bounds,
      minSpan,
      maxSpan,
      enabled,
      zoomKey,
      panKey,
      enableBrush,
      dragThreshold,
      commitDebounceMs,
      isControlled,
      cursorFeedback,
      onPreview,
      onCommit,
      onChange,
      onInteractionStart,
    };
  });

  // Clamp a desired domain to span + bounds constraints.
  const clamp = React.useCallback((d: [number, number]): [number, number] => {
    const { bounds: b, minSpan: minS, maxSpan: maxS } = optsRef.current;
    let [start, end] = d;
    if (end < start) [start, end] = [end, start];
    let span = end - start;

    // Effective max span can't exceed the bounds span.
    let effMax = maxS;
    if (b) {
      const boundSpan = b[1] - b[0];
      effMax = effMax === undefined ? boundSpan : Math.min(effMax, boundSpan);
    }

    const center = (start + end) / 2;
    if (minS !== undefined && span < minS) {
      start = center - minS / 2;
      end = center + minS / 2;
      span = minS;
    }
    if (effMax !== undefined && span > effMax) {
      start = center - effMax / 2;
      end = center + effMax / 2;
      span = effMax;
    }

    if (b) {
      if (start < b[0]) {
        end += b[0] - start;
        start = b[0];
      }
      if (end > b[1]) {
        start -= end - b[1];
        end = b[1];
      }
      if (start < b[0]) start = b[0];
    }

    return [start, end];
  }, []);

  const clampRef = React.useRef(clamp);
  clampRef.current = clamp;

  // Apply an instant preview: update internal state (uncontrolled) + onPreview.
  const applyPreview = React.useCallback((d: [number, number]) => {
    const clamped = clampRef.current(d);
    if (!optsRef.current.isControlled) {
      setInternalDomain(clamped);
    }
    domainRef.current = clamped;
    optsRef.current.onPreview?.(clamped);
  }, []);

  // Commit a final domain: update state + onCommit + onChange.
  const applyCommit = React.useCallback((d: [number, number]) => {
    const clamped = clampRef.current(d);
    if (!optsRef.current.isControlled) {
      setInternalDomain(clamped);
    }
    domainRef.current = clamped;
    optsRef.current.onCommit?.(clamped);
    optsRef.current.onChange?.(clamped);
  }, []);

  const applyPreviewRef = React.useRef(applyPreview);
  applyPreviewRef.current = applyPreview;
  const applyCommitRef = React.useRef(applyCommit);
  applyCommitRef.current = applyCommit;

  // ── Interaction state (refs — survive across events without re-render) ───
  const isPanning = React.useRef(false);
  const panStartX = React.useRef(0);
  const panStartDomain = React.useRef<[number, number] | null>(null);
  const pointerDownId = React.useRef<number | null>(null);
  const pendingZoom = React.useRef<[number, number] | null>(null);
  const zoomTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const brushStart = React.useRef<{ clientX: number } | null>(null);

  // Bind the element to state so the listener effect re-runs once it mounts.
  const [el, setEl] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => {
    const node = containerRef.current;
    if (node !== el) setEl(node);
  }, [containerRef, el]);

  React.useEffect(() => {
    if (!el) return;

    const chartWidthOf = (rect: DOMRect) => {
      const m = optsRef.current.margin;
      return rect.width - m.left - m.right;
    };

    const valueAtClientX = (clientX: number, rect: DOMRect, dom: [number, number]) => {
      const m = optsRef.current.margin;
      const w = chartWidthOf(rect);
      if (w <= 0) return dom[0];
      const x = Math.max(0, Math.min(w, clientX - rect.left - m.left));
      return dom[0] + (x / w) * (dom[1] - dom[0]);
    };

    const handleWheel = (e: WheelEvent) => {
      const o = optsRef.current;
      if (!o.enabled) return;
      if (!modifierMatches(e, o.zoomKey)) return;
      e.preventDefault();

      const rect = el.getBoundingClientRect();
      const m = o.margin;
      const w = chartWidthOf(rect);
      if (w <= 0) return;

      const [start, end] = pendingZoom.current ?? domainRef.current;
      const span = end - start;

      const cursorFrac = Math.max(0, Math.min(1, (e.clientX - rect.left - m.left) / w));
      const normalizedDelta = (Math.sign(e.deltaY) * Math.min(Math.abs(e.deltaY), 100)) / 100;
      const factor = 1 + normalizedDelta * 0.15;
      const newSpan = span * factor;

      const newStart = start + (span - newSpan) * cursorFrac;
      const newEnd = newStart + newSpan;

      const next: [number, number] = [newStart, newEnd];
      pendingZoom.current = clampRef.current(next);
      applyPreviewRef.current(next);

      if (zoomTimer.current) clearTimeout(zoomTimer.current);
      zoomTimer.current = setTimeout(() => {
        const z = pendingZoom.current;
        if (z) {
          applyCommitRef.current(z);
          pendingZoom.current = null;
        }
        zoomTimer.current = null;
      }, o.commitDebounceMs);
    };

    const handlePointerDown = (e: PointerEvent) => {
      const o = optsRef.current;
      if (!o.enabled) return;
      if (e.button !== 0) return;

      // Brush (shift+drag) — checked first so it wins over a "none" panKey.
      if (o.enableBrush && e.shiftKey) {
        const rect = el.getBoundingClientRect();
        const m = o.margin;
        const w = chartWidthOf(rect);
        if (w <= 0) return;
        const x = Math.max(0, Math.min(w, e.clientX - rect.left - m.left));
        brushStart.current = { clientX: e.clientX };
        pointerDownId.current = e.pointerId;
        el.setPointerCapture(e.pointerId);
        o.onInteractionStart?.();
        setBrushRect({ left: x + m.left, width: 0 });
        return;
      }

      if (!modifierMatches(e, o.panKey)) return;

      panStartX.current = e.clientX;
      panStartDomain.current = [...domainRef.current] as [number, number];
      pointerDownId.current = e.pointerId;
    };

    const handlePointerMove = (e: PointerEvent) => {
      const o = optsRef.current;

      if (brushStart.current) {
        const rect = el.getBoundingClientRect();
        const m = o.margin;
        const w = chartWidthOf(rect);
        if (w <= 0) return;
        const startX = brushStart.current.clientX - rect.left - m.left;
        const curX = Math.max(0, Math.min(w, e.clientX - rect.left - m.left));
        setBrushRect({ left: Math.min(startX, curX) + m.left, width: Math.abs(curX - startX) });
        return;
      }

      if (!panStartDomain.current) return;

      const deltaX = e.clientX - panStartX.current;

      if (!isPanning.current) {
        if (Math.abs(deltaX) < o.dragThreshold) return;
        isPanning.current = true;
        if (pointerDownId.current !== null) {
          el.setPointerCapture(pointerDownId.current);
        }
        if (o.cursorFeedback) el.style.cursor = "grabbing";
        o.onInteractionStart?.();
      }

      const rect = el.getBoundingClientRect();
      const w = chartWidthOf(rect);
      if (w <= 0) return;

      const [start, end] = panStartDomain.current;
      const span = end - start;
      const deltaValue = -(deltaX / w) * span;
      applyPreviewRef.current([start + deltaValue, end + deltaValue]);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const o = optsRef.current;

      if (brushStart.current) {
        const rect = el.getBoundingClientRect();
        const w = chartWidthOf(rect);
        const startClientX = brushStart.current.clientX;
        brushStart.current = null;
        setBrushRect(null);
        pointerDownId.current = null;
        if (w <= 0) return;
        if (Math.abs(e.clientX - startClientX) < o.dragThreshold) return;
        // Map BOTH endpoints through the current domain at commit time. Capturing
        // the start value at pointerdown would mix coordinate spaces if a
        // controlled domain shifted mid-brush, committing a wrong sub-range.
        const dom = domainRef.current;
        const startValue = valueAtClientX(startClientX, rect, dom);
        const endValue = valueAtClientX(e.clientX, rect, dom);
        const [s, en] = startValue < endValue ? [startValue, endValue] : [endValue, startValue];
        applyCommitRef.current([s, en]);
        return;
      }

      if (!panStartDomain.current) return;

      if (o.cursorFeedback) el.style.cursor = "";

      if (isPanning.current) {
        const rect = el.getBoundingClientRect();
        const w = chartWidthOf(rect);
        if (w > 0) {
          const [start, end] = panStartDomain.current;
          const span = end - start;
          const deltaX = e.clientX - panStartX.current;
          const deltaValue = -(deltaX / w) * span;
          applyCommitRef.current([start + deltaValue, end + deltaValue]);
        }
      }

      isPanning.current = false;
      panStartDomain.current = null;
      pointerDownId.current = null;
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);

    return () => {
      el.removeEventListener("wheel", handleWheel);
      el.removeEventListener("pointerdown", handlePointerDown);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerup", handlePointerUp);
      if (zoomTimer.current) clearTimeout(zoomTimer.current);
    };
  }, [el]);

  const reset = React.useCallback(() => {
    pendingZoom.current = null;
    if (zoomTimer.current) {
      clearTimeout(zoomTimer.current);
      zoomTimer.current = null;
    }
    applyCommitRef.current(seedDomain);
  }, [seedDomain]);

  return { domain: effectiveDomain, isPanning, brushRect, reset };
}
