import * as React from "react";
import { OpenInV0Button } from "@/components/open-in-v0-button";
import { BrailleLoaderShowcase } from "@/registry/new-york/blocks/braille-loader-showcase/braille-loader-showcase";
import { BrailleLoader } from "@/components/ui/braille-loader";
import { CodeBlock } from "@/components/code-block";
import { VariantCard } from "@/components/variant-card";
import { brailleLoaderVariants, type BrailleLoaderVariant } from "@/lib/braille-loader";

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
  interference: "Interference",
  "gravity-well": "Gravity Well",
  "phase-shift": "Phase Shift",
  spiral: "Spiral",
  "reflected-ripple": "Reflected Ripple",
};

const installCode = `npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json`;

const showcaseInstallCode = `npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader-showcase.json`;

const basicUsageCode = `import { BrailleLoader } from "@/components/ui/braille-loader"

export function Example() {
  return (
    <BrailleLoader
      variant="helix"
      dotSize="md"
      gap="md"
      gridSize="md"
      speed="normal"
      label="Loading results"
    />
  )
}`;

const dotSizeExampleCode = `<BrailleLoader variant="breathe" dotSize="sm" gap="sm" />
<BrailleLoader variant="breathe" dotSize="md" gap="md" />
<BrailleLoader variant="breathe" dotSize="lg" gap="lg" />`;

const customDotCode = `<BrailleLoader variant="pulse" dotSize={8} gap={12} />
<BrailleLoader variant="orbit" dotSize={4} gap={6} />`;

const gridExampleCode = `<BrailleLoader variant="rain" gridSize="sm" />
<BrailleLoader variant="rain" gridSize="md" />
<BrailleLoader variant="rain" gridSize="lg" />
<BrailleLoader variant="rain" gridSize="xl" />`;

const customGridCode = `<BrailleLoader variant="snake" grid={[5, 8]} />
<BrailleLoader variant="pulse" grid={[6, 6]} dotSize="lg" />`;

const speedExampleCode = `<BrailleLoader variant="orbit" speed="slow" />
<BrailleLoader variant="orbit" speed="normal" />
<BrailleLoader variant="orbit" speed="fast" />`;

const themingCode = `<BrailleLoader 
  variant="sparkle" 
  className="text-blue-500" 
/>

<BrailleLoader 
  variant="helix" 
  className="text-emerald-600 dark:text-emerald-400" 
/>

<BrailleLoader 
  variant="breathe" 
  dotClassName="opacity-100" 
/>`;

const formExampleCode = `import { BrailleLoader } from "@/components/ui/braille-loader"
import { Button } from "@/components/ui/button"

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <BrailleLoader variant="pulse" dotSize="sm" gap="sm" className="text-primary-foreground" />
          Processing...
        </>
      ) : (
        "Submit"
      )}
    </Button>
  )
}`;

const propsData = [
  { prop: "variant", type: "string", default: '"breathe"', description: "Animation pattern. One of 20 variants." },
  { prop: "dotSize", type: 'number | "sm" | "md" | "lg"', default: "6", description: "Dot size in pixels. Presets: 4, 6, 10." },
  {
    prop: "gap",
    type: 'number | "sm" | "md" | "lg"',
    default: "10",
    description: "Gap between dots in pixels. Presets: 6, 10, 14.",
  },
  { prop: "gridSize", type: '"sm" | "md" | "lg" | "xl"', default: "-", description: "Preset grid dimensions (3x3 to 6x6)." },
  { prop: "grid", type: "[rows, cols]", default: "[4, 4]", description: "Custom grid override. 2x2 to 12x12 supported." },
  { prop: "duration", type: "number", default: "2000", description: "Animation duration in milliseconds." },
  { prop: "speed", type: '"slow" | "normal" | "fast"', default: '"normal"', description: "Speed preset. Overrides duration." },
  { prop: "className", type: "string", default: "-", description: "Additional classes for the wrapper." },
  { prop: "dotClassName", type: "string", default: "-", description: "Additional classes for each dot." },
  { prop: "label", type: "string", default: '"Loading"', description: "Screen-reader accessible label." },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <header className="mb-16 text-center">
          <div className="inline-flex items-center justify-center mb-6 p-4 rounded-2xl bg-primary/5 border">
            <BrailleLoader variant="helix" dotSize="lg" gap="lg" gridSize="lg" speed="normal" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">Braille Loader</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A collection of 20 accessible, animated loading indicators for shadcn/ui. Registry-ready with full TypeScript support.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8">
            <OpenInV0Button name="braille-loader-showcase" />
            <a
              href="#installation"
              className="inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium border bg-background hover:bg-accent transition-colors"
            >
              Get Started
            </a>
          </div>
        </header>

        <main className="space-y-24">
          <section id="variants">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight">Variant Gallery</h2>
                <p className="text-muted-foreground mt-2">
                  Click any card to copy the code. Each variant offers a unique animation pattern.
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {brailleLoaderVariants.map((variant) => (
                  <VariantCard key={variant} variant={variant} label={variantLabel[variant]} />
                ))}
              </div>
            </div>
          </section>

          <section id="installation">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Installation</h2>
              <p className="text-muted-foreground">Install the core component using the shadcn CLI:</p>
              <CodeBlock code={installCode} language="bash" filename="Terminal" />
              <p className="text-muted-foreground mt-4">Optional: Install the showcase block for the demo preview:</p>
              <CodeBlock code={showcaseInstallCode} language="bash" filename="Terminal" />
            </div>
          </section>

          <section id="quick-start">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold tracking-tight">Quick Start</h2>
              <p className="text-muted-foreground">Import and use the component with your preferred variant:</p>
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="flex items-center justify-center p-8 rounded-xl border bg-muted/30">
                  <BrailleLoader variant="helix" dotSize="lg" gap="lg" gridSize="lg" />
                </div>
                <CodeBlock code={basicUsageCode} language="tsx" filename="example.tsx" showLineNumbers />
              </div>
            </div>
          </section>

          <section id="customization">
            <div className="space-y-12">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight mb-2">Customization</h2>
                <p className="text-muted-foreground">Configure size, grid dimensions, and speed to match your design.</p>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium">Dot Size & Gap</h3>
                <p className="text-sm text-muted-foreground">
                  Three presets control dot size and spacing. Or use numeric values for precise control.
                </p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-8 p-8 rounded-xl border bg-muted/30">
                    <div className="text-center">
                      <BrailleLoader variant="breathe" dotSize="sm" gap="sm" />
                      <span className="block mt-3 text-xs text-muted-foreground">sm (4px/6px)</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="breathe" dotSize="md" gap="md" />
                      <span className="block mt-3 text-xs text-muted-foreground">md (6px/10px)</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="breathe" dotSize="lg" gap="lg" />
                      <span className="block mt-3 text-xs text-muted-foreground">lg (10px/14px)</span>
                    </div>
                  </div>
                  <CodeBlock code={dotSizeExampleCode} language="tsx" />
                </div>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-10 p-8 rounded-xl border bg-muted/30">
                    <div className="text-center">
                      <BrailleLoader variant="pulse" dotSize={8} gap={12} />
                      <span className="block mt-3 text-xs text-muted-foreground">8px/12px</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="orbit" dotSize={4} gap={6} />
                      <span className="block mt-3 text-xs text-muted-foreground">4px/6px</span>
                    </div>
                  </div>
                  <CodeBlock code={customDotCode} language="tsx" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium">Grid Size</h3>
                <p className="text-sm text-muted-foreground">Four presets from 3x3 to 6x6 grids.</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-6 p-8 rounded-xl border bg-muted/30 flex-wrap">
                    <div className="text-center">
                      <BrailleLoader variant="rain" gridSize="sm" />
                      <span className="block mt-3 text-xs text-muted-foreground">sm (3x3)</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="rain" gridSize="md" />
                      <span className="block mt-3 text-xs text-muted-foreground">md (4x4)</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="rain" gridSize="lg" />
                      <span className="block mt-3 text-xs text-muted-foreground">lg (5x5)</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="rain" gridSize="xl" />
                      <span className="block mt-3 text-xs text-muted-foreground">xl (6x6)</span>
                    </div>
                  </div>
                  <CodeBlock code={gridExampleCode} language="tsx" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium">Custom Grid</h3>
                <p className="text-sm text-muted-foreground">Override presets with any grid dimensions from 2x2 to 12x12.</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-10 p-8 rounded-xl border bg-muted/30">
                    <div className="text-center">
                      <BrailleLoader variant="snake" grid={[5, 8]} />
                      <span className="block mt-3 text-xs text-muted-foreground">5x8</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="pulse" grid={[6, 6]} dotSize="lg" gap="lg" />
                      <span className="block mt-3 text-xs text-muted-foreground">6x6</span>
                    </div>
                  </div>
                  <CodeBlock code={customGridCode} language="tsx" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium">Speed</h3>
                <p className="text-sm text-muted-foreground">Control animation speed with three presets.</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-8 p-8 rounded-xl border bg-muted/30">
                    <div className="text-center">
                      <BrailleLoader variant="orbit" gridSize="md" speed="slow" />
                      <span className="block mt-3 text-xs text-muted-foreground">slow</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="orbit" gridSize="md" speed="normal" />
                      <span className="block mt-3 text-xs text-muted-foreground">normal</span>
                    </div>
                    <div className="text-center">
                      <BrailleLoader variant="orbit" gridSize="md" speed="fast" />
                      <span className="block mt-3 text-xs text-muted-foreground">fast</span>
                    </div>
                  </div>
                  <CodeBlock code={speedExampleCode} language="tsx" />
                </div>
              </div>

              <div className="space-y-6">
                <h3 className="text-xl font-medium">Theming</h3>
                <p className="text-sm text-muted-foreground">Apply custom colors using Tailwind classes.</p>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="flex items-center justify-center gap-8 p-8 rounded-xl border bg-muted/30">
                    <BrailleLoader variant="sparkle" gridSize="md" className="text-blue-500" />
                    <BrailleLoader variant="helix" gridSize="md" className="text-emerald-600" />
                    <BrailleLoader variant="breathe" gridSize="md" className="text-purple-500" />
                  </div>
                  <CodeBlock code={themingCode} language="tsx" />
                </div>
              </div>
            </div>
          </section>

          <section id="examples">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Usage Examples</h2>

              <div className="space-y-4">
                <h3 className="text-xl font-medium">Form Submit Button</h3>
                <p className="text-sm text-muted-foreground">Use the loader inside a button during form submission.</p>
                <CodeBlock code={formExampleCode} language="tsx" filename="submit-button.tsx" showLineNumbers />
              </div>
            </div>
          </section>

          <section id="api">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">API Reference</h2>
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Prop</th>
                      <th className="px-4 py-3 font-medium">Type</th>
                      <th className="px-4 py-3 font-medium">Default</th>
                      <th className="px-4 py-3 font-medium">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {propsData.map((row) => (
                      <tr key={row.prop} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-mono text-xs text-primary">{row.prop}</td>
                        <td className="px-4 py-3 font-mono text-xs">{row.type}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{row.default}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>

          <section id="accessibility">
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold tracking-tight">Accessibility</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Screen Reader Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{`role="status"`}</code> and{" "}
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{`aria-live="polite"`}</code> for live region
                    announcements.
                  </p>
                </div>
                <div className="rounded-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Reduced Motion</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Respects <code className="text-xs bg-muted px-1.5 py-0.5 rounded">prefers-reduced-motion</code> and renders a
                    static, non-zero frame.
                  </p>
                </div>
                <div className="rounded-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Custom Labels</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    The <code className="text-xs bg-muted px-1.5 py-0.5 rounded">label</code> prop provides context-specific
                    loading text for screen readers.
                  </p>
                </div>
                <div className="rounded-xl border p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="font-medium">Theme Support</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Uses <code className="text-xs bg-muted px-1.5 py-0.5 rounded">currentColor</code> for automatic light/dark
                    theme adaptation.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section id="showcase">
            <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
              <div className="border-b bg-muted/30 px-6 py-4 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">All Variants</h2>
                  <p className="text-sm text-muted-foreground">Dark and light theme preview</p>
                </div>
                <OpenInV0Button name="braille-loader-showcase" />
              </div>
              <div className="p-6">
                <BrailleLoaderShowcase />
              </div>
            </div>
          </section>
        </main>

        <footer className="mt-24 pt-8 border-t">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>Built for shadcn/ui with React and Tailwind CSS</p>
            <div className="flex items-center gap-4">
              <a
                href="https://ui.shadcn.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                shadcn/ui
              </a>
              <a
                href="https://v0.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                v0
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
