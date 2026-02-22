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
] as const;

export type BrailleLoaderVariant = (typeof brailleLoaderVariants)[number];
export type BrailleLoaderSpeed = "slow" | "normal" | "fast";
export type BrailleGridSize = "sm" | "md" | "lg" | "xl";
export type BrailleGrid = [rows: number, cols: number];

export type DotState = {
  opacity: number;
  scale: number;
  translateX: number;
  translateY: number;
};

const GRID_PRESETS: Record<BrailleGridSize, BrailleGrid> = {
  sm: [3, 3],
  md: [4, 4],
  lg: [5, 5],
  xl: [6, 6],
};

const MIN_GRID_DIMENSION = 2;
const MAX_GRID_DIMENSION = 12;

export const speedToDuration: Record<BrailleLoaderSpeed, number> = {
  slow: 3000,
  normal: 2400,
  fast: 1200,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/* ---------------- PREMIUM MOTION HELPERS ---------------- */

function smoothFalloff(delta: number, width: number): number {
  const x = clamp(1 - delta / width, 0, 1);
  return x * x * (3 - 2 * x); // smoothstep
}

function circularDelta(a: number, b: number): number {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

function ambientField(row: number, col: number, time: number) {
  const phase = time * 2 * Math.PI;
  return {
    x: Math.sin(phase + row * 0.2 + col * 0.15) * 0.8,
    y: Math.cos(phase + row * 0.18 - col * 0.12) * 0.8,
  };
}

function smoothState(
  energy: number,
  row: number,
  col: number,
  time: number,
  scaleAmp = 0.22
): DotState {
  const drift = ambientField(row, col, time);
  return {
    opacity: 0.45 + 0.45 * energy,
    scale: 1 + scaleAmp * energy,
    translateX: drift.x * energy,
    translateY: drift.y * energy,
  };
}

/* ---------------- RANDOM ---------------- */

function lcg(seed: number) {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    return state / 0x100000000;
  };
}

function precomputeRainOffsets(cols: number): number[] {
  const random = lcg(cols * 7919);
  return Array.from({ length: cols }, () => random());
}

function precomputeSparkleOffsets(rows: number, cols: number): number[][] {
  const random = lcg(rows * cols * 3137);
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => random()));
}

function precomputeSnakePath(rows: number, cols: number): [number, number][] {
  const path: [number, number][] = [];
  for (let row = 0; row < rows; row++) {
    const isEven = row % 2 === 0;
    for (let i = 0; i < cols; i++) {
      const col = isEven ? i : cols - 1 - i;
      path.push([row, col]);
    }
  }
  return path;
}

function precomputeOrbitPath(rows: number, cols: number): [number, number][] {
  const path: [number, number][] = [];
  for (let col = 0; col < cols; col++) path.push([0, col]);
  for (let row = 1; row < rows - 1; row++) path.push([row, cols - 1]);
  if (rows > 1) for (let col = cols - 1; col >= 0; col--) path.push([rows - 1, col]);
  if (cols > 1) for (let row = rows - 2; row >= 1; row--) path.push([row, 0]);
  return path;
}

function getSnakeIndex(row: number, col: number, path: [number, number][]): number {
  return path.findIndex(([r, c]) => r === row && c === col);
}

function getBrailleClusterIndex(row: number, col: number, totalClusterCols: number): number {
  const clusterRow = Math.floor(row / 3);
  const clusterCol = Math.floor(col / 2);
  return clusterRow * totalClusterCols + clusterCol;
}

/* ---------------- VARIANTS ---------------- */

function breathe(row: number, col: number, time: number): DotState {
  const phase = (Math.sin(time * 2 * Math.PI) + 1) / 2;
  return smoothState(phase, row, col, time, 0.15);
}

function pulse(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const normalized = maxDist > 0 ? dist / maxDist : 0;
  const energy = smoothFalloff(Math.abs(normalized - time), 0.2);
  return smoothState(energy, row, col, time);
}

function orbit(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const angle = Math.atan2(row - cy, col - cx);
  const norm = (angle + Math.PI) / (2 * Math.PI);
  const energy = smoothFalloff(circularDelta(norm, time), 0.14);
  return smoothState(energy, row, col, time, 0.18);
}

function snake(row: number, col: number, time: number, path: [number, number][]): DotState {
  const total = path.length;
  const head = time * total;
  const index = getSnakeIndex(row, col, path);
  if (index === -1) return smoothState(0, row, col, time);
  let distance = head - index;
  if (distance < 0) distance += total;
  const energy = Math.exp(-distance * 0.45);
  return smoothState(energy, row, col, time, 0.2);
}

function fillSweep(row: number, col: number, time: number, rows: number): DotState {
  const activeRow = Math.floor(time * rows);
  if (row <= activeRow) return smoothState(1, row, col, time, 0.2);
  return smoothState(0.15, row, col, time);
}

function scan(row: number, col: number, time: number, rows: number): DotState {
  const scanRow = Math.floor(time * rows);
  const distance = Math.abs(row - scanRow);
  if (distance === 0) return smoothState(1, row, col, time, 0.2);
  if (distance === 1) return smoothState(0.5, row, col, time);
  return smoothState(0.1, row, col, time);
}

function rain(row: number, col: number, time: number, rows: number, offsets: number[]): DotState {
  const local = (time + offsets[col]) % 1;
  const activeRow = Math.floor(local * rows);
  if (row === activeRow) return smoothState(1, row, col, time);
  return smoothState(0.1, row, col, time);
}

function cascade(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const delay = (row + col) / (rows + cols);
  const delta = Math.abs(delay - time);
  if (delta < 0.1) return smoothState(1, row, col, time);
  return smoothState(0.1, row, col, time);
}

function checkerboard(row: number, col: number, time: number): DotState {
  const phase = Math.floor(time * 2) % 2;
  if ((row + col) % 2 === phase) return smoothState(1, row, col, time, 0.12);
  return smoothState(0.1, row, col, time);
}

function columns(col: number, time: number, cols: number): DotState {
  const delay = col / cols;
  const delta = Math.abs(delay - time);
  if (delta < 0.1) return { opacity: 1, scale: 1, translateX: 0, translateY: 0 };
  return { opacity: 0.2, scale: 1, translateX: 0, translateY: 0 };
}

function waveRows(row: number, col: number, time: number): DotState {
  const phase = Math.sin(time * 2 * Math.PI + row * 0.5);
  return {
    opacity: 0.45 + 0.45 * ((phase + 1) / 2),
    scale: 1 + 0.1 * phase,
    translateX: Math.sin(time * 2 * Math.PI + row * 0.2 + col * 0.15) * 0.8 * ((phase + 1) / 2),
    translateY: Math.cos(time * 2 * Math.PI + row * 0.18 - col * 0.12) * 0.8 * ((phase + 1) / 2),
  };
}

function diagonalSwipe(row: number, col: number, time: number, rows: number): DotState {
  const threshold = 0.1;
  const position = (row - col) / rows;
  const delta = Math.abs(position - (time * 2 - 1));
  if (delta < threshold) return smoothState(1, row, col, time);
  return smoothState(0.1, row, col, time);
}

function sparkle(row: number, col: number, time: number, offsets: number[][]): DotState {
  const dotOffset = offsets[row]?.[col] ?? 0;
  const local = (time + dotOffset) % 1;
  const pulse = Math.sin(local * 2 * Math.PI);
  if (pulse > 0.8) return smoothState(1, row, col, time, 0.22);
  return smoothState(0.2, row, col, time);
}

function helix(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const angle = Math.atan2(row - cy, col - cx);
  const radius = Math.sqrt(Math.pow(row - cy, 2) + Math.pow(col - cx, 2));
  const normRadius = maxDist > 0 ? radius / maxDist : 0;
  const normAngle = (angle + Math.PI) / (2 * Math.PI);
  const k = 0.5;
  const spiralIndex = (normAngle + normRadius * k) % 1;
  const delta1 = Math.abs(spiralIndex - time);
  const delta2 = Math.abs((spiralIndex + 0.5) % 1 - time);
  const minDelta = Math.min(delta1, delta2);
  if (minDelta < 0.08) return smoothState(1, row, col, time, 0.2);
  return smoothState(0.1, row, col, time);
}

function braille(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const clusterRows = Math.ceil(rows / 3);
  const clusterCols = Math.ceil(cols / 2);
  const totalClusters = clusterRows * clusterCols;
  const clusterIndex = getBrailleClusterIndex(row, col, clusterCols);
  const activeCluster = Math.floor(time * totalClusters);
  if (clusterIndex === activeCluster) return smoothState(1, row, col, time);
  return smoothState(0.1, row, col, time);
}

function interference(row: number, col: number, time: number): DotState {
  const waveA = Math.sin(time * 2 * Math.PI + row * 0.6);
  const waveB = Math.sin(time * 2 * Math.PI + col * 0.6);
  const combined = (waveA + waveB) / 2;
  return {
    opacity: 0.45 + 0.45 * ((combined + 1) / 2),
    scale: 1 + 0.15 * combined,
    translateX: Math.sin(time * 2 * Math.PI + row * 0.2 + col * 0.15) * 0.8 * ((combined + 1) / 2),
    translateY: Math.cos(time * 2 * Math.PI + row * 0.18 - col * 0.12) * 0.8 * ((combined + 1) / 2),
  };
}

function gravityWell(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = cols / 2;
  const cy = rows / 2;
  const dx = col - cx;
  const dy = row - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const norm = maxDist > 0 ? dist / maxDist : 0;
  const phase = Math.sin(time * 2 * Math.PI);
  const pullStrength = 0.4 * phase;
  const scale = 1 - pullStrength * norm;
  const opacity = 0.4 + 0.6 * (1 - norm);
  const drift = ambientField(row, col, time);
  return {
    opacity,
    scale,
    translateX: drift.x * (1 - norm),
    translateY: drift.y * (1 - norm),
  };
}

function phaseShift(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const midRow = rows / 2;
  const midCol = cols / 2;
  let phaseOffset = 0;
  if (row < midRow && col >= midCol) phaseOffset = Math.PI / 2;
  else if (row >= midRow && col < midCol) phaseOffset = Math.PI;
  else if (row >= midRow && col >= midCol) phaseOffset = (3 * Math.PI) / 2;
  const phase = Math.sin(time * 2 * Math.PI + phaseOffset);
  return {
    opacity: 0.45 + 0.45 * ((phase + 1) / 2),
    scale: 1 + 0.15 * phase,
    translateX: Math.sin(time * 2 * Math.PI + row * 0.2 + col * 0.15) * 0.8 * ((phase + 1) / 2),
    translateY: Math.cos(time * 2 * Math.PI + row * 0.18 - col * 0.12) * 0.8 * ((phase + 1) / 2),
  };
}

function spiral(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const angle = Math.atan2(row - cy, col - cx);
  const radius = Math.sqrt(Math.pow(row - cy, 2) + Math.pow(col - cx, 2));
  const normRadius = maxDist > 0 ? radius / maxDist : 0;
  const normAngle = (angle + Math.PI) / (2 * Math.PI);
  const spiralIndex = (normAngle + normRadius) % 1;
  const delta = Math.abs(spiralIndex - time);
  if (delta < 0.07) return smoothState(1, row, col, time, 0.22);
  return smoothState(0.1, row, col, time);
}

function reflectedRipple(col: number, time: number, cols: number): DotState {
  const position = time < 0.5 ? time * 2 : (1 - time) * 2;
  const normalized = col / cols;
  const delta = Math.abs(normalized - position);
  if (delta < 0.1) return { opacity: 1, scale: 1.2, translateX: 0, translateY: 0 };
  return { opacity: 0.2, scale: 1, translateX: 0, translateY: 0 };
}

/* ---------------- CONTEXT ---------------- */

type AnimationContext = {
  snakePath: [number, number][];
  orbitPath: [number, number][];
  rainOffsets: number[];
  sparkleOffsets: number[][];
};

function createAnimationContext(rows: number, cols: number): AnimationContext {
  return {
    snakePath: precomputeSnakePath(rows, cols),
    orbitPath: precomputeOrbitPath(rows, cols),
    rainOffsets: precomputeRainOffsets(cols),
    sparkleOffsets: precomputeSparkleOffsets(rows, cols),
  };
}

const contextCache = new Map<string, AnimationContext>();

function getAnimationContext(rows: number, cols: number): AnimationContext {
  const key = `${rows}x${cols}`;
  let ctx = contextCache.get(key);
  if (!ctx) {
    ctx = createAnimationContext(rows, cols);
    contextCache.set(key, ctx);
  }
  return ctx;
}

/* ---------------- MAIN ---------------- */

export function getDotState(
  variant: BrailleLoaderVariant,
  row: number,
  col: number,
  normalizedTime: number,
  rows: number,
  cols: number,
  context: AnimationContext,
): DotState {
  switch (variant) {
    case "breathe":
      return breathe(row, col, normalizedTime);
    case "pulse":
      return pulse(row, col, normalizedTime, rows, cols);
    case "orbit":
      return orbit(row, col, normalizedTime, rows, cols);
    case "snake":
      return snake(row, col, normalizedTime, context.snakePath);
    case "fill-sweep":
      return fillSweep(row, col, normalizedTime, rows);
    case "scan":
      return scan(row, col, normalizedTime, rows);
    case "rain":
      return rain(row, col, normalizedTime, rows, context.rainOffsets);
    case "cascade":
      return cascade(row, col, normalizedTime, rows, cols);
    case "checkerboard":
      return checkerboard(row, col, normalizedTime);
    case "columns":
      return columns(col, normalizedTime, cols);
    case "wave-rows":
      return waveRows(row, col, normalizedTime);
    case "diagonal-swipe":
      return diagonalSwipe(row, col, normalizedTime, rows);
    case "sparkle":
      return sparkle(row, col, normalizedTime, context.sparkleOffsets);
    case "helix":
      return helix(row, col, normalizedTime, rows, cols);
    case "braille":
      return braille(row, col, normalizedTime, rows, cols);
    case "interference":
      return interference(row, col, normalizedTime);
    case "gravity-well":
      return gravityWell(row, col, normalizedTime, rows, cols);
    case "phase-shift":
      return phaseShift(row, col, normalizedTime, rows, cols);
    case "spiral":
      return spiral(row, col, normalizedTime, rows, cols);
    case "reflected-ripple":
      return reflectedRipple(col, normalizedTime, cols);
    default:
      return { opacity: 0.5, scale: 1, translateX: 0, translateY: 0 };
  }
}

export function normalizeVariant(variant?: string): BrailleLoaderVariant {
  if (!variant) return "breathe";
  return brailleLoaderVariants.includes(variant as BrailleLoaderVariant) ? (variant as BrailleLoaderVariant) : "breathe";
}

export function resolveGrid(gridSize?: BrailleGridSize, grid?: BrailleGrid): BrailleGrid {
  if (grid) {
    const rows = clamp(Math.round(grid[0]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    const cols = clamp(Math.round(grid[1]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    return [rows, cols];
  }
  if (gridSize) return GRID_PRESETS[gridSize];
  return [4, 4];
}

export function getDuration(speed: BrailleLoaderSpeed): number {
  return speedToDuration[speed];
}

export function getStaticFrame(variant: BrailleLoaderVariant, rows: number, cols: number): DotState[] {
  const totalCells = rows * cols;
  const fixedState: DotState = { opacity: 0.5, scale: 1, translateX: 0, translateY: 0 };
  return Array.from({ length: totalCells }, () => ({ ...fixedState }));
}

export { getAnimationContext };
export type { AnimationContext };
