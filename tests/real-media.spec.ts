import { test, expect } from "@playwright/test";

test("diez fotos reales, portada 02, secundaria 01 y espacio especial", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const missing: string[] = [];
  page.on("response", (r) => {
    if (r.status() >= 400) missing.push(r.url());
  });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Explorar los 10 recuerdos" }).click();
  await expect(page.locator(".featured img")).toHaveAttribute(
    "src",
    /photos\/02\.jpeg$/,
  );
  await expect(page.locator(".secondary img")).toHaveAttribute(
    "src",
    /photos\/01\.jpeg$/,
  );
  await expect(page.locator("#memory-heading")).toHaveText(
    "Nuestros mejoresmomentos",
  );
  const images = page.locator(".album img");
  await expect(images).toHaveCount(10);
  for (const image of await images.all()) {
    await image.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        image.evaluate(
          (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  const order = await images.evaluateAll((nodes) =>
    nodes.map((n) => n.getAttribute("src")?.split("/").at(-1)),
  );
  expect(order).toEqual([
    "02.jpeg",
    "01.jpeg",
    "03.jpeg",
    "04.jpeg",
    "05.jpeg",
    "06.jpeg",
    "07.jpeg",
    "08.jpeg",
    "09.jpeg",
    "10.jpeg",
  ]);
  await expect(page.locator(".special-frame img")).toHaveCount(1);
  await expect(
    page.getByRole("heading", { name: "Mi flor más bonita" }),
  ).toBeVisible();
  await page.locator(".polaroid").first().click();
  await expect(page.locator(".lightbox img")).toHaveAttribute(
    "src",
    /02\.jpeg$/,
  );
  await page.keyboard.press("Escape");
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  expect(missing).toEqual([]);
});

test("MP4 real: gesto, continuidad entre intro y página, volumen, mute, pausa y dos bucles", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const state = window as typeof window & { testGains: GainNode[]; testAutomation: { value: number; mediaTime: number }[] };
    state.testGains = [];
    state.testAutomation = [];
    const volume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume")!;
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      ...volume,
      set(value: number) {
        state.testAutomation.push({ value, mediaTime: this.currentTime });
        volume.set!.call(this, value);
      },
    });
    if (!("AudioContext" in window)) return;
    const original = AudioContext.prototype.createGain;
    AudioContext.prototype.createGain = function () {
      const gain = original.call(this);
      state.testGains.push(gain);
      const set = gain.gain.setValueAtTime;
      const ramp = gain.gain.linearRampToValueAtTime;
      gain.gain.setValueAtTime = function (value, time) {
        state.testAutomation.push({ value, mediaTime: document.querySelector("audio")?.currentTime ?? 0 });
        return set.call(this, value, time);
      };
      gain.gain.linearRampToValueAtTime = function (value, time) {
        state.testAutomation.push({ value, mediaTime: document.querySelector("audio")?.currentTime ?? 0 });
        return ramp.call(this, value, time);
      };
      return gain;
    };
  });
  let requests = 0;
  const errors: string[] = [];
  page.on("request", (r) => {
    if (r.url().includes("cancion-aniversario.mp4")) requests++;
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("./");
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Abrir controles de música" }).click();
  expect(requests).toBe(0);
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  const audio = page.locator("audio");
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(1.3);
  expect(
    await audio.evaluate((a: HTMLAudioElement) => a.duration),
  ).toBeGreaterThan(200);
  const before = await audio.evaluate((a: HTMLAudioElement) => a.currentTime);
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await expect
    .poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime))
    .toBeGreaterThan(before);
  await page.getByLabel("Volumen").fill("0.7");
  const gain = () =>
    page.evaluate(
      () =>
        (window as typeof window & { testGains: GainNode[] }).testGains[0]?.gain
          .value ?? document.querySelector("audio")!.volume,
    );
  await expect.poll(gain).toBeCloseTo(0.7, 2);
  await page.getByRole("button", { name: "Silenciar", exact: true }).click();
  expect(await audio.evaluate((a: HTMLAudioElement) => a.muted)).toBe(true);
  await expect.poll(gain).toBe(0);
  expect(await audio.evaluate((a: HTMLAudioElement) => a.paused)).toBe(false);
  await page
    .getByRole("button", { name: "Activar sonido", exact: true })
    .click();
  expect(await audio.evaluate((a: HTMLAudioElement) => a.muted)).toBe(false);
  await expect.poll(gain).toBeCloseTo(0.7, 2);
  for (let i = 0; i < 2; i++) {
    await audio.evaluate((a: HTMLAudioElement) => {
      (window as typeof window & { testAutomation: { value: number; mediaTime: number }[] }).testAutomation = [];
      // Seek before the fade so codec seek granularity cannot skip its window.
      a.currentTime = 198;
    });
    // Retain the real gain operations so the short end fade cannot fall between
    // two Playwright round trips. Every operation still reaches the native API.
    await expect.poll(() => page.evaluate(() =>
      (window as typeof window & { testAutomation: { value: number; mediaTime: number }[] }).testAutomation.some(step => step.mediaTime >= 199.4 && step.value < 0.65),
    )).toBe(true);
    await expect
      .poll(() => audio.evaluate((a: HTMLAudioElement) => a.currentTime), {
        intervals: [80],
      })
      .toBeLessThan(3);
    await expect.poll(gain).toBeCloseTo(0.7, 2);
    expect(await audio.evaluate((a: HTMLAudioElement) => a.paused)).toBe(false);
  }
  await page
    .getByRole("button", { name: "Repetir la introducción floral" })
    .click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  expect(await audio.evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  const pausedTime = await audio.evaluate(
    (a: HTMLAudioElement) => a.currentTime,
  );
  await page.waitForTimeout(250);
  expect(
    await audio.evaluate((a: HTMLAudioElement) => a.currentTime),
  ).toBeCloseTo(pausedTime, 1);
  expect(await page.locator("audio").count()).toBe(1);
  expect(errors).toEqual([]);
});

test("sin canción configurada no se solicita audio", async ({ page }) => {
  let requests = 0;
  page.on("request", (r) => {
    if (r.url().includes("/audio/")) requests++;
  });
  await page.goto("tests/media-fixture.html?empty=1");
  await page.getByRole("button", { name: "Abrir controles de música" }).click();
  await expect(page.locator(".music-panel")).toContainText(
    "Nuestra canción llegará pronto",
  );
  await expect(page.locator("audio")).toHaveCount(0);
  expect(requests).toBe(0);
});
