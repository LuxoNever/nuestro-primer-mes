import { test, expect, type Page } from "@playwright/test";

test.use({ reducedMotion: "no-preference" });

async function flower(page: Page) {
  return page.locator(".gift-bouquet").evaluate((bouquet) => {
    // WebKit exposes SVG presentation transforms through baseVal, not computed CSS.
    const matrix = (selector: string) => {
      const element = bouquet.querySelector<SVGGraphicsElement>(selector)!;
      const css = getComputedStyle(element).transform;
      return css === "none"
        ? element.transform.baseVal.consolidate()!.matrix
        : new DOMMatrixReadOnly(css);
    };
    const petal = matrix(".petal-left");
    return {
      angle: (Math.atan2(petal.b, petal.a) * 180) / Math.PI,
      head: matrix(".flower-head").a,
      stem: matrix(".flower-stem").d,
      opacity: Number(getComputedStyle(bouquet).opacity),
    };
  });
}

test("regalo: capullo visible, apertura gradual y final; repetir y saltar", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const initial = await flower(page);
  expect(initial.opacity).toBe(0);
  expect(initial.angle).toBeCloseTo(31, 0);
  await page
    .locator(".gift-art")
    .screenshot({ path: info.outputPath("gift-initial.png") });
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await expect(page.locator(".welcome")).toHaveClass(/opening/);
  // The bouquet must become visible while petals are still closed.
  await expect
    .poll(async () => (await flower(page)).opacity, { intervals: [60] })
    .toBe(1);
  expect((await flower(page)).angle).toBeGreaterThan(25);
  await expect
    .poll(async () => (await flower(page)).angle, { intervals: [60] })
    .toBeLessThan(20);
  const middle = await flower(page);
  expect(middle.angle).toBeGreaterThan(-10);
  expect(middle.head).toBeGreaterThan(initial.head);
  expect(middle.head).toBeLessThan(1);
  await expect(page.locator(".welcome")).toHaveClass(/opening/);
  await page
    .locator(".gift-art")
    .screenshot({ path: info.outputPath("gift-middle.png") });
  await expect(page.locator(".welcome")).toHaveClass(/open$/, {
    timeout: 6500,
  });
  const final = await flower(page);
  expect(final.angle).toBeCloseTo(-12, 0);
  expect(final.head).toBeCloseTo(1, 2);
  expect(final.stem).toBeCloseTo(1, 2);
  await page
    .locator(".gift-art")
    .screenshot({ path: info.outputPath("gift-final.png") });
  await page.getByRole("button", { name: "Volver a florecer" }).click();
  expect((await flower(page)).angle).toBeGreaterThan(25);
  await expect
    .poll(async () => (await flower(page)).angle, { intervals: [80] })
    .toBeLessThan(10);
  await page.getByRole("button", { name: "Volver a abrir el regalo" }).click();
  await page.getByRole("button", { name: "Volver a abrir el regalo" }).click();
  await page.getByRole("button", { name: "Saltar animación" }).click();
  expect((await flower(page)).angle).toBeCloseTo(-12, 0);
  await expect(
    page.getByRole("heading", { name: /Feliz primer mes/ }),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test("sobre: solapa en tránsito, hoja desplegándose y párrafos progresivos", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const envelope = page.getByRole("button", { name: "Abrir mi carta de amor" });
  await envelope.scrollIntoViewIfNeeded();
  const flap = () =>
    page
      .locator(".envelope-flap")
      .evaluate(
        (e) => new DOMMatrixReadOnly(getComputedStyle(e).transform).m22,
      );
  expect(await flap()).toBe(1);
  await envelope.screenshot({ path: info.outputPath("letter-initial.png") });
  // Sample inside the rendering loop: screenshot/IPC latency must not skip
  // intermediate frames on WebKit or a busy CI worker.
  await envelope.evaluate((button) => {
    button.addEventListener(
      "click",
      () => {
        const start = performance.now();
        const frames: {
          ms: number;
          flap: number;
          scale: number;
          opacity: number;
          first: number;
          last: number;
        }[] = [];
        function sample() {
          const paper = document.querySelector(".letter-paper");
          const flap = document.querySelector(".envelope-flap")!;
          if (paper) {
            const paragraphs = paper.querySelectorAll("p");
            frames.push({
              ms: performance.now() - start,
              flap: new DOMMatrixReadOnly(getComputedStyle(flap).transform).m22,
              scale: new DOMMatrixReadOnly(getComputedStyle(paper).transform).d,
              opacity: Number(getComputedStyle(paper).opacity),
              first: Number(getComputedStyle(paragraphs[0]).opacity),
              last: Number(
                getComputedStyle(paragraphs[paragraphs.length - 1]).opacity,
              ),
            });
          }
          if (performance.now() - start < 4600) requestAnimationFrame(sample);
          else (button as HTMLElement).dataset.frames = JSON.stringify(frames);
        }
        requestAnimationFrame(sample);
      },
      { once: true },
    );
  });
  await envelope.click();
  await expect(page.locator(".letter-paper")).toHaveCSS("opacity", "0");
  await page.waitForTimeout(650);
  await page.screenshot({ path: info.outputPath("letter-flap.png") });
  await expect(page.locator(".letter-paper")).toHaveAttribute(
    "aria-busy",
    "false",
    { timeout: 6500 },
  );
  await expect(envelope).toHaveAttribute("data-frames", /ms/, {
    timeout: 6500,
  });
  const frames: {
    ms: number;
    flap: number;
    scale: number;
    opacity: number;
    first: number;
    last: number;
  }[] = JSON.parse((await envelope.getAttribute("data-frames"))!);
  expect(frames[0].opacity).toBe(0);
  expect(frames.some((f) => f.flap < 0.8 && f.flap > -0.8)).toBe(true);
  expect(
    frames.some((f) => f.scale > 0.2 && f.scale < 0.9 && f.opacity > 0),
  ).toBe(true);
  expect(frames.some((f) => f.first > 0.2 && f.last === 0)).toBe(true);
  expect(frames.at(-1)!.scale).toBe(1);
  expect(frames.at(-1)!.last).toBe(1);
  expect(await flap()).toBeCloseTo(-1, 2);
  await info.attach("letter-progress.json", {
    body: JSON.stringify(frames),
    contentType: "application/json",
  });
  const lastParagraph = page.locator(".letter-paper p").last();
  await page
    .locator(".letter-paper")
    .screenshot({ path: info.outputPath("letter-final.png") });
  await page.getByRole("button", { name: "Volver a leer" }).click();
  await expect(page.locator(".letter-paper")).toHaveCSS("opacity", "0");
  await page.getByRole("button", { name: "Cerrar el sobre" }).click();
  await expect(page.locator(".letter-paper")).toHaveCount(0);
  expect(await flap()).toBe(1);
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  await expect(lastParagraph).toHaveCSS("opacity", "1");
});

test("cambio de preferencia durante apertura termina sin movimiento y conserva controles", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Abre tu sorpresa" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".welcome")).toHaveClass(/open$/);
  const final = await flower(page);
  expect(final.angle).toBeCloseTo(-12, 0);
  await page.getByRole("button", { name: "Volver a florecer" }).click();
  expect(await flower(page)).toEqual(final);
  await page.getByRole("button", { name: "Abrir mi carta de amor" }).click();
  await expect(page.locator(".letter-paper")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  await expect(page.locator(".letter-paper p").last()).toHaveCSS(
    "opacity",
    "1",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.getByRole("button", { name: "Volver a leer" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(page.locator(".letter-paper p").last()).toHaveCSS(
    "opacity",
    "1",
  );
});

test("entradas de secciones y Polaroids avanzan al desplazarse", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const heading = page.locator("#anniversary-title");
  await expect(heading).toHaveCSS("opacity", "0.15");
  await page.locator("#nosotros").evaluate((e) =>
    window.scrollTo({
      top: e.getBoundingClientRect().top + window.scrollY - 150,
      behavior: "instant",
    }),
  );
  await expect
    .poll(() => heading.evaluate((e) => Number(getComputedStyle(e).opacity)), {
      intervals: [50],
    })
    .toBeGreaterThan(0.2);
  await expect(heading).toHaveCSS("opacity", "1");
  const photo = page.locator(".polaroid-slot").last();
  await photo.evaluate((e) =>
    window.scrollTo({
      top: e.getBoundingClientRect().top + window.scrollY - 200,
      behavior: "instant",
    }),
  );
  await expect(photo).toHaveCSS("opacity", "1");
  await page.getByRole("button", { name: "Explorar los 10 recuerdos" }).click();
  await expect(page.locator(".polaroid-slot")).toHaveCount(10);
  await page.locator(".polaroid").last().focus();
  await expect(page.locator(".polaroid-slot").last()).toHaveCSS("opacity", "1");
});
