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
  return 0.7 + height * 0.15;
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
      // One full swing across the animation duration
      const basePhase = progress * Math.PI * 4; // 2 full oscillations (back & forth)
      const field = createFieldBuffer(width);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        // angle varies across columns to form a curved arc
        const angle = basePhase + (pc / (width * 2)) * Math.PI;
        const center = scaleToHeight((Math.sin(angle) + 1) / 2, height);
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
      const phase = (Math.sin(progress * Math.PI * 2 - Math.PI / 2) + 1) / 2;
      const field = createFieldBuffer(width);
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const maxRadius = Math.max(centerX, centerY) * 1.1;
      const currentRadius = phase * maxRadius;

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        for (let row = 0; row < height; row++) {
          for (let dc = 0; dc < 2; dc++) {
            const actualPc = charIdx * 2 + dc;
            const dx = actualPc - centerX;
            const dy = row - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            const distDiff = Math.abs(dist - currentRadius);
            if (distDiff < 0.8) {
              field[charIdx] = setDot(field[charIdx], row, dc);
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
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const maxRadius = Math.max(centerX, centerY);
      const radius = progress * maxRadius;
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const dx = Math.abs(pc - centerX);
          const dy = Math.abs(row - centerY);
          const manhattanDist = dx + dy;

          if (Math.abs(manhattanDist - radius * 1.5) < threshold * 1.2) {
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const phase = Math.sin(progress * Math.PI * 4 + normalized * Math.PI * 3);
        const normPhase = (phase + 1) / 2;

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const normalizedRow = row / height;
          const wavePos = (normalizedRow + progress) % 1;
          const waveHeight = Math.cos(wavePos * Math.PI * 2);

          if (waveHeight > 0.4) {
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
      const tailLength = Math.min(total / 3, 5);
      const threshold = getThreshold(height);

      for (let pc = 0; pc < total; pc++) {
        let distance = head - pc;
        if (distance < 0) distance += total;

        const intensity = Math.max(0, 1 - distance / tailLength);
        if (intensity > 0.1) {
          const center = scaleToHeight(intensity * 0.8, height);
          const currentThreshold = threshold * (0.5 + intensity * 0.5);

          const charIdx = Math.floor(pc / 2);
          const dc = pc % 2;
          for (let row = 0; row < height; row++) {
            if (Math.abs(row - center) < currentThreshold) {
              field[charIdx] = setDot(field[charIdx], row, dc);
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
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const maxRadius = Math.max(centerX, centerY) * 0.85;
      const angleOffset = progress * Math.PI * 2;
      const threshold = getThreshold(height);

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const dx = pc - centerX;
          const dy = row - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          if (Math.abs(dist - maxRadius) < threshold * 0.7) {
            const normAngle = (angle + Math.PI) / (Math.PI * 2);
            const angleDelta = Math.abs(((normAngle - progress + 1.5) % 1) - 0.5);
            const intensity = smoothstep(clamp(1 - angleDelta * 4, 0, 1));

            if (intensity > 0.3) {
              const charIdx = Math.floor(pc / 2);
              const dc = pc % 2;
              field[charIdx] = setDot(field[charIdx], row, dc);
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
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const maxRadius = Math.max(centerX, centerY);
      const spiralAngle = progress * Math.PI * 6;

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const actualPc = charIdx * 2 + dc;
          const dx = actualPc - centerX;
          const dy = row - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx);

          if (dist < maxRadius) {
            const normDist = dist / maxRadius;
            const targetAngle = (spiralAngle + normDist * Math.PI * 3) % (Math.PI * 2);
            const angleDiff = Math.abs(angle + Math.PI - targetAngle);
            const normAngleDiff = angleDiff % (Math.PI * 2);
            const minDiff = Math.min(normAngleDiff, Math.PI * 2 - normAngleDiff);

            if (minDiff < 0.6 && dist > 0.3) {
              field[charIdx] = setDot(field[charIdx], row, dc);
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;

        // Each column has a unique phase and speed
        const columnSpeed = 1 + (pc % 3) * 0.3;
        const columnPhase = (pc * 0.17) % 1;
        const dropProgress = (progress * columnSpeed + columnPhase) % 1;

        // Drop position (0 = top, 1 = bottom)
        const dropPos = dropProgress * (height + 1) - 1;
        const dropY = Math.floor(dropPos);

        // Draw the drop (1-2 dots tall)
        for (let dropOffset = 0; dropOffset < 2; dropOffset++) {
          const actualY = dropY - dropOffset;
          if (actualY >= 0 && actualY < height) {
            field[charIdx] = setDot(field[charIdx], actualY, dc);
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

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const dotIndex = pc * height + row;
          const sparkleOffset = dotIndex * 0.17 + frame * 0.3;
          const sparklePhase = (sparkleOffset % 1) * Math.PI * 2;
          const sparkle = Math.sin(sparklePhase);
          const localRandom = seededRandom(Math.floor(dotIndex * 47));

          if (sparkle > 0.5 || localRandom() > 0.8) {
            const intensity = Math.max(0.6, sparkle) * (0.5 + localRandom() * 0.5);
            if (intensity > 0.7) {
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
    interval: 40,
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const leadingEdge = progress * 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const normalizedX = pc / (width * 2);
        for (let row = 0; row < height; row++) {
          const normalizedY = 1 - row / height;
          const diagonalSum = normalizedX + normalizedY;
          const delta = Math.abs(diagonalSum - leadingEdge);

          if (delta < 0.18) {
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

      for (let pc = 0; pc < width * 2; pc++) {
        const normalized = pc / (width * 2);
        const wave1 = Math.sin(progress * Math.PI * 6 + normalized * Math.PI * 4);
        const wave2 = Math.cos(progress * Math.PI * 6 + normalized * Math.PI * 4 + Math.PI);
        const combined = (wave1 + wave2 + 2) / 4;

        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const rowPhase = row / height;
          const rowMod = Math.cos(progress * Math.PI * 3 + rowPhase * Math.PI * 2) * 0.3;
          const finalIntensity = combined + rowMod;

          if (finalIntensity > 0.55) {
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
      const totalClusters = width;
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

      for (let pc = 0; pc < width * 2; pc++) {
        const normalizedX = pc / (width * 2);
        for (let row = 0; row < height; row++) {
          const normalizedY = row / height;
          const wave1 = Math.sin(progress * Math.PI * 4 + normalizedX * Math.PI * 3);
          const wave2 = Math.cos(progress * Math.PI * 3 + normalizedY * Math.PI * 2.5);
          const wave3 = Math.sin(progress * Math.PI * 2 + (normalizedX + normalizedY) * Math.PI * 2);
          const combined = (wave1 + wave2 + wave3) / 3;
          const intensity = (combined + 1) / 2;

          if (intensity > 0.35) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
            field[charIdx] = setDot(field[charIdx], row, dc);
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
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const maxRadius = Math.max(centerX, centerY);
      const phase = (Math.sin(progress * Math.PI * 4) + 1) / 2;
      const pullRadius = phase * maxRadius;
      const rand = seededRandom(frame);

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const dx = pc - centerX;
          const dy = row - centerY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < pullRadius) {
            const intensity = 1 - (dist / pullRadius) * 0.7;
            const dotIndex = pc * height + row;
            const noise = rand();
            if (noise < intensity * 0.5 + 0.1) {
              const charIdx = Math.floor(pc / 2);
              const dc = pc % 2;
              field[charIdx] = setDot(field[charIdx], row, dc);
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
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const dx = pc - centerX;
          const dy = row - centerY;

          let phaseOffset = 0;
          if (dx >= 0 && dy >= 0) phaseOffset = 0;
          else if (dx < 0 && dy >= 0) phaseOffset = Math.PI / 2;
          else if (dx < 0 && dy < 0) phaseOffset = Math.PI;
          else phaseOffset = Math.PI * 1.5;

          const phase = Math.sin(progress * Math.PI * 3 + phaseOffset);
          const intensity = (phase + 1) / 2;

          if (intensity > 0.35) {
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
    compute: (frame, totalFrames, width, height, _ctx) => {
      const progress = frame / totalFrames;
      const field = createFieldBuffer(width);
      const phase = progress < 0.5 ? progress * 2 : (1 - progress) * 2;
      const centerX = (width * 2 - 1) / 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const distFromCenter = Math.abs(pc - centerX);
        const normalizedDist = distFromCenter / centerX;
        const edgePos = phase * centerX;
        const delta = Math.abs(distFromCenter - edgePos);

        if (delta < 1.5) {
          const intensity = 1 - delta / 1.5;
          for (let row = 0; row < height; row++) {
            const rowIntensity = intensity * (1 - Math.abs(row - (height - 1) / 2) / (height / 2));
            if (rowIntensity > 0.3) {
              const charIdx = Math.floor(pc / 2);
              const dc = pc % 2;
              field[charIdx] = setDot(field[charIdx], row, dc);
            }
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
