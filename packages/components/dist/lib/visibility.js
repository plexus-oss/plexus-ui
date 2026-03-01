"use client";
import { useEffect, useRef, useState } from "react";
/**
 * Hook that tracks element visibility using IntersectionObserver and Page Visibility API.
 * Use this to pause expensive rendering when charts are off-screen or tab is hidden.
 *
 * @param elementRef - Ref to the element to observe
 * @param options - IntersectionObserver options
 * @returns VisibilityState with isVisible (true when element is in viewport AND tab is active)
 *
 * @example
 * ```tsx
 * function MyChart({ data }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const { isVisible } = useChartVisibility(containerRef);
 *
 *   // Skip expensive computations when not visible
 *   const processedData = useMemo(() => {
 *     if (!isVisible) return prevData;
 *     return expensiveProcess(data);
 *   }, [data, isVisible]);
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function useChartVisibility(elementRef, options = { threshold: 0 }) {
    const [isIntersecting, setIsIntersecting] = useState(true); // Default true for SSR
    const [isPageVisible, setIsPageVisible] = useState(true);
    // IntersectionObserver for viewport visibility
    useEffect(() => {
        const element = elementRef.current;
        if (!element)
            return;
        const observer = new IntersectionObserver(([entry]) => {
            setIsIntersecting(entry.isIntersecting);
        }, options);
        observer.observe(element);
        return () => {
            observer.disconnect();
        };
    }, [elementRef, options.threshold, options.root, options.rootMargin, options]);
    // Page Visibility API for tab visibility
    useEffect(() => {
        const handleVisibilityChange = () => {
            setIsPageVisible(document.visibilityState === "visible");
        };
        // Set initial state
        if (typeof document !== "undefined") {
            setIsPageVisible(document.visibilityState === "visible");
        }
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, []);
    return {
        isIntersecting,
        isPageVisible,
        isVisible: isIntersecting && isPageVisible,
    };
}
/**
 * Hook that pauses a callback when element is not visible.
 * Useful for animation loops that should stop when off-screen.
 *
 * @param callback - Function to call on each animation frame
 * @param elementRef - Ref to the element to observe
 * @param enabled - Optional flag to enable/disable the loop
 *
 * @example
 * ```tsx
 * function LiveChart({ data }) {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *
 *   useVisibleAnimationFrame(
 *     (deltaTime) => {
 *       // Only runs when element is visible
 *       updateChart(deltaTime);
 *     },
 *     containerRef
 *   );
 *
 *   return <div ref={containerRef}>...</div>;
 * }
 * ```
 */
export function useVisibleAnimationFrame(callback, elementRef, enabled = true) {
    const { isVisible } = useChartVisibility(elementRef);
    const rafRef = useRef(0);
    const previousTimeRef = useRef(0);
    const callbackRef = useRef(callback);
    // Keep callback ref up to date
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    useEffect(() => {
        if (!enabled || !isVisible) {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = 0;
            }
            return;
        }
        const animate = (time) => {
            if (previousTimeRef.current !== 0) {
                const deltaTime = time - previousTimeRef.current;
                callbackRef.current(deltaTime);
            }
            previousTimeRef.current = time;
            rafRef.current = requestAnimationFrame(animate);
        };
        rafRef.current = requestAnimationFrame(animate);
        return () => {
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current);
            }
        };
    }, [enabled, isVisible]);
}
/**
 * Hook that pauses an interval when element is not visible.
 *
 * @param callback - Function to call on each interval
 * @param intervalMs - Interval in milliseconds
 * @param elementRef - Ref to the element to observe
 * @param enabled - Optional flag to enable/disable the interval
 */
export function useVisibleInterval(callback, intervalMs, elementRef, enabled = true) {
    const { isVisible } = useChartVisibility(elementRef);
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    }, [callback]);
    useEffect(() => {
        if (!enabled || !isVisible)
            return;
        const id = setInterval(() => {
            callbackRef.current();
        }, intervalMs);
        return () => {
            clearInterval(id);
        };
    }, [enabled, isVisible, intervalMs]);
}
//# sourceMappingURL=visibility.js.map