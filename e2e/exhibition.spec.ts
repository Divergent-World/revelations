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
  const near = page.getByRole("button", { name: "Near" });
  await expect(near).toHaveText("Near");
  await expect(near).toHaveAttribute("aria-pressed", "true");
  const overflow = await page.locator(".tapestry-stage").evaluate(
    (node) => node.scrollWidth - node.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.locator('[data-row="top"] .scene-card')).toHaveCount(7);
  await expect(page.locator('[data-row="bottom"] .scene-card')).toHaveCount(7);
  await expect(page.locator('[data-row="top"] .scene-card').first()).toHaveAttribute("data-scene-id", "T3-T01");
  await expect(page.locator('[data-row="bottom"] .scene-card').last()).toHaveAttribute("data-scene-id", "T3-B07");
});

test("tablet reader uses one column before seven-card labels become unreadable", async ({ page }) => {
  await page.setViewportSize({ width: 761, height: 900 });
  await page.goto("/tapestries/3/");
  const layout = await page.locator('[data-row="top"]').evaluate((row) => ({
    display: getComputedStyle(row).display,
    cards: [...row.querySelectorAll<HTMLElement>(".scene-card")].map((card) => {
      const { x, y } = card.getBoundingClientRect();
      return { x, y };
    }),
  }));
  expect(layout.display).toBe("block");
  expect(new Set(layout.cards.map(({ x }) => Math.round(x))).size).toBe(1);
  expect(layout.cards.every((card, index) => index === 0 || card.y > layout.cards[index - 1].y)).toBe(true);
});

test("preview frames preserve artwork without elongation or cropping", async ({ page }) => {
  await page.goto("/tapestries/1/");
  const geometry = await page.locator('[data-scene-id="T1-T01"]').evaluate((card) => {
    const button = card.querySelector("button")!;
    const image = card.querySelector("img")!;
    const buttonBox = button.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    return {
      buttonRatio: buttonBox.width / buttonBox.height,
      imageRatio: imageBox.width / imageBox.height,
      objectFit: getComputedStyle(image).objectFit,
    };
  });
  expect(geometry.buttonRatio).toBeCloseTo(16 / 9, 1);
  expect(geometry.imageRatio).toBeCloseTo(16 / 9, 1);
  expect(geometry.objectFit).toBe("contain");
});

test("reader artwork panel scrolls independently when artwork exceeds its viewport", async ({ page }, testInfo) => {
  await page.goto("/tapestries/1/?scene=T1-00");
  const geometry = await page.locator(".dialog-art").evaluate((panel) => {
    const image = panel.querySelector("img")!;
    return {
      overflowY: getComputedStyle(panel).overflowY,
      scrollHeight: panel.scrollHeight,
      clientHeight: panel.clientHeight,
      imageObjectFit: getComputedStyle(image).objectFit,
    };
  });
  expect(geometry.overflowY).toBe("auto");
  if (testInfo.project.name !== "mobile") expect(geometry.scrollHeight).toBeGreaterThan(geometry.clientHeight);
  expect(geometry.imageObjectFit).toBe("contain");
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
  await expect(page.getByRole("button", { name: "Room" })).toHaveAttribute("aria-pressed", "true");
  await page.locator('[data-scene-id="T2-T01"] button').click();
  await page.keyboard.press("ArrowRight");
  await expect(page).toHaveURL(/scene=T2-T02/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

test("tapestry movements present the full narrative beside the reader", async ({ page }) => {
  await page.goto("/tapestries/2/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("The Trumpets Sound");
  const movements = page.locator(".movement-list li");
  await expect(movements).toHaveCount(4);
  await expect(movements.first()).toContainText("God marks out His people");
  await expect(movements.first()).toContainText("144,000 sealed");
  await expect(movements.last()).toContainText("Judgment becomes demonic and militarized");
  await expect(movements.last()).toContainText("riders on fire-breathing horses");
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

test("words of Jesus are highlighted in scene and chapter passages", async ({ page }) => {
  await page.goto("/tapestries/1/?scene=T1-00");
  const verse = page.getByRole("dialog").locator(".passage p").filter({ hasText: "I am the Alpha and the Omega" });
  const wordsOfJesus = verse.locator(".words-of-jesus");
  await expect(wordsOfJesus).toHaveText(["“I am the Alpha and the Omega,", "”", "“who is and who was and who is to come, the Almighty.”"]);
  await expect(verse).toContainText("says the Lord God");
  await expect(verse).toHaveCSS("color", "rgb(213, 210, 203)");
  await expect(wordsOfJesus.first()).toHaveCSS("color", "rgb(214, 187, 120)");

  await page.goto("/revelation/1/");
  const chapterVerse = page.locator("#verse-8");
  const chapterWordsOfJesus = chapterVerse.locator(".words-of-jesus");
  await expect(chapterWordsOfJesus).toHaveText(["“I am the Alpha and the Omega,", "”", "“who is and who was and who is to come, the Almighty.”"]);
  await expect(chapterVerse).toContainText("says the Lord God");
  await expect(chapterVerse.locator("p")).toHaveCSS("color", "rgb(212, 209, 203)");
  await expect(chapterWordsOfJesus.first()).toHaveCSS("color", "rgb(214, 187, 120)");
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
