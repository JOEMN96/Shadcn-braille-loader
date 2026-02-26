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
  "phase-shift",
  "reflected-ripple",
  "pendulum",
  "compress",
  "sort",
] as const;

export type BrailleLoaderVariant = (typeof brailleLoaderVariants)[number];
export type BrailleLoaderSpeed = "slow" | "normal" | "fast";
export type BrailleGrid = [rows: number, cols: number];

const MIN_GRID_DIMENSION = 2;
const MAX_GRID_DIMENSION = 12;

export const speedToDuration: Record<BrailleLoaderSpeed, number> = {
  slow: 3000,
  normal: 2400,
  fast: 1200,
};

const DOT_BITS = [
  [0x01, 0x08],
  [0x02, 0x10],
  [0x04, 0x20],
  [0x40, 0x80],
];

const BRAILLE_BASE = 0x2800;

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function smoothstep(t: number): number {
  return t * t * (3 - 2 * t);
}

function getCenterX(width: number): number {
  return (width * 2 - 1) / 2;
}

function scaleToHeight(value: number, height: number): number {
  return value * (height - 1);
}

function getThreshold(height: number): number {
  return 0.7 + height * 0.15;
}

function setDot(brailleChar: number, row: number, col: number): number {
  if (row < 0 || row > 3) return brailleChar;
  return brailleChar | DOT_BITS[row][col];
}

function createFieldBuffer(width: number): number[] {
  return Array.from({ length: width }, () => 0);
}

function fieldToString(field: number[]): string {
  return field.map((mask) => String.fromCharCode(BRAILLE_BASE + mask)).join("");
}

type VariantConfig = {
  totalFrames: number;
  interval: number;
  gridSize: [number, number];
  compute: (frame: number, totalFrames: number, width: number, height: number, context: PrecomputeContext) => number[];
};

type PrecomputeContext = {
  importance: number[];
  shuffled: number[];
  target: number[];
  colRandom: number[];
};

const contextCache = new Map<string, PrecomputeContext>();

export function getPrecomputeContext(width: number, height: number): PrecomputeContext {
  const key = `${width}x${height}`;
  let ctx = contextCache.get(key);
  if (!ctx) {
    const pixelCols = width * 2;
    const totalDots = pixelCols * height;

    const rand42 = seededRandom(42);
    const importance = Array.from({ length: totalDots }, () => rand42());

    const rand19 = seededRandom(19);
    const shuffled: number[] = [];
    const target: number[] = [];
    for (let i = 0; i < pixelCols; i++) {
      shuffled.push(rand19() * (height - 1));
      target.push((i / (pixelCols - 1)) * (height - 1));
    }

    const rand123 = seededRandom(123);
    const colRandom: number[] = [];
    for (let pc = 0; pc < pixelCols; pc++) {
      colRandom.push(rand123());
    }

    ctx = {
      importance,
      shuffled,
      target,
      colRandom,
    };
    contextCache.set(key, ctx);
  }
  return ctx;
}

export const VARIANT_CONFIGS: Record<string, VariantConfig> = {
  pendulum: {
    totalFrames: 120,
    interval: 12,
    gridSize: [5, 4],

    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);

      const progress = frame / totalFrames;
      const pixelCols = width * 2;

      // ✅ fast natural swing
      const basePhase = progress * Math.PI * 8;

      // ✅ dynamic spatial sine (CRITICAL)
      const spread = Math.sin(progress * Math.PI) * 1.1;

      const threshold = 0.7;

      for (let pc = 0; pc < pixelCols; pc++) {
        // ⭐ sine exists INSIDE braille cell
        const swing = Math.sin(basePhase + pc * spread);

        const center = ((1 - swing) * (height - 1)) / 2;

        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            const charIdx = Math.floor(pc / 2);
            field[charIdx] = setDot(field[charIdx], row, pc % 2);
          }
        }
      }

      return field;
    },
  },
  compress: {
    totalFrames: 100,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const sieveThreshold = Math.max(0.1, 1 - progress * 1.2);
      const squeeze = Math.min(1, progress / 0.85);
      const activeWidth = Math.max(1, width * 2 * (1 - squeeze * 0.95));
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const mappedPc = (pc / (width * 2)) * activeWidth;
        if (mappedPc >= activeWidth) continue;
        const targetPc = Math.round(mappedPc);
        if (targetPc >= width * 2) continue;
        const charIdx = Math.floor(targetPc / 2);
        const dc = targetPc % 2;

        for (let row = 0; row < height; row++) {
          const importanceIdx = pc * height + row;
          if (ctx.importance[importanceIdx] < sieveThreshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  sort: {
    totalFrames: 100,
    interval: 40,
    gridSize: [6, 6],

    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const pixelCols = width * 2;

      const field = createFieldBuffer(width);

      // sorting front
      const cursor = progress * pixelCols;

      for (let pc = 0; pc < pixelCols; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;

        let fillHeight;

        // =========================
        // ✅ SORTED REGION
        // =========================
        if (pc < cursor - 1) {
          fillHeight = ctx.target[pc];
        }

        // =========================
        // ✅ ACTIVE FRONT
        // =========================
        else if (Math.abs(pc - cursor) < 2) {
          const blend = 1 - Math.abs(pc - cursor) / 2;

          const ease = blend * blend * (3 - 2 * blend);

          fillHeight = ctx.shuffled[pc] + (ctx.target[pc] - ctx.shuffled[pc]) * ease;

          // flash = comparison
          if (blend > 0.7) {
            for (let r = 0; r < height; r++) {
              field[charIdx] = setDot(field[charIdx], r, dc);
            }
            continue;
          }
        }

        // =========================
        // ✅ UNSORTED REGION
        // =========================
        else {
          fillHeight = ctx.shuffled[pc] + Math.sin(progress * Math.PI * 12 + pc * 2.3) * 0.8;
        }

        fillHeight = Math.max(0, Math.min(height - 1, fillHeight));

        // ✅ IMPORTANT FIX:
        // cumulative stacking (NO ERASURE)
        for (let r = Math.floor(fillHeight); r < height; r++) {
          field[charIdx] = setDot(field[charIdx], r, dc);
        }
      }

      return field;
    },
  },

  breathe: {
    totalFrames: 40,
    interval: 40,
    gridSize: [1, 6],

    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const progress = frame / totalFrames;

      const alpha = 0.5 + 0.5 * Math.sin(progress * Math.PI * 2);

      // -----------------------------
      // loop index (changes ONLY after animation ends)
      // -----------------------------
      const loopIndex = Math.floor(frame / totalFrames);

      // -----------------------------
      // checker dots
      // -----------------------------
      const dots: { pc: number; row: number }[] = [];

      for (let pass = 0; pass < 2; pass++) {
        for (let pc = 0; pc < width * 2; pc++) {
          for (let row = 0; row < height; row++) {
            if ((pc + row) % 2 === pass) {
              dots.push({ pc, row });
            }
          }
        }
      }

      // -----------------------------
      // ✅ hole chosen once per loop
      // -----------------------------
      const rand = seededRandom(9001 + loopIndex);
      const holeIndex = Math.floor(rand() * dots.length);

      const maxDots = dots.length - 1;
      const activeDots = Math.floor(alpha * maxDots);

      let placed = 0;

      for (let i = 0; i < dots.length; i++) {
        if (i === holeIndex) continue;
        if (placed >= activeDots) break;

        const { pc, row } = dots[i];

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;

        field[charIdx] = setDot(field[charIdx], row, dc);

        placed++;
      }

      return field;
    },
  },

  pulse: {
    totalFrames: 23,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 900;
      const t = frame * 40;
      const scale = 1 + 0.06 * Math.sin((2 * Math.PI * t) / period);
      const alpha = 0.85 + 0.15 * Math.sin((2 * Math.PI * t) / period);
      const field = createFieldBuffer(width);
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const dx = (pc - centerX) / scale;
          const dy = (row - centerY) / scale;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
          const ringWidth = 0.8;
          const ringPos = ((Math.sin(((2 * Math.PI * t) / period) * 2) + 1) / 2) * maxDist;

          if (Math.abs(dist - ringPos) < ringWidth) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  waveRows: {
    totalFrames: 60,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;

      const basePhase = progress * Math.PI * 2;
      const colPhaseStep = (Math.PI * 2) / Math.max(2, pixelCols);
      const bandWidth = 0.9;

      for (let pc = 0; pc < pixelCols; pc++) {
        const colWave = Math.sin(basePhase + pc * colPhaseStep);
        const centerRow = ((colWave + 1) / 2) * (height - 1);

        for (let row = 0; row < height; row++) {
          const dist = Math.abs(row - centerRow);
          if (dist <= bandWidth) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  snake: {
    totalFrames: 60,
    interval: 80,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;

      // Build serpentine path: left→right on even rows, right→left on odd rows
      const path: Array<{ pc: number; row: number }> = [];
      for (let row = 0; row < height; row++) {
        if (row % 2 === 0) {
          for (let pc = 0; pc < pixelCols; pc++) path.push({ pc, row });
        } else {
          for (let pc = pixelCols - 1; pc >= 0; pc--) path.push({ pc, row });
        }
      }

      const progress = frame / totalFrames;
      const trailingCells = 3;
      const headPos = Math.floor(progress * path.length) % path.length;
      const deadGap = 1;

      const drawPathDot = (idx: number) => {
        const { pc, row } = path[idx];
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        field[charIdx] = setDot(field[charIdx], row, dc);
      };

      drawPathDot(headPos);

      for (let i = deadGap + 1; i < deadGap + 1 + trailingCells; i++) {
        const idx = (headPos - i + path.length) % path.length;
        drawPathDot(idx);
      }

      return field;
    },
  },

  orbit: {
    totalFrames: 60,
    interval: 50,
    gridSize: [4, 4],
    compute: (frame: number, totalFrames: number, width: number, height: number, _ctx: PrecomputeContext) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      // Edge positions in clockwise order around one braille character
      const edgePositions: Array<{ row: number; dc: number }> = [
        { row: 0, dc: 0 }, // top-left
        { row: 0, dc: 1 }, // top-right
        { row: 1, dc: 1 }, // right-1
        { row: 2, dc: 1 }, // right-2
        { row: 3, dc: 1 }, // bottom-right
        { row: 3, dc: 0 }, // bottom-left
        { row: 2, dc: 0 }, // left-2
        { row: 1, dc: 0 }, // left-1
      ];

      // 3-dot trail moving clockwise
      const leadPos = Math.floor(progress * edgePositions.length) % edgePositions.length;
      const trailLength = 3;

      // Only use first character
      const charIdx = 0;

      for (let i = 0; i < trailLength; i++) {
        const idx = (leadPos - i + edgePositions.length) % edgePositions.length;
        const pos = edgePositions[idx];

        if (pos.row < height) {
          field[charIdx] = setDot(field[charIdx], pos.row, pos.dc);
        }
      }

      return field;
    },
  },

  rain: {
    totalFrames: 90,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;
      const t = frame * 40;
      let activeDrops = 0;

      for (let pc = 0; pc < pixelCols; pc++) {
        const rand = ctx.colRandom[pc] ?? 0;

        const period = 1200 + rand * 1000;
        const cyclePos = t / period + rand * 0.91 + pc * 0.07;
        const cycleIndex = Math.floor(cyclePos);
        const phase = cyclePos - cycleIndex;

        const seedA = cycleIndex * 173 + pc * 37 + Math.floor(rand * 1009);
        const noiseA = Math.sin(seedA * 12.9898) * 43758.5453;
        const rollA = noiseA - Math.floor(noiseA);

        const seedB = cycleIndex * 257 + pc * 61 + Math.floor(rand * 881);
        const noiseB = Math.sin(seedB * 78.233) * 12345.6789;
        const rollB = noiseB - Math.floor(noiseB);

        const seedC = cycleIndex * 97 + pc * 149 + Math.floor(rand * 733);
        const noiseC = Math.sin(seedC * 39.3467) * 31337.4242;
        const rollC = noiseC - Math.floor(noiseC);

        const missChance = 0.02 + rand * 0.08;
        if (rollA < missChance) continue;

        const spawnDelay = 0.0 + rollB * 0.2;
        const fallDuration = 0.48 + rollC * 0.42;
        const endPhase = spawnDelay + fallDuration;

        if (phase < spawnDelay || phase > endPhase) continue;

        const localPhase = (phase - spawnDelay) / fallDuration;
        const gravityCurve = 1.6 + rollC * 1.2;
        const accelerated = Math.pow(localPhase, gravityCurve);

        const midWeight = Math.max(0, 1 - Math.abs(localPhase - 0.5) * 2);
        const wobbleSeed = cycleIndex * 0.73 + pc * 1.31 + rand * 4.7;
        const midWobble = Math.sin(wobbleSeed + localPhase * Math.PI * 6) * 0.1 * midWeight;

        const y = Math.floor((accelerated + midWobble) * (height + 1)) - 1;
        if (y < 0 || y >= height) continue;

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        field[charIdx] = setDot(field[charIdx], y, dc);
        activeDrops++;
      }

      if (activeDrops === 0) {
        const fallbackPos = (t / 1600) % 1;
        const fallbackPc = Math.floor(fallbackPos * pixelCols) % pixelCols;
        const fallbackPhase = fallbackPos * (height + 1);
        const fallbackY = clamp(Math.floor(fallbackPhase), 0, height - 1);
        const fallbackCharIdx = Math.floor(fallbackPc / 2);
        const fallbackDc = fallbackPc % 2;
        field[fallbackCharIdx] = setDot(field[fallbackCharIdx], fallbackY, fallbackDc);
      }

      return field;
    },
  },

  sparkle: {
    totalFrames: 60,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;
      const drawableHeight = Math.min(height, 4);
      const t = frame * 40;
      const phaseFrames = Math.max(2, Math.floor(totalFrames / 8));

      for (let pc = 0; pc < pixelCols; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < drawableHeight; row++) {
          const dotIndex = pc * drawableHeight + row;
          const spacedMask = ((pc % 3) === 0) || ((row % 2) === 0 && (pc % 3) === 1);
          if (!spacedMask) continue;

          const seedNoise = Math.sin((dotIndex + 23) * 12.9898) * 43758.5453;
          const seed = seedNoise - Math.floor(seedNoise);

          const phaseLagFrames = Math.floor(seed * phaseFrames);
          const localPhase = Math.floor((frame + phaseLagFrames) / phaseFrames) % 2;
          const checkerActive = ((pc + row) % 2) === localPhase;

          const twinklePeriod = 220 + seed * 160;
          const drift = 0.08 * Math.sin(2 * Math.PI * (t / (1200 + seed * 700) + seed * 1.7));
          const twinkle = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / twinklePeriod + seed * 0.8 + drift));

          if (checkerActive) {
            if (twinkle > 0.44) {
              field[charIdx] = setDot(field[charIdx], row, dc);
            }
          } else {
            if (twinkle > 0.96) {
              field[charIdx] = setDot(field[charIdx], row, dc);
            }
          }
        }
      }

      return field;
    },
  },

  checkerboard: {
    totalFrames: 60,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const drawableHeight = Math.min(height, 4);
      const phaseFrames = Math.max(2, Math.floor(totalFrames / 8));
      const phase = Math.floor(frame / phaseFrames) % 2;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < drawableHeight; row++) {
          // True checkerboard: alternate both X (pc) and Y (row) positions
          if ((pc + row) % 2 === phase) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  columns: {
    totalFrames: 48,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;
      const stepsPerColumn = height + 1;
      const totalSteps = pixelCols * stepsPerColumn;

      const progress = frame / totalFrames;
      const step = Math.floor(progress * totalSteps) % totalSteps;
      const activePc = Math.floor(step / stepsPerColumn);
      const activeFill = step % stepsPerColumn;

      const fillColumnToTop = (pc: number) => {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          field[charIdx] = setDot(field[charIdx], row, dc);
        }
      };

      const fillColumnBottomUp = (pc: number, count: number) => {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        const dotsToFill = Math.max(0, Math.min(height, count));
        for (let i = 0; i < dotsToFill; i++) {
          const row = height - 1 - i;
          field[charIdx] = setDot(field[charIdx], row, dc);
        }
      };

      for (let pc = 0; pc < pixelCols; pc++) {
        if (pc < activePc) {
          fillColumnToTop(pc);
          continue;
        }

        if (pc === activePc) {
          fillColumnBottomUp(pc, activeFill);
        }
      }

      return field;
    },
  },

  cascade: {
    totalFrames: 60,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const leadingEdge = progress * 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const normalizedX = pc / (width * 2);
        for (let row = 0; row < height; row++) {
          const normalizedY = row / height;
          const diagonalSum = normalizedX + normalizedY;
          const delta = Math.abs(diagonalSum - leadingEdge);

          if (delta < 0.2) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  diagonalSwipe: {
    totalFrames: 60,
    interval: 30,
    gridSize: [2, 6],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;

      const maxDiag = (pixelCols - 1) + (height - 1);
      const cycleFrame = frame % totalFrames;
      const clearFrames = Math.max(2, Math.floor(totalFrames / 2));
      const fillFrames = Math.max(2, totalFrames - clearFrames);

      const clearPhase = cycleFrame < clearFrames;
      const localFrame = clearPhase ? cycleFrame : cycleFrame - clearFrames;
      const localTotal = (clearPhase ? clearFrames : fillFrames) - 1;
      const phaseProgress = localTotal > 0 ? localFrame / localTotal : 1;
      const sweepFront = phaseProgress * (maxDiag + 1);

      for (let pc = 0; pc < pixelCols; pc++) {
        for (let row = 0; row < height; row++) {
          const diag = pc + row;
          const show = clearPhase ? diag >= sweepFront : diag < sweepFront;
          if (show) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  scan: {
    totalFrames: 40,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 900;
      const t = frame * 40;
      const progress = (t / period) % 1;
      const field = createFieldBuffer(width);
      const scanX = progress * (width * 2 - 1);
      const sigma = 0.45;

      for (let pc = 0; pc < width * 2; pc++) {
        const dist = Math.abs(pc - scanX);
        const alpha = Math.exp(-(dist * dist) / (2 * sigma * sigma));
        if (alpha > 0.1) {
          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;
          for (let row = 0; row < height; row++) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  fillSweep: {
    totalFrames: 80,
    interval: 60,
    gridSize: [4, 4],

    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);

      const framesPerStep = 2;

      const rawStep = frame / framesPerStep;
      const baseStep = Math.floor(rawStep);
      const phase = rawStep - baseStep;

      const maxFill = height;
      const cycle = maxFill * 2;

      const triangle = (s: number) => maxFill - Math.abs((s % cycle) - maxFill);

      const levelA = triangle(baseStep);
      const levelB = triangle(baseStep + 1);

      // ✅ temporal smoothing
      const fillLevel = phase < 0.5 ? levelA : levelB;

      const maxRow = height - 1;

      for (let i = 0; i < fillLevel; i++) {
        const row = maxRow - i;

        for (let charIdx = 0; charIdx < width; charIdx++) {
          field[charIdx] = setDot(field[charIdx], row, 0);
          field[charIdx] = setDot(field[charIdx], row, 1);
        }
      }

      return field;
    },
  },
  helix: {
    totalFrames: 64,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;
      const drawableHeight = Math.min(height, 4);
      if (drawableHeight < 2) return field;
      const maxRow = drawableHeight - 1;

      const progress = (frame % totalFrames) / Math.max(1, totalFrames - 1);
      const ramp = smoothstep(progress);
      const speedFactor = 0.7 + ramp * 0.7;
      const scrollSteps = progress * (pixelCols + 8) * speedFactor;
      const shiftA = Math.floor(scrollSteps);
      const shiftB = shiftA + 1;
      const shiftBlend = scrollSteps - shiftA;

      const levelScale = maxRow / 3;
      const mapLevel = (level: number) => clamp(Math.round(level * levelScale), 0, maxRow);

      const chainStates: Array<{ a: number; b: number; bridge: boolean }> = [
        { a: 0, b: 3, bridge: false },
        { a: 1, b: 2, bridge: true },
        { a: 2, b: 1, bridge: true },
        { a: 3, b: 0, bridge: false },
      ];

      const drawDot = (pc: number, row: number) => {
        if (pc < 0 || pc >= pixelCols || row < 0 || row >= drawableHeight) return;
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        field[charIdx] = setDot(field[charIdx], row, dc);
      };

      for (let pc = 0; pc < pixelCols; pc++) {
        const idxA = ((pc + shiftA) % chainStates.length + chainStates.length) % chainStates.length;
        const idxB = ((pc + shiftB) % chainStates.length + chainStates.length) % chainStates.length;

        const columnPhase = (pc + 0.5) / pixelCols;
        const useB = columnPhase < shiftBlend;
        const state = useB ? chainStates[idxB] : chainStates[idxA];

        const rowA = mapLevel(state.a);
        const rowB = mapLevel(state.b);

        drawDot(pc, rowA);
        drawDot(pc, rowB);

        if (state.bridge) {
          const bridge = clamp(Math.round((rowA + rowB) / 2), 0, maxRow);
          drawDot(pc, bridge);
        }
      }

      return field;
    },
  },

  braille: {
    totalFrames: 60,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame: number, totalFrames: number, width: number, height: number, _ctx: PrecomputeContext) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      // Braille pattern positions within one character
      const braillePath: Array<{ row: number; dc: number }> = [
        { row: 0, dc: 0 }, // top-left
        { row: 0, dc: 1 }, // top-right
        { row: 1, dc: 1 }, // right-top
        { row: 2, dc: 1 }, // right-bottom
        { row: 3, dc: 1 }, // bottom-right
        { row: 3, dc: 0 }, // bottom-left
        { row: 2, dc: 0 }, // left-bottom
        { row: 1, dc: 0 }, // left-top
      ];

      // 2 moving dots (opposite positions) with 2-dot trails each
      const lead1Index = Math.floor(progress * braillePath.length) % braillePath.length;
      const lead2Index = Math.floor((progress + 0.5) * braillePath.length) % braillePath.length;

      // Only use first character
      const charIdx = 0;

      // First moving dot with 2-dot trail
      for (let i = 0; i < 2; i++) {
        const idx = (lead1Index - i + braillePath.length) % braillePath.length;
        const pos = braillePath[idx];
        if (pos.row < height) {
          field[charIdx] = setDot(field[charIdx], pos.row, pos.dc);
        }
      }

      // Second moving dot with 2-dot trail (opposite)
      for (let i = 0; i < 2; i++) {
        const idx = (lead2Index - i + braillePath.length) % braillePath.length;
        const pos = braillePath[idx];
        if (pos.row < height) {
          field[charIdx] = setDot(field[charIdx], pos.row, pos.dc);
        }
      }

      return field;
    },
  },

  interference: {
    totalFrames: 60,
    interval: 40,
    gridSize: [4, 6],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const pixelCols = width * 2;
      const drawableHeight = Math.min(height, 4);

      const t = frame * 0.18;

      const centerY = (drawableHeight - 1) / 2;
      const srcSpread = Math.max(2, pixelCols * 0.22);

      const source1X = (pixelCols - 1) / 2 - srcSpread + Math.sin(t * 0.73) * 1.0;
      const source2X = (pixelCols - 1) / 2 + srcSpread + Math.cos(t * 0.91) * 1.0;
      const source1Y = centerY + Math.sin(t * 1.07) * 0.45;
      const source2Y = centerY + Math.cos(t * 0.97 + Math.PI / 4) * 0.45;

      const frequency = 2.5;
      const speed1 = 1.9;
      const speed2 = 1.45;

      for (let pc = 0; pc < pixelCols; pc++) {
        for (let row = 0; row < drawableHeight; row++) {
          const dx1 = pc - source1X;
          const dy1 = row - source1Y;
          const dx2 = pc - source2X;
          const dy2 = row - source2Y;

          const dist1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
          const dist2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

          const wave1 = Math.cos(dist1 * frequency - t * speed1 + pc * 0.05);
          const wave2 = Math.cos(dist2 * frequency + t * speed2 + row * 0.08);
          const interference = (wave1 + wave2) * 0.5;

          const peakIntensity = (interference + 1) * 0.5;
          const fringeIntensity = 1 - Math.abs(interference);
          const intensity = peakIntensity * 0.55 + fringeIntensity * 0.45;

          const threshold = 0.6 + 0.06 * Math.sin(t * 0.37 + pc * 0.12);

          if (intensity > threshold) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  phaseShift: {
    totalFrames: 60,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 0;
      const drawableHeight = Math.min(height, 4);
      const centerX = (width * 2 - 1) / 2;
      const centerY = (drawableHeight - 1) / 2;

      const phasePosition = (progress * 8) % 4;

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < drawableHeight; row++) {
          const isLeft = pc < centerX;
          const isTop = row < centerY;

          let quadrantIndex = 0;
          if (isTop && isLeft) quadrantIndex = 0;
          else if (isTop && !isLeft) quadrantIndex = 1;
          else if (!isTop && !isLeft) quadrantIndex = 2;
          else quadrantIndex = 3;

          const phaseDeltaRaw = Math.abs(phasePosition - quadrantIndex);
          const phaseDelta = Math.min(phaseDeltaRaw, 4 - phaseDeltaRaw);

          const primary = Math.max(0, 1 - phaseDelta / 0.7);
          const secondary = Math.max(0, 1 - phaseDelta / 1.35) * 0.45;
          const intensity = primary + secondary;

          if (intensity > 0.42) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  reflectedRipple: {
    totalFrames: 60,
    interval: 40,
    gridSize: [6, 6],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const progress = totalFrames > 1 ? frame / (totalFrames - 1) : 0;
      const drawableHeight = Math.min(height, 4);
      const centerX = (width * 2 - 1) / 2;
      const outward = progress < 0.5;
      const local = outward ? progress / 0.5 : (progress - 0.5) / 0.5;
      const localClamped = clamp(local, 0, 1);
      const easedLocal = smoothstep(localClamped) * 0.2 + localClamped * 0.8;
      const radius = outward ? easedLocal * centerX : (1 - easedLocal) * centerX;
      const ringThickness = 1.1;

      for (let pc = 0; pc < width * 2; pc++) {
        const distFromCenter = Math.abs(pc - centerX);
        const bandStrength = Math.max(0, 1 - Math.abs(distFromCenter - radius) / ringThickness);

        if (bandStrength > 0.3) {
          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;

          for (let row = 0; row < drawableHeight; row++) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }

      return field;
    },
  },
};

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
}

const frameCache = new Map<string, string[]>();

export function generateFrames(variant: string, width: number, height: number): { frames: string[]; interval: number } {
  const key = `${variant}-${width}x${height}`;
  const cached = frameCache.get(key);
  if (cached) {
    return { frames: cached, interval: VARIANT_CONFIGS[toCamelCase(variant)]?.interval || 40 };
  }

  const config = VARIANT_CONFIGS[toCamelCase(variant)];
  if (!config) {
    return { frames: [fieldToString(createFieldBuffer(width))], interval: 40 };
  }

  const context = getPrecomputeContext(width, height);
  const frames: string[] = [];

  for (let frame = 0; frame < config.totalFrames; frame++) {
    const field = config.compute(frame, config.totalFrames, width, height, context);
    frames.push(fieldToString(field));
  }

  frameCache.set(key, frames);
  return { frames, interval: config.interval };
}

export function resolveGrid(variant: string, grid?: BrailleGrid): [number, number] {
  if (grid) {
    const rows = clamp(Math.round(grid[0]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    const cols = clamp(Math.round(grid[1]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    return [cols, rows];
  }

  const config = VARIANT_CONFIGS[toCamelCase(variant)];
  if (config?.gridSize) {
    return config.gridSize;
  }

  return [4, 4];
}

export function normalizeVariant(variant?: string): BrailleLoaderVariant {
  if (!variant) return "breathe";
  return brailleLoaderVariants.includes(variant as BrailleLoaderVariant) ? (variant as BrailleLoaderVariant) : "breathe";
}
