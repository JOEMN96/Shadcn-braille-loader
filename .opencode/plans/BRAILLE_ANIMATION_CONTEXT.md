# Braille Loader Animation Context

This document explains the animation logic for the shadcn-braille-loader component.

## Architecture Overview

```
lib/braille-loader.ts          → Core animation logic (pure functions)
registry/new-york/ui/braille-loader.tsx → React component
```

## Core Types

```typescript
type DotState = {
  opacity: number  // 0 to 1
  scale: number    // e.g., 0.8 to 1.4
}

type BrailleGrid = [rows: number, cols: number]

type AnimationContext = {
  snakePath: [number, number][]      // Precomputed snake traversal order
  orbitPath: [number, number][]      // Precomputed orbit traversal order
  rainOffsets: number[]              // Per-column random offsets
  sparkleOffsets: number[][]         // Per-dot random offsets
}
```

## Animation Loop

1. Component uses `requestAnimationFrame` for 60fps animation
2. Calculates `normalizedTime = (elapsed % duration) / duration` (always 0-1)
3. For each dot in grid, calls `getDotState(variant, row, col, normalizedTime, rows, cols, context)`
4. Returns `{ opacity, scale }` which is applied as inline CSS

## All 20 Animation Variants

### 1. breathe
All dots breathe together in unison.
```typescript
function breathe(row, col, time): DotState {
  const phase = Math.sin(time * 2 * Math.PI)
  return {
    scale: 1 + 0.15 * phase,
    opacity: 0.6 + 0.4 * phase,
  }
}
```

### 2. pulse
Expanding ring from center outward.
```typescript
function pulse(row, col, time, rows, cols): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const distance = Math.sqrt((row - centerY)**2 + (col - centerX)**2)
  const maxDistance = Math.sqrt(centerX**2 + centerY**2)
  const normalizedDistance = distance / maxDistance
  const wave = Math.abs(normalizedDistance - time)
  
  if (wave < 0.1) return { opacity: 1, scale: 1.4 }
  return { opacity: 0.3, scale: 1 }
}
```

### 3. orbit
Dots light up based on angle from center (clockwise sweep).
```typescript
function orbit(row, col, time, rows, cols): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const angle = Math.atan2(row - centerY, col - centerX)
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)  // 0-1
  const delta = Math.abs(normalizedAngle - time)
  
  if (delta < 0.08) return { opacity: 1, scale: 1.3 }
  return { opacity: 0.3, scale: 1 }
}
```

### 4. snake
Traverses grid in snake pattern (left-to-right, right-to-left alternating).
```typescript
// Precomputed path: [[0,0], [0,1], ..., [0,cols-1], [1,cols-1], [1,cols-2], ...]
function snake(row, col, time, snakePath): DotState {
  const totalDots = snakePath.length
  const headPosition = Math.floor(time * totalDots)
  const trailLength = 8
  const dotIndex = path.findIndex(([r, c]) => r === row && c === col)
  const distanceFromHead = headPosition - dotIndex
  
  if (distanceFromHead >= 0 && distanceFromHead < trailLength) {
    return {
      opacity: 1 - distanceFromHead / trailLength,
      scale: 1.3,
    }
  }
  return { opacity: 0.2, scale: 1 }
}
```

### 5. fill-sweep
Fills grid row by row from top to bottom.
```typescript
function fillSweep(row, col, time, rows): DotState {
  const activeRow = Math.floor(time * rows)
  if (row <= activeRow) return { opacity: 1, scale: 1.2 }
  return { opacity: 0.2, scale: 1 }
}
```

### 6. scan
Single row highlight sweeps downward.
```typescript
function scan(row, col, time, rows): DotState {
  const scanRow = Math.floor(time * rows)
  const distance = Math.abs(row - scanRow)
  
  if (distance === 0) return { opacity: 1, scale: 1.3 }
  if (distance === 1) return { opacity: 0.6, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 7. rain
Matrix-style falling dots, each column has random offset.
```typescript
// Precomputed: columnOffsets[col] = random 0-1 per column
function rain(row, col, time, rows, columnOffsets): DotState {
  const localTime = (time + columnOffsets[col]) % 1
  const activeRow = Math.floor(localTime * rows)
  
  if (row === activeRow) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 8. cascade
Diagonal wave from top-left to bottom-right.
```typescript
function cascade(row, col, time, rows, cols): DotState {
  const delay = (row + col) / (rows + cols)
  const delta = Math.abs(delay - time)
  
  if (delta < 0.1) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 9. checkerboard
Alternating checkerboard pattern.
```typescript
function checkerboard(row, col, time): DotState {
  const phase = Math.floor(time * 2) % 2
  if ((row + col) % 2 === phase) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 10. columns
Column-by-column wave left to right.
```typescript
function columns(col, time, cols): DotState {
  const delay = col / cols
  const delta = Math.abs(delay - time)
  
  if (delta < 0.1) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 11. wave-rows
Rows wave vertically with phase offset.
```typescript
function waveRows(row, col, time): DotState {
  const phase = Math.sin(time * 2 * Math.PI + row * 0.5)
  return {
    opacity: 0.5 + 0.5 * phase,
    scale: 1 + 0.1 * phase,
  }
}
```

### 12. diagonal-swipe
Diagonal line sweeps across.
```typescript
function diagonalSwipe(row, col, time, rows): DotState {
  const position = (row - col) / rows
  const delta = Math.abs(position - (time * 2 - 1))
  
  if (delta < 0.1) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 13. sparkle
Random dots sparkle with random phase offsets.
```typescript
// Precomputed: sparkleOffsets[row][col] = random 0-1 per dot
function sparkle(row, col, time, sparkleOffsets): DotState {
  const dotOffset = sparkleOffsets[row][col]
  const localTime = (time + dotOffset) % 1
  const pulse = Math.sin(localTime * 2 * Math.PI)
  
  if (pulse > 0.8) return { opacity: 1, scale: 1.4 }
  return { opacity: 0.3, scale: 1 }
}
```

### 14. helix
Double helix pattern from center.
```typescript
function helix(row, col, time, rows, cols): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const maxDistance = Math.sqrt(centerX**2 + centerY**2)
  
  const angle = Math.atan2(row - centerY, col - centerX)
  const radius = Math.sqrt((row - centerY)**2 + (col - centerX)**2)
  const normalizedRadius = radius / maxDistance
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
  
  const k = 0.5
  const spiralIndex = (normalizedAngle + normalizedRadius * k) % 1
  const delta1 = Math.abs(spiralIndex - time)
  const delta2 = Math.abs((spiralIndex + 0.5) % 1 - time)
  const minDelta = Math.min(delta1, delta2)
  
  if (minDelta < 0.08) return { opacity: 1, scale: 1.2 }
  return { opacity: 0.2, scale: 1 }
}
```

### 15. braille
Highlights 3x2 braille cell clusters sequentially.
```typescript
function braille(row, col, time, rows, cols): DotState {
  const clusterRows = Math.ceil(rows / 3)
  const clusterCols = Math.ceil(cols / 2)
  const totalClusters = clusterRows * clusterCols
  
  const clusterRow = Math.floor(row / 3)
  const clusterCol = Math.floor(col / 2)
  const clusterIndex = clusterRow * clusterCols + clusterCol
  const activeCluster = Math.floor(time * totalClusters)
  
  if (clusterIndex === activeCluster) return { opacity: 1, scale: 1 }
  return { opacity: 0.2, scale: 1 }
}
```

### 16. interference
Two perpendicular waves interfering.
```typescript
function interference(row, col, time): DotState {
  const waveA = Math.sin(time * 2 * Math.PI + row * 0.6)
  const waveB = Math.sin(time * 2 * Math.PI + col * 0.6)
  const combined = (waveA + waveB) / 2
  
  return {
    opacity: 0.5 + 0.5 * combined,
    scale: 1 + 0.15 * combined,
  }
}
```

### 17. gravity-well
Center pulls all dots inward, pulsing.
```typescript
function gravityWell(row, col, time, rows, cols): DotState {
  const centerX = cols / 2
  const centerY = rows / 2
  const dx = col - centerX
  const dy = row - centerY
  const distance = Math.sqrt(dx**2 + dy**2)
  const maxDistance = Math.sqrt(centerX**2 + centerY**2)
  const normalizedDistance = distance / maxDistance
  
  const phase = Math.sin(time * 2 * Math.PI)
  const pullStrength = 0.4 * phase
  const scale = 1 - pullStrength * normalizedDistance
  const opacity = 0.4 + 0.6 * (1 - normalizedDistance)
  
  return { opacity, scale }
}
```

### 18. phase-shift
Four quadrants with different phase offsets.
```typescript
function phaseShift(row, col, time, rows, cols): DotState {
  const midRow = rows / 2
  const midCol = cols / 2
  
  let phaseOffset: number
  if (row < midRow && col < midCol) phaseOffset = 0
  else if (row < midRow && col >= midCol) phaseOffset = Math.PI / 2
  else if (row >= midRow && col < midCol) phaseOffset = Math.PI
  else phaseOffset = (3 * Math.PI) / 2
  
  const phase = Math.sin(time * 2 * Math.PI + phaseOffset)
  return {
    opacity: 0.5 + 0.5 * phase,
    scale: 1 + 0.15 * phase,
  }
}
```

### 19. spiral
Single arm spiral from center outward.
```typescript
function spiral(row, col, time, rows, cols): DotState {
  const centerX = (cols - 1) / 2
  const centerY = (rows - 1) / 2
  const maxDistance = Math.sqrt(centerX**2 + centerY**2)
  
  const angle = Math.atan2(row - centerY, col - centerX)
  const radius = Math.sqrt((row - centerY)**2 + (col - centerX)**2)
  const normalizedRadius = radius / maxDistance
  const normalizedAngle = (angle + Math.PI) / (2 * Math.PI)
  
  const spiralIndex = (normalizedAngle + normalizedRadius) % 1
  const delta = Math.abs(spiralIndex - time)
  
  if (delta < 0.07) return { opacity: 1, scale: 1.4 }
  return { opacity: 0.2, scale: 1 }
}
```

### 20. reflected-ripple
Ripple goes left-to-right then bounces back.
```typescript
function reflectedRipple(col, time, cols): DotState {
  const position = time < 0.5 ? time * 2 : (1 - time) * 2
  const normalizedCol = col / cols
  const delta = Math.abs(normalizedCol - position)
  
  if (delta < 0.1) return { opacity: 1, scale: 1.3 }
  return { opacity: 0.2, scale: 1 }
}
```

## Performance Optimizations

1. **Animation Context Caching**
   - Grid-specific paths/offsets computed once and cached
   - Key format: `${rows}x${cols}`

2. **LCG Random Generator**
   - Deterministic pseudo-random for rain/sparkle offsets
   - Same seed always produces same offsets

3. **Static Frames for Reduced Motion**
   - Precomputed frame at time=0.5 for accessibility
   - No animation loop when `prefers-reduced-motion: reduce`

## Component Props

```typescript
type BrailleLoaderProps = {
  variant?: BrailleLoaderVariant   // Animation type (default: "breathe")
  dotSize?: number | "sm" | "md" | "lg"  // Dot size in px (default: 6)
  gap?: number | "sm" | "md" | "lg"      // Gap between dots (default: 10)
  gridSize?: "sm" | "md" | "lg" | "xl"   // Preset grid (3x3, 4x4, 5x5, 6x6)
  grid?: [rows: number, cols: number]    // Custom grid dimensions (2-12)
  duration?: number                      // Animation duration in ms
  speed?: "slow" | "normal" | "fast"     // Speed preset (3000/2000/1200ms)
  dotClassName?: string                  // Additional dot classes
  label?: string                         // Accessibility label (default: "Loading")
}
```

## Grid Presets

| Size | Dimensions |
|------|------------|
| sm   | 3 x 3      |
| md   | 4 x 4      |
| lg   | 5 x 5      |
| xl   | 6 x 6      |

## Speed Presets

| Speed  | Duration |
|--------|----------|
| slow   | 3000ms   |
| normal | 2000ms   |
| fast   | 1200ms   |

## How to Add a New Variant

1. Add variant name to `brailleLoaderVariants` array in `lib/braille-loader.ts`
2. Create animation function with signature:
   ```typescript
   function myVariant(row: number, col: number, time: number, rows: number, cols: number, context: AnimationContext): DotState
   ```
3. Add case to `getDotState()` switch statement
4. Add label to `variantLabel` in showcase component

## Key Implementation Details

- Time is always normalized 0-1 for one complete animation cycle
- All animation functions are pure (same input = same output)
- CSS transitions handle smooth interpolation between states
- Grid uses CSS Grid with fixed pixel sizes
- Dots use `bg-current` to inherit text color
