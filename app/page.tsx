import * as React from "react"
import { OpenInV0Button } from "@/components/open-in-v0-button"
import { BrailleLoaderShowcase } from "@/registry/new-york/blocks/braille-loader-showcase/braille-loader-showcase"

const variants = [
  "braille",
  "orbit",
  "breathe",
  "snake",
  "fill-sweep",
  "pulse",
  "columns",
  "checkerboard",
  "scan",
  "rain",
  "cascade",
  "sparkle",
  "wave-rows",
  "helix",
  "diagonal-swipe",
]

const installCode = `npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader.json
npx shadcn@latest add YOUR_REGISTRY_URL/r/braille-loader-showcase.json`

const usageCode = `import { BrailleLoader } from "@/components/ui/braille-loader"

export function Example() {
  return (
    <BrailleLoader
      variant="helix"
      size="md"
      gridSize="md"
      speed="normal"
      label="Loading results"
    />
  )
}`

const customGridCode = `<BrailleLoader variant="rain" size="sm" grid={[4, 6]} speed="fast" />
<BrailleLoader variant="pulse" size="lg" gridSize="xl" speed="slow" />`

export default function Home() {
  return (
    <div className="max-w-3xl mx-auto flex flex-col min-h-svh px-4 py-8 gap-8">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">Braille Loader Registry</h1>
        <p className="text-muted-foreground">
          Complete documentation and examples for the shadcn braille loading
          components.
        </p>
      </header>

      <main className="flex flex-col flex-1 gap-8">
        <section className="flex flex-col gap-4 border rounded-lg p-4 min-h-[450px] relative">
          <div className="flex items-center justify-between">
            <h2 className="text-sm text-muted-foreground sm:pl-3">
              Braille loader variants for dark and light themes.
            </h2>
            <OpenInV0Button name="braille-loader-showcase" className="w-fit" />
          </div>
          <div className="flex items-center justify-center min-h-[400px] relative">
            <BrailleLoaderShowcase />
          </div>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Features</h2>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>15 distinct animation variants powered by a matrix engine.</li>
            <li>Configurable dot size, speed mode, and grid mode.</li>
            <li>Default grid preset is 4x4 via gridSize=md.</li>
            <li>Custom grid override with grid=[rows, cols].</li>
            <li>Accessible defaults with reduced-motion fallback support.</li>
          </ul>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Installation</h2>
          <p className="text-sm text-muted-foreground">
            Install the core component, then optional showcase block.
          </p>
          <pre className="rounded-md border bg-muted/40 p-4 text-xs overflow-x-auto">
            <code>{installCode}</code>
          </pre>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">How To Use</h2>
          <pre className="rounded-md border bg-muted/40 p-4 text-xs overflow-x-auto">
            <code>{usageCode}</code>
          </pre>
          <pre className="rounded-md border bg-muted/40 p-4 text-xs overflow-x-auto">
            <code>{customGridCode}</code>
          </pre>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Variants</h2>
          <p className="text-sm text-muted-foreground">
            Available values for the variant prop:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {variants.map((variant) => (
              <div
                key={variant}
                className="rounded-md border bg-muted/30 px-3 py-2 text-xs font-mono"
              >
                {variant}
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Modes And Configuration
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border p-4 space-y-2">
              <h3 className="text-sm font-medium">Grid Modes</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                <li>sm = 3x3</li>
                <li>md = 4x4 (default)</li>
                <li>lg = 5x5</li>
                <li>xl = 6x6</li>
                <li>grid=[rows, cols] overrides presets</li>
              </ul>
            </div>
            <div className="rounded-md border p-4 space-y-2">
              <h3 className="text-sm font-medium">Speed Modes</h3>
              <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
                <li>slow</li>
                <li>normal (default)</li>
                <li>fast</li>
              </ul>
            </div>
            <div className="rounded-md border p-4 space-y-2 sm:col-span-2">
              <h3 className="text-sm font-medium">Theme Modes</h3>
              <p className="text-sm text-muted-foreground">
                Designed for light and dark backgrounds. The showcase panel
                demonstrates both modes side by side.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Props</h2>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="p-3 font-medium">Prop</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Default</th>
                  <th className="p-3 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">variant</td>
                  <td className="p-3">15 variant names</td>
                  <td className="p-3">braille</td>
                  <td className="p-3">Animation pattern.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">size</td>
                  <td className="p-3">sm | md | lg</td>
                  <td className="p-3">md</td>
                  <td className="p-3">Dot size and gap scale.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">gridSize</td>
                  <td className="p-3">sm | md | lg | xl</td>
                  <td className="p-3">md (4x4)</td>
                  <td className="p-3">Preset matrix dimensions.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">grid</td>
                  <td className="p-3">[rows, cols]</td>
                  <td className="p-3">-</td>
                  <td className="p-3">Manual matrix override.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">speed</td>
                  <td className="p-3">slow | normal | fast</td>
                  <td className="p-3">normal</td>
                  <td className="p-3">Frame interval speed.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">dotClassName</td>
                  <td className="p-3">string</td>
                  <td className="p-3">-</td>
                  <td className="p-3">Extra class for each dot.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">className</td>
                  <td className="p-3">string</td>
                  <td className="p-3">-</td>
                  <td className="p-3">Wrapper classes.</td>
                </tr>
                <tr className="border-t">
                  <td className="p-3 font-mono text-xs">label</td>
                  <td className="p-3">string</td>
                  <td className="p-3">Loading</td>
                  <td className="p-3">Screen-reader label.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">Accessibility</h2>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>Uses role=status and aria-live=polite.</li>
            <li>Uses label for readable status text.</li>
            <li>Respects prefers-reduced-motion with static fallback frame.</li>
            <li>Works in light and dark modes with current color tokens.</li>
          </ul>
        </section>

        <section className="rounded-lg border p-6 space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">v0 And Registry</h2>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>Use the Open in v0 button in the showcase card.</li>
            <li>Installable JSON artifacts are served from /r/*.json.</li>
            <li>Use braille-loader-showcase for the demo board.</li>
            <li>Use braille-loader for the reusable core component.</li>
          </ul>
        </section>
      </main>
    </div>
  )
}
