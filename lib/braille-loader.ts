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
    gridSize: [5, 5],
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
    totalFrames: 55,
    interval: 40,
    gridSize: [3, 3],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 2200;
      const t = frame * 40;
      const alpha = 0.4 + (0.55 * (1 - Math.cos((2 * Math.PI * t) / period))) / 2;
      const field = createFieldBuffer(width);

      const dotCount = Math.floor(height * alpha);
      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < dotCount; row++) {
          field[charIdx] = setDot(field[charIdx], row, dc);
        }
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

      for (let row = 0; row < height; row++) {
        const rowPhase = (row / height) * Math.PI * 2;
        const waveCenter = (Math.sin(progress * Math.PI * 4 + rowPhase) + 1) / 2;
        const centerPc = waveCenter * (width * 2 - 1);

        for (let pc = 0; pc < width * 2; pc++) {
          const dist = Math.abs(pc - centerPc);
          if (dist < 1.2) {
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
    totalFrames: 35,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 1400;
      const t = frame * 40;
      const field = createFieldBuffer(width);
      const total = width * 2;
      const phaseOffset = 0.13;
      const speed = period / total;

      for (let pc = 0; pc < total; pc++) {
        const phase = (t / (speed * 40) + pc * phaseOffset) % 1;
        const easedPhase = phase * phase * (3 - 2 * phase);
        const alpha = Math.max(0, 1 - easedPhase * 1.5);

        if (alpha > 0.1) {
          const center = scaleToHeight(0.5, height);
          const currentThreshold = getThreshold(height) * (0.3 + alpha * 0.7);

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
    totalFrames: 60,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);
      const period = 1000;
      const t = frame * 40;
      const offset = 0.18;
      const dropAmplitude = 2;

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        const columnPhase = (t / period + pc * offset) % 1;
        const easeOut = 1 - (1 - columnPhase) * (1 - columnPhase);
        const yOffset = easeOut * dropAmplitude;
        const dropPos = columnPhase * (height + 1) - 1 + yOffset;
        const dropY = Math.floor(dropPos);

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
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const dotIndex = pc * height + row;
          const localRand = seededRandom(dotIndex * 47);
          const phaseOffset = localRand();
          const periodMin = 600;
          const periodMax = 1400;
          const period = periodMin + (periodMax - periodMin) * localRand();
          const t = frame * 40;

          const alpha = 0.5 + 0.5 * Math.sin(2 * Math.PI * (t / period + phaseOffset));
          const jitterAmp = 0.15;
          const microJitter = jitterAmp * Math.sin(2 * Math.PI * (t / 200 + phaseOffset * 10));

          if (alpha > 0.5 + microJitter) {
            field[charIdx] = setDot(field[charIdx], row, dc);
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
      const progress = frame / totalFrames;
      const phase = Math.floor(progress * 8) % 2;
      const field = createFieldBuffer(width);

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
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
    totalFrames: 30,
    interval: 40,
    gridSize: [4, 4],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 1200;
      const t = frame * 40;
      const field = createFieldBuffer(width);
      const phaseX = 0.16;

      for (let pc = 0; pc < width * 2; pc++) {
        const charIdx = Math.floor(pc / 2);
        const dc = pc % 2;
        for (let row = 0; row < height; row++) {
          const alpha = (Math.sin(2 * Math.PI * (t / period + pc * phaseX)) + 1) / 2;
          const rowOffset = row / height;
          const intensity = Math.max(0, Math.min(1, alpha - rowOffset));
          if (intensity > 0.3) {
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
    totalFrames: 35,
    interval: 40,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 1400;
      const t = frame * 40;
      const progress = (t / period) % 1;
      const field = createFieldBuffer(width);
      const trailFactor = 3.5;
      const N = width * 2 + height;

      for (let pc = 0; pc < width * 2; pc++) {
        const normalizedX = pc / (width * 2 - 1);
        for (let row = 0; row < height; row++) {
          const normalizedY = row / (height - 1);
          const phase = (normalizedX + normalizedY) / 2 - progress;
          const alpha = Math.exp(-phase * trailFactor);

          if (alpha > 0.1) {
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
      const period = 1600;
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
    totalFrames: 50,
    interval: 44,
    gridSize: [5, 5],
    compute: (frame, totalFrames, width, height, _ctx) => {
      const period = 1800;
      const t = frame * 44;
      const field = createFieldBuffer(width);
      const centerX = (width * 2 - 1) / 2;
      const centerY = (height - 1) / 2;
      const helixRadius = 3.0;
      const colOffset = 0.15;
      const rowSpacing = 0.1;

      for (let pc = 0; pc < width * 2; pc++) {
        for (let row = 0; row < height; row++) {
          const angle = 2 * Math.PI * (t / period + pc * colOffset);
          const cx = centerX + helixRadius * Math.cos(angle + row * rowSpacing);
          const cy = centerY + helixRadius * Math.sin(angle + row * rowSpacing) * 0.5;

          const dist = Math.sqrt((pc - cx) ** 2 + (row - cy) ** 2);
          if (dist < 1.2) {
            const charIdx = Math.floor(pc / 2);
            const dc = pc % 2;
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
    gridSize: [6, 6],
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

  phaseShift: {
    totalFrames: 60,
    interval: 40,
    gridSize: [5, 5],
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
    gridSize: [6, 6],
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
