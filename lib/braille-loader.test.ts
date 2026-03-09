import { describe, it, expect } from "vitest";
import {
  normalizeVariant,
  getVariantGridSize,
  generateFrames,
  seededRandom,
  brailleLoaderVariants,
  getPrecomputeContext,
} from "./braille-loader";

describe("normalizeVariant", () => {
  it("returns 'breathe' for undefined input", () => {
    expect(normalizeVariant(undefined)).toBe("breathe");
  });

  it("returns 'breathe' for invalid variant", () => {
    expect(normalizeVariant("invalid-variant")).toBe("breathe");
    expect(normalizeVariant("")).toBe("breathe");
    expect(normalizeVariant("foo")).toBe("breathe");
  });

  it("returns valid variant unchanged", () => {
    expect(normalizeVariant("helix")).toBe("helix");
    expect(normalizeVariant("sparkle")).toBe("sparkle");
    expect(normalizeVariant("snake")).toBe("snake");
  });

  it("accepts all 19 defined variants", () => {
    brailleLoaderVariants.forEach((variant) => {
      expect(normalizeVariant(variant)).toBe(variant);
    });
  });
});

describe("getVariantGridSize", () => {
  it("returns default [4, 4] for invalid variant", () => {
    expect(getVariantGridSize("invalid")).toEqual([4, 4]);
    expect(getVariantGridSize("")).toEqual([4, 4]);
  });

  it("returns correct grid size for breathe variant", () => {
    expect(getVariantGridSize("breathe")).toEqual([1, 6]);
  });

  it("returns correct grid size for pulse variant", () => {
    expect(getVariantGridSize("pulse")).toEqual([4, 4]);
  });

  it("returns correct grid size for snake variant", () => {
    expect(getVariantGridSize("snake")).toEqual([2, 4]);
  });

  it("returns valid [width, height] tuples for all variants", () => {
    brailleLoaderVariants.forEach((variant) => {
      const [width, height] = getVariantGridSize(variant);
      expect(width).toBeGreaterThan(0);
      expect(height).toBeGreaterThan(0);
      expect(Number.isInteger(width)).toBe(true);
      expect(Number.isInteger(height)).toBe(true);
    });
  });
});

describe("seededRandom", () => {
  it("returns deterministic values for same seed", () => {
    const rand1 = seededRandom(42);
    const rand2 = seededRandom(42);

    expect(rand1()).toBe(rand2());
    expect(rand1()).toBe(rand2());
    expect(rand1()).toBe(rand2());
  });

  it("returns different values for different seeds", () => {
    const rand1 = seededRandom(42);
    const rand2 = seededRandom(43);

    expect(rand1()).not.toBe(rand2());
  });

  it("returns values between 0 and 1", () => {
    const rand = seededRandom(12345);
    for (let i = 0; i < 100; i++) {
      const value = rand();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});

describe("generateFrames", () => {
  it("returns frames array with interval for valid variant", () => {
    const result = generateFrames("breathe", 2, 4);
    expect(result.frames).toBeInstanceOf(Array);
    expect(result.frames.length).toBeGreaterThan(0);
    expect(result.interval).toBeGreaterThan(0);
  });

  it("returns at least one frame for invalid variant", () => {
    const result = generateFrames("invalid", 4, 4);
    expect(result.frames.length).toBeGreaterThanOrEqual(1);
  });

  it("generates valid braille characters in frames", () => {
    const result = generateFrames("breathe", 2, 4);
    const brailleBase = 0x2800;
    const brailleEnd = 0x28ff;

    result.frames.forEach((frame) => {
      for (const char of frame) {
        const code = char.charCodeAt(0);
        expect(code).toBeGreaterThanOrEqual(brailleBase);
        expect(code).toBeLessThanOrEqual(brailleEnd);
      }
    });
  });

  it("generates correct frame width based on grid", () => {
    const [width] = getVariantGridSize("breathe");
    const result = generateFrames("breathe", width, 4);

    result.frames.forEach((frame) => {
      expect(frame.length).toBe(width);
    });
  });

  it("caches frames for same variant and size", () => {
    const result1 = generateFrames("pulse", 4, 4);
    const result2 = generateFrames("pulse", 4, 4);

    expect(result1.frames).toBe(result2.frames);
  });
});

describe("getPrecomputeContext", () => {
  it("returns context with required properties", () => {
    const ctx = getPrecomputeContext(4, 4);

    expect(ctx).toHaveProperty("importance");
    expect(ctx).toHaveProperty("shuffled");
    expect(ctx).toHaveProperty("target");
    expect(ctx).toHaveProperty("colRandom");
  });

  it("caches context for same dimensions", () => {
    const ctx1 = getPrecomputeContext(4, 4);
    const ctx2 = getPrecomputeContext(4, 4);

    expect(ctx1).toBe(ctx2);
  });

  it("returns different context for different dimensions", () => {
    const ctx1 = getPrecomputeContext(4, 4);
    const ctx2 = getPrecomputeContext(5, 5);

    expect(ctx1).not.toBe(ctx2);
  });
});

describe("all variants generate valid frames", () => {
  brailleLoaderVariants.forEach((variant) => {
    it(`variant "${variant}" generates valid frames`, () => {
      const [width, height] = getVariantGridSize(variant);
      const result = generateFrames(variant, width, height);

      expect(result.frames.length).toBeGreaterThan(0);
      expect(result.interval).toBeGreaterThan(0);

      result.frames.forEach((frame) => {
        expect(typeof frame).toBe("string");
        expect(frame.length).toBe(width);
      });
    });
  });
});

describe("brailleLoaderVariants", () => {
  it("contains exactly 19 variants", () => {
    expect(brailleLoaderVariants.length).toBe(19);
  });

  it("contains expected variants", () => {
    expect(brailleLoaderVariants).toContain("breathe");
    expect(brailleLoaderVariants).toContain("pulse");
    expect(brailleLoaderVariants).toContain("orbit");
    expect(brailleLoaderVariants).toContain("snake");
    expect(brailleLoaderVariants).toContain("helix");
    expect(brailleLoaderVariants).toContain("sparkle");
  });
});
