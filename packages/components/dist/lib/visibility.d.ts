import { type RefObject } from "react";
/**
 * Combined visibility state from IntersectionObserver + Page Visibility API
 */
export interface VisibilityState {
    /** Element is in viewport (IntersectionObserver) */
    isIntersecting: boolean;
    /** Page/tab is visible (Page Visibility API) */
    isPageVisible: boolean;
    /** Element should actively render (both conditions met) */
    isVisible: boolean;
}
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
export declare function useChartVisibility(elementRef: RefObject<HTMLElement | null>, options?: IntersectionObserverInit): VisibilityState;
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
export declare function useVisibleAnimationFrame(callback: (deltaTime: number) => void, elementRef: RefObject<HTMLElement | null>, enabled?: boolean): void;
/**
 * Hook that pauses an interval when element is not visible.
 *
 * @param callback - Function to call on each interval
 * @param intervalMs - Interval in milliseconds
 * @param elementRef - Ref to the element to observe
 * @param enabled - Optional flag to enable/disable the interval
 */
export declare function useVisibleInterval(callback: () => void, intervalMs: number, elementRef: RefObject<HTMLElement | null>, enabled?: boolean): void;
//# sourceMappingURL=visibility.d.ts.map