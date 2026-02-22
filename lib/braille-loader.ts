export const brailleLoaderVariants = [
  "braille",
  "orbit",
  "breathe",
  "snake",
  "fill-sweep",
  "pulse",
  "columns",
  "checkerboard",
  "scan",
  "rain",
  "cascade",
  "sparkle",
  "wave-rows",
  "helix",
  "diagonal-swipe",
] as const

export type BrailleLoaderVariant = (typeof brailleLoaderVariants)[number]
export type BrailleLoaderSpeed = "slow" | "normal" | "fast"
export type BrailleGridSize = "sm" | "md" | "lg" | "xl"
export type BrailleGrid = [rows: number, cols: number]

type VariantConfig = {
  stepMultiplier?: number
}

const GRID_PRESETS: Record<BrailleGridSize, BrailleGrid> = {
  sm: [3, 3],
  md: [4, 4],
  lg: [5, 5],
  xl: [6, 6],
}

const MIN_GRID_DIMENSION = 2
const MAX_GRID_DIMENSION = 12

const variantConfig: Record<BrailleLoaderVariant, VariantConfig> = {
  braille: { stepMultiplier: 1 },
  orbit: { stepMultiplier: 0.9 },
  breathe: { stepMultiplier: 1.15 },
  snake: { stepMultiplier: 0.9 },
  "fill-sweep": { stepMultiplier: 0.95 },
  pulse: { stepMultiplier: 1 },
  columns: { stepMultiplier: 1 },
  checkerboard: { stepMultiplier: 1.05 },
  scan: { stepMultiplier: 0.9 },
  rain: { stepMultiplier: 0.85 },
  cascade: { stepMultiplier: 0.9 },
  sparkle: { stepMultiplier: 0.95 },
  "wave-rows": { stepMultiplier: 1 },
  helix: { stepMultiplier: 0.9 },
  "diagonal-swipe": { stepMultiplier: 0.95 },
}

type Frame = number[]

const frameCache = new Map<string, Frame[]>()

export const speedToMs: Record<BrailleLoaderSpeed, number> = {
  slow: 220,
  normal: 140,
  fast: 90,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function toIndex(row: number, col: number, cols: number): number {
  return row * cols + col
}

function keyFor(variant: BrailleLoaderVariant, rows: number, cols: number): string {
  return `${variant}:${rows}x${cols}`
}

function range(length: number): number[] {
  return Array.from({ length }, (_, index) => index)
}

function uniqueFrame(values: number[]): Frame {
  return [...new Set(values)].sort((a, b) => a - b)
}

function perimeterPath(rows: number, cols: number): number[] {
  const path: number[] = []

  for (let col = 0; col < cols; col += 1) {
    path.push(toIndex(0, col, cols))
  }
  for (let row = 1; row < rows - 1; row += 1) {
    path.push(toIndex(row, cols - 1, cols))
  }
  if (rows > 1) {
    for (let col = cols - 1; col >= 0; col -= 1) {
      path.push(toIndex(rows - 1, col, cols))
    }
  }
  if (cols > 1) {
    for (let row = rows - 2; row >= 1; row -= 1) {
      path.push(toIndex(row, 0, cols))
    }
  }

  return uniqueFrame(path).length === path.length ? path : [...new Set(path)]
}

function snakePath(rows: number, cols: number): number[] {
  const path: number[] = []

  for (let row = 0; row < rows; row += 1) {
    const columns = range(cols)
    const ordered = row % 2 === 0 ? columns : columns.reverse()
    for (const col of ordered) {
      path.push(toIndex(row, col, cols))
    }
  }

  return path
}

function diagonalBands(rows: number, cols: number): number[][] {
  const count = rows + cols - 1
  return range(count).map((sum) => {
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      const col = sum - row
      if (col >= 0 && col < cols) {
        frame.push(toIndex(row, col, cols))
      }
    }
    return frame
  })
}

function antiDiagonalBands(rows: number, cols: number): number[][] {
  const count = rows + cols - 1
  return range(count).map((difference) => {
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      const col = row - difference + (cols - 1)
      if (col >= 0 && col < cols) {
        frame.push(toIndex(row, col, cols))
      }
    }
    return frame
  })
}

function lcg(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000
    return state / 0x100000000
  }
}

function buildBrailleFrames(rows: number, cols: number): Frame[] {
  const path = snakePath(rows, cols)
  const total = path.length
  const steps = [
    clamp(Math.floor(total * 0.15), 1, total),
    clamp(Math.floor(total * 0.35), 1, total),
    clamp(Math.floor(total * 0.55), 1, total),
    clamp(Math.floor(total * 0.75), 1, total),
    total,
  ]

  return [...steps, ...steps.slice(0, -1).reverse()].map((count) =>
    path.slice(0, count)
  )
}

function buildOrbitFrames(rows: number, cols: number): Frame[] {
  const path = perimeterPath(rows, cols)
  const trail = clamp(Math.floor(path.length / 5), 2, Math.max(2, path.length - 1))

  return path.map((_, index) => {
    const frame = range(trail).map((offset) => {
      const point = path[(index - offset + path.length) % path.length]
      return point
    })
    return uniqueFrame(frame)
  })
}

function buildBreatheFrames(rows: number, cols: number): Frame[] {
  const centerRow = (rows - 1) / 2
  const centerCol = (cols - 1) / 2
  const maxDistance = Math.max(centerRow, centerCol) || 1
  const levels = [0.3, 0.55, 0.8, 1, 0.8, 0.55]

  return levels.map((level) => {
    const threshold = maxDistance * level
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const distance = Math.max(
          Math.abs(row - centerRow),
          Math.abs(col - centerCol)
        )
        if (distance <= threshold) {
          frame.push(toIndex(row, col, cols))
        }``
      }
    }
    return frame
  })
}

function buildSnakeFrames(rows: number, cols: number): Frame[] {
  const path = snakePath(rows, cols)
  const trailLength = clamp(Math.floor(path.length / 4), 3, 8)

  return path.map((_, index) => {
    const frame = range(trailLength).map((offset) => {
      const point = path[(index - offset + path.length) % path.length]
      return point
    })
    return uniqueFrame(frame)
  })
}

function buildFillSweepFrames(rows: number, cols: number): Frame[] {
  const forward = range(cols + 1).map((step) => {
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < step; col += 1) {
        frame.push(toIndex(row, col, cols))
      }
    }
    return frame
  })

  const backward = range(cols).map((index) => cols - 1 - index).map((step) => {
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = step; col < cols; col += 1) {
        frame.push(toIndex(row, col, cols))
      }
    }
    return frame
  })

  return [...forward, ...backward]
}

function buildPulseFrames(rows: number, cols: number): Frame[] {
  const centerRow = (rows - 1) / 2
  const centerCol = (cols - 1) / 2
  const maxDistance = Math.max(
    Math.abs(0 - centerRow) + Math.abs(0 - centerCol),
    Math.abs(rows - 1 - centerRow) + Math.abs(cols - 1 - centerCol)
  )
  const levels = [0.2, 0.45, 0.75, 1, 0.75, 0.45]

  return levels.map((ratio) => {
    const threshold = maxDistance * ratio
    const frame: number[] = []
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const distance = Math.abs(row - centerRow) + Math.abs(col - centerCol)
        if (distance <= threshold) {
          frame.push(toIndex(row, col, cols))
        }
      }
    }
    return frame
  })
}

function buildColumnsFrames(rows: number, cols: number): Frame[] {
  const evenColumns: number[] = []
  const oddColumns: number[] = []
  const leftColumns: number[] = []
  const rightColumns: number[] = []
  const mid = Math.floor(cols / 2)

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = toIndex(row, col, cols)
      if (col % 2 === 0) evenColumns.push(index)
      if (col % 2 === 1) oddColumns.push(index)
      if (col < mid) leftColumns.push(index)
      if (col >= cols - mid) rightColumns.push(index)
    }
  }

  return [evenColumns, oddColumns, leftColumns, rightColumns]
}

function buildCheckerboardFrames(rows: number, cols: number): Frame[] {
  const even: number[] = []
  const odd: number[] = []

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if ((row + col) % 2 === 0) {
        even.push(toIndex(row, col, cols))
      } else {
        odd.push(toIndex(row, col, cols))
      }
    }
  }

  return [even, odd]
}

function buildScanFrames(rows: number, cols: number): Frame[] {
  const down = range(rows).map((row) =>
    range(cols).map((col) => toIndex(row, col, cols))
  )
  const up = range(Math.max(rows - 2, 0))
    .map((index) => rows - 2 - index)
    .map((row) => range(cols).map((col) => toIndex(row, col, cols)))

  return [...down, ...up]
}

function buildRainFrames(rows: number, cols: number): Frame[] {
  const frameCount = Math.max(rows * 2, 8)
  const random = lcg(rows * 131 + cols * 17)
  const phases = range(cols).map(() => Math.floor(random() * rows))
  const speeds = range(cols).map(() => 1 + Math.floor(random() * 2))

  return range(frameCount).map((frameIndex) => {
    const frame: number[] = []
    for (let col = 0; col < cols; col += 1) {
      const row = (phases[col] + frameIndex * speeds[col]) % rows
      frame.push(toIndex(row, col, cols))
      if (row > 0) {
        frame.push(toIndex(row - 1, col, cols))
      }
    }
    return uniqueFrame(frame)
  })
}

function buildCascadeFrames(rows: number, cols: number): Frame[] {
  const bands = diagonalBands(rows, cols)
  const thickness = 2

  return bands.map((_, index) => {
    const frame: number[] = []
    for (let offset = 0; offset < thickness; offset += 1) {
      const band = bands[(index - offset + bands.length) % bands.length]
      frame.push(...band)
    }
    return uniqueFrame(frame)
  })
}

function buildSparkleFrames(rows: number, cols: number): Frame[] {
  const frameCount = Math.max(rows + cols + 4, 10)
  const random = lcg(rows * 911 + cols * 3571)
  const total = rows * cols

  return range(frameCount).map((frameIndex) => {
    const burst = frameIndex % 5 === 0
    const points = burst
      ? clamp(Math.floor(total * 0.4), 4, total)
      : clamp(Math.floor(total * 0.15), 2, 8)
    const frame: number[] = []

    for (let i = 0; i < points; i += 1) {
      frame.push(Math.floor(random() * total))
    }

    return uniqueFrame(frame)
  })
}

function buildWaveRowsFrames(rows: number, cols: number): Frame[] {
  const frames = Math.max(cols * 2, 8)
  const phases = range(rows).map((row) => (row / Math.max(rows, 1)) * Math.PI)

  return range(frames).map((frameIndex) => {
    const frame: number[] = []
    const t = (frameIndex / frames) * 2 * Math.PI

    for (let row = 0; row < rows; row += 1) {
      const signal = (Math.sin(t + phases[row]) + 1) / 2
      const col = Math.round(signal * (cols - 1))
      frame.push(toIndex(row, col, cols))
      if (col + 1 < cols) {
        frame.push(toIndex(row, col + 1, cols))
      }
    }

    return uniqueFrame(frame)
  })
}

function buildHelixFrames(rows: number, cols: number): Frame[] {
  const path = perimeterPath(rows, cols)
  const half = Math.floor(path.length / 2)
  const wing = clamp(Math.floor(path.length / 8), 1, 4)

  return path.map((_, index) => {
    const frame: number[] = []
    const leadA = path[index]
    const leadB = path[(index + half) % path.length]
    frame.push(leadA, leadB)

    for (let offset = 1; offset <= wing; offset += 1) {
      frame.push(path[(index + offset) % path.length])
      frame.push(path[(index - offset + path.length) % path.length])
      frame.push(path[(index + half + offset) % path.length])
      frame.push(path[(index + half - offset + path.length) % path.length])
    }

    return uniqueFrame(frame)
  })
}

function buildDiagonalSwipeFrames(rows: number, cols: number): Frame[] {
  const bands = antiDiagonalBands(rows, cols)
  const reveal = bands.map((_, step) => uniqueFrame(bands.slice(0, step + 1).flat()))
  const conceal = bands
    .map((_, index) => index + 1)
    .map((step) => uniqueFrame(bands.slice(step).flat()))

  return [...reveal, ...conceal]
}

function getFrames(variant: BrailleLoaderVariant, rows: number, cols: number): Frame[] {
  const cacheKey = keyFor(variant, rows, cols)
  const cached = frameCache.get(cacheKey)
  if (cached) {
    return cached
  }

  const frames: Frame[] =
    variant === "braille"
      ? buildBrailleFrames(rows, cols)
      : variant === "orbit"
        ? buildOrbitFrames(rows, cols)
        : variant === "breathe"
          ? buildBreatheFrames(rows, cols)
          : variant === "snake"
            ? buildSnakeFrames(rows, cols)
            : variant === "fill-sweep"
              ? buildFillSweepFrames(rows, cols)
              : variant === "pulse"
                ? buildPulseFrames(rows, cols)
                : variant === "columns"
                  ? buildColumnsFrames(rows, cols)
                  : variant === "checkerboard"
                    ? buildCheckerboardFrames(rows, cols)
                    : variant === "scan"
                      ? buildScanFrames(rows, cols)
                      : variant === "rain"
                        ? buildRainFrames(rows, cols)
                        : variant === "cascade"
                          ? buildCascadeFrames(rows, cols)
                          : variant === "sparkle"
                            ? buildSparkleFrames(rows, cols)
                            : variant === "wave-rows"
                              ? buildWaveRowsFrames(rows, cols)
                              : variant === "helix"
                                ? buildHelixFrames(rows, cols)
                                : buildDiagonalSwipeFrames(rows, cols)

  frameCache.set(cacheKey, frames)
  return frames
}

export function normalizeVariant(variant?: string): BrailleLoaderVariant {
  if (!variant) {
    return "braille"
  }

  return brailleLoaderVariants.includes(variant as BrailleLoaderVariant)
    ? (variant as BrailleLoaderVariant)
    : "braille"
}

export function resolveGrid(
  gridSize: BrailleGridSize = "md",
  grid?: BrailleGrid
): BrailleGrid {
  if (!grid) {
    return GRID_PRESETS[gridSize]
  }

  const rows = clamp(
    Math.round(grid[0]),
    MIN_GRID_DIMENSION,
    MAX_GRID_DIMENSION
  )
  const cols = clamp(
    Math.round(grid[1]),
    MIN_GRID_DIMENSION,
    MAX_GRID_DIMENSION
  )

  return [rows, cols]
}

export function getFrameMs(
  variant: BrailleLoaderVariant,
  speed: BrailleLoaderSpeed
): number {
  const base = speedToMs[speed]
  const multiplier = variantConfig[variant].stepMultiplier ?? 1
  return Math.max(50, Math.round(base * multiplier))
}

export function getFrameCount(
  variant: BrailleLoaderVariant,
  rows: number,
  cols: number
): number {
  return getFrames(variant, rows, cols).length
}

export function getReducedMotionFrame(
  variant: BrailleLoaderVariant,
  rows: number,
  cols: number
): Frame {
  const frames = getFrames(variant, rows, cols)
  return frames.find((frame) => frame.length > 0) ?? []
}

export function isDotActive(
  variant: BrailleLoaderVariant,
  frameIndex: number,
  dotIndex: number,
  rows: number,
  cols: number
): boolean {
  const frames = getFrames(variant, rows, cols)
  const frame = frames[frameIndex % frames.length]
  return frame.includes(dotIndex)
}
