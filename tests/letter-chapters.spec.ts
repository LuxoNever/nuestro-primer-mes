import { test, expect } from "@playwright/test";

test("cambio real de 0,5 s, foco en título y anuncio breve", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abrir mi carta de amor" }).click();
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false", { timeout: 6500 });
  const button = page.getByRole("button", { name: "Siguiente", exact: true });
  await button.evaluate(button => button.addEventListener("click", () => {
    const start = performance.now();
    let changing = false;
    const frames: { opacity: number; x: number; depth: number }[] = [];
    function sample() {
      const paper = document.querySelector(".letter-paper")!;
      const content = paper.querySelector(".letter-chapter-content")!;
      const css = getComputedStyle(content);
      const transform = new DOMMatrixReadOnly(css.transform);
      changing ||= paper.getAttribute("aria-busy") === "true";
      frames.push({ opacity: Number(css.opacity), x: transform.m41, depth: transform.m13 });
      if ((changing && paper.getAttribute("aria-busy") === "false") || performance.now() - start > 1500) {
        (paper as HTMLElement).dataset.turn = JSON.stringify({ frames, duration: performance.now() - start });
      } else requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }, { once: true }));
  await button.click();
  await expect(page.locator(".letter-paper")).toHaveAttribute("data-turn", /frames/);
  const data: { frames: { opacity: number; x: number; depth: number }[]; duration: number } = JSON.parse((await page.locator(".letter-paper").getAttribute("data-turn"))!);
  expect(data.duration).toBeGreaterThan(350);
  expect(data.duration).toBeLessThan(1200);
  expect(data.frames.some(f => f.opacity > 0 && f.opacity < 0.9)).toBe(true);
  expect(data.frames.some(f => Math.abs(f.x) > 2 && Math.abs(f.depth) > 0.001)).toBe(true);
  await expect(page.locator(".letter-page-count")).toHaveText("Página 2 de 5");
  await expect(page.locator("#letter-chapter-title")).toHaveText("Lo que quiero construir contigo");
  await expect(page.locator("#letter-chapter-title")).toBeFocused();
  await expect(page.locator("#letter-chapter-title")).toBeInViewport();
  await expect(page.locator(".letter-announcement")).toHaveText("Página 2 de 5");
  await expect(page.locator(".letter-announcement")).toHaveAttribute("aria-live", "polite");
  expect(await page.locator(".letter-paper").getAttribute("aria-live")).toBeNull();
  await expect(page.getByRole("progressbar", { name: "Progreso de la carta" })).toHaveAttribute("value", "2");
  expect(await page.locator(".letter-chapter-content").evaluate((e: HTMLElement) => e.style.transform)).toBe("");
});

test("clics rápidos solo avanzan una página; anterior, cierre y reinicio son seguros", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abrir mi carta de amor" }).click();
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false", { timeout: 6500 });
  await page.getByRole("button", { name: "Siguiente", exact: true }).evaluate((button: HTMLButtonElement) => {
    button.click(); button.click(); button.click();
  });
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".letter-page-count")).toHaveText("Página 2 de 5");
  await page.getByRole("button", { name: "Anterior", exact: true }).click();
  await expect(page.locator(".letter-page-count")).toHaveText("Página 1 de 5");
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await page.getByRole("button", { name: "Siguiente", exact: true }).evaluate((button: HTMLButtonElement) => button.click());
  await page.getByRole("button", { name: "Cerrar el sobre" }).evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator(".letter-paper")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Abrir mi carta de amor" })).toBeFocused();
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  for (let i = 0; i < 4; i++) await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.locator(".letter-page-count")).toHaveText("Página 5 de 5");
  await expect(page.locator(".letter-closing strong")).toHaveText("Tu esclavo. ♡");
  await page.getByRole("button", { name: "Volver al inicio", exact: true }).click();
  await expect(page.locator(".letter-page-count")).toHaveText("Página 1 de 5");
  await expect(page.locator(".letter-closing")).toHaveCount(0);
  await expect(page.locator("#letter-chapter-title")).toBeFocused();
  expect(errors).toEqual([]);
});

test("lectura sin transiciones y cambio de reduced motion conservan una página visible", async ({ page }) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  await page.getByRole("button", { name: "Siguiente", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(page.locator(".letter-page-count")).toHaveText("Página 2 de 5");
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".letter-chapter-content")).toHaveCSS("transform", "none");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".letter-page-count")).toHaveText("Página 2 de 5");
  await page.getByRole("button", { name: "Volver a leer" }).click();
  await expect(page.locator(".letter-page-count")).toHaveText("Página 1 de 5");
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await expect(page.locator(".letter-paper")).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".letter-chapter-content")).toHaveCSS("opacity", "1");
  await expect(page.locator(".letter-chapter-content")).toHaveCSS("transform", "none");
  for (let i = 0; i < 4 && (await page.locator(".letter-page-count").textContent()) !== "Página 5 de 5"; i++)
    await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  await expect(page.locator(".letter-heart")).toHaveCSS("transform", "none");
});
