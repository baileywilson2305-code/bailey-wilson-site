import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.dirname(fileURLToPath(import.meta.url));

function serveVcard(directory) {
  return (req, res, next) => {
    const urlPath = req.url?.split("?")[0];
    if (urlPath !== "/bailey-wilson.vcf") return next();
    const body = readFileSync(path.join(directory, "bailey-wilson.vcf"));
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/vcard; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="bailey-wilson.vcf"');
    res.end(body);
  };
}

function staticSiteHeaders() {
  return {
    name: "static-site-headers",
    configureServer(server) {
      server.middlewares.use(serveVcard(path.join(root, "public")));
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveVcard(path.join(root, "dist")));
    },
  };
}

export default defineConfig({
  appType: "mpa",
  plugins: [staticSiteHeaders()],
  server: {
    host: "0.0.0.0",
    port: 43123,
    strictPort: true,
  },
  preview: {
    host: "0.0.0.0",
    port: 43123,
    strictPort: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    assetsInlineLimit: 0,
  },
});
