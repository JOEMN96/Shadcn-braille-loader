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
  normal: 2000,
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

function softState(strength: number, scaleAmp = 0.3): DotState {
  return {
    opacity: 0.35 + 0.65 * strength,
    scale: 1 + scaleAmp * strength,
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

function breathe(_: number, __: number, time: number): DotState {
  const phase = (Math.sin(time * 2 * Math.PI) + 1) / 2;
  return softState(phase, 0.15);
}

function pulse(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const normalized = maxDist > 0 ? dist / maxDist : 0;
  const strength = smoothFalloff(Math.abs(normalized - time), 0.18);
  return softState(strength, 0.35);
}

function orbit(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const angle = Math.atan2(row - cy, col - cx);
  const norm = (angle + Math.PI) / (2 * Math.PI);
  const strength = smoothFalloff(circularDelta(norm, time), 0.12);
  return softState(strength, 0.28);
}

function snake(row: number, col: number, time: number, path: [number, number][]): DotState {
  const total = path.length;
  const head = time * total;
  const index = getSnakeIndex(row, col, path);
  if (index === -1) return { opacity: 0.3, scale: 1 };
  let distance = head - index;
  if (distance < 0) distance += total;
  const strength = Math.exp(-distance * 0.35);
  return softState(strength, 0.3);
}

function fillSweep(row: number, _: number, time: number, rows: number): DotState {
  const progress = time * rows;
  const strength = smoothFalloff(Math.abs(row - progress), 0.9);
  return softState(strength, 0.2);
}

function scan(row: number, _: number, time: number, rows: number): DotState {
  const pos = time * rows;
  const strength = smoothFalloff(Math.abs(row - pos), 1.2);
  return softState(strength, 0.25);
}

function rain(row: number, col: number, time: number, rows: number, offsets: number[]): DotState {
  const local = (time + offsets[col]) % 1;
  const pos = local * rows;
  const strength = smoothFalloff(Math.abs(row - pos), 0.9);
  return softState(strength, 0.2);
}

function cascade(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const delay = (row + col) / (rows + cols);
  const strength = smoothFalloff(Math.abs(delay - time), 0.16);
  return softState(strength, 0.2);
}

function checkerboard(row: number, col: number, time: number): DotState {
  const phase = (Math.sin(time * 2 * Math.PI) + 1) / 2;
  const parity = (row + col) % 2;
  const strength = parity === 0 ? phase : 1 - phase;
  return softState(strength, 0.15);
}

function columns(col: number, time: number, cols: number): DotState {
  const pos = time * cols;
  const strength = smoothFalloff(Math.abs(col - pos), 0.9);
  return softState(strength, 0.2);
}

function waveRows(row: number, _: number, time: number): DotState {
  const phase = (Math.sin(time * 2 * Math.PI + row * 0.5) + 1) / 2;
  return softState(phase, 0.15);
}

function diagonalSwipe(row: number, col: number, time: number, rows: number): DotState {
  const position = (row - col) / rows;
  const strength = smoothFalloff(Math.abs(position - (time * 2 - 1)), 0.15);
  return softState(strength, 0.2);
}

function sparkle(row: number, col: number, time: number, offsets: number[][]): DotState {
  const local = (time + (offsets[row]?.[col] ?? 0)) % 1;
  const phase = (Math.sin(local * 2 * Math.PI) + 1) / 2;
  return softState(phase, 0.35);
}

function helix(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  const angle = Math.atan2(dy, dx);
  const radius = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const normRadius = maxDist > 0 ? radius / maxDist : 0;
  const normAngle = (angle + Math.PI) / (2 * Math.PI);
  const index = (normAngle + normRadius * 0.6) % 1;
  const strength = smoothFalloff(circularDelta(index, time), 0.1);
  return softState(strength, 0.25);
}

function braille(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const clusterRows = Math.ceil(rows / 3);
  const clusterCols = Math.ceil(cols / 2);
  const totalClusters = clusterRows * clusterCols;
  const clusterIndex = getBrailleClusterIndex(row, col, clusterCols);
  const progress = time * totalClusters;
  const strength = smoothFalloff(Math.abs(clusterIndex - progress), 0.9);
  return softState(strength, 0.15);
}

function interference(row: number, col: number, time: number): DotState {
  const waveA = Math.sin(time * 2 * Math.PI + row * 0.6);
  const waveB = Math.sin(time * 2 * Math.PI + col * 0.6);
  const combined = (waveA + waveB + 2) / 4;
  return softState(combined, 0.2);
}

function gravityWell(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = cols / 2;
  const cy = rows / 2;
  const dx = col - cx;
  const dy = row - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const norm = maxDist > 0 ? dist / maxDist : 0;
  const pulse = (Math.sin(time * 2 * Math.PI) + 1) / 2;
  return softState((1 - norm) * pulse, 0.2);
}

function phaseShift(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const midRow = rows / 2;
  const midCol = cols / 2;
  let offset = 0;
  if (row < midRow && col >= midCol) offset = Math.PI / 2;
  else if (row >= midRow && col < midCol) offset = Math.PI;
  else if (row >= midRow && col >= midCol) offset = (3 * Math.PI) / 2;
  const phase = (Math.sin(time * 2 * Math.PI + offset) + 1) / 2;
  return softState(phase, 0.15);
}

function spiral(row: number, col: number, time: number, rows: number, cols: number): DotState {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const dx = col - cx;
  const dy = row - cy;
  const angle = Math.atan2(dy, dx);
  const radius = Math.sqrt(dx * dx + dy * dy);
  const maxDist = Math.sqrt(cx * cx + cy * cy);
  const normRadius = maxDist > 0 ? radius / maxDist : 0;
  const normAngle = (angle + Math.PI) / (2 * Math.PI);
  const index = (normAngle + normRadius) % 1;
  const strength = smoothFalloff(circularDelta(index, time), 0.12);
  return softState(strength, 0.35);
}

function reflectedRipple(col: number, time: number, cols: number): DotState {
  const pos = time < 0.5 ? time * 2 : (1 - time) * 2;
  const normalized = col / cols;
  const strength = smoothFalloff(Math.abs(normalized - pos), 0.18);
  return softState(strength, 0.3);
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
      return { opacity: 0.5, scale: 1 };
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
  const context = getAnimationContext(rows, cols);
  const states: DotState[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      states.push(getDotState(variant, row, col, 0.5, rows, cols, context));
    }
  }
  return states;
}

export { getAnimationContext };
export type { AnimationContext };
