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

function setDot(brailleChar: number, row: number, col: number): number {
  return brailleChar | DOT_BITS[row][col];
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
  snakePath: [number, number][];
  rainOffsets: number[];
  sparkleOffsets: number[][];
};

const contextCache = new Map<string, PrecomputeContext>();

function getPrecomputeContext(width: number, height: number): PrecomputeContext {
  const key = `${width}x${height}`;
  let ctx = contextCache.get(key);
  if (!ctx) {
    const pixelCols = width * 2;
    const pixelRows = height * 4;
    const totalDots = pixelCols * pixelRows;

    const rand42 = seededRandom(42);
    const importance = Array.from({ length: totalDots }, () => rand42());

    const rand19 = seededRandom(19);
    const shuffled: number[] = [];
    const target: number[] = [];
    for (let i = 0; i < pixelCols; i++) {
      shuffled.push(rand19() * (pixelRows - 1));
      target.push((i / (pixelCols - 1)) * (pixelRows - 1));
    }

    const snakePath: [number, number][] = [];
    for (let row = 0; row < height; row++) {
      const isEven = row % 2 === 0;
      for (let i = 0; i < width; i++) {
        const col = isEven ? i : width - 1 - i;
        snakePath.push([row, col]);
      }
    }

    const rainOffsets = Array.from({ length: width }, () => {
      const r = seededRandom(width * 7919);
      return r();
    });

    const sparkleOffsets: number[][] = [];
    for (let row = 0; row < height; row++) {
      sparkleOffsets.push(
        Array.from({ length: width }, () => {
          const r = seededRandom(width * height * 3137 + row);
          return r();
        }),
      );
    }

    ctx = {
      importance,
      shuffled,
      target,
      snakePath,
      rainOffsets,
      sparkleOffsets,
    };
    contextCache.set(key, ctx);
  }
  return ctx;
}

const VARIANT_CONFIGS: Record<string, VariantConfig> = {
  pendulum: {
    totalFrames: 120,
    interval: 12,
    compute: (frame, totalFrames, width, _height, _ctx) => {
      const progress = frame / totalFrames;
      const spread = Math.sin(Math.PI * progress) * 1.0;
      const basePhase = progress * Math.PI * 8;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const swing = Math.sin(basePhase + pc * spread);
        const center = (1 - swing) * 1.5;
        for (let row = 0; row < 4; row++) {
          if (Math.abs(row - center) < 0.7) {
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
    compute: (frame, totalFrames, width, _height, ctx) => {
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
        for (let row = 0; row < 4; row++) {
          const importanceIdx = pc * 4 + row;
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
    compute: (frame, totalFrames, width, _height, ctx) => {
      const progress = frame / totalFrames;
      const cursor = progress * width * 2 * 1.2;
      const field = createFieldBuffer(width);

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
            for (let r = 0; r < 4; r++) {
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
        center = Math.max(0, Math.min(3, center));
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let r = 0; r < 4; r++) {
          if (Math.abs(r - center) < 0.7) {
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
      const cx = width / 2;
      const cy = height / 2;

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const dx = col - cx;
          const dy = row - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(cx * cx + cy * cy);
          const normalized = maxDist > 0 ? dist / maxDist : 0;
          const energy = smoothstep(clamp(1 - normalized * 2, 0, 1)) * phase;

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
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
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const dx = col - cx;
          const dy = row - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const normalized = maxDist > 0 ? dist / maxDist : 0;
          const delta = Math.abs(normalized - progress);
          const energy = smoothstep(clamp(1 - delta * 5, 0, 1));

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
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

      for (let row = 0; row < height; row++) {
        const phase = Math.sin(progress * Math.PI * 2 + row * 0.5);
        const energy = (phase + 1) / 2;
        for (let col = 0; col < width; col++) {
          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy * 0.8) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
          }
        }
      }
      return field;
    },
  },

  snake: {
    totalFrames: 80,
    interval: 40,
    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const total = ctx.snakePath.length;
      const head = progress * total;
      const field = createFieldBuffer(width);

      for (let i = 0; i < total; i++) {
        let distance = head - i;
        if (distance < 0) distance += total;
        const energy = Math.exp(-distance * 0.3);

        if (energy > 0.2) {
          const [row, col] = ctx.snakePath[i];
          for (let r = 0; r < 4; r++) {
            if (Math.random() < energy) {
              field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
            }
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
      const cx = width / 2;
      const cy = height / 2;

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const angle = Math.atan2(row - cy, col - cx);
          const normAngle = ((angle + Math.PI) / (Math.PI * 2) + progress) % 1;
          const energy = smoothstep(clamp(1 - Math.abs(normAngle - 0.5) * 4, 0, 1));

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
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
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const angle = Math.atan2(row - cy, col - cx);
          const radius = Math.sqrt(Math.pow(row - cy, 2) + Math.pow(col - cx, 2));
          const normRadius = maxDist > 0 ? radius / maxDist : 0;
          const normAngle = ((angle + Math.PI) / (Math.PI * 2) + progress) % 1;
          const spiralIndex = (normAngle + normRadius * 0.5) % 1;
          const delta = Math.abs(spiralIndex - progress);
          const energy = smoothstep(clamp(1 - delta * 10, 0, 1));

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
          }
        }
      }
      return field;
    },
  },

  rain: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let col = 0; col < width; col++) {
        const local = (progress + ctx.rainOffsets[col]) % 1;
        const activeRow = Math.floor(local * height);
        const row = height - 1 - activeRow;
        if (row >= 0 && row < height) {
          for (let r = 0; r < 4; r++) {
            field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
          }
        }
      }
      return field;
    },
  },

  sparkle: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, height, ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const offset = ctx.sparkleOffsets[row][col];
          const local = (progress + offset) % 1;
          const pulse = Math.sin(local * Math.PI * 2);
          if (pulse > 0.6) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < (pulse + 1) / 2) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
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

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if ((row + col) % 2 === phase) {
            for (let r = 0; r < 4; r++) {
              field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
            }
          }
        }
      }
      return field;
    },
  },

  columns: {
    totalFrames: 60,
    interval: 40,
    compute: (frame, totalFrames, width, _height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let col = 0; col < width; col++) {
        const delay = col / width;
        const delta = Math.abs(delay - progress);
        if (delta < 0.15) {
          for (let r = 0; r < 4; r++) {
            field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
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

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const delay = (row + col) / (width + height);
          const delta = Math.abs(delay - progress);
          if (delta < 0.1) {
            for (let r = 0; r < 4; r++) {
              field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
            }
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

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const position = (row - col) / height;
          const delta = Math.abs(position - (progress * 2 - 1));
          if (delta < 0.15) {
            for (let r = 0; r < 4; r++) {
              field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
            }
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
      const scanRow = Math.floor(progress * height);

      for (let col = 0; col < width; col++) {
        const row = height - 1 - scanRow;
        if (row >= 0 && row < height) {
          for (let r = 0; r < 4; r++) {
            field[col] = setDot(field[col], r, Math.random() > 0.3 ? 0 : 1);
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
      const activeRow = Math.floor(progress * height);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          if (row <= activeRow) {
            for (let r = 0; r < 4; r++) {
              field[col] = setDot(field[col], r, Math.random() > 0.2 ? 0 : 1);
            }
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
      const cx = width / 2;
      const cy = height / 2;
      const maxDist = Math.sqrt(cx * cx + cy * cy);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const angle = Math.atan2(row - cy, col - cx);
          const radius = Math.sqrt(Math.pow(row - cy, 2) + Math.pow(col - cx, 2));
          const normRadius = maxDist > 0 ? radius / maxDist : 0;
          const normAngle = ((angle + Math.PI) / (Math.PI * 2) + progress * 2) % 1;
          const k = 0.5;
          const spiralIndex = (normAngle + normRadius * k) % 1;
          const delta = Math.abs(spiralIndex - progress);
          const energy = smoothstep(clamp(1 - delta * 8, 0, 1));

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
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
      const clusterRows = Math.ceil(height / 3);
      const clusterCols = Math.ceil(width / 2);
      const totalClusters = clusterRows * clusterCols;
      const activeCluster = Math.floor(progress * totalClusters);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const clusterRow = Math.floor(row / 3);
          const clusterCol = Math.floor(col / 2);
          const clusterIndex = clusterRow * clusterCols + clusterCol;
          if (clusterIndex === activeCluster) {
            for (let r = 0; r < 4; r++) {
              field[col] = setDot(field[col], r, Math.random() > 0.3 ? 0 : 1);
            }
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

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const waveA = Math.sin(progress * Math.PI * 2 + row * 0.6);
          const waveB = Math.sin(progress * Math.PI * 2 + col * 0.6);
          const combined = (waveA + waveB) / 2;
          const energy = (combined + 1) / 2;

          if (energy > 0.4) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
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
      const cx = width / 2;
      const cy = height / 2;
      const phase = Math.sin(progress * Math.PI * 2);

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          const dx = col - cx;
          const dy = row - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const maxDist = Math.sqrt(cx * cx + cy * cy);
          const norm = maxDist > 0 ? dist / maxDist : 0;
          const energy = ((1 - norm) * (phase + 1)) / 2;

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
            }
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
      const midRow = height / 2;
      const midCol = width / 2;

      for (let row = 0; row < height; row++) {
        for (let col = 0; col < width; col++) {
          let phaseOffset = 0;
          if (row < midRow && col >= midCol) phaseOffset = Math.PI / 2;
          else if (row >= midRow && col < midCol) phaseOffset = Math.PI;
          else if (row >= midRow && col >= midCol) phaseOffset = (3 * Math.PI) / 2;
          const phase = Math.sin(progress * Math.PI * 2 + phaseOffset);
          const energy = (phase + 1) / 2;

          if (energy > 0.3) {
            for (let r = 0; r < 4; r++) {
              if (Math.random() < energy) {
                field[col] = setDot(field[col], r, Math.random() > 0.5 ? 0 : 1);
              }
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
    compute: (frame, totalFrames, width, _height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const position = progress < 0.5 ? progress * 4 : (1 - progress) * 4;

      for (let col = 0; col < width; col++) {
        const normalized = col / width;
        const delta = Math.abs(normalized - position);
        if (delta < 0.15) {
          for (let r = 0; r < 4; r++) {
            field[col] = setDot(field[col], r, Math.random() > 0.2 ? 0 : 1);
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
