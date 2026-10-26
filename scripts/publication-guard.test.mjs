import { test } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import { createHash } from "node:crypto";
import { checkPublication } from "./check-publication.mjs";

async function fixture(t, approved = true) {
  const base = resolve(tmpdir());
  const root = await mkdtemp(join(base, "anniversary-publication-"));
  t.after(async () => {
    assert.ok(resolve(root).startsWith(base + sep));
    assert.ok(root.includes("anniversary-publication-"));
    await rm(root, { recursive: true, force: true });
  });
  async function put(path, text = "fixture") {
    const file = join(root, path);
    await mkdir(join(file, ".."), { recursive: true });
    await writeFile(file, text);
    return createHash("sha256").update(text).digest("hex");
  }
  const paths = Array.from({ length: 10 }, (_, i) => `public/photos/${String(i + 1).padStart(2, "0")}.jpeg`);
  paths.push("public/photos/Mi flor más bonita.jpeg", "public/audio/cancion-aniversario.mp4");
  const assets = [];
  for (const path of paths) assets.push({ path, sha256: await put(path), publicationApproved: approved, rightsConfirmed: approved });
  const manifest = {
    repository: "nuestro-primer-mes", base: "/nuestro-primer-mes/", siteUrl: "https://example.invalid/nuestro-primer-mes/",
    authorization: { repositoryCreation: approved, remoteUpload: approved, publicSite: approved, publicTexts: approved },
    content: { "src/content.ts": await put("src/content.ts") }, assets,
  };
  await put("publication/manifest.json", JSON.stringify(manifest));
  return { root, put };
}
const check = (root, extra = {}) => checkPublication({ root, env: {}, ...extra });

test("la auditoría local no equivale a autorizar la publicación", async t => {
  const { root } = await fixture(t, false);
  const audit = await check(root, { requireApproval: false });
  assert.equal(audit.ok, true);
  assert.equal(audit.publicationApproved, false);
  assert.equal((await check(root)).ok, false);
});
test("solo un manifiesto completo autorizado puede pasar", async t => {
  const { root } = await fixture(t);
  assert.equal((await check(root)).ok, true);
});
test("un cambio de foto o canción invalida la revisión previa", async t => {
  const { root, put } = await fixture(t);
  await put("public/photos/01.jpeg", "different bytes");
  assert.equal((await check(root)).ok, false);
});
test("los textos también quedan ligados a la autorización", async t => {
  const { root, put } = await fixture(t);
  await put("src/content.ts", "different content");
  assert.equal((await check(root)).ok, false);
});
test("faltan archivos y otra URL de workflow: se bloquea", async t => {
  const { root } = await fixture(t);
  await rm(join(root, "public/audio/cancion-aniversario.mp4"));
  const result = await check(root, { env: { VITE_SITE_URL: "https://different.invalid/nuestro-primer-mes/" } });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("URL del workflow")));
});
test("dist rechaza archivos adicionales aunque exista autorización", async t => {
  const { root, put } = await fixture(t);
  const manifest = JSON.parse(await readFile(join(root, "publication/manifest.json"), "utf8"));
  for (const asset of manifest.assets) await put(`dist/${asset.path.slice(7)}`);
  await put("dist/extra-privado.txt");
  const result = await check(root, { checkDist: true });
  assert.equal(result.ok, false);
  assert.ok(result.errors.some(error => error.includes("extra-privado.txt")));
});
