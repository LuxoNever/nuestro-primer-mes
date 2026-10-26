import { test, expect, type Page } from "@playwright/test";

type GainRamp = { value: number; duration: number; mediaTime: number };
type GainWrite = { value: number; mediaTime: number };

async function observe(page: Page, native = false) {
  await page.addInitScript((nativeOnly) => {
    const state = window as typeof window & { gains: GainNode[]; playGestures: boolean[]; gainRamps: GainRamp[]; gainWrites: GainWrite[] };
    state.gains = [];
    state.playGestures = [];
    state.gainRamps = [];
    state.gainWrites = [];
    const volume = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "volume")!;
    Object.defineProperty(HTMLMediaElement.prototype, "volume", {
      ...volume,
      set(value: number) {
        state.gainWrites.push({ value, mediaTime: this.currentTime });
        volume.set!.call(this, value);
      },
    });
    if (nativeOnly) Object.defineProperty(window, "AudioContext", { value: undefined });
    if (typeof AudioContext === "function") {
      const create = AudioContext.prototype.createGain;
      AudioContext.prototype.createGain = function () {
        const gain = create.call(this);
        state.gains.push(gain);
        // Observe the real automation without replacing or simulating the audio.
        // A short cross-process poll can miss the ramp on a Linux CI audio clock.
        const ramp = gain.gain.linearRampToValueAtTime;
        const set = gain.gain.setValueAtTime;
        const contextTime = () => this.currentTime;
        gain.gain.setValueAtTime = function (value, time) {
          state.gainWrites.push({ value, mediaTime: document.querySelector("audio")?.currentTime ?? 0 });
          return set.call(this, value, time);
        };
        gain.gain.linearRampToValueAtTime = function (value, end) {
          state.gainRamps.push({ value, duration: end - contextTime(), mediaTime: document.querySelector("audio")?.currentTime ?? 0 });
          return ramp.call(this, value, end);
        };
        return gain;
      };
    }
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function () {
      state.playGestures.push(navigator.userActivation.isActive);
      return play.call(this);
    };
  }, native);
}

function level(page: Page) {
  return page.evaluate(() => {
    const a = document.querySelector("audio")!;
    const gain = (window as typeof window & { gains: GainNode[] }).gains[0];
    return a.muted || a.paused ? 0 : gain?.gain.value ?? a.volume;
  });
}
const open = (page: Page) => page.getByRole("button", { name: "Abrir sobre de la introducción" }).click();
const skip = (page: Page) => page.getByRole("button", { name: "Saltar introducción" }).click();
const panel = (page: Page) => page.getByRole("button", { name: "Abrir controles de música" }).click();

test("sobre real: silencio en floración, reinicio y fundido en onReveal sin otro toque", async ({ page, browserName }) => {
  await observe(page);
  let requests = 0;
  const errors: string[] = [];
  page.on("request", r => { if (r.url().includes("cancion-aniversario.mp4")) requests++; });
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("./");
  expect(requests).toBe(0);
  await expect(page.locator("audio")).not.toHaveAttribute("src");
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentSrc)).toBe("");
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.readyState)).toBe(0);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.buffered.length)).toBe(0);
  // Sample output during actual GSAP phases, not a parallel 7450 ms timer.
  await page.evaluate(() => {
    const state = window as typeof window & {
      gains: GainNode[];
      samples: { phase: string; level: number; time: number; rewound: boolean }[];
    };
    state.samples = [];
    const a = document.querySelector("audio")!;
    // React may commit data-phase one frame after onReveal. Observe the actual
    // rewind as well, so that frame is not mistaken for pre-reveal sound.
    let rewound = false;
    const time = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "currentTime")!;
    Object.defineProperty(a, "currentTime", {
      get() { return time.get!.call(a); },
      set(value: number) {
        if (time.get!.call(a) > 2 && value < 1) rewound = true;
        time.set!.call(a, value);
      },
    });
    const sample = () => {
      const phase = document.querySelector<HTMLElement>(".intro-experience")?.dataset.phase ?? "page";
      state.samples.push({ phase, level: a.muted || a.paused ? 0 : state.gains[0]?.gain.value ?? a.volume, time: a.currentTime, rewound });
      if (phase !== "page" || a.currentTime < 2.3) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  expect(await level(page)).toBe(0);
  await expect(page.locator(".intro-experience")).toHaveCount(0, { timeout: 12000 });
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
  const samples = await page.evaluate(() => (window as typeof window & {
    samples: { phase: string; level: number; time: number; rewound: boolean }[];
  }).samples);
  for (const phase of ["expanding", "immersed", "message"]) {
    const frames = samples.filter(s => s.phase === phase);
    expect(frames.length).toBeGreaterThan(0);
    expect(frames.filter(s => !s.rewound).every(s => s.level === 0)).toBe(true);
  }
  expect(samples.filter(s => !s.rewound).every(s => s.level === 0)).toBe(true);
  const reveal = samples.filter(s => s.phase === "leaving");
  expect(reveal.length).toBeGreaterThan(0);
  expect(reveal[0].time).toBeGreaterThanOrEqual(0.85);
  expect(reveal[0].time).toBeLessThan(1.3);
  const ramps = await page.evaluate(() => (window as typeof window & { gainRamps: GainRamp[] }).gainRamps);
  const writes = await page.evaluate(() => (window as typeof window & { gainWrites: GainWrite[] }).gainWrites);
  // Require an actual scheduled ramp substantially longer than the 0.35 s loop
  // fade. Combined with silence before rewind and final gain, this validates the
  // 1.2 s reveal fade without depending on sampling one particular render frame.
  if (await page.evaluate(() => (window as typeof window & { gains: GainNode[] }).gains.length))
    expect(ramps.some(ramp => Math.abs(ramp.value - 0.35) < 0.001 && ramp.mediaTime >= 0.85 && ramp.mediaTime < 1.4 && ramp.duration > 0.6 && ramp.duration <= 1.21), JSON.stringify(ramps)).toBe(true);
  // WebKit builds without Web Audio use the native volume path instead. In both
  // paths require a real intermediate write consistent with the 1.2 s envelope.
  expect(writes.some(write => write.mediaTime >= 1.15 && write.mediaTime < 1.8 && Math.abs(write.value - 0.35 * (write.mediaTime - 0.85) / 1.2) < 0.025), JSON.stringify(writes)).toBe(true);
  expect(await page.evaluate(() => (window as typeof window & { playGestures: boolean[] }).playGestures)).toEqual([true]);
  expect(await page.evaluate(() => (window as typeof window & { gains: GainNode[] }).gains.length)).toBeLessThanOrEqual(1);
  await expect(page.locator("audio")).toHaveCount(1);
  // Windows WebKit's native media loader does not expose MP4 requests to routing.
  if (browserName !== "webkit") expect(requests).toBeGreaterThan(0);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.readyState)).toBeGreaterThanOrEqual(2);
  expect(errors).toEqual([]);
});

test("salto sin abrir no inicia audio; movimiento reducido lo revela al entrar", async ({ page }) => {
  await observe(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  let requests = 0;
  page.on("request", r => { if (r.url().includes("cancion-aniversario.mp4")) requests++; });
  await page.goto("./");
  await skip(page);
  expect(requests).toBe(0);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Repetir la introducción floral" }).click();
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  expect(await level(page)).toBe(0);
  await page.getByRole("button", { name: "Entrar a nuestra historia" }).click();
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
});

test("pausa durante preparación y repetición conservan la decisión manual", async ({ page }) => {
  await observe(page);
  await page.goto("./");
  await open(page);
  await panel(page);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await skip(page);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  await page.getByRole("button", { name: "Repetir la introducción floral" }).click();
  await open(page);
  await skip(page);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.paused)).toBe(true);
  expect(await level(page)).toBe(0);
});

test("mute previo, volumen, salto tras abrir y repetición sin reiniciar canción", async ({ page }) => {
  await observe(page);
  await page.goto("./");
  await panel(page);
  await page.getByRole("button", { name: "Silenciar", exact: true }).click();
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  await skip(page);
  await page.getByLabel("Volumen").fill("0.65");
  expect(await level(page)).toBe(0);
  await expect(page.getByRole("button", { name: "Activar sonido", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Activar sonido", exact: true }).click();
  await expect.poll(() => level(page)).toBeCloseTo(0.65, 2);
  await page.locator("audio").evaluate((a: HTMLAudioElement) => { a.currentTime = 40; });
  await page.getByRole("button", { name: "Repetir la introducción floral" }).click();
  await open(page);
  await skip(page);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThanOrEqual(40);
  await expect(page.locator("audio")).toHaveCount(1);
  expect(await page.evaluate(() => (window as typeof window & { playGestures: boolean[] }).playGestures.length)).toBe(1);
});

test("fallback sin Web Audio: silencio seguro y fundido nativo al saltar", async ({ page }) => {
  await observe(page, true);
  await page.goto("./");
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.muted)).toBe(true);
  expect(await level(page)).toBe(0);
  await skip(page);
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
  expect(await page.locator("audio").evaluate((a: HTMLAudioElement) => a.muted)).toBe(false);
});

test("rechazo de política ofrece Reproducir y recupera con un toque real", async ({ page }) => {
  await observe(page);
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let first = true;
    HTMLMediaElement.prototype.play = function () {
      if (first) { first = false; return Promise.reject(new DOMException("Gesture required", "NotAllowedError")); }
      return play.call(this);
    };
  });
  await page.goto("./");
  await open(page);
  await expect(page.getByRole("status")).toContainText("Tu navegador necesita otro toque");
  await skip(page);
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
  expect(await page.evaluate(() => (window as typeof window & { gains: GainNode[] }).gains.length)).toBeLessThanOrEqual(1);
});

test("fallback nativo: una pausa al quitar mute ofrece recuperación manual", async ({ page }) => {
  await observe(page, true);
  await page.addInitScript(() => {
    const muted = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "muted")!;
    let rejectUnmute = true;
    Object.defineProperty(HTMLMediaElement.prototype, "muted", {
      get() { return muted.get!.call(this); },
      set(value: boolean) {
        const wasMuted = muted.get!.call(this);
        muted.set!.call(this, value);
        if (wasMuted && !value && rejectUnmute) {
          rejectUnmute = false;
          queueMicrotask(() => this.pause());
        }
      },
    });
  });
  await page.goto("./");
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  await skip(page);
  await expect(page.getByRole("status")).toContainText("Tu navegador necesita otro toque");
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
});

test("metadatos tardíos tras saltar conservan inicio y liberan silencio al cargar", async ({ page }) => {
  await observe(page);
  // Inject delayed metadata availability at the media API boundary, including
  // WebKit Windows where native MP4 requests bypass Playwright routing.
  await page.addInitScript(() => {
    const state = window as typeof window & { holdMetadata: boolean };
    state.holdMetadata = true;
    const ready = Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, "readyState")!;
    Object.defineProperty(HTMLMediaElement.prototype, "readyState", {
      get() { return state.holdMetadata ? 0 : ready.get!.call(this); },
    });
  });
  await page.goto("./");
  await open(page);
  await expect.poll(() => page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime)).toBeGreaterThan(1.3);
  await skip(page);
  expect(await level(page)).toBe(0);
  await page.evaluate(() => {
    (window as typeof window & { holdMetadata: boolean }).holdMetadata = false;
    document.querySelector("audio")!.dispatchEvent(new Event("loadedmetadata"));
  });
  await expect.poll(() => level(page)).toBeCloseTo(0.35, 2);
  const time = await page.locator("audio").evaluate((a: HTMLAudioElement) => a.currentTime);
  expect(time).toBeGreaterThan(2);
  expect(time).toBeLessThan(4);
});

test("archivo fallido no bloquea introducción ni página", async ({ page }) => {
  await page.addInitScript(() => {
    HTMLMediaElement.prototype.play = function () {
      return Promise.reject(new DOMException("Unsupported resource", "NotSupportedError"));
    };
  });
  await page.goto("./");
  await open(page);
  await expect(page.getByRole("status")).toContainText("La canción no está disponible");
  await skip(page);
  await expect(page.locator("#contenido")).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(1);
});
