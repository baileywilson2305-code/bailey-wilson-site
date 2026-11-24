import { access, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dist = path.join(root, "dist");

async function must(file) {
  await access(path.join(dist, file));
}

const html = await readFile(path.join(dist, "index.html"), "utf8");
const needles = [
  "Find the",
  "right boat.",
  "Buying, selling, and trade-ins.",
  "More time on the water.",
  "Less to worry about.",
  "How would you like to reach me?",
  "Keep the boat ready",
  "trading one in",
  "sms:+61485025920",
  "tel:+61485025920",
  "mailto:bailey.wilson@shortmarine.com?subject=Let%27s%20talk%20boating",
  "bailey-wilson.vcf",
  "og:image",
  "/img/og.jpg",
];
for (const needle of needles) {
  if (!html.includes(needle)) {
    console.error("Missing from dist/index.html:", needle);
    process.exit(1);
  }
}

for (const file of [
  "index.html",
  "404.html",
  "bailey-wilson.vcf",
  "favicon.svg",
  "favicon-32.png",
  "apple-touch-icon.png",
  "img/og.jpg",
  "img/hero-1280.avif",
  "img/hero-1280.webp",
  "img/hero-1280.jpg",
  "img/short-marine-logo.webp",
  "robots.txt",
  "_headers",
]) {
  await must(file);
}

const config = await readFile(path.join(root, "wrangler.jsonc"), "utf8");
if (!config.includes('"name": "bailey-wilson-site"')) {
  console.error("wrangler name mismatch");
  process.exit(1);
}
if (!config.includes('"directory": "./dist"')) {
  console.error("assets directory missing");
  process.exit(1);
}
if (!config.includes('"custom_domain": true') || !config.includes('"main": "./src/index.js"')) {
  console.error("custom domains or worker entry not enabled");
  process.exit(1);
}
if (!config.includes("baileywilson.au") || !config.includes("baileywilsonboats.au")) {
  console.error("domain routes missing");
  process.exit(1);
}

console.log("check ok");
