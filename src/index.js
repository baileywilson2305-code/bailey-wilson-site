/**
 * baileywilson.au and www.baileywilson.au serve the static site.
 * baileywilsonboats.au and www.baileywilsonboats.au 301 to the same path
 * on https://baileywilson.au.
 */
const APEX = "baileywilson.au";

const REDIRECT_HOSTS = new Set([
  "baileywilsonboats.au",
  "www.baileywilsonboats.au",
]);

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (REDIRECT_HOSTS.has(url.hostname.toLowerCase())) {
      url.hostname = APEX;
      url.protocol = "https:";
      return Response.redirect(url.toString(), 301);
    }
    return env.ASSETS.fetch(request);
  },
};
