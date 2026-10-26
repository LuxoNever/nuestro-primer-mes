import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { resolve, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const project = fileURLToPath(new URL("../", import.meta.url));
const digest = bytes => createHash("sha256").update(bytes).digest("hex");
const publicFiles = new Set([
  "index.html", "favicon.svg", "social/tulipanes.svg", "social/tulipanes.png",
  "licenses/Cormorant-Garamond.txt", "licenses/DM-Sans.txt", "licenses/React.txt", "licenses/GSAP-Notice.txt",
]);

export async function checkPublication({ root = project, checkDist = false, requireApproval = true, env = process.env } = {}) {
  const errors = [];
  const pending = [];
  const manifest = JSON.parse(await readFile(resolve(root, "publication/manifest.json"), "utf8"));
  function safe(path) {
    const absolute = resolve(root, path);
    if (!absolute.startsWith(resolve(root) + sep)) throw new Error("Ruta fuera del proyecto en el manifiesto.");
    return absolute;
  }
  async function matches(path, expected) {
    try {
      const bytes = await readFile(safe(path));
      if (digest(bytes) !== expected) errors.push(`Huella modificada: ${path}`);
    } catch (error) {
      errors.push(`Recurso ausente o no válido: ${path} (${error.code ?? "ruta"})`);
    }
  }
  if (manifest.repository !== "nuestro-primer-mes" || manifest.base !== "/nuestro-primer-mes/") errors.push("Repositorio o base distintos del objetivo.");
  if (!manifest.content["src/content.ts"] || manifest.assets.length !== 12) errors.push("El manifiesto debe incluir el contenido y los doce medios revisados.");
  for (const [path, hash] of Object.entries(manifest.content)) await matches(path, hash);
  const known = new Set();
  for (const item of manifest.assets) {
    if (!/^public\/(photos|audio)\/[^/]+$/.test(item.path) || known.has(item.path)) errors.push(`Entrada inválida o duplicada: ${item.path}`);
    known.add(item.path);
    await matches(item.path, item.sha256);
    if (!item.publicationApproved || !item.rightsConfirmed) pending.push(item.path);
    if (checkDist) await matches(`dist/${item.path.slice(7)}`, item.sha256);
  }
  for (const key of ["repositoryCreation", "remoteUpload", "publicSite", "publicTexts"]) {
    if (manifest.authorization[key] !== true) pending.push(`Autorización: ${key}`);
  }
  if (!manifest.siteUrl) pending.push("URL pública definitiva");
  else {
    const site = new URL(manifest.siteUrl);
    if (site.protocol !== "https:" || site.pathname !== manifest.base || site.username || site.password || site.search || site.hash) errors.push("URL pública no válida.");
    if (env.VITE_SITE_URL && new URL(env.VITE_SITE_URL).href !== site.href) errors.push("La URL del workflow no coincide con la revisada.");
  }
  if (env.GITHUB_REPOSITORY && env.GITHUB_REPOSITORY.split("/").at(-1) !== manifest.repository) errors.push("El workflow se ejecuta en otro repositorio.");
  const distFiles = [];
  if (checkDist) {
    async function visit(directory) {
      for (const item of await readdir(directory, { withFileTypes: true })) {
        const path = resolve(directory, item.name);
        if (item.isSymbolicLink()) { errors.push(`Enlace no permitido: ${relative(root, path)}`); continue; }
        if (item.isDirectory()) await visit(path);
        else {
          const rel = relative(resolve(root, "dist"), path).split(sep).join("/");
          // The Pages action explicitly excludes hidden files, including .gitkeep.
          if (rel.split("/").some(part => part.startsWith("."))) continue;
          distFiles.push(rel);
          const generated = /^assets\/[a-zA-Z0-9_-]+\.(js|css|woff2?)$/.test(rel);
          if (!publicFiles.has(rel) && !known.has(`public/${rel}`) && !generated) errors.push(`Archivo no previsto en dist: ${rel}`);
        }
      }
    }
    await visit(safe("dist"));
    for (const name of publicFiles) if (!distFiles.includes(name)) errors.push(`Archivo público necesario ausente: ${name}`);
  }
  if (requireApproval && pending.length) errors.push("Publicación bloqueada: faltan autorizaciones o URL revisada.");
  return { ok: errors.length === 0, publicationApproved: pending.length === 0, errors, pending, assets: manifest.assets.length, distFiles };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await checkPublication({ checkDist: process.argv.includes("--dist"), requireApproval: !process.argv.includes("--audit") });
  console.log(JSON.stringify(result, null, 2));
  process.exitCode = result.ok ? 0 : 1;
}
