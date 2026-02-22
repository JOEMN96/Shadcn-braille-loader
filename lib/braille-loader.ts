export const brailleLoaderVariants = [
  "breathe",
  "pulse",
  "orbit",
  "snake",
  "fill-sweep",
  "scan",
  "rain",
  "cascade",
  "checkerboard",
  "columns",
  "wave-rows",
  "diagonal-swipe",
  "sparkle",
  "helix",
  "braille",
  "interference",
  "gravity-well",
  "phase-shift",
  "spiral",
  "reflected-ripple",
] as const

export type BrailleLoaderVariant = (typeof brailleLoaderVariants)[number]
export type BrailleLoaderSpeed = "slow" | "normal" | "fast"
export type BrailleGridSize = "sm" | "md" | "lg" | "xl"
export type BrailleGrid = [rows: number, cols: number]

export type DotState = {
  opacity: number
  scale: number
}

const GRID_PRESETS: Record<BrailleGridSize, BrailleGrid> = {
  sm: [3, 3],
  md: [4, 4],
  lg: [5, 5],
  xl: [6, 6],
}

const MIN_GRID_DIMENSION = 2
const MAX_GRID_DIMENSION = 12

export const speedToDuration: Record<BrailleLoaderSpeed, number> = {
  slow: 3000,
  normal: 2000,
  fast: 1200,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function lcg(seed: number) {
  let state = seed
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000
    return state / 0x100000000
  }
}

function precomputeRainOffsets(cols: number): number[] {
  const random = lcg(cols * 7_919)
  return Array.from({ length: cols }, () => random())
}

function precomputeSparkleOffsets(rows: number, cols: number): number[][] {
  const random = lcg(rows * cols * 3_137)
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => random())
  )
}

function precomputeSnakePath(rows: number, cols: number): [number, number][] {
  const path: [number, number][] = []
  for (let row = 0; row < rows; row++) {
    const isEven = row % 2 === 0
    for (let i = 0; i < cols; i++) {
      const col = isEven ? i : cols - 1 - i
      path.push([row, col])
    }
  }
  return path
}

function precomputeOrbitPath(rows: number, cols: number): [number, number][] {
  const path: [number, number][] = []

  for (let col = 0; col < cols; col++) {
    path.push([0, col])
  }
  for (let row = 1; row < rows - 1; row++) {
    path.push([row, cols - 1])
  }
  if (rows > 1) {
    for (let col = cols - 1; col >= 0; col--) {
      path.push([rows - 1, col])
    }
  }
  if (cols > 1) {
    for (let row = rows - 2; row >= 1; row--) {
      path.push([row, 0])
    }
  }

  const seen = new Set<string>()
  return path.filter(([r, c]) => {
    const key = `${r},${c}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function getSnakeIndex(
  row: number,
  col: number,
  path: [number, number][]
): number {
  return path.findIndex(([r, c]) => r === row && c === col)
}

function getBrailleClusterIndex(
  row: number,
  col: number,
  totalClusterCols: number
): number {
  const clusterRow = Math.floor(row / 3)
  const clusterCol = Math.floor(col / 2)
  return clusterRow * totalClusterCols + clusterCol
}

function breathe(row: number, col: number, time: number): DotState {
  const phase = Math.sin(time * 2 * Math.PI)
  return {
    scale: 1 + 0.15 * phase,
    opacity: 0.6 + 0.4 * phase,
  }
}

function pulse(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const distance = Math.sqrt(
    Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2)
  )
  const maxDistance = Math.sqrt(
    Math.pow(centerX, 2) + Math.pow(centerY, 2)
  )
  const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0
  const wave = Math.abs(normalizedDistance - time)

  if (wave < 0.1) {
    return { opacity: 1, scale: 1.4 }
  }
  return { opacity: 0.3, scale: 1 }
}

function orbit(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const angle = Math.atan2(row - centerY, col - centerX)
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
  const delta = Math.abs(normalizedAngle - time)

  if (delta < 0.08) {
    return { opacity: 1, scale: 1.3 }
  }
  return { opacity: 0.3, scale: 1 }
}

function snake(
  row: number,
  col: number,
  time: number,
  snakePath: [number, number][]
): DotState {
  const totalDots = snakePath.length
  const headPosition = Math.floor(time * totalDots)
  const trailLength = 8
  const dotIndex = getSnakeIndex(row, col, snakePath)

  if (dotIndex === -1) {
    return { opacity: 0.2, scale: 1 }
  }

  const distanceFromHead = headPosition - dotIndex

  if (distanceFromHead >= 0 && distanceFromHead < trailLength) {
    return {
      opacity: 1 - distanceFromHead / trailLength,
      scale: 1.3,
    }
  }
  return { opacity: 0.2, scale: 1 }
}

function fillSweep(
  row: number,
  col: number,
  time: number,
  rows: number
): DotState {
  const activeRow = Math.floor(time * rows)
  if (row <= activeRow) {
    return { opacity: 1, scale: 1.2 }
  }
  return { opacity: 0.2, scale: 1 }
}

function scan(row: number, col: number, time: number, rows: number): DotState {
  const scanRow = Math.floor(time * rows)
  const distance = Math.abs(row - scanRow)

  if (distance === 0) {
    return { opacity: 1, scale: 1.3 }
  }
  if (distance === 1) {
    return { opacity: 0.6, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function rain(
  row: number,
  col: number,
  time: number,
  rows: number,
  columnOffsets: number[]
): DotState {
  const localTime = (time + columnOffsets[col]) % 1
  const activeRow = Math.floor(localTime * rows)

  if (row === activeRow) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function cascade(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const delay = (row + col) / (rows + cols)
  const delta = Math.abs(delay - time)

  if (delta < 0.1) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function checkerboard(row: number, col: number, time: number): DotState {
  const phase = Math.floor(time * 2) % 2
  if ((row + col) % 2 === phase) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function columns(
  col: number,
  time: number,
  cols: number
): DotState {
  const delay = col / cols
  const delta = Math.abs(delay - time)

  if (delta < 0.1) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function waveRows(row: number, col: number, time: number): DotState {
  const phase = Math.sin(time * 2 * Math.PI + row * 0.5)
  return {
    opacity: 0.5 + 0.5 * phase,
    scale: 1 + 0.1 * phase,
  }
}

function diagonalSwipe(
  row: number,
  col: number,
  time: number,
  rows: number
): DotState {
  const threshold = 0.1
  const position = (row - col) / rows
  const delta = Math.abs(position - (time * 2 - 1))

  if (delta < threshold) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function sparkle(
  row: number,
  col: number,
  time: number,
  sparkleOffsets: number[][]
): DotState {
  const dotOffset = sparkleOffsets[row]?.[col] ?? 0
  const localTime = (time + dotOffset) % 1
  const pulse = Math.sin(localTime * 2 * Math.PI)

  if (pulse > 0.8) {
    return { opacity: 1, scale: 1.4 }
  }
  return { opacity: 0.3, scale: 1 }
}

function helix(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

  const angle = Math.atan2(row - centerY, col - centerX)
  const radius = Math.sqrt(Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2))
  const normalizedRadius = maxDistance > 0 ? radius / maxDistance : 0
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)

  const k = 0.5
  const spiralIndex = (normalizedAngle + normalizedRadius * k) % 1
  const delta = Math.abs(spiralIndex - time)
  const delta2 = Math.abs((spiralIndex + 0.5) % 1 - time)
  const minDelta = Math.min(delta, delta2)

  if (minDelta < 0.08) {
    return { opacity: 1, scale: 1.2 }
  }
  return { opacity: 0.2, scale: 1 }
}

function braille(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const clusterRows = Math.ceil(rows / 3)
  const clusterCols = Math.ceil(cols / 2)
  const totalClusters = clusterRows * clusterCols
  const clusterIndex = getBrailleClusterIndex(row, col, clusterCols)
  const activeCluster = Math.floor(time * totalClusters)

  if (clusterIndex === activeCluster) {
    return { opacity: 1, scale: 1 }
  }
  return { opacity: 0.2, scale: 1 }
}

function interference(row: number, col: number, time: number): DotState {
  const waveA = Math.sin(time * 2 * Math.PI + row * 0.6)
  const waveB = Math.sin(time * 2 * Math.PI + col * 0.6)
  const combined = (waveA + waveB) / 2
  return {
    opacity: 0.5 + 0.5 * combined,
    scale: 1 + 0.15 * combined,
  }
}

function gravityWell(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const centerX = cols / 2
  const centerY = rows / 2
  const dx = col - centerX
  const dy = row - centerY
  const distance = Math.sqrt(dx * dx + dy * dy)
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)
  const normalizedDistance = maxDistance > 0 ? distance / maxDistance : 0

  const phase = Math.sin(time * 2 * Math.PI)
  const pullStrength = 0.4 * phase
  const scale = 1 - pullStrength * normalizedDistance
  const opacity = 0.4 + 0.6 * (1 - normalizedDistance)

  return { opacity, scale }
}

function phaseShift(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const midRow = rows / 2
  const midCol = cols / 2

  let phaseOffset: number
  if (row < midRow && col < midCol) {
    phaseOffset = 0
  } else if (row < midRow && col >= midCol) {
    phaseOffset = Math.PI / 2
  } else if (row >= midRow && col < midCol) {
    phaseOffset = Math.PI
  } else {
    phaseOffset = (3 * Math.PI) / 2
  }

  const phase = Math.sin(time * 2 * Math.PI + phaseOffset)
  return {
    opacity: 0.5 + 0.5 * phase,
    scale: 1 + 0.15 * phase,
  }
}

function spiral(
  row: number,
  col: number,
  time: number,
  rows: number,
  cols: number
): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY)

  const angle = Math.atan2(row - centerY, col - centerX)
  const radius = Math.sqrt(Math.pow(row - centerY, 2) + Math.pow(col - centerX, 2))
  const normalizedRadius = maxDistance > 0 ? radius / maxDistance : 0
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)

  const spiralIndex = (normalizedAngle + normalizedRadius) % 1
  const delta = Math.abs(spiralIndex - time)

  if (delta < 0.07) {
    return { opacity: 1, scale: 1.4 }
  }
  return { opacity: 0.2, scale: 1 }
}

function reflectedRipple(col: number, time: number, cols: number): DotState {
  const position = time < 0.5
    ? time * 2
    : (1 - time) * 2
  const normalizedCol = col / cols
  const delta = Math.abs(normalizedCol - position)

  if (delta < 0.1) {
    return { opacity: 1, scale: 1.3 }
  }
  return { opacity: 0.2, scale: 1 }
}

type AnimationContext = {
  snakePath: [number, number][]
  orbitPath: [number, number][]
  rainOffsets: number[]
  sparkleOffsets: number[][]
}

function createAnimationContext(
  rows: number,
  cols: number
): AnimationContext {
  return {
    snakePath: precomputeSnakePath(rows, cols),
    orbitPath: precomputeOrbitPath(rows, cols),
    rainOffsets: precomputeRainOffsets(cols),
    sparkleOffsets: precomputeSparkleOffsets(rows, cols),
  }
}

const contextCache = new Map<string, AnimationContext>()

function getAnimationContext(rows: number, cols: number): AnimationContext {
  const key = `${rows}x${cols}`
  let ctx = contextCache.get(key)
  if (!ctx) {
    ctx = createAnimationContext(rows, cols)
    contextCache.set(key, ctx)
  }
  return ctx
}

export function getDotState(
  variant: BrailleLoaderVariant,
  row: number,
  col: number,
  normalizedTime: number,
  rows: number,
  cols: number,
  context: AnimationContext
): DotState {
  switch (variant) {
    case "breathe":
      return breathe(row, col, normalizedTime)

    case "pulse":
      return pulse(row, col, normalizedTime, rows, cols)

    case "orbit":
      return orbit(row, col, normalizedTime, rows, cols)

    case "snake":
      return snake(row, col, normalizedTime, context.snakePath)

    case "fill-sweep":
      return fillSweep(row, col, normalizedTime, rows)

    case "scan":
      return scan(row, col, normalizedTime, rows)

    case "rain":
      return rain(row, col, normalizedTime, rows, context.rainOffsets)

    case "cascade":
      return cascade(row, col, normalizedTime, rows, cols)

    case "checkerboard":
      return checkerboard(row, col, normalizedTime)

    case "columns":
      return columns(col, normalizedTime, cols)

    case "wave-rows":
      return waveRows(row, col, normalizedTime)

    case "diagonal-swipe":
      return diagonalSwipe(row, col, normalizedTime, rows)

    case "sparkle":
      return sparkle(row, col, normalizedTime, context.sparkleOffsets)

    case "helix":
      return helix(row, col, normalizedTime, rows, cols)

    case "braille":
      return braille(row, col, normalizedTime, rows, cols)

    case "interference":
      return interference(row, col, normalizedTime)

    case "gravity-well":
      return gravityWell(row, col, normalizedTime, rows, cols)

    case "phase-shift":
      return phaseShift(row, col, normalizedTime, rows, cols)

    case "spiral":
      return spiral(row, col, normalizedTime, rows, cols)

    case "reflected-ripple":
      return reflectedRipple(col, normalizedTime, cols)

    default:
      return { opacity: 0.5, scale: 1 }
  }
}

export function normalizeVariant(variant?: string): BrailleLoaderVariant {
  if (!variant) {
    return "breathe"
  }
  return brailleLoaderVariants.includes(variant as BrailleLoaderVariant)
    ? (variant as BrailleLoaderVariant)
    : "breathe"
}

export function resolveGrid(
  gridSize?: BrailleGridSize,
  grid?: BrailleGrid
): BrailleGrid {
  if (grid) {
    const rows = clamp(Math.round(grid[0]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION)
    const cols = clamp(Math.round(grid[1]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION)
    return [rows, cols]
  }

  if (gridSize) {
    return GRID_PRESETS[gridSize]
  }

  return [4, 4]
}

export function getDuration(speed: BrailleLoaderSpeed): number {
  return speedToDuration[speed]
}

export function getStaticFrame(
  variant: BrailleLoaderVariant,
  rows: number,
  cols: number
): DotState[] {
  const context = getAnimationContext(rows, cols)
  const states: DotState[] = []

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const state = getDotState(variant, row, col, 0.5, rows, cols, context)
      states.push(state)
    }
  }

  return states
}

export { getAnimationContext }
export type { AnimationContext }
