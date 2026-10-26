import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("foto original, entrada de tres segundos y permanencia al volver", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const result = await page.evaluate(() => new Promise<{
    frames: { photo: number; mask: number; title: number; signature: number; left: string; frame: string }[];
    elapsed: number;
  }>(resolve => {
    const section = document.getElementById("mi-flor")!;
    const photo = section.querySelector<HTMLElement>(".special-photo")!;
    const title = section.querySelector<HTMLElement>("#special-title")!;
    const signature = section.querySelector<HTMLElement>(".special-signature")!;
    const frame = section.querySelector<HTMLElement>(".special-frame")!;
    const left = section.querySelector<HTMLElement>(".special-botanical-left")!;
    const frames: { photo: number; mask: number; title: number; signature: number; left: string; frame: string }[] = [];
    let started = 0;
    const beginning = performance.now();
    function sample() {
      const now = performance.now();
      const opacity = Number(getComputedStyle(photo).opacity);
      const inset = getComputedStyle(photo).clipPath.match(/[\d.]+/g);
      const mask = inset ? Number(inset[1]) : 0;
      if (!started && mask > 0) started = now;
      frames.push({ photo: opacity, mask, title: Number(getComputedStyle(title).opacity), signature: Number(getComputedStyle(signature).opacity), left: getComputedStyle(left).transform, frame: getComputedStyle(frame).transform });
      if (started && frame.style.transform === "") resolve({ frames, elapsed: now - started });
      else if (now - beginning > 6000) resolve({ frames, elapsed: now - beginning });
      else requestAnimationFrame(sample);
    }
    window.scrollTo({ top: section.getBoundingClientRect().top + scrollY - 120, behavior: "instant" });
    requestAnimationFrame(sample);
  }));
  expect(result.frames.every(f => f.photo === 1)).toBe(true);
  expect(result.frames.some(f => f.mask > 28)).toBe(true);
  expect(result.frames.some(f => f.mask > 3 && f.mask < 22)).toBe(true);
  expect(result.frames.some(f => f.title > 0.4 && f.signature < 0.4)).toBe(true);
  expect(new Set(result.frames.map(f => f.left)).size).toBeGreaterThan(3);
  expect(new Set(result.frames.map(f => f.frame)).size).toBeGreaterThan(3);
  expect(result.elapsed).toBeGreaterThan(2650);
  expect(result.elapsed).toBeLessThan(4500);
  await expect(page.locator(".special-photo")).toHaveCSS("opacity", "1");
  await expect(page.locator(".special-photo")).toHaveCSS("clip-path", "none");
  const image = page.locator(".special-photo img");
  expect(decodeURI(await image.getAttribute("src") ?? "")).toContain("photos/Mi flor más bonita.jpeg");
  await image.scrollIntoViewIfNeeded();
  await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth === 1280 && img.naturalHeight === 1280)).toBe(true);
  await expect(image).toHaveCSS("filter", "none");
  await expect(page.locator(".special-botanical-left")).toHaveCSS("z-index", "0");
  await expect(page.locator(".special-frame")).toHaveCSS("z-index", "1");
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.locator("#mi-flor").scrollIntoViewIfNeeded();
  await expect(page.locator("#special-title")).toHaveCSS("opacity", "1");
  expect(await page.locator(".special-frame").evaluate((e: HTMLElement) => e.style.transform)).toBe("");
  await expect(page.locator(".special-photo")).toHaveCSS("clip-path", "none");
  expect(errors).toEqual([]);
});

test("reduced motion, composición responsive, teclado y corazón sin movimiento", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const section = page.locator("#mi-flor");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await section.scrollIntoViewIfNeeded();
    const photo = await page.locator(".special-visual").boundingBox();
    const text = await page.locator(".special-copy").boundingBox();
    expect(photo).not.toBeNull();
    expect(text).not.toBeNull();
    if (width < 760) expect(photo!.y + photo!.height).toBeLessThan(text!.y);
    else expect(photo!.x + photo!.width).toBeLessThan(text!.x);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator(".special-dedication p").nth(1)).toHaveCSS("font-size", "16px");
    await expect(page.locator(".special-copy > .eyebrow")).toHaveCSS("font-size", "12px");
    await expect(page.locator(".special-photo")).toHaveCSS("clip-path", "none");
  }
  const heart = page.getByRole("button", { name: "Enviar un corazón", exact: true });
  await heart.focus();
  await expect(heart).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator(".special-heart-note")).toHaveText("Y todos los demás también serían para ti, mi preciosa. 💜");
  await page.setViewportSize({ width: 320, height: 900 });
  await page.getByRole("button", { name: "Enviar otro corazón" }).scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".special-petal").evaluateAll(nodes => nodes.every(e => getComputedStyle(e).opacity === "0"))).toBe(true);
  await expect(page.locator("#special-title")).toHaveCSS("opacity", "1");
  const accessibility = await new AxeBuilder({ page }).include("#mi-flor").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});

test("corazón con pétalos finitos, teclado revela y cambio de preferencia conserva contenido", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const heart = page.getByRole("button", { name: "Enviar un corazón", exact: true });
  await heart.focus();
  await expect(page.locator("#special-title")).toHaveCSS("opacity", "1");
  await page.keyboard.press("Enter");
  await expect.poll(() => page.locator(".special-petal").evaluateAll(nodes => nodes.some(e => Number(getComputedStyle(e).opacity) > 0.1)), { intervals: [40] }).toBe(true);
  await expect.poll(() => page.locator(".special-petal").evaluateAll(nodes => nodes.every(e => Number(getComputedStyle(e).opacity) === 0))).toBe(true);
  await page.getByRole("button", { name: "Enviar otro corazón" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".special-photo")).toHaveCSS("opacity", "1");
  await expect(page.locator(".special-photo")).toHaveCSS("clip-path", "none");
  await expect(page.locator("#special-title")).toHaveCSS("opacity", "1");
  expect(await page.locator(".special-petal").evaluateAll(nodes => nodes.every(e => getComputedStyle(e).opacity === "0"))).toBe(true);
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator("#special-title")).toHaveCSS("opacity", "1");
});

test("foto fallida conserva texto y reserva accesible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.route(url => decodeURI(url.pathname).endsWith("/photos/Mi flor más bonita.jpeg"), route => route.fulfill({ status: 404, body: "" }));
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.locator("#mi-flor").scrollIntoViewIfNeeded();
  await expect(page.locator(".special-placeholder")).toContainText("Aquí guardaremos mi flor más bonita.");
  await expect(page.locator(".special-photo img")).toHaveCount(0);
  await expect(page.locator("#special-title")).toBeVisible();
});

test("sin soporte de máscara conserva el fundido y la foto completa", async ({ page }) => {
  await page.addInitScript(() => {
    const supports = CSS.supports.bind(CSS);
    CSS.supports = (property: string, value?: string) => {
      if (property === "clip-path") return false;
      return value === undefined ? supports(property) : supports(property, value);
    };
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.locator("#mi-flor").evaluate(section => window.scrollTo({ top: section.getBoundingClientRect().top + scrollY - 120, behavior: "instant" }));
  await expect.poll(() => page.locator(".special-photo").evaluate(e => Number(getComputedStyle(e).opacity)), { intervals: [30] }).toBeLessThan(0.9);
  await expect(page.locator(".special-photo")).toHaveCSS("opacity", "1");
  await expect(page.locator(".special-photo")).toHaveCSS("clip-path", "none");
});
