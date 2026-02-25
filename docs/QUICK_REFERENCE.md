# Braille Loader - Quick Reference

## Installation

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json
```

Optional showcase block:
```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-showcase.json
```

---

## Basic Usage

```tsx
import { BrailleLoader } from "@/components/ui/braille-loader"

// Basic
<BrailleLoader />

// With variant
<BrailleLoader variant="helix" />

// With custom size
<BrailleLoader gridSize="lg" speed="fast" />

// With custom grid (width × height)
<BrailleLoader grid={[4, 8]} />

// Theming
<BrailleLoader variant="sparkle" className="text-blue-500" />
```

---

## All 23 Variants

| Variant | Speed | Best For | Code |
|---------|-------|----------|------|
| **breathe** | normal | Subtle loading | `<BrailleLoader variant="breathe" />` |
| **pulse** | normal | Attention | `<BrailleLoader variant="pulse" />` |
| **pendulum** | fast | Calm, continuous | `<BrailleLoader variant="pendulum" />` |
| **compress** | slow | Compacting | `<BrailleLoader variant="compress" />` |
| **sort** | normal | Sorting | `<BrailleLoader variant="sort" />` |
| **orbit** | normal | Processing | `<BrailleLoader variant="orbit" />` |
| **spiral** | normal | Exploration | `<BrailleLoader variant="spiral" />` |
| **helix** | normal | Scientific | `<BrailleLoaderLoader variant="helix" />` |
| **snake** | normal | Progress | `<BrailleLoaderLoader variant="snake" />` |
| **rain** | normal | Streaming | `<BrailleLoaderLoader variant="rain" />` |
| **waveRows** | normal | Calm | `<BrailleLoaderLoader variant="wave-rows" />` |
| **cascade** | normal | Sequential | `<BrailleLoaderLoader variant="cascade" />` |
| **diagonalSwipe** | normal | Transitions | `<BrailleLoaderLoader variant="diagonal-swipe" />` |
| **fillSweep** | normal | Progress | `<BrailleLoaderLoader variant="fill-sweep" />` |
| **scan** | normal | Scanning | `<BrailleLoaderLoader variant="scan" />` |
| **columns** | normal | Column data | `<BrailleLoaderLoader variant="columns" />` |
| **checkerboard** | normal | Idle | `<BrailleLoaderLoader variant="checkerboard" />` |
| **sparkle** | normal | Creative | `<BrailleLoaderLoader variant="sparkle" />` |
| **braille** | normal | Accessibility | `<BrailleLoaderLoader variant="braille" />` |
| **interference** | normal | Scientific | `<BrailleLoaderLoader variant="interference" />` |
| **gravityWell** | normal | Focused | `<BrailleLoaderLoader variant="gravity-well" />` |
| **phaseShift** | normal | Parallel | `<BrailleLoaderLoader variant="phase-shift" />` |
| **reflectedRipple** | normal | Network | `<BrailleLoaderLoader variant="reflected-ripple" />` |
| **wave-rows** | alias | Use `waveRows` | - |
| **diagonal-swipe** | alias | Use `diagonalSwipe` | - |
| **fill-sweep** | alias | Use `fillSweep` | - |
| **gravity-well** | alias | Use `gravityWell` | - |
| **phase-shift** | alias | Use `phaseShift` | - |
| **reflected-ripple** | alias | Use `reflectedRipple` | - |

---

## Grid Sizes

| Preset | Dimensions | Use Case |
|--------|-----------|----------|
| `sm` | 3×3 | Compact loaders |
| `md` | 4×4 | Standard loaders (default) |
| `lg` | 4×5 | Wide loaders (height capped at 4) |
| `xl` | 4×6 | Very wide loaders (height capped at 4) |

**Note:** Current version (v1) caps height at 4 rows.
- `lg: [5, 5]` → renders as 4×5
- `xl: [6, 6]` → renders as 4×6
- Full multi-row support planned for v2

---

## Speed Presets

| Speed | Duration | Frame Interval |
|-------|----------|----------------|
| `slow` | 3000ms | 75 frames @ 40ms |
| `normal` | 2400ms | 60 frames @ 40ms |
| `fast` | 1200ms | 60 frames @ 20ms |
| **pendulum** | 1440ms | 120 frames @ 12ms |

---

## Props Quick Reference

```typescript
<BrailleLoader
  variant="breathe"           // Animation variant
  gridSize="md"              // sm | md | lg | xl
  grid={[4, 8]}              // Custom [rows, cols], 2-12
  speed="normal"              // slow | normal | fast
  className="text-primary"   // Add classes
  label="Loading..."          // Screen reader text
  fontSize={24}                // Font size in pixels
/>
```

---

## Common Patterns

### Button Loading State

```tsx
function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <BrailleLoader variant="pulse" className="text-primary-foreground" fontSize={16} />
          Processing...
        </>
      ) : "Submit"}
    </Button>
  )
}
```

### Page Loading Overlay

```tsx
function App({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return <MainContent />

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
      <BrailleLoader variant="gravity-well" gridSize="lg" fontSize={32} label="Loading..." />
    </div>
  )
}
```

### Data Table Loading

```tsx
function TableLoader({ loading }: { loading: boolean }) {
  return (
    <div className="flex items-center justify-center p-12">
      {loading && (
        <>
          <BrailleLoader variant="snake" gridSize="sm" gap="sm" />
          <span className="ml-2">Loading data...</span>
        </>
      )}
    </div>
  )
}
```

### Form Input Loading

```tsx
function SearchInput({ searching, value, onChange }: Props) {
  return (
    <div className="relative">
      <input
        value={value}
        onChange={onChange}
        placeholder="Search..."
        className="pl-10"
      />
      {searching && (
        <BrailleLoader 
          variant="scan" 
          className="absolute left-3 top-1/2 -translate-y-1/2" 
          fontSize={14} 
        />
      )}
    </div>
  )
}
```

---

## Troubleshooting

### Animation Not Showing

**Check:**
```tsx
// ✅ Correct
<BrailleLoader variant="breathe" />

// ❌ Wrong - variant name must match
<BrailleLoader variant="Breathe" />
<BrailleLoader variant=" Breathing" />
```

### Grid Looks Wrong

**Check dimensions:**
```tsx
// ✅ Correct - [rows, cols]
<BrailleLoader grid={[4, 6]} />  // 4 rows × 6 cols

// ❌ Wrong - not [width, height]
<BrailleLoader grid={[6, 4]} />  // Wrong order!
```

### TypeScript Errors

**Common fix:**

```typescript
// If you get "cannot find name 'ctx'"
// Change this:
compute: (frame, totalFrames, width, height, _ctx) => {

// To this:
compute: (frame, totalFrames, width, height, ctx) => {
```

### Lint Errors

**Add eslint-comments for unused params:**
```typescript
compute: (frame, totalFrames, width, height, _ctx: unknown) => {
  // _ctx intentionally unused
```

---

## Performance Tips

1. **Prefer `gridSize` over `grid`**: Uses cached context
2. **Use appropriate speed**: Don't use "fast" for long-running loaders
3. **Limit variant count**: Don't use many loaders on same page
4. **Cache frames**: Already handled automatically by the system

---

## Exports

```typescript
import { BrailleLoader } from "@/components/ui/braille-loader";
import {
  generateFrames,
  resolveGrid,
  normalizeVariant,
  brailleLoaderVariants
} from "@/lib/braille-loader";
import type {
  BrailleLoaderVariant,
  BrailleLoaderSpeed,
  BrailleGridSize,
  BrailleGrid
} from "@/lib/braille-loader";
```

---

## Browser Support

| Browser | Version | Notes |
|---------|---------|-------|
| Chrome | 88+ | Full support |
| Firefox | 78+ | Full support |
| Safari | 14+ | Full support |
| Edge | 88+ | Full support |

---

## FAQ

**Q: Why height capped at 4?**  
A: Braille characters have 4 vertical dots. Multi-row braille coming in v2.

**Q: How do I make it faster/slower?**  
A: Use `speed="fast"` or `speed="slow"` props.

**Q: Can I use my own custom animation?**  
A: Not yet. Custom builder planned for v2.

**Q: Why does pendulum run faster?**  
A: Uses 120 frames at 12ms (83 FPS) vs 60 frames at 40ms (25 FPS).

**Q: Can I change colors?**  
A: Use `className` with Tailwind: `<BrailleLoader className="text-blue-500" />`

**Q: How do I use this in vanilla JS?**  
A: Import `generateFrames()` and render strings to `innerHTML`.

**Q: Does it work with SSR?**  
A: Yes, Next.js SSR compatible (client component with "use client").

**Q: Can I export as GIF?**  
A: Not built-in, but you could capture frames and encode manually.

**Q: How do I reduce file size?**  
A: Use tree-shaking, only import variants you need.

---

## Migration from Old Versions

### Before v1.0

If you have an older version, update imports:

```tsx
// Old (with deprecations)
<BrailleLoader 
  dotSize="md" 
  gap="sm" 
  gridSize="lg" 
  speed="normal" 
  dotClassName="..." 
  duration={3000}
/>

// New (v1.0 current)
<BrailleLoader 
  grid={[]}         // Use `grid` for custom, `gridSize` for presets
  speed="normal"
  className="..."   // Inline styles via Tailwind
  fontSize={24}    // Font size directly
/>
```

---

## Support

- Issues: [GitHub Issues](https://github.com/your-org/braille-loader/issues)
- Questions: [Discussions](https://github.com/your-org/braille-loader/discussions)
- Documentation: [README.md](../README.md)
- Implementation: [IMPLEMENTATION.md](./IMPLEMENTATION.md)

---

**Version:** 1.0.0  
**Last Updated:** 2026-02-24  
**Status:** Production Ready ✓
