/**
 * Animation utilities for smooth data transitions
 *
 * Provides spring-based animations for chart data updates without external dependencies.
 */
export interface SpringConfig {
    /** Stiffness of the spring (default: 170) */
    stiffness?: number;
    /** Damping of the spring (default: 26) */
    damping?: number;
    /** Mass of the object (default: 1) */
    mass?: number;
    /** Precision threshold (default: 0.01) */
    precision?: number;
}
/**
 * Hook to animate a single numeric value
 */
export declare function useSpring(target: number, config?: SpringConfig): number;
/**
 * Hook to animate data points for charts
 */
export declare function useAnimatedData<T extends {
    x: number;
    y: number;
}>(data: T[], config?: SpringConfig, enabled?: boolean): T[];
/**
 * Interpolate between two values over time
 */
export declare function lerp(start: number, end: number, t: number): number;
/**
 * Easing functions
 */
export declare const easing: {
    linear: (t: number) => number;
    easeInQuad: (t: number) => number;
    easeOutQuad: (t: number) => number;
    easeInOutQuad: (t: number) => number;
    easeInCubic: (t: number) => number;
    easeOutCubic: (t: number) => number;
    easeInOutCubic: (t: number) => number;
};
/**
 * Hook to animate a value with custom easing
 */
export declare function useAnimatedValue(target: number, duration?: number, easingFn?: (t: number) => number): number;
/**
 * Stagger animations for multiple elements
 */
export declare function useStaggeredSpring(targets: number[], staggerDelay?: number, config?: SpringConfig): number[];
//# sourceMappingURL=animations.d.ts.map