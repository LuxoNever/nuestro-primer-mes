import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("teclado, foco dentro del modal y gesto horizontal", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await page.getByRole("link", { name: "Saltar al contenido" }).focus();
  if (browserName !== "webkit") {
    await expect(
      page.getByRole("link", { name: "Saltar al contenido" }),
    ).toBeFocused();
  }
  const open = page.getByRole("button", { name: "Abre tu sorpresa" });
  for (
    let i = 0;
    i < 7 && !(await open.evaluate((el) => el === document.activeElement));
    i++
  )
    await page.keyboard.press("Tab");
  await expect(open).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: /Feliz primer mes/ }),
  ).toBeVisible();
  await page.locator(".polaroid").first().focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Cerrar fotografía" }),
  ).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(
    page.getByRole("button", { name: "Foto siguiente" }),
  ).toBeFocused();
  await page.locator(".lightbox-inner").evaluate((el) => {
    const start = new Event("touchstart", { bubbles: true });
    Object.defineProperty(start, "touches", {
      value: [{ clientX: 240, clientY: 200 }],
    });
    el.dispatchEvent(start);
    const end = new Event("touchend", { bubbles: true });
    Object.defineProperty(end, "changedTouches", {
      value: [{ clientX: 80, clientY: 205 }],
    });
    el.dispatchEvent(end);
  });
  await expect(page.locator(".lightbox-nav")).toContainText("2 / 10");
  await page.keyboard.press("Escape");
  await expect(page.locator(".polaroid").first()).toBeFocused();
});

test("regalo, salto, repetición y acceso al contenido", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Un mes contigo",
  );
  await page
    .getByRole("button", { name: "Abre tu sorpresa", exact: false })
    .click();
  await page.getByRole("button", { name: "Saltar animación" }).click();
  await expect(
    page.getByRole("heading", { name: /Feliz primer mes/ }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Volver a florecer" }).click();
  await page.getByRole("button", { name: "Volver a abrir el regalo" }).click();
  await expect(page.locator(".welcome")).toHaveClass(/opening/, {
    timeout: 3000,
  });
  await expect(page.locator(".welcome")).toHaveClass(/open$/, {
    timeout: 6000,
  });
  await page
    .getByRole("button", { name: "Volver a vivir nuestra sorpresa" })
    .click();
  await expect(page.locator(".welcome")).toHaveClass(/closed/);
  await expect(
    page.getByRole("button", { name: "Abre tu sorpresa" }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});

test("álbum completo, modal, flechas y restitución de foco", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Explorar los 10 recuerdos" }).click();
  await expect(page.locator(".polaroid")).toHaveCount(10);
  const photo = page.getByRole("button", {
    name: "Ampliar recuerdo 1:",
    exact: false,
  });
  await photo.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Foto siguiente" }).click();
  await expect(page.locator(".lightbox-nav")).toContainText("2 / 10");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator(".lightbox-nav")).toContainText("1 / 10");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(photo).toBeFocused();
});

test("carta reversible y música voluntaria sin solicitudes fallidas", async ({
  page,
}) => {
  const failed: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) failed.push(r.url());
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abrir mi carta de amor" }).click();
  await expect(page.locator(".letter-paper")).toContainText("Mi reina 💜");
  await page.getByRole("button", { name: "Cerrar el sobre" }).click();
  await expect(page.locator(".letter-paper")).toHaveCount(0);
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  await expect(page.locator(".letter-paper")).not.toHaveClass(/animate-letter/);
  await page.getByRole("button", { name: "Abrir controles de música" }).click();
  await expect(page.locator(".music-panel")).toContainText("Nuestra canción");
  await expect(page.locator("audio")).toHaveCount(1);
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(true);
  expect(failed).toEqual([]);
});

test("movimiento reducido y accesibilidad de página y modal", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await expect(page.locator(".welcome")).toHaveClass(/open$/);
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.locator(".polaroid").first().click();
  const modal = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(modal.violations).toEqual([]);
});

test("320–1440 px sin desbordamiento horizontal", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  for (const width of [320, 375, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflows, `desbordamiento en ${width}px`).toBe(false);
  }
  await page.setViewportSize({ width: 320, height: 700 });
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await page.getByRole("button", { name: "Explorar los 10 recuerdos" }).click();
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
