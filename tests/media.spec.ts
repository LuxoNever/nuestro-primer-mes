import { test, expect } from "@playwright/test";

function silentWav() {
  // This test checks controls, not short-file looping. Leave enough playback
  // time for WebKit/GStreamer and a loaded CI runner to operate the slider.
  const dataBytes = 16000 * 30;
  const buffer = Buffer.alloc(44 + dataBytes);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(8000, 24);
  buffer.writeUInt32LE(16000, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataBytes, 40);
  return buffer;
}

test("foto real local y audio voluntario, volumen y pausa", async ({
  page,
  browserName,
}) => {
  test.skip(
    browserName === "webkit" && process.platform === "win32",
    "WebKit Windows rechaza el WAV PCM válido con MEDIA_ERR_SRC_NOT_SUPPORTED; comprobar audio real en Safari/macOS. El resto de WebKit se ejecuta.",
  );
  let audioRequests = 0;
  await page.route("**/audio/test.wav", (route) => {
    audioRequests++;
    return route.fulfill({ contentType: "audio/wav", body: silentWav() });
  });
  await page.route("**/photos/test.svg", (route) =>
    route.fulfill({
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500"><rect width="500" height="500" fill="#C8A2C8"/></svg>',
    }),
  );
  await page.goto("tests/media-fixture.html");
  await expect(page.locator(".featured img")).toBeVisible();
  await expect
    .poll(() =>
      page
        .locator(".featured img")
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  expect(audioRequests).toBe(0);
  await page.getByRole("button", { name: "Abrir controles de música" }).click();
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Pausar", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Volumen").fill("0.7");
  await expect(page.getByLabel("Volumen")).toHaveValue("0.7");
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  expect(
    await page.locator("audio").evaluate((el: HTMLAudioElement) => el.paused),
  ).toBe(true);
});

test("recursos rotos conservan placeholders y muestran error recuperable", async ({
  page,
}) => {
  await page.route("**/audio/test.wav", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.route("**/photos/test.svg", (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.goto("tests/media-fixture.html");
  await expect(page.locator(".featured")).toContainText(
    "Este recuerdo volverá pronto",
  );
  await expect(page.locator(".featured img")).toHaveCount(0);
  await page.getByRole("button", { name: "Abrir controles de música" }).click();
  await page.getByRole("button", { name: "Reproducir", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(
    "La canción no está disponible",
  );
});
