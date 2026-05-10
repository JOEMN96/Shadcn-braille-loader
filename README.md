# Shadcn Braille Loader Registry

A registry-first, accessible braille loader library for shadcn CLI featuring **25 unique animation variants**. Built with React, TypeScript, and Tailwind CSS.

## Features

- **25 Animation Variants** - From subtle pulses to complex patterns
- **Fully Accessible** - Screen reader support, respects `prefers-reduced-motion`
- **Highly Customizable** - Font size, animation speed
- **Theme-Aware** - Inherits color from current text color
- **Registry-First** - Install directly via shadcn CLI
- **Zero Dependencies** - Pure React + CSS animations

---

## Documentation

- **[Quick Reference](./docs/QUICK_REFERENCE.md)** - Fast lookup for common usage patterns and props
- **[Implementation Guide](./docs/IMPLEMENTATION.md)** - Deep dive into architecture, algorithms, and internals

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BrailleLoader Component                      │
│                    (registry/new-york/ui/braille-loader.tsx)         │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  React Component                                             │    │
│  │  - Manages animation loop via requestAnimationFrame          │    │
│  │  - Handles prefers-reduced-motion accessibility              │    │
│  │  - Renders CSS grid of dot elements                          │    │
│  │  - Applies opacity/scale transforms per frame                │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                              │                                       │
│                              ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  Animation Library (lib/braille-loader.ts)                   │    │
│  │  - Pure TypeScript functions (no React dependencies)         │    │
│  │  - Precomputes paths for snake/orbit variants                │    │
│  │  - Caches animation contexts per grid size                   │    │
│  │  - Returns DotState { opacity, scale } for each dot          │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘

Data Flow:
┌──────────┐    ┌─────────────────┐    ┌──────────────┐    ┌───────────┐
│  Props   │───▶│ Get Variant     │───▶│ Get Context  │───▶│ Animate   │
│ (config) │    │ Grid Size       │    │ (cached)     │    │ Loop      │
└──────────┘    └─────────────────┘    └──────────────┘    └─────┬─────┘
                                                              │
                     ┌─────────────────────────────────────────┘
                     ▼
          ┌─────────────────────┐    ┌────────────────────┐
          │  For each dot:      │───▶│  Render Braille    │
          │  getDotState()      │    │  Unicode Character │
          └─────────────────────┘    └────────────────────┘
```

---

## Development

```bash
npm install
npm run dev
```

Build registry artifacts:

```bash
npm run registry:build
```

This generates installable files in `/public/r`.

---

## Installation

### From Registry

Replace `YOUR_REGISTRY_URL` with your hosted base URL:

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json
```

Optional showcase block:

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader-showcase.json
```

---

## Quick Start

```tsx
import { BrailleLoader } from "@/components/ui/braille-loader";

export function Example() {
  return <BrailleLoader variant="helix" speed="normal" className="text-primary" />;
}
```

Optional showcase block:

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader-showcase.json
```

---

## Props Reference

| Prop        | Type                           | Default     | Description                                                                    |
| ----------- | ------------------------------ | ----------- | ------------------------------------------------------------------------------ |
| `variant`   | `BrailleLoaderVariant`         | `"breathe"` | Animation pattern (25 available). Invalid values fallback to `"breathe"`.      |
| `speed`     | `"slow" \| "normal" \| "fast"` | `"normal"`  | Speed preset: `slow=3000ms`, `normal=2400ms`, `fast=1200ms`.                   |
| `className` | `string`                       | `undefined` | CSS classes for the wrapper element.                                           |
| `label`     | `string`                       | `"Loading"` | Screen reader accessible label.                                                |
| `fontSize`  | `number`                       | `28`        | Font size in pixels for braille characters (controls visual size).            |

---

## Variant Comparison Matrix

| Variant | Motion Type | Complexity | Use Case |
| ------- | ----------- | ---------- | -------- |
| `breathe` | Uniform | Low | Subtle loading |
| `pulse` | Radial | Medium | Attention |
| `orbit` | Circular | Medium | Processing |
| `snake` | Sequential | Medium | Progress |
| `fill-sweep` | Linear | Low | Progress |
| `scan` | Linear | Low | Scanning |
| `rain` | Random | Medium | Streaming |
| `cascade` | Diagonal | Medium | Sequential |
| `checkerboard` | Toggle | Low | Idle |
| `columns` | Linear | Low | Column data |
| `wave-rows` | Sine | Medium | Calm |
| `diagonal-swipe` | Diagonal | Low | Transitions |
| `sparkle` | Random | Medium | Creative |
| `helix` | Spiral | High | Scientific |
| `braille` | Pattern | Medium | Accessibility |
| `reflected-ripple` | Bounce | Low | Network |
| `pendulum` | Curved wave | Medium | Calm/continuous |
| `compress` | Inward | Medium | Compacting |
| `sort` | Gradient | Medium | Sorting |
| `equalizer` | Audio bars | Medium | Music/audio |
| `chase` | Linear chase | Low | Waiting states |
| `bars` | Vertical bars | Low | Processing |
| `marquee` | Diagonal stripes | Low | Activity |
| `typing` | Sequential | Low | Text input |
| `spiral` | Rotation | Medium | Creative |

---

## Animation Guide (Descriptions + Braille)

Representative braille sequences for each variant. These are illustrative snapshots of motion states, not fixed outputs.

| Variant            | Animation Description                                     | Example Braille Chars |
| ------------------ | --------------------------------------------------------- | --------------------- |
| `breathe`          | Whole grid gently expands and contracts in unison.        | `⠂⠂` → `⠆⠆` → `⠂⠂`    |
| `pulse`            | Radial pulse radiates from center then fades outward.     | `⠐⠂` → `⠿⠿` → `⠂⠐`    |
| `orbit`            | Bright cluster circles around center on a looped path.    | `⢀⠂` → `⠐⢀` → `⠂⢀`    |
| `snake`            | Lead dot moves cell-by-cell with trailing tail.           | `⠁⠂⠄` → `⠂⠄⠂`         |
| `fill-sweep`       | Grid fills linearly in one direction then resets.         | `⠁⠃⠇` → `⣿⣿⣿`         |
| `scan`             | Thin scan line sweeps across and repeats.                 | `⠤⠀⠀` → `⠀⠤⠀` → `⠀⠀⠤` |
| `rain`             | Staggered vertical drops fall through columns.            | `⠂⠀⠂` → `⠄⠀⠄`         |
| `cascade`          | Diagonal cascade activates cells in falling bands.        | `⠁⠀⠂` → `⠀⠂⠀⠄`        |
| `checkerboard`     | Alternating checker pattern flips phase each beat.        | `⠕⠪` ↔ `⠪⠕`           |
| `columns`          | Columns animate in sequence with vertical emphasis.       | `⡇⠀⡇` → `⠀⡇⠀`         |
| `wave-rows`        | Horizontal row waves roll left-to-right.                  | `⠒⠤⠒` → `⠤⠒⠤`         |
| `diagonal-swipe`   | Fill and clear move diagonally across the grid.           | `⠁⠂⠄` → `⠄⠂⠁`         |
| `sparkle`          | Scattered glints twinkle with controlled randomness.      | `⠁⠀⠈` → `⠀⠂⠀`         |
| `helix`            | Spiral/helix-like band rotates across columns.            | `⡇⠒⢸` → `⢸⠒⡇`         |
| `braille`          | Cycles through classic braille-inspired glyph patterns.   | `⠿` → `⣶` → `⠿`       |
| `reflected-ripple` | Ripple expands from center, reflects, and returns.        | `⢸⡇` → `⣿⣿` → `⡇⢸`    |
| `pendulum`         | Arc-like sweep oscillates back and forth smoothly.        | `⠂⠄⠂` ↔ `⠄⠂⠄`         |
| `compress`         | Active band compresses inward toward center mass.         | `⡇⠀⡇` → `⠀⣿⠀`         |
| `sort`             | Gradient-like ordering transitions from mixed to grouped. | `⠂⠆⣿` → `⠂⠂⣿`         |
| `equalizer`        | Audio visualizer bars animate up/down like frequency bands. | `⢸⢸` → `⣿⣿` → `⢸⢸`     |
| `chase`           | Compact dots chase across the row. | `⠂⠀` → `⠀⠒` → `⠀⠀⠤`     |
| `bars`            | Symmetric bars rise and fall from the baseline. | `⣀⣀` → `⣤⣤` → `⣿⣿`       |
| `marquee`         | Diagonal stripe bands scroll across the grid. | `⠓⠒` → `⠤⣄` → `⣄⠤`       |
| `typing`           | Dots appear sequentially like characters being typed. | `⠁` → `⠃` → `⠇` → `⣿`   |
| `spiral`           | Rotating arm spirals around the center point. | `⠘⠃` → `⠙⠄` → `⠐⠚`     |

---

## Accessibility

The BrailleLoader is built with accessibility as a first-class concern:

### ARIA Support

```tsx
<div role="status" aria-live="polite">
  <span className="sr-only">{label}</span>
  {/* Visual dots */}
</div>
```

- **`role="status"`** - Announces loading state to screen readers
- **`aria-live="polite"`** - Non-intrusive announcements
- **Screen reader text** - Hidden label announced during loading

### Reduced Motion

Automatically respects the user's `prefers-reduced-motion` preference:

```tsx
// User has reduced motion enabled
const prefersReducedMotion = usePrefersReducedMotion();

// Static frame is rendered instead of animation
if (prefersReducedMotion) {
  return getStaticFrame(variant, rows, cols);
}
```

When reduced motion is preferred:

- Animation loop is disabled
- A static, non-zero frame is displayed
- Transitions are removed

---

## Customization Examples

### Grid Sizing

```tsx
// Small, compact loader
<BrailleLoader variant="breathe" />

// Large, prominent loader
<BrailleLoader variant="helix" />
```

### Size Control

```tsx
// Small loader
<BrailleLoader variant="breathe" fontSize={16} />

// Default size
<BrailleLoader variant="helix" fontSize={28} />

// Large loader
<BrailleLoader variant="sparkle" fontSize={48} />
```

### Speed Control

```tsx
// Slow, gentle animation
<BrailleLoader variant="breathe" speed="slow" />

// Fast, urgent animation
<BrailleLoader variant="pulse" speed="fast" />
```

### Theming with Tailwind

```tsx
// Primary color
<BrailleLoader variant="helix" className="text-primary" />

// Muted appearance
<BrailleLoader variant="sparkle" className="text-muted-foreground" />

// Custom font size for larger braille dots
<BrailleLoader variant="rain" className="text-secondary" fontSize={32} />
```

### Form Loading State

```tsx
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button disabled={isSubmitting}>
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <BrailleLoader variant="snake" className="text-background" />
          Processing...
        </span>
      ) : (
        "Submit"
      )}
    </button>
  );
}
```

### Overlay Loading

```tsx
function LoadingOverlay({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
      <BrailleLoader variant="sparkle" className="text-primary" />
    </div>
  );
}
```

---

## TypeScript Types

```tsx
type BrailleLoaderVariant =
  | "breathe"
  | "pulse"
  | "orbit"
  | "snake"
  | "fill-sweep"
  | "scan"
  | "rain"
  | "cascade"
  | "checkerboard"
  | "columns"
  | "wave-rows"
  | "diagonal-swipe"
  | "sparkle"
  | "helix"
  | "braille"
  | "reflected-ripple"
  | "pendulum"
  | "compress"
  | "sort"
  | "equalizer"
  | "chase"
  | "bars"
  | "marquee"
  | "typing"
  | "spiral";

type BrailleLoaderSpeed = "slow" | "normal" | "fast";
```

---

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

Requires `requestAnimationFrame` and CSS `transform` support.

---

## Performance

- **60fps animations** using `requestAnimationFrame`
- **Precomputed paths** for snake/orbit variants
- **Context caching** per grid dimensions
- **No layout thrashing** - transforms only (opacity, scale)
- **CSS transitions** for smooth interpolation

---

## License

MIT
