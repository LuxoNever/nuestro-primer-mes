import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.VITE_BASE_PATH || "/nuestro-primer-mes/";
const configuredSite = process.env.VITE_SITE_URL?.trim();
const site = configuredSite ? new URL(configuredSite) : null;
if (site && (site.protocol !== "https:" || site.username || site.password || site.search || site.hash || site.pathname.replace(/\/?$/, "/") !== base))
  throw new Error("VITE_SITE_URL debe ser una URL HTTPS con la misma ruta que VITE_BASE_PATH.");
if (site) site.pathname = base;

// Sharing metadata contains only the original title and a botanical illustration.
export default defineConfig({
  plugins: [react(), {
    name: "anniversary-sharing-metadata",
    transformIndexHtml() {
      const image = site ? new URL("social/tulipanes.png", site).href : `${base}social/tulipanes.png`;
      return [
        { tag: "meta", attrs: { property: "og:image", content: image } },
        { tag: "meta", attrs: { name: "twitter:image", content: image } },
        ...(site ? [
          { tag: "link", attrs: { rel: "canonical", href: site.href } },
          { tag: "meta", attrs: { property: "og:url", content: site.href } },
        ] : []),
      ];
    },
  }],
  base,
});
