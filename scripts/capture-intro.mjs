import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";

const output = resolve(process.env.INTRO_OUTPUT || "artifacts/intro");
const url = process.env.DEMO_URL || "http://127.0.0.1:4173/nuestro-primer-mes/";
await mkdir(output, { recursive: true });
const stages = [
  ["1-sobre", 650],
  ["2-emergen", 1650],
  ["3-expanden", 2800],
  ["4-inmersion", 4600],
  ["5-mensaje", 6900],
  ["6-pagina", 8750],
];
const browser = await chromium.launch();
const report = [];
for (const [name, width, height] of [
  ["escritorio", 1440, 1000],
  ["movil", 390, 844],
]) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "no-preference",
    isMobile: name === "movil",
    hasTouch: name === "movil",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  const errors = [];
  const failed = [];
  const frames = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400) failed.push(response.url());
  });
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(output, `${name}-0-cerrado.png`) });
  await page.waitForTimeout(500);
  await page
    .getByRole("button", { name: "Abrir sobre de la introducción" })
    .click();
  const start = Date.now();
  let coverageFrame;
  for (const [label, time] of stages) {
    await page.waitForTimeout(Math.max(0, time - (Date.now() - start)));
    const phase = await page.evaluate(
      () =>
        document
          .querySelector(".intro-experience")
          ?.getAttribute("data-phase") || "page",
    );
    const buffer = await page.screenshot({
      path: join(output, `${name}-${label}.png`),
    });
    if (label === "4-inmersion") coverageFrame = buffer.toString("base64");
    frames.push({
      label,
      intendedMs: time,
      capturedMs: Date.now() - start,
      phase,
    });
  }
  // Pixel-based evidence of floral coverage, distinct from bounding-box tests.
  // Lavender/purple petals have both R and B above G. Ivory background does not.
  const coverage = await page.evaluate(async (png) => {
    const image = new Image();
    image.src = `data:image/png;base64,${png}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let purple = 0;
    for (let i = 0; i < pixels.length; i += 4)
      if (pixels[i] - pixels[i + 1] > 8 && pixels[i + 2] - pixels[i + 1] > 8)
        purple++;
    return Number(((100 * purple) / (pixels.length / 4)).toFixed(2));
  }, coverageFrame);
  report.push({
    device: name,
    width,
    height,
    frames,
    floralColorCoveragePercent: coverage,
    errors,
    failed,
    introUnmounted: (await page.locator(".intro-experience").count()) === 0,
    overflow: await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth,
    ),
  });
  await context.close();
  // Record a separate uninterrupted pass: screenshot encoding must not affect video.
  const recording = await browser.newContext({ viewport: { width, height },
    reducedMotion: "no-preference", isMobile: name === "movil", hasTouch: name === "movil",
    deviceScaleFactor: 1, recordVideo: { dir: output, size: { width, height } } });
  const videoPage = await recording.newPage();
  videoPage.on("pageerror", (error) => errors.push(error.message));
  await videoPage.goto(url);
  await videoPage.evaluate(() => document.fonts.ready);
  await videoPage.waitForTimeout(750);
  await videoPage.getByRole("button", { name: "Abrir sobre de la introducción" }).click();
  await videoPage.locator(".intro-experience").waitFor({ state: "detached", timeout: 15000 });
  await videoPage.waitForTimeout(1000);
  const video = videoPage.video();
  await recording.close();
  await video.saveAs(join(output, `${name}-intro.webm`));
  await video.delete();
}
await browser.close();
await writeFile(
  join(output, "verificacion.json"),
  JSON.stringify(report, null, 2),
);
const labels = ["0-cerrado", ...stages.map(([label]) => label)];
const sections = ["escritorio", "movil"]
  .map(
    (device) =>
      `<section><h2>${device === "movil" ? "Celular · 390 × 844" : "Escritorio · 1440 × 1000"}</h2><video controls preload="metadata" poster="${device}-0-cerrado.png" src="${device}-intro.webm"></video><div class="frames">${labels.map((label) => `<figure><a href="${device}-${label}.png"><img loading="lazy" src="${device}-${label}.png" alt="${label.replaceAll("-", " ")}"></a><figcaption>${label.replaceAll("-", " ")}</figcaption></figure>`).join("")}</div></section>`,
  )
  .join("");
await writeFile(
  join(output, "index.html"),
  `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Una bienvenida entre tulipanes</title><style>body{margin:0;padding:30px;background:#fff9f6;color:#543a65;font:15px/1.6 system-ui}main{max-width:1440px;margin:auto}h1,h2{font-family:Georgia;font-weight:400}h1{font-size:44px}section{margin-top:50px}video{width:100%;max-height:660px;background:#f3eaf3;border-radius:12px}.frames{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:28px}figure{margin:0}img{width:100%;border:1px solid #ddcbe4}figcaption{font-size:13px}</style><main><h1>Para ti, mi preciosa…</h1><p>Introducción original: sobre → racimo → expansión hacia la cámara → inmersión → mensaje → página existente.</p><p>Videos de la compilación local con movimiento normal explícito. La secuencia dura 8,3 segundos desde el clic. Las imágenes adjuntas por el usuario se utilizaron como referencia de comportamiento; no se incorporaron sus recursos a la web.</p>${sections}<p>La cobertura de color floral en el fotograma de inmersión fue ${report[0].floralColorCoveragePercent}% en escritorio y ${report[1].floralColorCoveragePercent}% en móvil. Es una medición de color, complementaria a la revisión visual y las pruebas de movimiento.</p></main></html>`,
);
console.log(JSON.stringify(report, null, 2));
