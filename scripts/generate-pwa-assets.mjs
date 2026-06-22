// Generates all raster PWA assets from the single source-of-truth SVG (public/icon.svg).
// Run: node scripts/generate-pwa-assets.mjs
// Uses sharp (a transitive Next.js dependency) — no extra install needed.
import sharp from "sharp";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const svg = readFileSync(join(root, "public/icon.svg"));

// The SVG is authored full-bleed with content inside the maskable 80% safe zone,
// so the same source serves both "any" and "maskable" purposes.
const outputs = [
  { file: "public/icons/icon-192.png", size: 192 },
  { file: "public/icons/icon-512.png", size: 512 },
  { file: "public/icons/maskable-192.png", size: 192 },
  { file: "public/icons/maskable-512.png", size: 512 },
  // iOS reads the home-screen icon from apple-touch-icon (PNG, 180 is the canonical size).
  { file: "public/apple-touch-icon.png", size: 180 },
  { file: "public/favicon-32.png", size: 32 },
  { file: "public/favicon-16.png", size: 16 },
];

for (const { file, size } of outputs) {
  const out = join(root, file);
  mkdirSync(dirname(out), { recursive: true });
  await sharp(svg, { density: 512 })
    .resize(size, size, { fit: "cover" })
    // Drop the (fully-opaque) alpha channel so apple-touch-icon / maskable PNGs
    // have no transparency, per Apple + maskable.icon guidance.
    .flatten()
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`✓ ${file} (${size}×${size})`);
}

console.log(`\nGenerated ${outputs.length} PWA assets from public/icon.svg`);
