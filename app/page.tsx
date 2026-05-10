import { Metadata } from "next";
import { OpenInV0Button } from "@/components/open-in-v0-button";
import { BrailleLoaderShowcase } from "@/registry/new-york/blocks/braille-loader-showcase/braille-loader-showcase";
import { BrailleLoader } from "@/components/ui/braille-loader";
import { CodeBlock } from "@/components/code-block";
import { VariantCard } from "@/components/variant-card";
import { brailleLoaderVariants, type BrailleLoaderVariant } from "@/lib/braille-loader";

export const metadata: Metadata = {
  title: "Braille Loader - Animated shadcn/ui Loaders",
  description:
    "Launch-ready Unicode braille loading animations for shadcn/ui. Install as source, theme with currentColor, and ship 25 accessible variants with zero runtime dependencies.",
  openGraph: {
    title: "Braille Loader - Animated shadcn/ui Loaders",
    description:
      "Install 25 accessible Unicode braille loading animations for shadcn/ui with zero runtime dependencies.",
    images: ["/og-image.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Braille Loader - Animated shadcn/ui Loaders",
    description: "25 accessible Unicode braille loading animations for shadcn/ui.",
    images: ["/og-image.png"],
  },
};

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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://braille-loader.dev";

const installCode = `npx shadcn@latest add ${siteUrl}/r/braille-loader.json`;

const showcaseInstallCode = `npx shadcn@latest add ${siteUrl}/r/braille-loader-showcase.json`;

const basicUsageCode = `import { BrailleLoader } from "@/components/ui/braille-loader"

export function LoadingState() {
  return (
    <BrailleLoader
      variant="helix"
      speed="normal"
      label="Loading results"
    />
  )
}`;

const buttonUsageCode = `import { BrailleLoader } from "@/components/ui/braille-loader"
import { Button } from "@/components/ui/button"

function SubmitButton({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <Button disabled={isSubmitting}>
      {isSubmitting ? (
        <>
          <BrailleLoader variant="pulse" className="text-primary-foreground" />
          Saving
        </>
      ) : (
        "Save changes"
      )}
    </Button>
  )
}`;

const variantsCode = `<BrailleLoader variant="chase" />
<BrailleLoader variant="bars" />
<BrailleLoader variant="marquee" />
<BrailleLoader variant="helix" />`;

const speedExampleCode = `<BrailleLoader variant="orbit" speed="slow" />
<BrailleLoader variant="orbit" speed="normal" />
<BrailleLoader variant="orbit" speed="fast" />`;

const fontSizeCode = `<BrailleLoader variant="sparkle" fontSize={16} />
<BrailleLoader variant="sparkle" fontSize={28} />
<BrailleLoader variant="sparkle" fontSize={44} />`;

const themingCode = `<BrailleLoader variant="sparkle" className="text-primary" />
<BrailleLoader variant="helix" className="text-muted-foreground" />
<BrailleLoader variant="rain" className="text-foreground" />`;

const propsData = [
  { prop: "variant", type: "string", default: '"breathe"', description: "Animation pattern. One of 25 variants." },
  { prop: "speed", type: '"slow" | "normal" | "fast"', default: '"normal"', description: "Animation speed preset." },
  { prop: "className", type: "string", default: "-", description: "Additional classes for color, layout, and spacing." },
  { prop: "label", type: "string", default: '"Loading"', description: "Screen reader label exposed through role=status." },
  { prop: "fontSize", type: "number", default: "28", description: "Braille character size in pixels." },
];

const heroVariants: BrailleLoaderVariant[] = ["chase", "bars", "marquee", "helix", "rain", "sparkle"];

const quickStats = [
  { label: "Variants", value: "25" },
  { label: "Runtime deps", value: "0" },
  { label: "Install style", value: "Source" },
];

const launchHighlights = [
  {
    title: "Built for shadcn/ui",
    description: "Install through the registry, own the source, and adapt the component like the rest of your system.",
  },
  {
    title: "Braille-only motion",
    description: "Every animation is composed from Unicode braille cells, so the loaders stay crisp at any size.",
  },
  {
    title: "Accessible defaults",
    description: "The component ships with role=status, aria-live, aria-label, and decorative cells hidden from assistive tech.",
  },
];

const focusedVariants: BrailleLoaderVariant[] = ["chase", "bars", "marquee", "rain", "sparkle", "helix"];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b bg-background/95">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <a href="#top" className="flex min-w-0 items-center gap-3 text-sm font-semibold">
            <span className="flex size-9 items-center justify-center rounded-lg border bg-muted/40">
              <BrailleLoader variant="chase" speed="fast" fontSize={18} label="Braille Loader" />
            </span>
            <span>Braille Loader</span>
          </a>
          <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#variants" className="transition-colors hover:text-foreground">Variants</a>
            <a href="#install" className="transition-colors hover:text-foreground">Install</a>
            <a href="#api" className="transition-colors hover:text-foreground">API</a>
          </div>
          <OpenInV0Button name="braille-loader-showcase" />
        </nav>
      </header>

      <main id="top">
        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:px-8 lg:py-16">
            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-4">
                <p className="text-sm font-medium text-muted-foreground">Accessible loaders for shadcn/ui</p>
                <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                  Braille Loader
                </h1>
                <p className="max-w-2xl text-lg leading-8 text-muted-foreground">
                  A polished registry component with 25 Unicode braille animations, readable loading states, and styling that follows your app through currentColor.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <OpenInV0Button name="braille-loader-showcase" />
                <a
                  href="#install"
                  className="inline-flex h-9 items-center justify-center rounded-md border bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  Install component
                </a>
                <a
                  href="#variants"
                  className="inline-flex h-9 items-center justify-center rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Browse variants
                </a>
              </div>

              <div className="max-w-2xl">
                <CodeBlock code={installCode} language="bash" filename="Terminal" />
              </div>

              <dl className="grid max-w-2xl grid-cols-3 gap-3">
                {quickStats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border bg-muted/20 p-4">
                    <dt className="text-xs font-medium uppercase text-muted-foreground">{stat.label}</dt>
                    <dd className="mt-2 text-2xl font-semibold tracking-tight">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3 border-b pb-3">
                <div className="flex flex-col gap-1">
                  <p className="text-sm font-medium">Live preview</p>
                  <p className="text-xs text-muted-foreground">Source-owned motion states</p>
                </div>
                <BrailleLoader variant="typing" speed="fast" fontSize={18} label="Preview active" />
              </div>
              <div className="grid gap-3 pt-4 sm:grid-cols-2">
                {heroVariants.map((variant) => (
                  <div key={variant} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border bg-background p-4 text-center">
                    <BrailleLoader variant={variant} speed="normal" />
                    <span className="text-xs font-medium text-muted-foreground">{variantLabel[variant]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="border-b bg-muted/20">
          <div className="mx-auto grid max-w-6xl gap-4 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
            {launchHighlights.map((item) => (
              <article key={item.title} className="rounded-lg border bg-background p-5">
                <h2 className="text-base font-semibold">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="variants" className="scroll-mt-20 border-b">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-2xl flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">Variant library</p>
                <h2 className="text-3xl font-semibold tracking-tight">Pick a loading rhythm that fits the moment.</h2>
                <p className="text-muted-foreground">
                  Use compact indicators inside controls, expressive loaders in empty states, and slower motion for calm background work.
                </p>
              </div>
              <CodeBlock code={variantsCode} language="tsx" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {brailleLoaderVariants.map((variant) => (
                <VariantCard key={variant} variant={variant} label={variantLabel[variant]} />
              ))}
            </div>
          </div>
        </section>

        <section id="install" className="scroll-mt-20 border-b bg-muted/20">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-muted-foreground">Install</p>
              <h2 className="text-3xl font-semibold tracking-tight">Drop it into your app as editable source.</h2>
              <p className="text-muted-foreground">
                The registry command adds the loader component and animation helpers to your project. The showcase block is optional when you want the full preview surface.
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <CodeBlock code={installCode} language="bash" filename="Core component" />
              <CodeBlock code={showcaseInstallCode} language="bash" filename="Optional showcase block" />
            </div>
          </div>
        </section>

        <section id="usage" className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:px-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">Usage</p>
                <h2 className="text-3xl font-semibold tracking-tight">Small API, flexible presentation.</h2>
                <p className="text-muted-foreground">
                  The loader is intentionally plain: choose a variant, tune speed and size, then let your existing color tokens do the rest.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                {focusedVariants.slice(0, 3).map((variant) => (
                  <div key={variant} className="flex min-h-28 flex-col items-center justify-center gap-3 rounded-lg border bg-muted/20 p-4">
                    <BrailleLoader variant={variant} />
                    <span className="text-xs text-muted-foreground">{variantLabel[variant]}</span>
                  </div>
                ))}
              </div>
            </div>
            <CodeBlock code={basicUsageCode} language="tsx" filename="loading-state.tsx" showLineNumbers />
          </div>
        </section>

        <section id="customize" className="border-b bg-muted/20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex max-w-2xl flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Customize</p>
              <h2 className="text-3xl font-semibold tracking-tight">Tune motion without rewriting it.</h2>
              <p className="text-muted-foreground">
                Speeds, type size, and color are all component props or standard classes, so the loader stays easy to compose.
              </p>
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              <article className="flex flex-col gap-5 rounded-lg border bg-background p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">Speed</h3>
                  <p className="text-sm text-muted-foreground">Use slow, normal, or fast presets.</p>
                </div>
                <div className="flex flex-1 items-center justify-center gap-6 rounded-lg bg-muted/30 p-5">
                  <BrailleLoader variant="orbit" speed="slow" />
                  <BrailleLoader variant="orbit" speed="normal" />
                  <BrailleLoader variant="orbit" speed="fast" />
                </div>
                <CodeBlock code={speedExampleCode} language="tsx" />
              </article>

              <article className="flex flex-col gap-5 rounded-lg border bg-background p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">Size</h3>
                  <p className="text-sm text-muted-foreground">Set the braille cell font size directly.</p>
                </div>
                <div className="flex flex-1 items-center justify-center gap-6 rounded-lg bg-muted/30 p-5">
                  <BrailleLoader variant="sparkle" fontSize={16} />
                  <BrailleLoader variant="sparkle" fontSize={28} />
                  <BrailleLoader variant="sparkle" fontSize={44} />
                </div>
                <CodeBlock code={fontSizeCode} language="tsx" />
              </article>

              <article className="flex flex-col gap-5 rounded-lg border bg-background p-5">
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">Color</h3>
                  <p className="text-sm text-muted-foreground">The cells inherit currentColor.</p>
                </div>
                <div className="flex flex-1 items-center justify-center gap-6 rounded-lg bg-muted/30 p-5">
                  <BrailleLoader variant="sparkle" className="text-primary" />
                  <BrailleLoader variant="helix" className="text-muted-foreground" />
                  <BrailleLoader variant="rain" className="text-foreground" />
                </div>
                <CodeBlock code={themingCode} language="tsx" />
              </article>
            </div>
          </div>
        </section>

        <section id="examples" className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">Example</p>
                <h2 className="text-3xl font-semibold tracking-tight">Designed for real loading states.</h2>
                <p className="text-muted-foreground">
                  Put it in buttons, forms, table refresh states, command palettes, and anywhere a small source-owned loader should feel deliberate.
                </p>
              </div>
              <div className="flex flex-col gap-3 rounded-lg border bg-muted/20 p-4">
                <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                  <span className="text-sm font-medium">Saving profile</span>
                  <BrailleLoader variant="pulse" speed="fast" fontSize={20} label="Saving profile" />
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                  <span className="text-sm font-medium">Syncing workspace</span>
                  <BrailleLoader variant="marquee" speed="normal" fontSize={20} label="Syncing workspace" />
                </div>
                <div className="flex items-center justify-between rounded-lg border bg-background p-4">
                  <span className="text-sm font-medium">Loading analytics</span>
                  <BrailleLoader variant="bars" speed="normal" fontSize={20} label="Loading analytics" />
                </div>
              </div>
            </div>
            <CodeBlock code={buttonUsageCode} language="tsx" filename="submit-button.tsx" showLineNumbers />
          </div>
        </section>

        <section id="api" className="scroll-mt-20 border-b bg-muted/20">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex max-w-2xl flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">API</p>
              <h2 className="text-3xl font-semibold tracking-tight">Component props</h2>
              <p className="text-muted-foreground">Everything needed for production loading states, kept intentionally small.</p>
            </div>
            <div className="overflow-x-auto rounded-lg border bg-background">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Prop</th>
                    <th className="px-4 py-3 text-left font-medium">Type</th>
                    <th className="px-4 py-3 text-left font-medium">Default</th>
                    <th className="px-4 py-3 text-left font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {propsData.map((prop) => (
                    <tr key={prop.prop} className="border-b last:border-0">
                      <td className="px-4 py-3 font-mono text-xs">{prop.prop}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{prop.type}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{prop.default}</td>
                      <td className="px-4 py-3 text-muted-foreground">{prop.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section id="accessibility" className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-muted-foreground">Accessibility</p>
              <h2 className="text-3xl font-semibold tracking-tight">Status semantics are included.</h2>
              <p className="text-muted-foreground">
                Animated braille cells are hidden from screen readers while the wrapper announces a concise loading label.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <article className="rounded-lg border bg-muted/20 p-5">
                <h3 className="font-semibold">role=status</h3>
                <p className="mt-2 text-sm text-muted-foreground">Communicates a non-interruptive loading state.</p>
              </article>
              <article className="rounded-lg border bg-muted/20 p-5">
                <h3 className="font-semibold">aria-live=polite</h3>
                <p className="mt-2 text-sm text-muted-foreground">Lets assistive tech announce updates calmly.</p>
              </article>
              <article className="rounded-lg border bg-muted/20 p-5">
                <h3 className="font-semibold">aria-hidden cells</h3>
                <p className="mt-2 text-sm text-muted-foreground">Keeps decorative animation characters out of the spoken output.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="showcase">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-14 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="flex max-w-2xl flex-col gap-2">
                <p className="text-sm font-medium text-muted-foreground">Showcase block</p>
                <h2 className="text-3xl font-semibold tracking-tight">Try the full preview surface.</h2>
                <p className="text-muted-foreground">
                  Install the showcase when you want a ready-made browser for comparing variants, sizes, and speeds.
                </p>
              </div>
              <OpenInV0Button name="braille-loader-showcase" />
            </div>
            <div className="rounded-lg border bg-muted/20 p-4 sm:p-6">
              <BrailleLoaderShowcase />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-muted/20">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <p>Built for shadcn/ui projects that need loading states with a little more care.</p>
          <div className="flex flex-wrap items-center gap-4">
            <a href="#install" className="transition-colors hover:text-foreground">Install</a>
            <a href="#variants" className="transition-colors hover:text-foreground">Variants</a>
            <a href="#api" className="transition-colors hover:text-foreground">API</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
