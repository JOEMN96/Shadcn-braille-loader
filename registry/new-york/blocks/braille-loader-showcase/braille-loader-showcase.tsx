import { brailleLoaderVariants, type BrailleLoaderVariant } from "@/lib/braille-loader";
import { BrailleLoader } from "@/components/ui/braille-loader";
import { cn } from "@/lib/utils";

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
  "reflected-ripple": "Reflected Ripple",
  pendulum: "Pendulum",
  compress: "Compress",
  sort: "Sort",
  equalizer: "Equalizer",
  chase: "Chase",
  bars: "Bars",
  marquee: "Marquee",
  typing: "Typing",
  spiral: "Spiral",
};

type PanelProps = {
  panelClassName: string;
  textClassName: string;
  colorClass: string;
};

function Panel({ panelClassName, textClassName, colorClass }: PanelProps) {
  return (
    <div className={cn("overflow-hidden rounded-lg border px-5 py-6", panelClassName)}>
      <ul className="flex flex-col gap-2">
        {brailleLoaderVariants.map((variant) => (
          <li key={variant} className={cn("flex min-h-8 items-center gap-4 text-[15px] leading-tight", textClassName)}>
            <span className="inline-flex shrink-0 items-center justify-center overflow-hidden">
              <BrailleLoader
                variant={variant}
                speed="normal"
                className={colorClass}
                label={`Animation ${variantLabel[variant]} loading`}
              />
            </span>
            <span className="inline-flex items-baseline gap-2 whitespace-nowrap">
              <span className="font-semibold">{variantLabel[variant]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BrailleLoaderShowcase() {
  return (
    <div className="w-full overflow-hidden rounded-lg border bg-card p-4 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <Panel
          panelClassName="border-foreground/10 bg-foreground text-background"
          textClassName="text-background"
          colorClass="text-background"
        />
        <Panel
          panelClassName="border-border bg-background text-foreground"
          textClassName="text-foreground"
          colorClass="text-foreground"
        />
      </div>
    </div>
  );
}
