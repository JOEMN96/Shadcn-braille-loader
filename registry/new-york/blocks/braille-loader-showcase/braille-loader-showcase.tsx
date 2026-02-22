import {
  brailleLoaderVariants,
  type BrailleLoaderVariant,
} from "@/lib/braille-loader"
import { BrailleLoader } from "@/components/ui/braille-loader"
import { cn } from "@/lib/utils"

const variantLabel: Record<BrailleLoaderVariant, string> = {
  braille: "Braille",
  orbit: "Orbit",
  breathe: "Breathe",
  snake: "Snake",
  "fill-sweep": "Fill Sweep",
  pulse: "Pulse",
  columns: "Columns",
  checkerboard: "Checkerboard",
  scan: "Scan",
  rain: "Rain",
  cascade: "Cascade",
  sparkle: "Sparkle",
  "wave-rows": "Wave Rows",
  helix: "Helix",
  "diagonal-swipe": "Diagonal Swipe",
}

type PanelProps = {
  panelClassName: string
  textClassName: string
  dotClassName: string
}

function Panel({ panelClassName, textClassName, dotClassName }: PanelProps) {
  return (
    <div className={cn("rounded-2xl p-6 shadow-sm", panelClassName)}>
      <ul className="space-y-3">
        {brailleLoaderVariants.map((variant) => (
          <li
            key={variant}
            className={cn("flex items-center gap-4 text-[15px]", textClassName)}
          >
            <BrailleLoader
              variant={variant}
              size="sm"
              gridSize="md"
              speed="normal"
              dotClassName={dotClassName}
              label={`Agent ${variantLabel[variant]} loading`}
            />
            <span>
              <span className="opacity-60">Agent</span>{" "}
              <span className="font-semibold">{variantLabel[variant]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function BrailleLoaderShowcase() {
  return (
    <div className="w-full rounded-3xl border border-border/60 bg-gradient-to-b from-background to-muted/30 p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          panelClassName="border border-white/5 bg-neutral-950 text-neutral-100"
          textClassName="text-neutral-100"
          dotClassName="bg-neutral-100"
        />
        <Panel
          panelClassName="border border-black/10 bg-neutral-50 text-neutral-900"
          textClassName="text-neutral-900"
          dotClassName="bg-neutral-900"
        />
      </div>
    </div>
  )
}
