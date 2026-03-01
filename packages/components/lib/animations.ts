/**
 * Animation utilities for smooth data transitions
 *
 * Provides spring-based animations for chart data updates without external dependencies.
 */

"use client";

import { useEffect, useRef, useState } from "react";

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

const DEFAULT_SPRING: Required<SpringConfig> = {
  stiffness: 170,
  damping: 26,
  mass: 1,
  precision: 0.01,
};

/**
 * Simple spring physics simulation
 */
function springStep(
  current: number,
  target: number,
  velocity: number,
  config: Required<SpringConfig>,
  dt: number
): { value: number; velocity: number; isAtRest: boolean } {
  const { stiffness, damping, mass } = config;

  // Spring force: F = -k * x
  const springForce = -stiffness * (current - target);

  // Damping force: F = -c * v
  const dampingForce = -damping * velocity;

  // Acceleration: a = F / m
  const acceleration = (springForce + dampingForce) / mass;

  // Update velocity and position
  const newVelocity = velocity + acceleration * dt;
  const newValue = current + newVelocity * dt;

  // Check if at rest
  const isAtRest =
    Math.abs(newVelocity) < config.precision && Math.abs(newValue - target) < config.precision;

  return {
    value: isAtRest ? target : newValue,
    velocity: isAtRest ? 0 : newVelocity,
    isAtRest,
  };
}

/**
 * Hook to animate a single numeric value
 */
export function useSpring(target: number, config: SpringConfig = {}): number {
  const [current, setCurrent] = useState(target);
  const velocityRef = useRef(0);
  const targetRef = useRef(target);
  const rafRef = useRef<number>(0);

  const finalConfig = { ...DEFAULT_SPRING, ...config };

  useEffect(() => {
    targetRef.current = target;

    const animate = (prevTime: number) => {
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1); // Cap at 100ms

      setCurrent((prev) => {
        const result = springStep(prev, targetRef.current, velocityRef.current, finalConfig, dt);

        velocityRef.current = result.velocity;

        if (!result.isAtRest) {
          rafRef.current = requestAnimationFrame(() => animate(now));
        }

        return result.value;
      });
    };

    // Start animation
    rafRef.current = requestAnimationFrame(() => animate(performance.now()));

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, finalConfig.stiffness, finalConfig.damping, finalConfig.mass, finalConfig]);

  return current;
}

/**
 * Hook to animate data points for charts
 */
export function useAnimatedData<T extends { x: number; y: number }>(
  data: T[],
  config: SpringConfig = {},
  enabled = true
): T[] {
  const [animatedData, setAnimatedData] = useState(data);
  const velocitiesRef = useRef<Map<string, number>>(new Map());
  const rafRef = useRef<number>(0);
  const targetDataRef = useRef(data);

  const finalConfig = { ...DEFAULT_SPRING, ...config };

  useEffect(() => {
    if (!enabled) {
      setAnimatedData(data);
      return;
    }

    targetDataRef.current = data;

    const animate = (prevTime: number) => {
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1);

      let allAtRest = true;

      setAnimatedData((prev) => {
        const newData = targetDataRef.current.map((target, i) => {
          const current = prev[i] || target;
          const key = `${i}`;

          // Animate Y value
          const velocity = velocitiesRef.current.get(key) || 0;
          const result = springStep(current.y, target.y, velocity, finalConfig, dt);

          velocitiesRef.current.set(key, result.velocity);

          if (!result.isAtRest) {
            allAtRest = false;
          }

          return {
            ...target,
            y: result.value,
          };
        });

        if (!allAtRest) {
          rafRef.current = requestAnimationFrame(() => animate(now));
        }

        return newData;
      });
    };

    rafRef.current = requestAnimationFrame(() => animate(performance.now()));

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [data, enabled, finalConfig.stiffness, finalConfig.damping, finalConfig.mass, finalConfig]);

  return enabled ? animatedData : data;
}

/**
 * Interpolate between two values over time
 */
export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

/**
 * Easing functions
 */
export const easing = {
  linear: (t: number) => t,
  easeInQuad: (t: number) => t * t,
  easeOutQuad: (t: number) => t * (2 - t),
  easeInOutQuad: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => --t * t * t + 1,
  easeInOutCubic: (t: number) =>
    t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
};

/**
 * Hook to animate a value with custom easing
 */
export function useAnimatedValue(
  target: number,
  duration = 300,
  easingFn: (t: number) => number = easing.easeOutQuad
): number {
  const [current, setCurrent] = useState(target);
  const startValueRef = useRef(target);
  const startTimeRef = useRef<number>(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    startValueRef.current = current;
    startTimeRef.current = performance.now();

    const animate = () => {
      const now = performance.now();
      const elapsed = now - (startTimeRef.current || now);
      const progress = Math.min(elapsed / duration, 1);
      const eased = easingFn(progress);

      const newValue = lerp(startValueRef.current, target, eased);
      setCurrent(newValue);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, easingFn, current]);

  return current;
}

/**
 * Stagger animations for multiple elements
 */
export function useStaggeredSpring(
  targets: number[],
  staggerDelay = 50,
  config: SpringConfig = {}
): number[] {
  const [values, setValues] = useState(targets);
  const velocitiesRef = useRef<number[]>(targets.map(() => 0));
  const rafRef = useRef<number>(0);
  const startTimesRef = useRef<number[]>(
    targets.map((_, i) => performance.now() + i * staggerDelay)
  );

  const finalConfig = { ...DEFAULT_SPRING, ...config };

  useEffect(() => {
    // Update start times for new items
    if (targets.length > startTimesRef.current.length) {
      const now = performance.now();
      const newStartTimes = [...startTimesRef.current];
      for (let i = startTimesRef.current.length; i < targets.length; i++) {
        newStartTimes.push(now + i * staggerDelay);
      }
      startTimesRef.current = newStartTimes;
    }

    const animate = (prevTime: number) => {
      const now = performance.now();
      const dt = Math.min((now - prevTime) / 1000, 0.1);

      let allAtRest = true;

      setValues((prev) => {
        return targets.map((target, i) => {
          const current = prev[i] ?? target;
          const startTime = startTimesRef.current[i];

          // Don't animate until stagger delay has passed
          if (now < startTime) {
            allAtRest = false;
            return current;
          }

          const velocity = velocitiesRef.current[i] || 0;
          const result = springStep(current, target, velocity, finalConfig, dt);

          velocitiesRef.current[i] = result.velocity;

          if (!result.isAtRest) {
            allAtRest = false;
          }

          return result.value;
        });
      });

      if (!allAtRest) {
        rafRef.current = requestAnimationFrame(() => animate(now));
      }
    };

    rafRef.current = requestAnimationFrame(() => animate(performance.now()));

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [
    targets,
    staggerDelay,
    finalConfig.stiffness,
    finalConfig.damping,
    finalConfig.mass,
    finalConfig,
  ]);

  return values;
}
