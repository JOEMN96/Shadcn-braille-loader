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
  "pendulum",
  "compress",
  "sort",
] as const;

export type BrailleLoaderVariant = (typeof brailleLoaderVariants)[number];
export type BrailleLoaderSpeed = "slow" | "normal" | "fast";
export type BrailleGridSize = "sm" | "md" | "lg" | "xl";
export type BrailleGrid = [rows: number, cols: number];

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
  return 0.7 * (height / 4);
}

function setDot(brailleChar: number, row: number, col: number): number {
  const safeRow = Math.min(row, 3);
  return brailleChar | DOT_BITS[safeRow][col];
}

function createFieldBuffer(width: number): number[] {
  return Array.from({ length: width }, () => BRAILLE_BASE);
}

function fieldToString(field: number[]): string {
  return field.map((c) => String.fromCharCode(c)).join("");
}

type VariantConfig = {
  totalFrames: number;
  interval: number;
  compute: (frame: number, totalFrames: number, width: number, height: number, context: PrecomputeContext) => number[];
};

type PrecomputeContext = {
  importance: number[];
  shuffled: number[];
  target: number[];
  colRandom: number[];
};

const contextCache = new Map<string, PrecomputeContext>();

function getPrecomputeContext(width: number, height: number): PrecomputeContext {
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

const VARIANT_CONFIGS: Record<string, VariantConfig> = {
  pendulum: {
    totalFrames: 120,
    interval: 12,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const spread = Math.sin(Math.PI * progress) * 1.0;
      const basePhase = progress * Math.PI * 8;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const swing = Math.sin(basePhase + pc * spread);
        const center = scaleToHeight((1 - swing) * 0.5, height);
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[Math.floor(pc / 2)] = setDot(field[Math.floor(pc / 2)], row, pc % 2);
          }
        }
      }
      return field;
    },
  },

  compress: {
    totalFrames: 100,
    interval: 40,
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
    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const cursor = progress * width * 2 * 1.2;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);
      const maxRow = height - 1;

      for (let pc = 0; pc < width * 2; pc++) {
        const d = pc - cursor;
        let center: number;
        if (d < -3) {
          center = ctx.target[pc];
        } else if (d < 2) {
          const blend = 1 - (d + 3) / 5;
          const ease = blend * blend * (3 - 2 * blend);
          center = ctx.shuffled[pc] + (ctx.target[pc] - ctx.shuffled[pc]) * ease;
          if (Math.abs(d) < 0.8) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            for (let r = 0; r < height; r++) {
              field[charIdx] = setDot(field[charIdx], r, dc);
            }
            continue;
          }
        } else {
          center =
            ctx.shuffled[pc] +
            Math.sin(progress * Math.PI * 16 + pc * 2.7) * 0.6 +
            Math.sin(progress * Math.PI * 9 + pc * 1.3) * 0.4;
        }
        center = Math.max(0, Math.min(maxRow, center));
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let r = 0; r < height; r++) {
          if (Math.abs(r - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], r, dc);
          }
        }
      }
      return field;
    },
  },

  breathe: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const phase = (Math.sin(progress * Math.PI * 2) + 1) / 2;
      const field = createFieldBuffer(width);
      const centerPos = getCenterX(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const dist = Math.abs(pc - centerPos);
        const normalized = dist / centerPos;
        const center = scaleToHeight(smoothstep(clamp(1 - normalized * 2, 0, 1)) * phase, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  pulse: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const delta = Math.abs(normalized - progress);
        const center = scaleToHeight(smoothstep(clamp(1 - delta * 5, 0, 1)), height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const phase = Math.sin(progress * Math.PI * 2 + pc * 0.3);
        const center = scaleToHeight((phase + 1) / 2, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  snake: {
    totalFrames: 80,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const total = width * 2;
      const head = progress * total;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < total; pc++) {
        let distance = head - pc;
        if (distance < 0) distance += total;
        const center = scaleToHeight(Math.exp(-distance * 0.3), height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  orbit: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const angle = (pc / (width * 2)) * Math.PI * 2;
        const normAngle = ((angle + Math.PI) / (Math.PI * 2) + progress) % 1;
        const center = scaleToHeight(smoothstep(clamp(1 - Math.abs(normAngle - 0.5) * 4, 0, 1)), height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  spiral: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const spiralAngle = normalized * Math.PI * 4 + progress * Math.PI * 2;
        const center = scaleToHeight((Math.sin(spiralAngle) + 1) / 2, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  rain: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const offset = pc * 0.05;
        const local = (progress + offset) % 1;
        const phase = Math.sin(local * Math.PI * 2);
        const center = scaleToHeight((phase + 1) / 2, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  sparkle: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const offset = pc * 0.08;
        const local = (progress + offset) % 1;
        const pulse = Math.sin(local * Math.PI * 2);
        const center = scaleToHeight((pulse + 1) / 2, height);

        if (pulse > 0.3) {
          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;
          for (let row = 0; row < height; row++) {
            if (Math.abs(row - center) < threshold) {
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const phase = Math.floor(progress * 2) % 2;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        if (pc % 2 === phase) {
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

  columns: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const delay = pc / (width * 2);
        const delta = Math.abs(delay - progress);
        if (delta < 0.15) {
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

  cascade: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const delta = Math.abs(normalized - progress);
        if (delta < 0.1) {
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

  diagonalSwipe: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const position = progress * 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const delta = Math.abs(normalized - position + 0.5);
        if (delta < 0.15) {
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

  scan: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const scanPos = progress * width * 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const delta = Math.abs(pc - scanPos);
        if (delta < 2) {
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
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const activePc = Math.floor(progress * width * 2);

      for (let pc = 0; pc < width * 2; pc++) {
        if (pc <= activePc) {
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

  helix: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const wave1 = Math.sin(progress * Math.PI * 4 + normalized * Math.PI * 2);
        const wave2 = Math.cos(progress * Math.PI * 4 + normalized * Math.PI * 2);
        const center = scaleToHeight((wave1 + wave2 + 2) / 4, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
            field[charIdx] = setDot(field[charIdx], row, dc);
          }
        }
      }
      return field;
    },
  },

  braille: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const totalClusters = Math.ceil(width / 2);
      const activeCluster = Math.floor(progress * totalClusters);

      for (let pc = 0; pc < width * 2; pc++) {
        const clusterIdx = Math.floor(pc / 2);
        if (clusterIdx === activeCluster) {
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

  interference: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const waveA = Math.sin(progress * Math.PI * 2 + normalized * Math.PI * 2);
        const waveB = Math.sin(progress * Math.PI * 2 + normalized * Math.PI * 4);
        const combined = (waveA + waveB) / 2;
        const center = scaleToHeight((combined + 1) / 2, height);

        if (combined > 0) {
          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;
          for (let row = 0; row < height; row++) {
            if (Math.abs(row - center) < threshold) {
              field[charIdx] = setDot(field[charIdx], row, dc);
            }
          }
        }
      }
      return field;
    },
  },

  gravityWell: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const centerPos = getCenterX(width);
      const threshold = getThreshold(height);
      const phase = Math.sin(progress * Math.PI * 2);

      for (let pc = 0; pc < width * 2; pc++) {
        const dist = Math.abs(pc - centerPos);
        const normalized = dist / centerPos;
        const center = scaleToHeight((1 - normalized) * (phase + 1) / 2, height);

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          if (Math.abs(row - center) < threshold) {
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const mid = getCenterX(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        let phaseOffset = 0;
        if (pc < mid) phaseOffset = 0;
        else if (pc < mid * 1.5) phaseOffset = Math.PI / 2;
        else if (pc < mid * 2) phaseOffset = Math.PI;
        
        const phase = Math.sin(progress * Math.PI * 2 + phaseOffset);
        const center = scaleToHeight((phase + 1) / 2, height);

        if (phase > 0) {
          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;
          for (let row = 0; row < height; row++) {
            if (Math.abs(row - center) < threshold) {
              field[charIdx] = setDot(field[charIdx], row, dc);
            }
          }
        }
      }
      return field;
    },
  },

  reflectedRipple: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const position = progress < 0.5 ? progress * 4 : (1 - progress) * 4;
      const centerPos = getCenterX(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const delta = Math.abs(pc - position * (width * 2) / 2);
        if (delta < width * 0.2) {
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

export function resolveGrid(gridSize?: BrailleGridSize, grid?: BrailleGrid): [number, number] {
  if (grid) {
    const rows = clamp(Math.round(grid[0]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    const cols = clamp(Math.round(grid[1]), MIN_GRID_DIMENSION, MAX_GRID_DIMENSION);
    return [cols, rows];
  }
  if (gridSize) return [GRID_PRESETS[gridSize][1], GRID_PRESETS[gridSize][0]];
  return [4, 4];
}

export function normalizeVariant(variant?: string): BrailleLoaderVariant {
  if (!variant) return "breathe";
  return brailleLoaderVariants.includes(variant as BrailleLoaderVariant) ? (variant as BrailleLoaderVariant) : "breathe";
}
