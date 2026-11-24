# Bailey Wilson

Personal site for Bailey Wilson, sales executive and boat broker at Short Marine in Runaway Bay on the Gold Coast. One static page: a full-bleed hero, a short introduction, three ways Short Marine stays involved after the sale, and buttons to text, call, email or send an enquiry.

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

Boat pictures are from the Short Marine marketing drive: the February 2026 Grady-White 345 Freedom shoot, The Spit, and The Boat Works. Bailey’s own boat photos are not used. His two small portraits stay. Originals live in `images/originals/`. The build writes AVIF, WebP and JPEG into `public/img/`. Those generated files are not committed.

| File | Use |
| --- | --- |
| `freedom-345-aerial-running-wake.jpg` | Hero and social image |
| `freedom-345-running-golden-hour.jpg` | Full-bleed break after the intro |
| `freedom-345-cockpit-lounge.jpg` | Support section |
| `freedom-345-running-cliffs.jpg`, `freedom-345-at-rest-cliffs.jpg`, `spit-marina-beach-and-yachts.jpg`, `freedom-345-two-boats-open-water.jpg` | Gallery |
| `boat-works-canal-rainbow.jpg` | Full-bleed break before contact |
| `bailey-intro-arms-crossed.jpg` | Small intro portrait |
| `bailey-at-helm.jpg` | Small contact portrait |

## Deploy on Cloudflare Workers

This is Worker `bailey-wilson-site`, separate from `bwb-social` and `mays-wardrobe-reminders`. `assets.directory` is `./dist`. `src/index.js` serves the site on `baileywilson.au` and `www.baileywilson.au`, and 301s `baileywilsonboats.au` and `www.baileywilsonboats.au` to the same path on `https://baileywilson.au`. `run_worker_first` stays on so the redirect runs before `index.html` is served.

The zones are on the account. If the nameservers have not finished switching, wait until each zone is active before the deploy that attaches the custom domains.

```bash
npx wrangler login
npm run deploy
```

`npm run deploy:dry` builds and packages without publishing.

Docs: [static assets](https://developers.cloudflare.com/workers/static-assets/), [custom domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/), [redirects](https://developers.cloudflare.com/workers/static-assets/redirects/). `_redirects` cannot change host, which is why the boats domain redirect is in the Worker.

The canonical repo is [baileywilson2305-code/bailey-wilson-site](https://github.com/baileywilson2305-code/bailey-wilson-site).

