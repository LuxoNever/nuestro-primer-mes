import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";

// Independent transcription of the author's attachment, including punctuation.
const text = JSON.parse(readFileSync(new URL("./fixtures/dedicatorias-definitivas.json", import.meta.url), "utf8")) as {
  specialLead: string; specialParagraphs: string[]; specialClosing: string; specialSignature: string;
  letterGreeting: string; letterParagraphs: string[]; letterClosing: string; letterSignature: string;
};

const ranges = [[0, 2], [2, 4], [4, 7], [7, 10], [10, 13]];
async function letterIsComplete(page: Page, chapter = 0) {
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false");
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-hidden", "false");
  await expect(page.locator(".letter-paragraph")).toHaveText(text.letterParagraphs.slice(...ranges[chapter]));
  expect(await page.locator(".letter-chapter-content > *").evaluateAll(nodes => nodes.every(node => {
    const css = getComputedStyle(node);
    return css.opacity === "1" && css.visibility === "visible" && node.getBoundingClientRect().height > 0;
  }))).toBe(true);
}

test("transcripción exacta de ambas dedicatorias, orden, firmas y fecha", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await expect(page.locator(".special-dedication p")).toHaveText([text.specialLead, ...text.specialParagraphs]);
  expect(await page.locator(".special-dedication p").allTextContents()).toEqual([text.specialLead, ...text.specialParagraphs]);
  await expect(page.locator(".special-signature p")).toHaveText(text.specialClosing);
  await expect(page.locator(".special-signature > span")).toHaveText(text.specialSignature);
  await expect(page.locator(".special-frame figcaption")).toHaveText("Tú, haciendo más bonito mi mundo.");
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  await letterIsComplete(page);
  await expect(page.locator(".letter-greeting")).toHaveText(text.letterGreeting);
  await expect(page.locator(".letter-date")).toHaveText("26.10.2026");
  const paragraphs: string[] = [];
  for (let chapter = 0; chapter < 5; chapter++) {
    await letterIsComplete(page, chapter);
    paragraphs.push(...await page.locator(".letter-paragraph").allTextContents());
    await expect(page.locator(".letter-closing")).toHaveCount(chapter === 4 ? 1 : 0);
    if (chapter < 4) await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  }
  expect(paragraphs).toEqual(text.letterParagraphs);
  await expect(page.locator(".letter-closing > em")).toHaveText(text.letterClosing);
  await expect(page.locator(".letter-closing strong")).toHaveText(text.letterSignature);
  await expect(page.locator(".letter-paper")).not.toContainText("Siempre tuyo");
  await expect(page.locator(".letter-paper")).not.toContainText("Hay cosas que no caben en un regalo");
  await expect(page.locator(".special-dedication")).not.toContainText("Hermosa, este pequeño rincón");
});

test("carta larga: apertura, repetición, cierre durante animación y lectura inmediata", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  const open = page.getByRole("button", { name: "Abrir mi carta de amor" });
  await open.click();
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "true");
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "false", { timeout: 6500 });
  await letterIsComplete(page);
  await page.locator(".letter-paragraph").last().scrollIntoViewIfNeeded();
  await expect(page.locator(".letter-paragraph").last()).toBeInViewport();
  await page.getByRole("button", { name: "Volver a leer" }).click();
  await expect(page.locator(".letter-paper")).toHaveAttribute("aria-busy", "true");
  await page.getByRole("button", { name: "Cerrar el sobre" }).click();
  await expect(page.locator(".letter-paper")).toHaveCount(0);
  await expect(open).toBeFocused();
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  await letterIsComplete(page);
  await page.getByRole("button", { name: "Volver a leer" }).click();
  await page.emulateMedia({ reducedMotion: "reduce" });
  await letterIsComplete(page);
  expect(errors).toEqual([]);
});

test("lectura completa 320–1440 px, sin recortes ni superposición y accesible", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await page.getByRole("button", { name: "Saltar introducción" }).click();
  await page.getByRole("button", { name: "Leer sin animación" }).click();
  let chapter = 0;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (let step = 0; step < (width === 320 ? 5 : 1); step++) {
    await letterIsComplete(page, chapter);
    await expect(page.locator(".letter-paper")).toHaveCSS("max-height", "none");
    await expect(page.locator(".letter-paper")).toHaveCSS("overflow-y", "visible");
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await page.locator(".letter-paper").evaluate(paper => {
      const box = paper.getBoundingClientRect();
      return Array.from(paper.querySelectorAll("p")).every(p => {
        const range = document.createRange();
        range.selectNodeContents(p);
        const textBox = range.getBoundingClientRect();
        return textBox.left >= box.left && textBox.right <= box.right && textBox.bottom <= box.bottom;
      });
    })).toBe(true);
    expect(await page.locator(".letter-paper").evaluate(paper => {
      const node = paper.querySelector(".handwritten");
      if (!node) return true;
      const signature = node.getBoundingClientRect();
      const heart = paper.querySelector(".letter-heart")!.getBoundingClientRect();
      const overlapY = Math.min(signature.bottom, heart.bottom) > Math.max(signature.top, heart.top);
      return !overlapY || signature.right < heart.left;
    })).toBe(true);
    await page.locator(".letter-paragraph").last().evaluate(e => e.scrollIntoView({ block: "center", behavior: "instant" }));
    await expect(page.locator(".letter-paragraph").last()).toBeInViewport();
    if (chapter < 4) {
      await page.getByRole("button", { name: "Siguiente", exact: true }).click();
      chapter++;
    }
    }
  }
  await page.locator(".special-signature").scrollIntoViewIfNeeded();
  await expect(page.locator(".special-signature")).toBeInViewport();
  const accessibility = await new AxeBuilder({ page }).include("#carta").include("#mi-flor").withTags(["wcag2a", "wcag2aa", "wcag21aa"]).analyze();
  expect(accessibility.violations).toEqual([]);
});
