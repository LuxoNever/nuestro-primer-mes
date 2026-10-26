import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.use({ reducedMotion: "no-preference" });

test("introducción: sobre, emergencia, expansión hacia la cámara, inmersión y página", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("./");
  const intro = page.getByRole("dialog");
  await expect(intro).toHaveAttribute("data-phase", "waiting");
  await expect(page.locator(".page-shell")).toHaveAttribute("inert", "");
  await expect(
    page.getByRole("button", { name: "Abrir sobre de la introducción" }),
  ).toBeFocused();
  const count = await page.locator(".intro-bloom").count();
  expect(count).toBeGreaterThanOrEqual(28);
  expect(count).toBeLessThanOrEqual(48);
  const samplesPromise = page.evaluate(
    () =>
      new Promise<
        {
          ms: number;
          phase: string;
          width: number;
          z: number;
          visible: number;
          span: number;
          flap: number;
        }[]
      >((resolve) => {
        const root = document.querySelector<HTMLElement>(".intro-experience")!;
        const flower = root.querySelector<HTMLElement>(".intro-bloom")!;
        const blooms = Array.from(
          root.querySelectorAll<HTMLElement>(".intro-bloom"),
        );
        const frames: {
          ms: number;
          phase: string;
          width: number;
          z: number;
          visible: number;
          span: number;
          flap: number;
        }[] = [];
        root.querySelector(".intro-envelope")!.addEventListener(
          "click",
          () => {
            const start = performance.now();
            let previous = -100;
            function sample() {
              const ms = performance.now() - start;
              if (!root.isConnected) {
                resolve(frames);
                return;
              }
              if (ms - previous > 70) {
                previous = ms;
                const css = getComputedStyle(flower);
                const visible = blooms.filter(
                  (b) =>
                    Number(getComputedStyle(b).opacity) > 0.7 &&
                    getComputedStyle(b).visibility !== "hidden",
                );
                const boxes = visible.map((b) => b.getBoundingClientRect());
                frames.push({
                  ms,
                  phase: root.dataset.phase!,
                  width: flower.getBoundingClientRect().width,
                  z: new DOMMatrixReadOnly(css.transform).m43,
                  visible: visible.length,
                  span: boxes.length
                    ? (Math.max(...boxes.map((b) => b.right)) -
                        Math.min(...boxes.map((b) => b.left))) /
                      innerWidth
                    : 0,
                  flap: new DOMMatrixReadOnly(
                    getComputedStyle(root.querySelector(".intro-flap")!)
                      .transform,
                  ).m22,
                });
              }
              requestAnimationFrame(sample);
            }
            requestAnimationFrame(sample);
          },
          { once: true },
        );
      }),
  );
  await page
    .getByRole("button", { name: "Abrir sobre de la introducción" })
    .click();
  const frames = await samplesPromise;
  expect(frames.some((f) => f.flap > -0.8 && f.flap < 0.8)).toBe(true);
  const early = frames.find((f) => f.phase === "emerging" && f.visible > 8)!;
  const partial = frames.find((f) => f.ms > 2900 && f.ms < 3500)!;
  const covered = frames.find((f) => f.phase === "immersed")!;
  expect(early).toBeTruthy();
  expect(partial).toBeTruthy();
  expect(covered).toBeTruthy();
  expect(early.span).toBeLessThan(0.9);
  expect(partial.width).toBeGreaterThan(early.width * 1.3);
  expect(covered.width).toBeGreaterThan(early.width * 2);
  expect(covered.z).toBeGreaterThan(early.z + 60);
  expect(covered.span).toBeGreaterThan(1);
  expect(covered.visible).toBe(count);
  expect(frames.some((f) => f.phase === "message")).toBe(true);
  await info.attach("intro-progress.json", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
  await expect(page.locator(".intro-experience")).toHaveCount(0);
  await expect(page.locator("#contenido")).toBeFocused();
  await expect(page.locator(".page-shell")).not.toHaveAttribute("inert");
  expect(
    await page.evaluate(() => document.documentElement.style.overflow),
  ).toBe("");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Un mes contigo",
  );
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await expect(page.locator(".welcome")).toHaveClass(/opening/);
  await page.getByRole("button", { name: "Saltar animación" }).click();
  expect(errors).toEqual([]);
});

test("foco, Escape, repetición, clics rápidos y salida durante expansión", async ({
  page,
}) => {
  await page.goto("./");
  const open = page.getByRole("button", {
    name: "Abrir sobre de la introducción",
  });
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Abrir controles de música" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("button", { name: "Saltar introducción" }),
  ).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(open).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("slider", { name: /Volumen/ })).toBeFocused();
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("button", { name: "Saltar introducción" })).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Cerrar controles de música" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.locator("#contenido")).toBeFocused();
  for (let i = 0; i < 3; i++) {
    await page
      .getByRole("button", { name: "Repetir la introducción floral" })
      .click();
    await expect(open).toBeFocused();
    await expect(page.locator(".intro-experience")).toHaveAttribute(
      "data-phase",
      "waiting",
    );
    await open.click();
    await open.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
      button.click();
    });
    await expect(page.locator(".intro-experience")).toHaveAttribute(
      "data-phase",
      "expanding",
      { timeout: 5000 },
    );
    await page.getByRole("button", { name: "Saltar introducción" }).click();
    await expect(page.locator(".intro-experience")).toHaveCount(0);
    await expect(page.locator("#contenido")).toBeFocused();
  }
  expect(
    await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused),
  ).toBe(false);
});

test("movimiento reducido, elección voluntaria completa y preferencia intacta", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect(
    page.getByRole("button", { name: "Ver animación completa" }),
  ).toBeVisible();
  const a11y = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze();
  expect(a11y.violations).toEqual([]);
  await page
    .getByRole("button", { name: "Abrir sobre de la introducción" })
    .click();
  await expect(page.locator(".intro-experience")).toHaveAttribute(
    "data-motion",
    "quiet",
  );
  await expect(
    page.getByRole("heading", { name: /Feliz primer mes/ }),
  ).toBeVisible();
  await expect(page.locator(".intro-field")).toHaveCSS("visibility", "hidden");
  await page.getByRole("button", { name: "Ver animación completa" }).click();
  await expect(page.locator(".intro-experience")).toHaveAttribute(
    "data-phase",
    "opening",
  );
  await expect(page.locator(".intro-experience")).toHaveAttribute(
    "data-phase",
    "immersed",
    { timeout: 7000 },
  );
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await expect(page.locator(".welcome")).toHaveClass(/instant open$/);
});

test("cambio de preferencia y tamaños 320–1440 sin bloqueo ni desbordamiento", async ({
  page,
}) => {
  await page.goto("./");
  await page
    .getByRole("button", { name: "Abrir sobre de la introducción" })
    .click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".intro-experience")).toHaveAttribute(
    "data-motion",
    "quiet",
  );
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: width === 320 ? 568 : 740 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await expect(
      page.getByRole("button", { name: "Entrar a nuestra historia" }),
    ).toBeVisible();
  }
  await page.getByRole("button", { name: "Entrar a nuestra historia" }).click();
  await expect(page.locator(".intro-experience")).toHaveCount(0);
  await expect(page.locator("#contenido")).toBeFocused();
});
