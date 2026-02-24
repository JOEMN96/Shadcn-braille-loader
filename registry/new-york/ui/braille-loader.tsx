"use client";

import * as React from "react";

import {
  type BrailleGrid,
  type BrailleGridSize,
  type BrailleLoaderSpeed,
  type BrailleLoaderVariant,
  generateFrames,
  normalizeVariant,
  resolveGrid,
  speedToDuration,
} from "@/lib/braille-loader";
import { cn } from "@/lib/utils";

type BrailleLoaderProps = React.ComponentProps<"div"> & {
  variant?: BrailleLoaderVariant;
  gridSize?: BrailleGridSize;
  grid?: BrailleGrid;
  speed?: BrailleLoaderSpeed;
  label?: string;
  fontSize?: number;
};

function BrailleLoader({
  variant = "breathe",
  gridSize,
  grid,
  speed = "normal",
  className,
  label = "Loading",
  fontSize = 28,
  style,
  ...props
}: BrailleLoaderProps) {
  const resolvedVariant = normalizeVariant(variant);
  const [width, height] = resolveGrid(gridSize, grid);
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const [mounted, setMounted] = React.useState(false);

  const framesData = React.useMemo(() => {
    return generateFrames(resolvedVariant, width, height);
  }, [resolvedVariant, width, height]);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const speedMultiplier: Record<BrailleLoaderSpeed, number> = {
    slow: 1.5,
    normal: 1,
    fast: 0.6,
  };

  React.useEffect(() => {
    if (!mounted || !spanRef.current) return;

    const frames = framesData.frames;
    let frameIndex = 0;
    const baseInterval = framesData.interval;
    const interval = baseInterval * speedMultiplier[speed];

    const updateFrame = () => {
      if (spanRef.current) {
        spanRef.current.textContent = frames[frameIndex];
      }
      frameIndex = (frameIndex + 1) % frames.length;
    };

    updateFrame();
    const intervalId = setInterval(updateFrame, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [framesData, mounted, speed]);

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
      <span
        ref={spanRef}
        aria-hidden="true"
        style={{
          fontFamily: "monospace",
          whiteSpace: "pre",
          fontSize: `${fontSize}px`,
          lineHeight: 1,
          letterSpacing: 0,
        }}
      >
        {framesData.frames[0]}
      </span>
    </div>
  );
}

export { BrailleLoader, type BrailleLoaderProps };
