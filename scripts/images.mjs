import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const originals = path.join(root, "images", "originals");
const outDir = path.join(root, "public", "img");

const FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf";

async function exists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

async function firstExisting(names) {
  for (const name of names) {
    const file = path.join(originals, name);
    if (await exists(file)) return file;
  }
  throw new Error(`Missing source image. Add one of: ${names.join(", ")} in images/originals`);
}

async function encode(pipeline, width, base) {
  const resized = pipeline.clone().resize({
    width,
    withoutEnlargement: true,
    fit: "inside",
  });
  await resized.clone().avif({ quality: 50, effort: 4 }).toFile(`${base}.avif`);
  await resized.clone().webp({ quality: 74 }).toFile(`${base}.webp`);
  await resized.clone().jpeg({ quality: 76, mozjpeg: true }).toFile(`${base}.jpg`);
}

async function responsive(source, name, widths) {
  const input = sharp(source).rotate();
  const meta = await input.metadata();
  const made = [];
  for (const width of widths) {
    const target = Math.min(width, meta.width || width);
    await encode(input, target, path.join(outDir, `${name}-${width}`));
    made.push(width);
  }
  return { widths: made, height: meta.height, width: meta.width };
}

async function logo() {
  const source = await firstExisting(["short-marine-logo.png"]);
  const trimmed = sharp(source).ensureAlpha().trim();
  const meta = await trimmed.metadata();
  const height = 64;
  const width = Math.round(((meta.width || 640) / (meta.height || 80)) * height);
  await trimmed
    .resize({ height, width, fit: "inside" })
    .webp({ quality: 90, alphaQuality: 100 })
    .toFile(path.join(outDir, "short-marine-logo.webp"));
  return { width, height };
}

async function icons() {
  const svg = await readFile(path.join(root, "public", "favicon.svg"));
  const sizes = [
    [32, path.join(root, "public", "favicon-32.png")],
    [180, path.join(root, "public", "apple-touch-icon.png")],
    [192, path.join(root, "public", "icon-192.png")],
  ];
  for (const [size, file] of sizes) {
    await sharp(svg).resize(size, size).png().toFile(file);
  }
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

async function openGraph(source) {
  const width = 1200;
  const height = 630;
  const photo = await sharp(source)
    .rotate()
    .resize(width, height, { fit: "cover", position: "centre" })
    .toBuffer();

  const title = escapeXml("BAILEY WILSON");
  const line = escapeXml("HELPING YOU BOAT WITH CONFIDENCE");
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#05080f" stop-opacity="0.15"/>
      <stop offset="0.45" stop-color="#05080f" stop-opacity="0.05"/>
      <stop offset="1" stop-color="#05080f" stop-opacity="0.88"/>
    </linearGradient>
    <style>
      @font-face { font-family: "LibSans"; src: url("file://${FONT}"); font-weight: 700; }
    </style>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#shade)"/>
  <text x="64" y="500" fill="#ffc700" font-family="LibSans, Liberation Sans, sans-serif" font-size="22" font-weight="700" letter-spacing="4">SHORT MARINE · RUNAWAY BAY</text>
  <text x="64" y="552" fill="#f6f3ec" font-family="LibSans, Liberation Sans, sans-serif" font-size="48" font-weight="700">${title}</text>
  <text x="64" y="596" fill="#ffc700" font-family="LibSans, Liberation Sans, sans-serif" font-size="26" font-weight="700">${line}</text>
</svg>`;

  await sharp(photo)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 80, mozjpeg: true })
    .toFile(path.join(outDir, "og.jpg"));
}

await mkdir(outDir, { recursive: true });

async function must(name) {
  const file = path.join(originals, name);
  if (!(await exists(file))) throw new Error(`Missing images/originals/${name}`);
  return file;
}

const hero = await must("freedom-345-aerial-running-wake.jpg");
const intro = await must("bailey-intro-arms-crossed.jpg");
const helmPortrait = await must("bailey-at-helm.jpg");
const support = await must("freedom-345-cockpit-lounge.jpg");

const wide = [
  ["freedom-345-running-golden-hour.jpg", "break-run", [1000, 1600]],
  ["boat-works-canal-rainbow.jpg", "break-canal", [1000, 1600]],
];
const gallery = [
  ["freedom-345-running-cliffs.jpg", "cliffs", [720, 1100]],
  ["freedom-345-at-rest-cliffs.jpg", "rest", [720, 1100]],
  ["spit-marina-beach-and-yachts.jpg", "spit", [720, 1100]],
  ["freedom-345-two-boats-open-water.jpg", "pair", [720, 1100]],
];

const heroInfo = await responsive(hero, "hero", [768, 1280, 1920]);
const introInfo = await responsive(intro, "intro", [450, 675]);
await responsive(helmPortrait, "bailey-helm", [450, 675]);
await responsive(support, "support", [720, 1100]);
for (const [file, name, widths] of [...wide, ...gallery]) {
  await responsive(await must(file), name, widths);
}
const logoInfo = await logo();
await icons();
await openGraph(hero);

const manifest = {
  hero: heroInfo.widths,
  intro: introInfo.widths,
  logo: logoInfo,
  portrait: "bailey-intro-arms-crossed.jpg",
};
await writeFile(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("images ready", manifest);
