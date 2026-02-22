"use client"

import * as React from "react"

import {
  type BrailleGrid,
  type BrailleGridSize,
  type BrailleLoaderSpeed,
  type BrailleLoaderVariant,
  getFrameCount,
  getFrameMs,
  getReducedMotionFrame,
  isDotActive,
  normalizeVariant,
  resolveGrid,
} from "@/lib/braille-loader"
import { cn } from "@/lib/utils"

type BrailleLoaderProps = React.ComponentProps<"div"> & {
  variant?: BrailleLoaderVariant
  size?: "sm" | "md" | "lg"
  gridSize?: BrailleGridSize
  grid?: BrailleGrid
  speed?: BrailleLoaderSpeed
  dotClassName?: string
  label?: string
}

const sizeVars = {
  sm: { dot: "5px", gap: "4px", radius: "9999px" },
  md: { dot: "7px", gap: "5px", radius: "9999px" },
  lg: { dot: "10px", gap: "6px", radius: "9999px" },
} as const

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    const onChange = () => setPrefersReducedMotion(mediaQuery.matches)

    onChange()
    mediaQuery.addEventListener("change", onChange)

    return () => mediaQuery.removeEventListener("change", onChange)
  }, [])

  return prefersReducedMotion
}

function BrailleLoader({
  variant = "braille",
  size = "md",
  gridSize = "md",
  grid,
  speed = "normal",
  dotClassName,
  className,
  label = "Loading",
  style,
  ...props
}: BrailleLoaderProps) {
  const resolvedVariant = normalizeVariant(variant)
  const [rows, cols] = resolveGrid(gridSize, grid)
  const frameCount = getFrameCount(resolvedVariant, rows, cols)
  const prefersReducedMotion = usePrefersReducedMotion()
  const [frameIndex, setFrameIndex] = React.useState(0)

  React.useEffect(() => {
    if (prefersReducedMotion) {
      return
    }

    const intervalMs = getFrameMs(resolvedVariant, speed)
    const timer = window.setInterval(() => {
      setFrameIndex((current) => (current + 1) % frameCount)
    }, intervalMs)

    return () => window.clearInterval(timer)
  }, [frameCount, prefersReducedMotion, resolvedVariant, speed, rows, cols])

  const resolvedSize = sizeVars[size]
  const staticFrame = React.useMemo(
    () => new Set(getReducedMotionFrame(resolvedVariant, rows, cols)),
    [resolvedVariant, rows, cols]
  )
  const totalCells = rows * cols

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("inline-flex items-center text-current", className)}
      style={
        {
          "--bl-dot-size": resolvedSize.dot,
          "--bl-gap": resolvedSize.gap,
          "--bl-dot-radius": resolvedSize.radius,
          ...style,
        } as React.CSSProperties
      }
      {...props}
    >
      <span className="sr-only">{label}</span>
      <div
        aria-hidden="true"
        className="grid"
        style={{
          gap: "var(--bl-gap)",
          gridTemplateColumns: `repeat(${cols}, var(--bl-dot-size))`,
          gridTemplateRows: `repeat(${rows}, var(--bl-dot-size))`,
        }}
      >
        {Array.from({ length: totalCells }, (_, dotIndex) => {
          const active = prefersReducedMotion
            ? staticFrame.has(dotIndex)
            : isDotActive(resolvedVariant, frameIndex, dotIndex, rows, cols)

          return (
            <span
              key={dotIndex}
              className={cn(
                "bg-current transition-opacity duration-150 ease-linear",
                active ? "opacity-90" : "opacity-20",
                dotClassName
              )}
              style={{
                width: "var(--bl-dot-size)",
                height: "var(--bl-dot-size)",
                borderRadius: "var(--bl-dot-radius)",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

export { BrailleLoader, type BrailleLoaderProps }
