"use client";

import { BrailleLoader } from "@/components/ui/braille-loader";
import { CopyButton } from "@/components/copy-button";
import { cn } from "@/lib/utils";
import type { BrailleLoaderVariant } from "@/lib/braille-loader";

type VariantCardProps = {
  variant: BrailleLoaderVariant;
  label: string;
  className?: string;
};

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
  rain: "Drops moving down staggered columns",
  cascade: "Diagonal cascade movement",
  sparkle: "Random sparkle burst pattern",
  "wave-rows": "Sine wave across rows",
  helix: "Double helix orbit pattern",
  "diagonal-swipe": "Diagonal reveal animation",
  "reflected-ripple": "Mirror ripple wave",
  pendulum: "Horizontal swing wave pattern",
  compress: "Compress inward with popping dots",
  sort: "Sort from random to ordered gradient",
  equalizer: "Audio bars rising by frequency",
  chase: "Compact dots chase across the row",
  bars: "Symmetric bars rise and fall",
  marquee: "Scrolling diagonal stripe band",
  typing: "Sequential type-in cursor effect",
  spiral: "Rotating arms around center",
};

function VariantCard({ variant, label, className }: VariantCardProps) {
  const code = `<BrailleLoader variant="${variant}" />`;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md hover:shadow-primary/5",
        className,
      )}
    >
      <div className="flex h-28 items-center justify-center bg-muted/20">
        <BrailleLoader variant={variant} speed="normal" className="text-primary" />
      </div>

      <div className="flex items-center justify-between gap-3 border-t p-3">
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-medium">{label}</h4>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {variantDescriptions[variant] || "Animation variant"}
          </p>
        </div>
        <CopyButton content={code} className="h-7 shrink-0 px-2" />
      </div>
    </div>
  );
}

export { VariantCard };
