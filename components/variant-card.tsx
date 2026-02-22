"use client"

import * as React from "react"
import { BrailleLoader } from "@/components/ui/braille-loader"
import { CopyButton } from "@/components/copy-button"
import { cn } from "@/lib/utils"
import type { BrailleLoaderVariant } from "@/lib/braille-loader"

type VariantCardProps = {
  variant: BrailleLoaderVariant
  label: string
  className?: string
}

const variantDescriptions: Partial<Record<BrailleLoaderVariant, string>> = {
  braille: "Classic braille cell fill animation",
  orbit: "Dots orbit around the perimeter",
  breathe: "Expanding and contracting from center",
  snake: "Snake-like path traversal",
  "fill-sweep": "Horizontal sweep fill effect",
  pulse: "Diamond-shaped pulse from center",
  columns: "Alternating column highlight",
  checkerboard: "Classic checkerboard toggle",
  scan: "Vertical scan line effect",
  rain: "Raindrops falling down columns",
  cascade: "Diagonal cascade movement",
  sparkle: "Random sparkle burst pattern",
  "wave-rows": "Sine wave across rows",
  helix: "Double helix orbit pattern",
  "diagonal-swipe": "Diagonal reveal animation",
}

function VariantCard({ variant, label, className }: VariantCardProps) {
  const [showCode, setShowCode] = React.useState(false)
  
  const code = `<BrailleLoader variant="${variant}" />`

  return (
    <div
      className={cn(
        "group relative rounded-xl border bg-card overflow-hidden",
        "transition-all duration-300",
        "hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5",
        className
      )}
    >
      <div className="flex items-center justify-center h-28 bg-gradient-to-br from-muted/30 to-muted/10">
        <BrailleLoader
          variant={variant}
          size="md"
          gridSize="md"
          speed="normal"
          className="text-primary"
        />
      </div>
      
      <div className="p-3 border-t">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-sm truncate">{label}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {variantDescriptions[variant] || "Animation variant"}
            </p>
          </div>
          <CopyButton 
            content={code} 
            className="h-7 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
          />
        </div>
      </div>
      
      <button
        onClick={() => setShowCode(!showCode)}
        className="absolute top-2 right-2 p-1.5 rounded-md bg-background/80 border opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
        aria-label="Toggle code"
      >
        <svg 
          className="size-4 text-muted-foreground" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
        </svg>
      </button>
    </div>
  )
}

export { VariantCard }
