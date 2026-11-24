# Bailey Wilson

Personal site for Bailey Wilson, sales executive at Short Marine in Runaway Bay on the Gold Coast. One static page: a full-bleed boat hero, a short note on buying, selling and trade-ins, how the Short Marine team stays involved after the sale, and ways to text, call, email or send an enquiry.

The enquiry form does not have a server. Submitting it opens the visitor’s mail app with a message to `bailey.wilson@shortmarine.com`.

## Run it locally

```bash
npm install
npm run dev
```

The dev server is on port 43123.

```bash
npm run build
npm run preview
```

`npm run build` optimises the photos, then writes the static site to `dist/`.

## Photos

Boat pictures are from the Short Marine marketing drive (the February 2026 Grady-White 345 Freedom shoot, and The Spit). Bailey’s own boat photos are not used. The Boat Works canal rainbow shot is not used. His two portraits stay. Originals live in `images/originals/`. The build writes AVIF, WebP and JPEG into `public/img/`. Those generated files are not committed.

| File | Use |
| --- | --- |
| `freedom-345-running-golden-hour.jpg` | Hero and social image. Boat sits clear of the bottom-left headline. |
| `freedom-345-cockpit-lounge.jpg` | Support section |
| `freedom-345-aerial-running-wake.jpg` | Wide gallery photo |
| `freedom-345-at-rest-cliffs.jpg`, `spit-marina-beach-and-yachts.jpg` | Gallery pair |
| `bailey-intro-arms-crossed.jpg` | Small intro portrait |
| `bailey-at-helm.jpg` | Contact portrait |

## Deploy on Cloudflare Workers

This is Worker `bailey-wilson-site`, separate from `bwb-social` and `mays-wardrobe-reminders`. `assets.directory` is `./dist`. `src/index.js` serves the site on `baileywilson.au` and `www.baileywilson.au`, and 301s `baileywilsonboats.au` and `www.baileywilsonboats.au` to the same path on `https://baileywilson.au`. `run_worker_first` stays on so the redirect runs before `index.html` is served.

The zones are on the account. If the nameservers have not finished switching, wait until each zone is active before the deploy that attaches the custom domains.

```bash
npx wrangler login
npm run deploy
```

`npm run deploy:dry` builds and packages without publishing.

Docs: [static assets](https://developers.cloudflare.com/workers/static-assets/), [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [redirects](https://developers.cloudflare.com/workers/static-assets/redirects/). `_redirects` cannot change host, which is why the boats domain redirect is in the Worker.

`Save my contact` downloads `bailey-wilson.vcf`. On Cloudflare, `public/_headers` serves it as `text/vcard; charset=utf-8` with `Content-Disposition: attachment; filename="bailey-wilson.vcf"`.

The canonical repo is [baileywilson2305-code/bailey-wilson-site](https://github.com/baileywilson2305-code/bailey-wilson-site).
