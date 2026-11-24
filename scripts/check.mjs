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
  "Buying, selling and learning.",
  "Learn &amp; Explore",
  "5+ years · Short Marine · Gold Coast &amp; across Australia",
  "How would you like to reach me?",
  "Grady-White distributor",
  "Chris-Craft, Regal and Capelli",
  "sms:+61485025920",
  "tel:+61485025920",
  "mailto:bailey.wilson@shortmarine.com?subject=Let%27s%20talk%20boating",
  "bailey-wilson.vcf",
  "instagram.com/baileywilsonboats",
  "tiktok.com/@baileywilsonboats",
  "youtube.com/@baileywilson-boats",
  "linkedin.com/in/bailey-wilson-670230189",
  "bailey-portrait",
  "Tips, tech and new releases",
  "og:image",
  "/img/og.jpg",
  "inter-latin-600-normal.woff2",
  "#16233b",
];
for (const needle of needles) {
  if (!html.includes(needle)) {
    console.error("Missing from dist/index.html:", needle);
    process.exit(1);
  }
}

const banned = [
  "—",
  "–",
  "4FA3E0",
  "4fa3e0",
  "boat sales guy",
  "boat-works-canal",
  "text-transform: uppercase",
  "trade-in",
  "trade in",
  "bailey-helm",
];
for (const item of banned) {
  if (html.includes(item)) {
    console.error("Unexpected in dist/index.html:", item);
    process.exit(1);
  }
}

// Street address belongs in contact and schema only, not the hero or intro.
const addressHits = html.split("1/247 Bayview Street").length - 1;
if (addressHits < 1) {
  console.error("Work address missing from the page");
  process.exit(1);
}

const { readdir } = await import("node:fs/promises");
const assetNames = await readdir(path.join(dist, "assets"));
const cssName = assetNames.find((name) => name.endsWith(".css"));
const css = await readFile(path.join(dist, "assets", cssName), "utf8");
if (!css.includes("Inter") || !css.includes("#ffc700") || !css.includes("#16233b")) {
  console.error("CSS palette or font check failed");
  process.exit(1);
}
if (css.includes("#4FA3E0") || css.includes("#4fa3e0") || css.includes("text-transform:uppercase") || css.includes("border-radius:999px")) {
  console.error("CSS still has the old accent, all-caps treatment, or pill buttons");
  process.exit(1);
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
  "img/bailey-portrait-675.jpg",
  "img/scene-1100.jpg",
  "img/short-marine-logo.webp",
  "fonts/inter-latin-400-normal.woff2",
  "robots.txt",
  "_headers",
]) {
  await must(file);
}

const headers = await readFile(path.join(dist, "_headers"), "utf8");
if (!headers.includes("Content-Type: text/vcard; charset=utf-8")) {
  console.error("vCard content type missing from _headers");
  process.exit(1);
}

const vcard = await readFile(path.join(dist, "bailey-wilson.vcf"));
const vcardText = vcard.toString("utf8");
for (const field of [
  "FN:Bailey Wilson",
  "ORG:Short Marine",
  "TITLE:Sales Executive",
  "TEL;TYPE=CELL,VOICE:+61485025920",
  "EMAIL;TYPE=INTERNET:bailey.wilson@shortmarine.com",
  "URL:https://baileywilson.au",
  "1/247 Bayview Street",
  "Runaway Bay",
  "QLD",
  "4216",
  "https://www.instagram.com/baileywilsonboats/",
  "https://www.tiktok.com/@baileywilsonboats",
  "https://www.youtube.com/@baileywilson-boats",
  "https://www.linkedin.com/in/bailey-wilson-670230189",
]) {
  if (!vcardText.includes(field)) {
    console.error("vCard missing", field);
    process.exit(1);
  }
}
if (!vcard.includes(Buffer.from("\r\n"))) {
  console.error("vCard should use CRLF");
  process.exit(1);
}

const page404 = await readFile(path.join(dist, "404.html"), "utf8");
if (!page404.includes("That page isn’t here.") || !page404.includes('href="/"') || !page404.includes("Gold Coast")) {
  console.error("404 page incomplete");
  process.exit(1);
}
if (page404.includes("Runaway Bay")) {
  console.error("404 page should say Gold Coast, not Runaway Bay");
  process.exit(1);
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
if (!config.includes('"not_found_handling": "404-page"')) {
  console.error("404 handling missing");
  process.exit(1);
}

console.log("check ok");
