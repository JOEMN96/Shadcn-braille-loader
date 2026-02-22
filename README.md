# Shadcn Braille Loader Registry

A registry-first, accessible braille loader library for shadcn CLI featuring 20 unique animation variants. Built with React, TypeScript, and Tailwind CSS.

## Features

- **20 Animation Variants** - From subtle pulses to complex spiral patterns
- **Fully Accessible** - Screen reader support, respects `prefers-reduced-motion`
- **Highly Customizable** - Dot size, gap, grid dimensions, animation speed
- **Theme-Aware** - Inherits color from current text color
- **Registry-First** - Install directly via shadcn CLI
- **Zero Dependencies** - Pure React + CSS animations

---

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
┌──────────┐    ┌───────────────┐    ┌──────────────┐    ┌───────────┐
│  Props   │───▶│ Resolve Grid  │───▶│ Get Context  │───▶│ Animate   │
│ (config) │    │ & Settings    │    │ (cached)     │    │ Loop      │
└──────────┘    └───────────────┘    └──────────────┘    └─────┬─────┘
                                                              │
                    ┌─────────────────────────────────────────┘
                    ▼
         ┌─────────────────────┐    ┌────────────────────┐
         │  For each dot:      │───▶│  Apply CSS         │
         │  getDotState()      │    │  opacity + scale   │
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
  return <BrailleLoader variant="helix" dotSize="md" gap="md" gridSize="lg" speed="normal" />;
}
```

---

## Props Reference

| Prop           | Type                             | Default     | Description                                                               |
| -------------- | -------------------------------- | ----------- | ------------------------------------------------------------------------- |
| `variant`      | `BrailleLoaderVariant`           | `"breathe"` | Animation variant (20 available). Invalid values fallback to `"breathe"`. |
| `dotSize`      | `number \| "sm" \| "md" \| "lg"` | `6`         | Dot diameter in pixels. Presets: `sm=4`, `md=6`, `lg=10`.                 |
| `gap`          | `number \| "sm" \| "md" \| "lg"` | `10`        | Gap between dots in pixels. Presets: `sm=6`, `md=10`, `lg=14`.            |
| `gridSize`     | `"sm" \| "md" \| "lg" \| "xl"`   | `"md"`      | Grid preset: `sm=3x3`, `md=4x4`, `lg=5x5`, `xl=6x6`.                      |
| `grid`         | `[rows: number, cols: number]`   | `undefined` | Custom grid dimensions (2-12). Overrides `gridSize`.                      |
| `speed`        | `"slow" \| "normal" \| "fast"`   | `"normal"`  | Animation duration: `slow=3000ms`, `normal=2000ms`, `fast=1200ms`.        |
| `duration`     | `number`                         | `undefined` | Custom animation duration in ms. Overrides `speed`.                       |
| `dotClassName` | `string`                         | `undefined` | Additional CSS classes applied to each dot.                               |
| `className`    | `string`                         | `undefined` | CSS classes for the wrapper element.                                      |
| `label`        | `string`                         | `"Loading"` | Screen reader announcement text.                                          |

---

## Variant Comparison Matrix

| Variant            | Motion Type | Complexity | Best Grid Size | Use Case       |
| ------------------ | ----------- | ---------- | -------------- | -------------- |
| `breathe`          | Uniform     | Low        | Any            | Subtle loading |
| `pulse`            | Radial      | Medium     | md, lg         | Attention      |
| `orbit`            | Circular    | Medium     | md, lg         | Processing     |
| `snake`            | Sequential  | Medium     | Any            | Progress       |
| `fill-sweep`       | Linear      | Low        | Any            | Progress       |
| `scan`             | Linear      | Low        | Any            | Scanning       |
| `rain`             | Random      | Medium     | lg, xl         | Streaming      |
| `cascade`          | Diagonal    | Medium     | md, lg         | Sequential     |
| `checkerboard`     | Toggle      | Low        | Any            | Idle           |
| `columns`          | Linear      | Low        | Any            | Column data    |
| `wave-rows`        | Sine        | Medium     | lg, xl         | Calm           |
| `diagonal-swipe`   | Diagonal    | Low        | Any            | Transitions    |
| `sparkle`          | Random      | Medium     | Any            | Creative       |
| `helix`            | Spiral      | High       | md, lg         | Scientific     |
| `braille`          | Pattern     | Medium     | Any            | Accessibility  |
| `interference`     | Wave        | High       | lg, xl         | Scientific     |
| `gravity-well`     | Radial      | Medium     | Any            | Focused        |
| `phase-shift`      | Quadrant    | Medium     | md, lg         | Parallel       |
| `spiral`           | Spiral      | High       | md, lg         | Creative       |
| `reflected-ripple` | Bounce      | Low        | Any            | Network        |

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

### Basic Sizing

```tsx
// Small, compact loader
<BrailleLoader variant="breathe" dotSize="sm" gap="sm" />

// Large, prominent loader
<BrailleLoader variant="helix" dotSize="lg" gap="lg" gridSize="xl" />
```

### Custom Dimensions

```tsx
// Custom dot size (8px) and gap (12px)
<BrailleLoader variant="rain" dotSize={8} gap={12} />

// Custom grid (5 rows x 8 columns)
<BrailleLoader variant="scan" grid={[5, 8]} />

// Combine custom dimensions
<BrailleLoader
  variant="cascade"
  dotSize={5}
  gap={8}
  grid={[6, 10]}
/>
```

### Speed Control

```tsx
// Slow, gentle animation
<BrailleLoader variant="breathe" speed="slow" />

// Fast, urgent animation
<BrailleLoader variant="pulse" speed="fast" />

// Precise duration (1500ms)
<BrailleLoader variant="orbit" duration={1500} />
```

### Theming with Tailwind

```tsx
// Primary color
<BrailleLoader variant="helix" className="text-primary" />

// Muted appearance
<BrailleLoader
  variant="sparkle"
  className="text-muted-foreground"
/>

// Custom dot styling
<BrailleLoader
  variant="rain"
  dotClassName="opacity-80 rounded-sm"
/>
```

### Form Loading State

```tsx
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button disabled={isSubmitting}>
      {isSubmitting ? (
        <span className="flex items-center gap-2">
          <BrailleLoader variant="snake" dotSize="sm" gap="sm" className="text-background" />
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
      <BrailleLoader variant="gravity-well" dotSize="lg" gridSize="lg" className="text-primary" />
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
  | "interference"
  | "gravity-well"
  | "phase-shift"
  | "spiral"
  | "reflected-ripple";

type BrailleLoaderSpeed = "slow" | "normal" | "fast";

type BrailleGridSize = "sm" | "md" | "lg" | "xl";

type BrailleGrid = [rows: number, cols: number];

type DotState = {
  opacity: number; // 0.0 to 1.0
  scale: number; // Scale factor (1.0 = normal)
};
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

## Variant Catalog

### 1. `breathe`

A gentle expanding and contracting animation from the center. All dots scale uniformly.

**Best for:** Subtle loading states, background loading indicators

**Visual:**

```
○ ○ ○ ○      ● ● ● ●      ○ ○ ○ ○
○ ○ ○ ○  →   ● ● ● ●  →   ○ ○ ○ ○
○ ○ ○ ○      ● ● ● ●      ○ ○ ○ ○
○ ○ ○ ○      ● ● ● ●      ○ ○ ○ ○
```

---

### 2. `pulse`

A diamond-shaped pulse radiating from the center outward.

**Best for:** Attention-grabbing loaders, form submissions

**Grid recommendation:** Works best with `md` (4x4) or larger grids

---

### 3. `orbit`

Dots illuminate sequentially around the perimeter in a circular orbit pattern.

**Best for:** Processing states, cyclical operations

**Visual:**

```
● ○ ○ ○      ○ ○ ○ ●      ○ ○ ○ ○
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
○ ○ ○ ○  →   ○ ○ ○ ○  →   ○ ○ ○ ○
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ●
```

---

### 4. `snake`

A serpentine path traversal with a trailing tail effect. The illuminated dot snakes through the grid row by row.

**Best for:** Progress indication, multi-step processes

**Grid recommendation:** Any size, especially effective on larger grids

---

### 5. `fill-sweep`

Horizontal sweep filling the grid from top to bottom.

**Best for:** Loading progress, batch operations

**Visual:**

```
○ ○ ○ ○      ● ● ● ●      ● ● ● ●
○ ○ ○ ○  →   ○ ○ ○ ○  →   ● ● ● ●
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
```

---

### 6. `scan`

A vertical scan line moving across the grid with adjacent glow.

**Best for:** Search operations, data scanning states

---

### 7. `rain`

Raindrops falling down each column at different speeds and offsets.

**Best for:** Data streaming, real-time updates

**Visual:**

```
○ ○ ● ○      ○ ○ ○ ○      ● ○ ○ ●
○ ○ ○ ○  →   ○ ● ○ ○  →   ○ ○ ○ ○
● ○ ○ ○      ○ ○ ○ ○      ○ ○ ● ○
○ ○ ○ ●      ○ ○ ○ ●      ○ ○ ○ ○
```

---

### 8. `cascade`

A diagonal wave cascading from top-left to bottom-right.

**Best for:** Sequential processing, waterfall operations

**Grid recommendation:** Works well on square grids (md, lg)

---

### 9. `checkerboard`

Classic alternating checkerboard pattern that toggles between two states.

**Best for:** Idle states, waiting indicators

**Visual:**

```
● ○ ● ○      ○ ● ○ ●      ● ○ ● ○
○ ● ○ ●  →   ● ○ ● ○  →   ○ ● ○ ●
● ○ ● ○      ○ ● ○ ●      ● ○ ● ○
○ ● ○ ●      ● ○ ● ○      ○ ● ○ ●
```

---

### 10. `columns`

Columns illuminate sequentially from left to right.

**Best for:** Column-based data loading, tabular operations

---

### 11. `wave-rows`

A sine wave undulating across all rows simultaneously.

**Best for:** Calm loading states, background processes

**Grid recommendation:** Works best with larger grids (lg, xl)

---

### 12. `diagonal-swipe`

A diagonal line sweeps across the grid.

**Best for:** Transition states, directional operations

**Visual:**

```
● ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
○ ● ○ ○  →   ○ ● ○ ○  →   ○ ○ ● ○
○ ○ ● ○      ○ ○ ● ○      ○ ○ ○ ●
○ ○ ○ ●      ○ ○ ○ ●      ○ ○ ○ ○
```

---

### 13. `sparkle`

Random dots sparkle with varying intensities and timing offsets.

**Best for:** Festive states, celebration moments, creative loading

**Note:** Uses pseudo-random offset generation for consistent sparkle patterns

---

### 14. `helix`

A double helix pattern with two orbits spiraling around the center.

**Best for:** Scientific/data processing, complex operations

**Grid recommendation:** Works best with `md` or larger grids

---

### 15. `braille`

Classic braille cell fill animation. Dots activate in 3x2 braille cell patterns.

**Best for:** Accessibility-themed interfaces, unique visual identity

**Visual:**

```
● ● ○ ○      ● ● ● ●      ● ● ● ●
● ● ○ ○  →   ● ● ○ ○  →   ● ● ● ●
○ ○ ○ ○      ○ ○ ○ ○      ● ● ○ ○
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
```

---

### 16. `interference`

Dual wave interference pattern creating moire-like visual effects.

**Best for:** Scientific visualizations, unique aesthetics

---

### 17. `gravity-well`

Dots are pulled toward the center and released, simulating gravity.

**Best for:** Center-focused operations, collapsing/expanding states

**Visual:**

```
○ ○ ○ ○      ○ ○ ○ ○      ● ● ● ●
○ ○ ○ ○  →   ○ ● ● ○  →   ● ● ● ●
○ ○ ○ ○      ○ ● ● ○      ● ● ● ●
○ ○ ○ ○      ○ ○ ○ ○      ● ● ● ●
```

---

### 18. `phase-shift`

Alternating quadrant phases create a shifting pattern across the grid.

**Best for:** Parallel processing, multi-threaded operations

**Grid recommendation:** Works best with even-dimension grids

---

### 19. `spiral`

A logarithmic spiral emanates from the center outward.

**Best for:** Exploration, search operations, creative loading

**Visual:**

```
○ ○ ○ ○      ○ ○ ● ○      ● ○ ○ ○
○ ● ○ ○  →   ○ ○ ○ ○  →   ○ ○ ○ ●
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
○ ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ○
```

---

### 20. `reflected-ripple`

A wave bounces back and forth across columns, creating a reflected ripple effect.

**Best for:** Ping operations, network status, back-and-forth processes

**Visual:**

```
● ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ●
● ○ ○ ○  →   ○ ○ ● ○  →   ○ ○ ○ ●
● ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ●
● ○ ○ ○      ○ ○ ○ ○      ○ ○ ○ ●
```

---

## License

MIT
