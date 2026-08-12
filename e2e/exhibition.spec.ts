import { expect, test } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.route("**/releases/v1/web/**", (route) => route.fulfill({
    status: 200,
    contentType: "image/webp",
    body: Buffer.from("UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v89WAAAAA==", "base64"),
  }));
});

test("desktop preserves two authored rows of seven scenes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/3/");
  await expect(page.locator('[data-row="top"] .scene-card')).toHaveCount(7);
  await expect(page.locator('[data-row="bottom"] .scene-card')).toHaveCount(7);
  await expect(page.locator('[data-row="top"] .scene-card').first()).toHaveAttribute("data-scene-id", "T3-T01");
  await expect(page.locator('[data-row="bottom"] .scene-card').last()).toHaveAttribute("data-scene-id", "T3-B07");
});

test("scene deep links open, navigate, and follow browser history", async ({ page }) => {
  await page.goto("/tapestries/1/?scene=T1-T01");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Seven churches of Asia" })).toBeVisible();
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page).toHaveURL(/scene=T1-T02/);
  await expect(page.getByRole("dialog").getByRole("heading", { name: "Vision of the Seven Candlesticks" })).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/scene=T1-T01/);
  await page.getByRole("button", { name: "Close scene" }).click();
  await expect(page).not.toHaveURL(/scene=/);
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("scene links can be copied and closing returns focus to the opener", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/tapestries/1/");
  const opener = page.locator('[data-scene-id="T1-T01"] button');
  await opener.click();
  await page.getByRole("button", { name: "Copy scene link" }).click();
  await expect(page.getByRole("button", { name: "Link copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain("?scene=T1-T01");
  await page.getByRole("button", { name: "Close scene" }).click();
  await expect(opener).toBeFocused();
});

test("keyboard controls zoom and navigate an open scene", async ({ page }) => {
  await page.goto("/tapestries/2/");
  await page.keyboard.press("+");
  await expect(page.getByRole("button", { name: "detail" })).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-scene-id="T2-T01"] button').click();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/scene=T2-T02/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("normal viewing never requests an archival original", async ({ page }) => {
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.goto("/tapestries/4/?scene=T4-T01");
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(requests.some((url) => url.includes("/originals/"))).toBe(false);
  expect(requests.some((url) => url.includes("/web/1920/"))).toBe(true);
});

test("failed reader and preview images retain a descriptive placeholder", async ({ page }) => {
  await page.route("**/T1-T01.webp", (route) => route.fulfill({ status: 404 }));
  await page.goto("/tapestries/1/?scene=T1-T01");
  const fallback = page.getByRole("dialog").getByRole("img", { name: /Seven churches of Asia/ });
  await expect(fallback).toContainText("Seven churches of Asia");
  await expect(fallback).toContainText("Revelation 1:11; Revelation 2–3");
});

test("reduced motion disables meaningful transition duration", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/tapestries/1/");
  const duration = await page.locator(".scene-card").first().evaluate((element) => getComputedStyle(element).transitionDuration);
  expect(duration).toBe("1e-05s");
});

test("embed route omits global chrome", async ({ page }) => {
  await page.goto("/embed/tapestries/5/");
  await expect(page.locator(".viewer-embedded")).toBeVisible();
  await expect(page.locator(".site-header")).toBeHidden();
  await expect(page.locator(".site-footer")).toBeHidden();
});

test("chapter verses link back to matching scenes", async ({ page }) => {
  await page.goto("/revelation/6/#verse-1");
  const verse = page.locator("#verse-1");
  await expect(verse).toContainText("T1-B01");
  await expect(verse.getByRole("link", { name: /First Horseman/ })).toHaveAttribute("href", "/tapestries/1/?scene=T1-B01");
});

test("mobile presents top scenes before bottom scenes in one column", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/tapestries/6/");
  const boxes = await page.locator(".tapestry-stage .scene-card").evaluateAll((cards) => cards.map((card) => ({ id: card.getAttribute("data-scene-id"), x: card.getBoundingClientRect().x, y: card.getBoundingClientRect().y })));
  expect(boxes).toHaveLength(14);
  expect(boxes[0].id).toBe("T6-T01");
  expect(boxes[7].id).toBe("T6-B01");
  expect(new Set(boxes.map(({ x }) => Math.round(x))).size).toBe(1);
  expect(boxes.every((box, index) => index === 0 || box.y > boxes[index - 1].y)).toBe(true);
});
