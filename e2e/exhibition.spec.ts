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

test("reader artwork stays contained by its zoom viewport", async ({ page }) => {
  await page.goto("/tapestries/1/?scene=T1-00");
  const geometry = await page.locator(".dialog-art").evaluate((panel) => {
    const image = panel.querySelector("img")!;
    const viewport = panel.querySelector<HTMLElement>(".zoom-artwork__viewport")!;
    return {
      overflowY: getComputedStyle(panel).overflowY,
      scrollHeight: panel.scrollHeight,
      clientHeight: panel.clientHeight,
      imageObjectFit: getComputedStyle(image).objectFit,
      viewportTouchAction: getComputedStyle(viewport).touchAction,
    };
  });
  expect(geometry.overflowY).toBe("hidden");
  expect(geometry.scrollHeight - geometry.clientHeight).toBeLessThanOrEqual(1);
  expect(geometry.imageObjectFit).toBe("contain");
  expect(geometry.viewportTouchAction).toBe("none");
});

test("artwork zoom controls step between their bounds and reset pan", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/1/?scene=T1-T01");

  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const zoomOut = page.getByRole("button", { name: "Zoom out" });
  const zoomIn = page.getByRole("button", { name: "Zoom in" });
  const reset = page.getByRole("button", { name: "Reset artwork zoom" });
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await expect(zoomOut).toBeDisabled();
  await expect(reset).toBeDisabled();

  await zoomIn.click();
  await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
  for (let step = 0; step < 5; step += 1) await zoomIn.click();
  await expect(page.getByText("4×", { exact: true })).toBeVisible();
  await expect(zoomIn).toBeDisabled();
  for (let step = 0; step < 6; step += 1) await zoomOut.click();
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await expect(zoomOut).toBeDisabled();

  await viewport.click({ position: { x: 80, y: 80 } });
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const anchored = await viewport.locator("img").evaluate((image) => {
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    const bounds = image.parentElement!.getBoundingClientRect();
    const intrinsicRatio = Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
    const viewportRatio = bounds.width / bounds.height;
    const fittedWidth = intrinsicRatio > viewportRatio ? bounds.width : bounds.height * intrinsicRatio;
    const fittedHeight = intrinsicRatio > viewportRatio ? bounds.width / intrinsicRatio : bounds.height;
    return {
      x: matrix.e,
      y: matrix.f,
      maxX: Math.max(0, (fittedWidth * 2 - bounds.width) / 2),
      maxY: Math.max(0, (fittedHeight * 2 - bounds.height) / 2),
    };
  });
  expect(anchored.x).toBeGreaterThan(1);
  expect(anchored.y).toBeGreaterThan(1);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await page.mouse.move(box!.x + box!.width / 2 + 500, box!.y + box!.height / 2 + 500);
  await page.mouse.up();
  const panned = await viewport.locator("img").evaluate((image) => {
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    return { x: matrix.e, y: matrix.f };
  });
  expect(panned.x).toBeCloseTo(anchored.maxX, 0);
  expect(panned.y).toBeCloseTo(anchored.maxY, 0);
  await reset.click();
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await expect(viewport.locator("img")).toHaveCSS("transform", "matrix(1, 0, 0, 1, 0, 0)");
});

test("artwork zoom click toggle and hover lens follow pointer mode", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/1/?scene=T1-T01");

  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  await viewport.hover({ position: { x: 100, y: 200 } });
  await expect(page.locator(".art-lens")).toBeVisible();
  await viewport.click({ position: { x: 100, y: 200 } });
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  await expect(page.locator(".art-lens")).toBeHidden();
  await viewport.click({ position: { x: 100, y: 200 } });
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await expect(page.locator(".art-lens")).toBeVisible();
});

test("artwork zoom ignores non-primary mouse buttons", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/1/?scene=T1-T01");
  const viewport = page.getByRole("button", { name: "Zoom artwork" });

  await viewport.click({ button: "right", position: { x: 100, y: 100 } });
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await viewport.click({ button: "middle", position: { x: 100, y: 100 } });
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
});

test("artwork zoom treats lost pointer capture as cancellation", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/1/?scene=T1-T01");
  await page.getByRole("button", { name: "Zoom in" }).click();
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  await viewport.evaluate((element) => {
    element.addEventListener("pointerdown", (event) => { element.setAttribute("data-test-pointer", String((event as PointerEvent).pointerId)); }, { once: true });
  });
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down();
  await expect(viewport).toHaveAttribute("data-dragging", "true");
  await viewport.dispatchEvent("lostpointercapture", {
    pointerId: Number(await viewport.getAttribute("data-test-pointer")),
    pointerType: "mouse",
    button: 0,
    isPrimary: true,
  });
  await expect(viewport).toHaveAttribute("data-dragging", "false");
  await page.mouse.up();
  await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
});

test("artwork zoom lens preserves the fitted region beneath the pointer", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  const artwork = '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="200"><path fill="#369" d="M0 0h300v200H0z"/></svg>';
  await page.route("**/T1-T01.webp", (route) => route.fulfill({ status: 200, contentType: "image/svg+xml", body: artwork }));
  await page.goto("/tapestries/1/?scene=T1-T01");

  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const pointer = { x: box!.width * .3, y: box!.height * .45 };
  await viewport.hover({ position: pointer });

  const geometry = await page.locator(".art-lens").evaluate((lens) => {
    const viewport = lens.parentElement!;
    const image = lens.querySelector("img")!;
    const viewportBox = viewport.getBoundingClientRect();
    const lensBox = lens.getBoundingClientRect();
    const imageBox = image.getBoundingClientRect();
    const ratio = Number(image.getAttribute("width")) / Number(image.getAttribute("height"));
    const fittedWidth = Math.min(viewportBox.width, viewportBox.height * ratio);
    const fittedHeight = fittedWidth / ratio;
    const pointerX = lensBox.x + lensBox.width / 2;
    const pointerY = lensBox.y + lensBox.height / 2;
    return {
      imageRatio: imageBox.width / imageBox.height,
      objectFit: getComputedStyle(image).objectFit,
      sourceX: (pointerX - viewportBox.x - (viewportBox.width - fittedWidth) / 2) / fittedWidth,
      sourceY: (pointerY - viewportBox.y - (viewportBox.height - fittedHeight) / 2) / fittedHeight,
      lensX: (pointerX - imageBox.x) / imageBox.width,
      lensY: (pointerY - imageBox.y) / imageBox.height,
    };
  });
  expect(geometry.imageRatio).toBeCloseTo(1.5, 4);
  expect(geometry.objectFit).toBe("contain");
  expect(geometry.lensX).toBeCloseTo(geometry.sourceX, 3);
  expect(geometry.lensY).toBeCloseTo(geometry.sourceY, 3);
});

test("artwork zoom keyboard shortcuts adjust and Escape closes the focused dialog", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/tapestries/1/");

  const opener = page.getByRole("button", { name: "Open Seven churches of Asia" });
  await opener.click();
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  await viewport.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  await page.keyboard.press("-");
  await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
  await page.keyboard.press("+");
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).not.toHaveURL(/scene=/);
  await expect(opener).toBeFocused();

  await opener.click();
  await page.getByRole("button", { name: "Zoom artwork" }).focus();
  await page.keyboard.press("Space");
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  await page.keyboard.press("0");
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  await expect(page.getByRole("dialog")).toBeVisible();
});

test("artwork zoom resets between scenes and disables only after both images fail", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.route("**/T1-T03.webp", (route) => route.fulfill({ status: 404 }));
  await page.goto("/tapestries/1/?scene=T1-T01");
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
  await page.route("**/web/1920/T1-T02.webp", (route) => route.fulfill({ status: 404 }));
  await page.getByRole("button", { name: "Next →" }).click();
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  const preview = page.locator(".zoom-artwork__viewport > .zoom-artwork__image");
  await expect(preview).toHaveAttribute("src", /\/web\/640\/T1-T02\.webp$/);
  await expect.poll(() => preview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  await viewport.hover({ position: { x: 100, y: 200 } });
  const lensPreview = page.locator(".art-lens img");
  await expect(lensPreview).toHaveAttribute("src", /\/web\/640\/T1-T02\.webp$/);
  await expect.poll(() => lensPreview.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect(page.getByText("1.5×", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "Next →" }).click();
  const unavailable = page.getByRole("dialog").locator(".image-fallback");
  await expect(unavailable).toHaveAccessibleName(/Vision of Christ in Majesty/);
  await expect(page.getByRole("button", { name: "Zoom in" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Zoom out" })).toBeDisabled();
  await expect(page.getByRole("button", { name: "Reset artwork zoom" })).toBeDisabled();
});

test("artwork zoom keeps the reader split at iPad width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/tapestries/1/?scene=T1-T01");
  const layout = await page.getByRole("dialog").evaluate((dialog) => {
    const art = dialog.querySelector<HTMLElement>(".dialog-art")!.getBoundingClientRect();
    const reading = dialog.querySelector<HTMLElement>(".dialog-reading")!.getBoundingClientRect();
    return {
      sideBySide: Math.abs(art.y - reading.y) < 2 && reading.x > art.x,
      artworkTouchAction: getComputedStyle(dialog.querySelector<HTMLElement>(".zoom-artwork__viewport")!).touchAction,
      readingTouchAction: getComputedStyle(dialog.querySelector<HTMLElement>(".dialog-reading")!).touchAction,
    };
  });
  expect(layout.sideBySide).toBe(true);
  expect(layout.artworkTouchAction).toBe("none");
  expect(layout.readingTouchAction).not.toBe("none");

  const reading = page.locator(".dialog-reading");
  await reading.hover();
  await page.mouse.wheel(0, 500);
  await expect.poll(() => reading.evaluate((node) => node.scrollTop)).toBeGreaterThan(0);
  await page.getByRole("button", { name: "Close scene" }).click();
  await page.mouse.move(400, 500);
  await page.mouse.wheel(0, 500);
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0);
});

test("artwork zoom stacks artwork and text at 740px phone width", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.setViewportSize({ width: 740, height: 900 });
  await page.goto("/tapestries/1/?scene=T1-T01");
  const layout = await page.getByRole("dialog").evaluate((dialog) => {
    const artwork = dialog.querySelector<HTMLElement>(".dialog-art")!.getBoundingClientRect();
    const reading = dialog.querySelector<HTMLElement>(".dialog-reading")!.getBoundingClientRect();
    return { display: getComputedStyle(dialog).display, artworkBottom: artwork.bottom, readingTop: reading.top };
  });
  expect(layout.display).toBe("block");
  expect(layout.readingTop).toBeGreaterThanOrEqual(layout.artworkBottom - 1);
});

test("artwork zoom stacks artwork and text on a short coarse-pointer landscape phone", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto("/tapestries/1/?scene=T1-T01");
  const layout = await page.getByRole("dialog").evaluate((dialog) => {
    const artwork = dialog.querySelector<HTMLElement>(".dialog-art")!.getBoundingClientRect();
    const reading = dialog.querySelector<HTMLElement>(".dialog-reading")!.getBoundingClientRect();
    return {
      coarsePointer: matchMedia("(pointer: coarse)").matches,
      display: getComputedStyle(dialog).display,
      artworkBottom: artwork.bottom,
      readingTop: reading.top,
    };
  });
  expect(layout.coarsePointer).toBe(true);
  expect(layout.display).toBe("block");
  expect(layout.readingTop).toBeGreaterThanOrEqual(layout.artworkBottom - 1);
});

test("artwork zoom handles native touch pinch and pan without click toggle", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/tapestries/1/?scene=T1-00");
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const center = { x: box!.x + box!.width * .35, y: box!.y + box!.height * .4 };
  const client = await context.newCDPSession(page);
  const pageScroll = await page.evaluate(() => window.scrollY);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 50, y: center.y, id: 0 },
      { x: center.x + 50, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 70, y: center.y + 20, id: 0 },
      { x: center.x + 130, y: center.y + 20, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("2×", { exact: true })).toBeVisible();

  const beforePan = await viewport.locator("img").evaluate((image) => {
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    return { scale: matrix.a, x: matrix.e, y: matrix.f };
  });
  const initialRelative = { x: center.x - box!.x - box!.width / 2, y: center.y - box!.y - box!.height / 2 };
  const movedRelative = { x: initialRelative.x + 30, y: initialRelative.y + 20 };
  const fittedWidth = Math.min(box!.width, box!.height * 2 / 3);
  const fittedHeight = fittedWidth * 3 / 2;
  const maxX = Math.max(0, (fittedWidth * 2 - box!.width) / 2);
  const maxY = Math.max(0, (fittedHeight * 2 - box!.height) / 2);
  const expectedX = Math.min(maxX, Math.max(-maxX, movedRelative.x - initialRelative.x * 2));
  const expectedY = Math.min(maxY, Math.max(-maxY, movedRelative.y - initialRelative.y * 2));
  expect(beforePan.scale).toBeCloseTo(2, 4);
  expect(beforePan.x).toBeCloseTo(expectedX, 1);
  expect(beforePan.y).toBeCloseTo(expectedY, 1);
  expect((movedRelative.x - beforePan.x) / beforePan.scale).toBeCloseTo(initialRelative.x, 1);
  expect((movedRelative.y - beforePan.y) / beforePan.scale).toBeCloseTo(initialRelative.y, 1);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: center.x, y: center.y, id: 0 }],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: center.x + 25, y: center.y + 10, id: 0 }],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const afterPan = await viewport.locator("img").evaluate((image) => {
    const matrix = new DOMMatrix(getComputedStyle(image).transform);
    return { x: matrix.e, y: matrix.f };
  });
  expect(afterPan.x).toBeCloseTo(Math.min(maxX, beforePan.x + 25), 1);
  expect(afterPan.y).toBeCloseTo(Math.min(maxY, beforePan.y + 10), 1);
  expect(afterPan.x).toBeGreaterThan(beforePan.x);
  expect(afterPan.y).toBeGreaterThan(beforePan.y);
  await expect(page.getByText("2×", { exact: true })).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(pageScroll);
});

test("artwork zoom keeps continuous pinch updates out of live regions", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/tapestries/1/?scene=T1-00");
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const output = page.locator('[aria-label="Artwork zoom level"]');
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const client = await context.newCDPSession(page);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 50, y: center.y, id: 0 },
      { x: center.x + 50, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 100, y: center.y, id: 0 },
      { x: center.x + 100, y: center.y, id: 1 },
    ],
  });
  await expect(output).toHaveText("2×");
  await expect(page.locator(".zoom-toolbar [aria-live]")).toHaveCount(0);
  await expect(page.getByRole("status")).toHaveCount(0);
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
});

test("artwork zoom clamps native touch pinch at exactly 1× and 4×", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/tapestries/1/?scene=T1-00");
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const client = await context.newCDPSession(page);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 100, y: center.y, id: 0 },
      { x: center.x + 100, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 2, y: center.y, id: 0 },
      { x: center.x + 2, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("1×", { exact: true })).toBeVisible();
  expect(await viewport.locator("> .zoom-artwork__image").evaluate((image) => new DOMMatrix(getComputedStyle(image).transform).a)).toBe(1);

  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 20, y: center.y, id: 0 },
      { x: center.x + 20, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 100, y: center.y, id: 0 },
      { x: center.x + 100, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("4×", { exact: true })).toBeVisible();
  expect(await viewport.locator("> .zoom-artwork__image").evaluate((image) => new DOMMatrix(getComputedStyle(image).transform).a)).toBe(4);
});

test("artwork zoom clamps native one-finger pan at every fitted edge", async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.setViewportSize({ width: 820, height: 1000 });
  await page.goto("/tapestries/1/?scene=T1-00");
  const viewport = page.getByRole("button", { name: "Zoom artwork" });
  const image = viewport.locator("> .zoom-artwork__image");
  const box = await viewport.boundingBox();
  expect(box).not.toBeNull();
  const size = await viewport.evaluate((element) => ({ width: element.clientWidth, height: element.clientHeight }));
  const center = { x: box!.x + box!.width / 2, y: box!.y + box!.height / 2 };
  const client = await context.newCDPSession(page);
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: center.x - 50, y: center.y, id: 0 },
      { x: center.x + 50, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [
      { x: center.x - 100, y: center.y, id: 0 },
      { x: center.x + 100, y: center.y, id: 1 },
    ],
  });
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await expect(page.getByText("2×", { exact: true })).toBeVisible();

  const fittedWidth = Math.min(size.width, size.height * 2 / 3);
  const fittedHeight = fittedWidth * 3 / 2;
  const maxX = (fittedWidth * 2 - size.width) / 2;
  const maxY = (fittedHeight * 2 - size.height) / 2;
  async function drag(start: { x: number; y: number }, end: { x: number; y: number }) {
    await client.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ ...start, id: 0 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ ...end, id: 0 }] });
    await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    return image.evaluate((element) => {
      const matrix = new DOMMatrix(getComputedStyle(element).transform);
      return { x: matrix.e, y: matrix.f };
    });
  }

  expect((await drag(center, { x: 819, y: center.y })).x).toBe(maxX);
  expect((await drag({ x: box!.x + box!.width - 1, y: center.y }, { x: 1, y: center.y })).x).toBe(-maxX);
  expect((await drag(center, { x: center.x, y: 999 })).y).toBe(maxY);
  expect((await drag({ x: center.x, y: box!.y + box!.height - 1 }, { x: center.x, y: 1 })).y).toBe(-maxY);
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

test("public taxonomy presents the prophecy as six movements", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("A prophecy in six movements");
  await expect(page.getByRole("navigation", { name: "Primary navigation" }).getByRole("link", { name: "Movements" })).toHaveAttribute("href", "/tapestries/1/");
  await expect(page.getByRole("heading", { level: 2, name: "The six movements" })).toBeVisible();

  await page.goto("/tapestries/2/");
  await expect(page.locator(".viewer-heading .eyebrow")).toHaveText("Movement II");
  await expect(page.locator(".movement-list > .eyebrow")).toHaveText("The prophecy unfolds");
  const movementNavigation = page.getByRole("navigation", { name: "Movement navigation" });
  await expect(movementNavigation).toContainText("Previous movement");
  await expect(movementNavigation).toContainText("All movements");
  await expect(movementNavigation).toContainText("Next movement");
  await expect(page).toHaveTitle(/Movement II: The Trumpets Sound/);

  await page.goto("/revelation/");
  await expect(page.locator(".reader-hero")).toContainText("six movements");
});
