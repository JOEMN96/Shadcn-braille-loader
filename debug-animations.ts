import fs from "fs";
import { VARIANT_CONFIGS, getPrecomputeContext } from "./lib/braille-loader";

// ---------- CONFIG ----------
const VARIANT = "phaseShift";
const cfg = VARIANT_CONFIGS[VARIANT];
const WIDTH = cfg.gridSize[0];
const HEIGHT = cfg.gridSize[1];
const OUTPUT = "braille-debug.txt";
// ----------------------------

if (!cfg) {
  throw new Error(`Variant "${VARIANT}" not found`);
}

const ctx = getPrecomputeContext(WIDTH, HEIGHT);

let output = "";
output += `=== BRAILLE DEBUG ===\n`;
output += `Variant: ${VARIANT}\n`;
output += `Grid: ${WIDTH}x${HEIGHT}\n`;
output += `TotalFrames: ${cfg.totalFrames}\n\n`;

for (let frame = 0; frame < cfg.totalFrames; frame++) {
  const field = cfg.compute(frame, cfg.totalFrames, WIDTH, HEIGHT, ctx);

  const masks = field.map((m) => "0x" + m.toString(16).padStart(2, "0")).join(" ");

  const codepoints = field.map((m) => "0x" + (0x2800 + m).toString(16)).join(" ");

  const chars = field.map((m) => String.fromCharCode(0x2800 + m)).join("");

  output += `Frame ${frame}\n`;
  output += `Mask      : ${masks}\n`;
  output += `Codepoint : ${codepoints}\n`;
  output += `Chars     : ${chars}\n`;
  output += `----------------------------------\n`;
}

fs.writeFileSync(OUTPUT, output);

console.log(`✅ Debug written → ${OUTPUT}`);
