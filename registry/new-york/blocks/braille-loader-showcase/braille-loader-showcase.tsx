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
  agentClassName: string
}

function Panel({
  panelClassName,
  textClassName,
  dotClassName,
  agentClassName,
}: PanelProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[18px] border px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_1px_0_rgba(0,0,0,0.12)]",
        panelClassName
      )}
    >
      <ul className="space-y-[7px]">
        {brailleLoaderVariants.map((variant) => (
          <li
            key={variant}
            className={cn(
              "flex min-h-[30px] items-center gap-4 text-[15px] leading-[1.2]",
              textClassName
            )}
          >
            <span className="inline-flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden">
              <BrailleLoader
                variant={variant}
                size="sm"
                gridSize="md"
                speed="normal"
                dotClassName={dotClassName}
                label={`Agent ${variantLabel[variant]} loading`}
              />
            </span>
            <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
              <span className={cn("font-medium", agentClassName)}>Agent</span>
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
    <div className="w-full overflow-hidden rounded-[30px] border border-[#1a2035]/75 bg-[#080d1f] p-5 shadow-[0_0_0_1px_rgba(98,116,167,0.12),0_22px_60px_rgba(2,6,20,0.75),inset_0_1px_0_rgba(145,159,204,0.14)]">
      <div className="grid grid-cols-2 gap-4">
        <Panel
          panelClassName="border-white/5 bg-[#171a27] text-[#d8dbe2]"
          textClassName="text-[#d8dbe2]"
          dotClassName="bg-[#d8dbe2]"
          agentClassName="text-[#9ba1ad]"
        />
        <Panel
          panelClassName="border-black/10 bg-[#e8eaee] text-[#2b2f3a]"
          textClassName="text-[#2b2f3a]"
          dotClassName="bg-[#343946]"
          agentClassName="text-[#8d93a0]"
        />
      </div>
    </div>
  )
}
