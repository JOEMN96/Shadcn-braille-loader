# Shadcn Braille Loader Registry

Registry-first braille loader library for shadcn CLI with:

- `braille-loader`: core, accessible loader component with 15 variants.
- `braille-loader-showcase`: dark/light preview block that displays all variants.

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

## Install From Registry

Replace `YOUR_REGISTRY_URL` with your hosted base URL:

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json
```

Optional showcase block:

```bash
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader-showcase.json
```

## Usage

```tsx
import { BrailleLoader } from "@/components/ui/braille-loader"

export function Example() {
  return (
    <BrailleLoader
      variant="helix"
      size="md"
      gridSize="md"
      speed="normal"
    />
  )
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `variant` | `"braille" \| "orbit" \| "breathe" \| "snake" \| "fill-sweep" \| "pulse" \| "columns" \| "checkerboard" \| "scan" \| "rain" \| "cascade" \| "sparkle" \| "wave-rows" \| "helix" \| "diagonal-swipe"` | `"braille"` | Invalid runtime values fall back to `"braille"`. |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | Changes dot size and spacing. |
| `gridSize` | `"sm" \| "md" \| "lg" \| "xl"` | `"md"` | Grid preset (`sm=3x3`, `md=4x4`, `lg=5x5`, `xl=6x6`). |
| `grid` | `[rows, cols]` | `undefined` | Explicit grid override; takes precedence over `gridSize`. |
| `speed` | `"slow" \| "normal" \| "fast"` | `"normal"` | Controls frame interval. |
| `dotClassName` | `string` | `undefined` | Extra classes for each dot. |
| `className` | `string` | `undefined` | Wrapper classes. |
| `label` | `string` | `"Loading"` | Screen-reader status text. |

## Variant Catalog

- `braille`
- `orbit`
- `breathe`
- `snake`
- `fill-sweep`
- `pulse`
- `columns`
- `checkerboard`
- `scan`
- `rain`
- `cascade`
- `sparkle`
- `wave-rows`
- `helix`
- `diagonal-swipe`

## Accessibility

- Uses `role="status"` and `aria-live="polite"`.
- Includes screen-reader label via `label`.
- Honors `prefers-reduced-motion` and renders a static non-zero frame.

## Customization Examples

Larger, faster loader:

```tsx
<BrailleLoader variant="snake" size="lg" gridSize="lg" speed="fast" />
```

Custom matrix override:

```tsx
<BrailleLoader variant="rain" grid={[4, 6]} size="sm" />
```

Muted dot appearance:

```tsx
<BrailleLoader
  variant="sparkle"
  className="text-foreground/80"
  dotClassName="opacity-70"
/>
```
