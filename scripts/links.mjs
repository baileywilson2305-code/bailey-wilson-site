import worker from "../src/index.js";

const base = process.env.BASE || "http://127.0.0.1:43123";
const rows = [];

function add(link, target, result) {
  rows.push({ link, target, result });
}

function pass(link, target, detail) {
  add(link, target, `pass: ${detail}`);
}

function fail(link, target, detail) {
  add(link, target, `FAIL: ${detail}`);
}

async function text(url, init) {
  const response = await fetch(url, init);
  const body = await response.text();
  return { response, body };
}

const home = await text(`${base}/`);
if (home.response.status !== 200) fail("GET /", base, `status ${home.response.status}`);
else pass("GET /", `${base}/`, "200");

const html = home.body;
const expected = [
  ["Text", "sms:+61485025920"],
  ["Call", "tel:+61485025920"],
  ["Email", "mailto:bailey.wilson@shortmarine.com?subject=Let's talk boating"],
  ["Direct email", "mailto:bailey.wilson@shortmarine.com?subject=Let's talk boating"],
  ["Enquiry button", "#enquiry"],
  ["Header", "#contact"],
  ["Skip", "#content"],
  ["Instagram", "https://www.instagram.com/baileywilsonboats/"],
  ["TikTok", "https://www.tiktok.com/@baileywilsonboats"],
  ["YouTube", "https://www.youtube.com/@baileywilson-boats"],
  ["LinkedIn", "https://www.linkedin.com/in/bailey-wilson-670230189"],
  ["Save my contact", "/bailey-wilson.vcf"],
  ["Map", "https://maps.google.com/?q=1/247+Bayview+Street,+Runaway+Bay+QLD+4216"],
  ["Short Marine", "https://shortmarine.com.au/"],
  ["Privacy", "https://shortmarine.com.au/privacy-policy/"],
  ["Form action", "mailto:bailey.wilson@shortmarine.com"],
];

for (const [name, href] of expected) {
  if (html.includes(href)) pass(name, href, "present in homepage");
  else fail(name, href, "missing from homepage");
}

for (const id of ["content", "contact", "enquiry"]) {
  if (html.includes(`id="${id}"`)) pass(`Anchor #${id}`, `#${id}`, "target id exists");
  else fail(`Anchor #${id}`, `#${id}`, "target id missing");
}

const vcf = await fetch(`${base}/bailey-wilson.vcf`);
const vcfBody = await vcf.text();
const type = vcf.headers.get("content-type") || "";
const disposition = vcf.headers.get("content-disposition") || "";
if (vcf.status === 200 && type.toLowerCase().includes("text/vcard") && vcfBody.includes("FN:Bailey Wilson") && vcfBody.includes("TEL;TYPE=CELL,VOICE:+61485025920") && vcfBody.includes("bailey.wilson@shortmarine.com") && vcfBody.includes("ORG:Short Marine") && vcfBody.includes("1/247 Bayview Street") && vcfBody.includes("Runaway Bay") && vcfBody.includes("QLD") && vcfBody.includes("4216") && vcfBody.includes("https://baileywilson.au")) {
  pass("Save my contact download", "/bailey-wilson.vcf", `200 ${type}; ${disposition || "no disposition"}`);
} else {
  fail("Save my contact download", "/bailey-wilson.vcf", `status ${vcf.status} type ${type} body snippet ${vcfBody.slice(0, 80)}`);
}

const missing = await fetch(`${base}/this-page-does-not-exist`);
const missingBody = await missing.text();
if (missing.status === 404 && missingBody.includes("That page isn’t here.")) {
  pass("Unknown path", "/this-page-does-not-exist", "404 page");
} else if (missingBody.includes("That page isn’t here.")) {
  pass("Unknown path", "/this-page-does-not-exist", `body is 404 page, status ${missing.status}`);
} else {
  fail("Unknown path", "/this-page-does-not-exist", `status ${missing.status}`);
}

const page404 = await text(`${base}/404.html`);
if (page404.response.status === 200 && page404.body.includes("That page isn’t here.") && page404.body.includes('href="/"')) {
  pass("404.html", "/404.html", "200 with homepage link");
} else {
  fail("404.html", "/404.html", `status ${page404.response.status}`);
}

const font = await fetch(`${base}/fonts/inter-latin-600-normal.woff2`);
pass("Inter font", "/fonts/inter-latin-600-normal.woff2", `${font.status} ${font.headers.get("content-type")}`);
if (font.status !== 200) fail("Inter font", "/fonts/inter-latin-600-normal.woff2", "not served");

for (const asset of ["/img/hero-1280.avif", "/img/scene-sunset-1100.jpg", "/img/bailey-portrait-675.jpg", "/img/og.jpg", "/favicon.svg"]) {
  const res = await fetch(`${base}${asset}`);
  if (res.status === 200) pass(asset, asset, `200 ${res.headers.get("content-type")}`);
  else fail(asset, asset, `status ${res.status}`);
}

const rainbow = await fetch(`${base}/img/break-canal-1600.jpg`);
if (rainbow.status === 404) pass("Boat Works image removed", "/img/break-canal-1600.jpg", "404");
else fail("Boat Works image removed", "/img/break-canal-1600.jpg", `still served, status ${rainbow.status}`);

const env = {
  ASSETS: {
    async fetch(request) {
      return new Response("asset", { status: 200, headers: { "x-asset": new URL(request.url).hostname } });
    },
  },
};

const redirects = [
  ["https://baileywilsonboats.au/contact?from=boats", "https://baileywilson.au/contact?from=boats"],
  ["https://www.baileywilsonboats.au/", "https://baileywilson.au/"],
  ["https://BaileyWilsonBoats.au/boats", "https://baileywilson.au/boats"],
];
for (const [from, to] of redirects) {
  const res = await worker.fetch(new Request(from), env);
  const location = res.headers.get("location");
  if (res.status === 301 && location === to) pass("Boats domain redirect", from, `301 ${location}`);
  else fail("Boats domain redirect", from, `status ${res.status} location ${location}`);
}

for (const host of ["https://baileywilson.au/", "https://www.baileywilson.au/gallery"]) {
  const res = await worker.fetch(new Request(host), env);
  if (res.status === 200 && (await res.text()) === "asset") pass("Apex serves assets", host, "200 asset, no redirect");
  else fail("Apex serves assets", host, `status ${res.status}`);
}

const external = [
  ["Instagram live", "https://www.instagram.com/baileywilsonboats/"],
  ["Short Marine live", "https://shortmarine.com.au/"],
  ["Privacy live", "https://shortmarine.com.au/privacy-policy/"],
];
for (const [name, url] of external) {
  try {
    const res = await fetch(url, { redirect: "follow", headers: { "user-agent": "Mozilla/5.0" } });
    pass(name, url, `${res.status} ${res.url}`);
  } catch (error) {
    fail(name, url, error.message);
  }
}

const failed = rows.filter((row) => row.result.startsWith("FAIL"));
console.log(JSON.stringify({ failed: failed.length, rows }, null, 2));
if (failed.length) process.exit(1);
