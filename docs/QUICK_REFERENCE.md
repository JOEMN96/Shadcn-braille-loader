# Braille Loader - Quick Reference

## Installation

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json
```

---

## Basic Usage

```tsx
import { BrailleLoader } from "@/components/ui/braille-loader"

// Basic
<BrailleLoader />

// With variant
<BrailleLoader variant="helix" />

// With speed
<BrailleLoader speed="fast" />

// With font size
<BrailleLoader fontSize={16} />

// Theming
<BrailleLoader variant="sparkle" className="text-blue-500" />
```

---

## All 19 Variants

| Variant              | Description                       | Code                                      |
| -------------------- | --------------------------------- | ----------------------------------------- |
| **breathe**          | Subtle expand/contract            | `<BrailleLoader variant="breathe" />`     |
| **pulse**            | Radial pulse from center          | `<BrailleLoader variant="pulse" />`      |
| **pendulum**         | Smooth arc swing                  | `<BrailleLoader variant="pendulum" />`    |
| **compress**         | Inward compression                | `<BrailleLoader variant="compress" />`    |
| **sort**             | Gradient sorting                  | `<BrailleLoader variant="sort" />`        |
| **orbit**            | Circular orbit around center      | `<BrailleLoader variant="orbit" />`       |
| **helix**            | Spiral pattern                    | `<BrailleLoader variant="helix" />`       |
| **snake**            | Sequential snake movement         | `<BrailleLoader variant="snake" />`       |
| **rain**             | Staggered vertical drops          | `<BrailleLoader variant="rain" />`        |
| **wave-rows**        | Horizontal sine wave              | `<BrailleLoader variant="wave-rows" />`   |
| **cascade**          | Diagonal cascade                  | `<BrailleLoader variant="cascade" />`     |
| **diagonal-swipe**   | Diagonal sweep                    | `<BrailleLoader variant="diagonal-swipe" />` |
| **fill-sweep**       | Linear fill left-to-right         | `<BrailleLoader variant="fill-sweep" />`  |
| **scan**             | Thin scan line sweep              | `<BrailleLoader variant="scan" />`        |
| **columns**          | Column-by-column animation        | `<BrailleLoader variant="columns" />`     |
| **checkerboard**     | Alternating checker pattern       | `<BrailleLoader variant="checkerboard" />` |
| **sparkle**          | Random twinkling dots            | `<BrailleLoader variant="sparkle" />`     |
| **braille**          | Classic braille patterns          | `<BrailleLoader variant="braille" />`     |
| **reflected-ripple** | Bounce ripple from center         | `<BrailleLoader variant="reflected-ripple" />` |

---

## Speed Presets

| Speed    | Description     |
| -------- | -------------- |
| `slow`   | 3000ms cycle   |
| `normal` | 2400ms cycle   |
| `fast`   | 1200ms cycle   |

---

## Props Quick Reference

```typescript
<BrailleLoader
  variant="breathe"        // Animation variant (19 options)
  speed="normal"           // slow | normal | fast
  className="text-primary" // Tailwind classes
  label="Loading..."       // Screen reader text
  fontSize={28}            // Font size in pixels
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
      ) : (
        "Submit"
      )}
    </Button>
  );
}
```

### Page Loading Overlay

```tsx
function App({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return <MainContent />;

  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center">
      <BrailleLoader variant="sparkle" fontSize={32} label="Loading..." />
    </div>
  );
}
```

---

## Accessibility

The BrailleLoader includes built-in accessibility support:

- `role="status"` and `aria-live="polite"` for screen readers
- Respects `prefers-reduced-motion` automatically
- Customizable `label` prop for context-specific announcements

```tsx
<BrailleLoader label="Loading your data..." />
```

---

## Theming

Use Tailwind classes to match your design system:

```tsx
// Primary color
<BrailleLoader variant="helix" className="text-primary" />

// Muted for dark backgrounds
<BrailleLoader variant="sparkle" className="text-muted-foreground" />

// Custom color
<BrailleLoader variant="rain" className="text-blue-500" />
```

---

## Exports

```typescript
import { BrailleLoader } from "@/components/ui/braille-loader";
import { generateFrames, getVariantGridSize, normalizeVariant, brailleLoaderVariants } from "@/lib/braille-loader";
import type { BrailleLoaderVariant, BrailleLoaderSpeed } from "@/lib/braille-loader";
```

---

## Browser Support

| Browser | Version |
| ------- | ------- |
| Chrome  | 88+     |
| Firefox | 78+     |
| Safari  | 14+     |
| Edge    | 88+     |

---

## FAQ

**Q: How do I make it faster/slower?**  
A: Use `speed="fast"` or `speed="slow"` props.

**Q: Can I change colors?**  
A: Use `className` with Tailwind: `<BrailleLoader className="text-blue-500" />`

**Q: Does it work with SSR?**  
A: Yes, Next.js SSR compatible (client component with "use client").

---

## Support

- Issues: [GitHub Issues](https://github.com/your-org/braille-loader/issues)
- Documentation: [README.md](../README.md)

---

**Version:** 2.0.0  
**Last Updated:** 2026-03-08  
**Status:** Production Ready ✓
