"use client";

import * as React from "react";

import {
  type BrailleGrid,
  type BrailleGridSize,
  type BrailleLoaderSpeed,
  type BrailleLoaderVariant,
  type DotState,
  type AnimationContext,
  getDotState,
  getDuration,
  getAnimationContext,
  normalizeVariant,
  resolveGrid,
} from "@/lib/braille-loader";
import { cn } from "@/lib/utils";

type BrailleLoaderProps = React.ComponentProps<"div"> & {
  variant?: BrailleLoaderVariant;
  dotSize?: number | "sm" | "md" | "lg";
  gap?: number | "sm" | "md" | "lg";
  gridSize?: BrailleGridSize;
  grid?: BrailleGrid;
  duration?: number;
  speed?: BrailleLoaderSpeed;
  dotClassName?: string;
  label?: string;
};

const DOT_SIZE_PRESETS = {
  sm: 4,
  md: 6,
  lg: 10,
} as const;

const GAP_PRESETS = {
  sm: 6,
  md: 10,
  lg: 14,
} as const;

function resolveDimension(value: number | string | undefined, presets: Record<string, number>, defaultValue: number): number {
  if (typeof value === "number") {
    return Math.max(1, value);
  }
  if (typeof value === "string" && value in presets) {
    return presets[value];
  }
  return defaultValue;
}

function BrailleLoader({
  variant = "breathe",
  dotSize = 6,
  gap = 10,
  gridSize,
  grid,
  duration,
  speed = "normal",
  dotClassName,
  className,
  label = "Loading",
  style,
  ...props
}: BrailleLoaderProps) {
  const resolvedVariant = normalizeVariant(variant);
  const [rows, cols] = resolveGrid(gridSize, grid);
  const resolvedDuration = duration ?? getDuration(speed);
  const resolvedDotSize = resolveDimension(dotSize, DOT_SIZE_PRESETS, 6);
  const resolvedGap = resolveDimension(gap, GAP_PRESETS, 10);

  const [normalizedTime, setNormalizedTime] = React.useState(0);
  const [mounted, setMounted] = React.useState(false);

  const contextRef = React.useRef<AnimationContext | null>(null);
  if (!contextRef.current) {
    contextRef.current = getAnimationContext(rows, cols);
  }

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!mounted) return;

    let animationId: number;
    let startTime: number | null = null;

    const animate = (timestamp: number) => {
      if (startTime === null) {
        startTime = timestamp;
      }

      const elapsed = timestamp - startTime;
      const time = (elapsed % resolvedDuration) / resolvedDuration;
      setNormalizedTime(time);

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [resolvedDuration, mounted]);

  const totalCells = rows * cols;
  const context = contextRef.current;

  const getDotStyle = (index: number): React.CSSProperties => {
    const row = Math.floor(index / cols);
    const col = index % cols;
    const state = getDotState(resolvedVariant, row, col, normalizedTime, rows, cols, context);

    return {
      opacity: state.opacity,
      transform: `translate3d(${state.translateX}px, ${state.translateY}px, 0) scale(${state.scale})`,
      transition: "opacity 0.1s linear, transform 0.1s linear",
    };
  };

  if (!mounted) {
    return (
      <div
        role="status"
        aria-live="polite"
        className={cn("inline-flex items-center text-current", className)}
        style={style}
        {...props}
      >
        <span className="sr-only">{label}</span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center text-current", className)}
      style={style}
      {...props}
    >
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className="grid"
        style={{
          gap: `${resolvedGap}px`,
          gridTemplateColumns: `repeat(${cols}, ${resolvedDotSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${resolvedDotSize}px)`,
        }}
      >
        {Array.from({ length: totalCells }, (_, dotIndex) => (
          <span
            key={dotIndex}
            className={cn("bg-current rounded-full", dotClassName)}
            style={{
              width: `${resolvedDotSize}px`,
              height: `${resolvedDotSize}px`,
              ...getDotStyle(dotIndex),
            }}
          />
        ))}
      </div>
    </div>
  );
}

export { BrailleLoader, type BrailleLoaderProps };
