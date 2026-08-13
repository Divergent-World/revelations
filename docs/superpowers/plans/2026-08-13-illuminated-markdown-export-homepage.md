# Illuminated Markdown Export and Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the public exhibition as a prophecy in six movements, publish a statically generated `export.md` containing all 22 chapters and all 90 artworks exactly once, document Pandoc conversion, and transform the homepage into an accessible illuminated ledger.

**Architecture:** Keep the current canonical JSON and stable `/tapestries/` routes. Add one pure TypeScript Markdown renderer and one request-independent Next.js Route Handler, then consume the existing scene model and artwork component in a CSS-module homepage. Validate the book at build time, use absolute localhost/R2 reader-image URLs, and verify the final artifact with Node tests, Playwright, Next’s static build, and a real Pandoc conversion.

**Tech Stack:** Next.js 16.3 App Router static export, React 19 Server/Client Components, TypeScript 5.9, Node.js 22 native test runner, Playwright, CSS Modules, Pandoc 3.x.

## Global Constraints

- Read the relevant installed Next.js 16 guides under `node_modules/next/dist/docs/` before changing Route Handlers or static-export behavior; do not rely on older Next.js conventions.
- Add no runtime or development dependency.
- Public copy uses “A prophecy in six movements,” “Movement I” through “Movement VI,” and “All movements.”
- Preserve `/tapestries/...`, `/embed/tapestries/...`, scene query parameters, scene IDs, JSON keys, source-vault paths, release keys, and internal `Tapestry`/`tapestry` symbols.
- Preserve exact World English Bible text and canonical artwork titles, including legitimate title/scripture uses of “vision.”
- The Markdown output must contain 22 sequential chapters, 404 numbered verses, 90 unique scene IDs, and 90 unique absolute reader-image URLs.
- Local image URLs use `http://127.0.0.1:3101`; production image URLs use `NEXT_PUBLIC_ASSET_BASE_URL` and the existing clean-HTTPS-origin guard.
- Use `scene.images.reader`, not attachment-served archival originals.
- Keep all artwork uncropped and retain keyboard focus, alt text, target size, and reduced-motion behavior.
- Preserve the pre-existing `.DS_Store` modification and untracked `graphify-out/`; never stage or edit them as part of this work.
- Prefix shell commands with `rtk`, including test, build, and Git commands.

---

## File Structure

**Create**

- `lib/markdown-book.ts` — pure validation and Markdown rendering; no React, Next.js, browser, or filesystem dependency.
- `test/markdown-book.test.mjs` — canonical-data and mutation tests for the renderer.
- `app/export.md/route.ts` — static `GET` route for `out/export.md`.
- `app/page.module.css` — isolated illuminated-ledger homepage styles.
- `docs/book-export.md` — Pandoc and Google Docs workflow.

**Modify**

- `package.json` — suppress only Node’s module-type warning while native tests import the TypeScript renderer.
- `app/page.tsx` — approved terminology, export link, featured artwork, movement ledger, and colophon.
- `app/layout.tsx` — prophecy/movement metadata.
- `components/SiteHeader.tsx` — “Movements” navigation label.
- `components/TapestryViewer.tsx` — public Movement labels, sequence eyebrow, and pagination/ARIA copy.
- `app/tapestries/[id]/page.tsx` — Movement metadata title.
- `app/revelation/page.tsx` — six-movement reader copy.
- `app/revelation/[chapter]/page.tsx` — “Return to Movement VI.”
- `scripts/generate-content.mjs` — canonical source for revised editorial narrative copy.
- `content/tapestries.json` — regenerated output only; do not hand-edit.
- `scripts/serve-static.mjs` — `.md` media type.
- `app/globals.css` — remove superseded homepage-only global selectors while retaining shared buttons and reader styles.
- `e2e/exhibition.spec.ts` — public-taxonomy, export, and illuminated-layout behavior.
- `README.md` — new public description and book-export documentation link.

---

### Task 1: Adopt the Prophecy and Movement Taxonomy

**Files:**

- Modify: `e2e/exhibition.spec.ts`
- Modify: `test/content.test.mjs`
- Modify: `app/page.tsx:8-49`
- Modify: `app/layout.tsx:8-11`
- Modify: `components/SiteHeader.tsx:8-13`
- Modify: `components/TapestryViewer.tsx:69-105`
- Modify: `app/tapestries/[id]/page.tsx:9-13`
- Modify: `app/revelation/page.tsx:7-12`
- Modify: `app/revelation/[chapter]/page.tsx:36-41`
- Modify: `scripts/generate-content.mjs:35-188`
- Regenerate: `content/tapestries.json`
- Modify: `README.md:1-4`

**Interfaces:**

- Consumes: existing routes, `Tapestry.roman`, titles, summaries, narrative subdivisions, and generated canonical content.
- Produces: stable routes with new public labels; later tasks rely on `/export.md` being the only remaining feature addition to the homepage archive actions.

- [ ] **Step 1: Add failing public-taxonomy tests**

Append this test to `e2e/exhibition.spec.ts`:

```ts
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
```

Append this generated-copy guard to `test/content.test.mjs`:

```js
test("public editorial copy avoids the retired tapestry taxonomy", () => {
  const editorialCopy = tapestries.flatMap(({ title, summary, movements }) => [
    title,
    summary,
    ...movements.flatMap(({ title: movementTitle, description }) => [movementTitle, description]),
  ]).join("\n");

  assert.doesNotMatch(editorialCopy, /\btapestr(?:y|ies)\b/i);
});
```

- [ ] **Step 2: Run the test and verify the expected failure**

Run:

```bash
rtk npm run test:e2e -- --project=chromium --grep "public taxonomy presents"
rtk npm test -- --test-name-pattern="public editorial copy avoids"
```

Expected: the browser test fails first on the homepage heading (`A vision in six movements`) or missing “Movements” navigation label, and the Node test fails on current generated editorial prose. The browser build itself must still complete.

- [ ] **Step 3: Replace public UI labels without renaming internals**

Apply these exact visible labels:

```tsx
// app/layout.tsx
title: { default: "Revelations — A Prophecy in Six Movements", template: "%s — Revelations" },
description: "An illuminated reading of the Book of Revelation as a prophecy in six movements by Ali Rahman / Divergent World.",

// components/SiteHeader.tsx
<Link href="/tapestries/1/">Movements</Link>

// components/TapestryViewer.tsx
<p className="eyebrow">Movement {tapestry.roman}</p>
<p className="eyebrow">The prophecy unfolds</p>
<section ... aria-label={`Movement ${tapestry.roman} scenes`}>
<nav className="tapestry-pagination" aria-label="Movement navigation">
  {tapestry.id > 1 ? <Link href={`/tapestries/${tapestry.id - 1}/`}>← Previous movement</Link> : <span />}
  <Link href="/">All movements</Link>
  {tapestry.id < 6 ? <Link href={`/tapestries/${tapestry.id + 1}/`}>Next movement →</Link> : <Link href="/revelation/22/">Read the ending →</Link>}
</nav>

// app/tapestries/[id]/page.tsx
return { title: tapestry ? `Movement ${tapestry.roman}: ${tapestry.title}` : "Movement" };

// app/revelation/page.tsx
<p>Read the complete twenty-two-chapter text. Illuminated verse markers return you to scenes across the six movements.</p>

// app/revelation/[chapter]/page.tsx
<Link href="/tapestries/6/">Return to Movement VI →</Link>
```

For the temporary pre-overhaul homepage, use these exact strings so the taxonomy test can turn green before Task 4:

```tsx
<p className="eyebrow">The Revelation to John</p>
<h1>A prophecy in six movements</h1>
<Link className="button button-primary" href="/tapestries/1/">Enter Movement I</Link>
<h2 id="six-movements">The six movements</h2>
```

Change the section’s `aria-labelledby` and heading ID from `six-tapestries` to `six-movements`.

- [ ] **Step 4: Revise editorial narrative copy at its generator source**

In `scripts/generate-content.mjs`, preserve event descriptions and theological meaning while applying this exact taxonomy:

```text
“divine vision” → “divine revelation”
“this vision comes from Christ” → “this prophecy comes from Christ”
“The vision rises into heaven.” → “The revelation rises into heaven.”
“John’s private vision” → “John’s private revelation”
“first tapestry” → “Movement I”
“the tapestry” at the start of a top-level description → “Movement II/IV/V/VI” as appropriate
“Tapestry 2/3/4/5/6” → “Movement II/III/IV/V/VI”
“next tapestry” → “next movement”
“earlier tapestries” → “earlier movements”
remaining standalone “the tapestry” → “the movement,” “the sequence,” or “the prophecy,” according to the sentence
“first movement” for a nested outline item → “opening sequence”
“second movement” for a nested outline item → “second sequence”
“This movement” for a nested outline item → “This sequence”
“last movement” for a nested outline item → “final sequence”
```

Keep “the vision shifts toward one of Revelation’s most iconic images” and “presence, vision, and relationship,” because those uses describe beholding rather than the six-part taxonomy. The new `test/content.test.mjs` guard must pass against regenerated public titles, summaries, and narrative subdivisions; internal filenames, keys, variables, paths, validation diagnostics, and release metadata keep the existing implementation vocabulary.

- [ ] **Step 5: Regenerate canonical content from the available official sources**

Run:

```bash
rtk env WEB_VPL_PATH=/private/tmp/engwebp_vpl.txt WEB_USFM_PATH=/private/tmp/engwebp_usfm.zip npm run content:generate
rtk git diff -- content/tapestries.json content/source-map.json content/revelation.web.json
```

Expected: `content/tapestries.json` changes only in the intended titles/descriptions. `content/source-map.json`, scene mappings, checksums, and `content/revelation.web.json` remain byte-for-byte unchanged. If unrelated generated data changes, stop and inspect source versions instead of committing it.

- [ ] **Step 6: Update the README’s public product description**

Use:

```markdown
An open-source, static exhibition of the Book of Revelation as a prophecy in six movements by Ali Rahman / Divergent World. The Next.js portal presents 90 canonical scenes beside the public-domain World English Bible text of Revelation.
```

Keep technical filenames, route examples, and the sibling `Apocalypse Tapestry` vault path unchanged.

- [ ] **Step 7: Run focused and content verification**

Run:

```bash
rtk npm run content:validate
rtk npm test
rtk npm run test:e2e -- --project=chromium --grep "public taxonomy presents"
```

Expected: all commands exit 0; content validation still reports 6 internal tapestry records, 90 scenes, and 22 chapters.

- [ ] **Step 8: Commit the terminology change**

Stage only the files in this task, inspect the staged diff, then commit:

```bash
rtk git add app/page.tsx app/layout.tsx components/SiteHeader.tsx components/TapestryViewer.tsx 'app/tapestries/[id]/page.tsx' app/revelation/page.tsx 'app/revelation/[chapter]/page.tsx' scripts/generate-content.mjs content/tapestries.json README.md e2e/exhibition.spec.ts test/content.test.mjs
rtk git diff --cached --check
rtk git commit -m "feat: adopt movement terminology"
```

---

### Task 2: Build the Canonical Markdown Book Renderer

**Files:**

- Create: `lib/markdown-book.ts`
- Create: `test/markdown-book.test.mjs`
- Modify: `package.json:6-18`

**Interfaces:**

- Consumes: `ScriptureChapter[]`, `Scene[]`, and a clean absolute asset origin.
- Produces: `renderMarkdownBook(input: MarkdownBookInput): string`, consumed by `app/export.md/route.ts` in Task 3.

- [ ] **Step 1: Write the failing renderer contract tests**

Create `test/markdown-book.test.mjs` with real committed content and hand-derived expectations:

```js
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { renderMarkdownBook } from "../lib/markdown-book.ts";

const { chapters } = JSON.parse(await readFile(new URL("../content/revelation.web.json", import.meta.url), "utf8"));
const { scenes } = JSON.parse(await readFile(new URL("../content/tapestries.json", import.meta.url), "utf8"));

const render = (overrides = {}) => renderMarkdownBook({
  chapters,
  scenes,
  assetBaseUrl: "https://assets.example.test",
  ...overrides,
});

test("renders the complete illuminated Revelation with every artwork once", () => {
  const markdown = render();
  const chapterHeadings = markdown.match(/^## Revelation \d+$/gm) ?? [];
  const verseLines = markdown.match(/^\*\*\d+:\d+\*\* /gm) ?? [];
  const figureLines = markdown.match(/^!\[[^\n]+\]\((https:\/\/assets\.example\.test\/releases\/v1\/web\/1920\/[^)]+\.webp)\)$/gm) ?? [];
  const sceneCaptions = [...markdown.matchAll(/^\*Movement [IVX]+ · (T\d-(?:00|[TB]\d{2})) ·/gm)].map((match) => match[1]);

  assert.equal(chapterHeadings.length, 22);
  assert.equal(verseLines.length, 404);
  assert.equal(figureLines.length, 90);
  assert.equal(sceneCaptions.length, 90);
  assert.equal(new Set(sceneCaptions).size, 90);
  assert.match(markdown, /^---\ntitle: "The Revelation to John"/);
  assert.match(markdown, /\*\*22:21\*\* The grace of the Lord Jesus Christ be with all the saints\. Amen\./);
});

test("places shared and multi-span scenes once at their first verse", () => {
  const markdown = render();
  const verseOne = markdown.indexOf("**1:1**");
  assert.ok(markdown.indexOf("· T1-00 ·") < verseOne);

  const verseNineteenEleven = markdown.indexOf("**19:11**");
  const shared = ["T6-00", "T6-T01", "T6-T03"].map((id) => markdown.indexOf(`· ${id} ·`));
  assert.ok(shared.every((index) => index >= 0 && index < verseNineteenEleven));
  assert.deepEqual([...shared].sort((a, b) => a - b), shared);
  assert.equal(markdown.match(/· T1-T01 ·/g)?.length, 1);
});

test("rejects a relative asset origin", () => {
  assert.throws(() => render({ assetBaseUrl: "/assets" }), /absolute HTTP or HTTPS/);
});

test("rejects duplicate scene IDs and duplicate image URLs", () => {
  const duplicateId = scenes.map((scene, index) => index === 1 ? { ...scene, id: scenes[0].id } : scene);
  assert.throws(() => render({ scenes: duplicateId }), /Duplicate scene ID/);

  const duplicateImage = scenes.map((scene, index) => index === 1 ? { ...scene, images: { ...scene.images, reader: scenes[0].images.reader } } : scene);
  assert.throws(() => render({ scenes: duplicateImage }), /Duplicate reader image URL/);
});

test("rejects incomplete scripture and invalid first anchors", () => {
  assert.throws(() => render({ chapters: chapters.slice(0, 21) }), /chapters 1 through 22/);
  const invalidAnchor = scenes.map((scene, index) => index === 0 ? {
    ...scene,
    scriptureSpans: [{ ...scene.scriptureSpans[0], startChapter: 99 }],
  } : scene);
  assert.throws(() => render({ scenes: invalidAnchor }), /first scripture anchor is missing/);
});

test("rejects reader image keys that escape the canonical release tree", () => {
  const invalidImage = scenes.map((scene, index) => index === 0 ? {
    ...scene,
    images: { ...scene.images, reader: "https://unexpected.example/T1-00.webp" },
  } : scene);
  assert.throws(() => render({ scenes: invalidImage }), /canonical release key/);
});
```

- [ ] **Step 2: Run the renderer test and verify RED**

Run:

```bash
rtk node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/markdown-book.test.mjs
```

Expected: FAIL before any assertions run with `ERR_MODULE_NOT_FOUND` for `lib/markdown-book.ts`; the six tests define the complete first contract before implementation.

- [ ] **Step 3: Implement the minimal pure renderer**

Create `lib/markdown-book.ts` with this public contract and algorithm:

```ts
import type { Scene, ScriptureChapter } from "./content";

export type MarkdownBookInput = {
  chapters: ScriptureChapter[];
  scenes: Scene[];
  assetBaseUrl: string;
};

const romans = ["", "I", "II", "III", "IV", "V", "VI"];

function cleanOrigin(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Book asset origin must be an absolute HTTP or HTTPS URL: ${value}`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`Book asset origin must be a clean absolute HTTP or HTTPS origin: ${value}`);
  }
  return url.origin;
}

function escapeMarkdown(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("*", "\\*").replaceAll("_", "\\_");
}

export function renderMarkdownBook({ chapters, scenes, assetBaseUrl }: MarkdownBookInput) {
  const origin = cleanOrigin(assetBaseUrl);
  if (chapters.length !== 22 || chapters.some(({ chapter }, index) => chapter !== index + 1)) {
    throw new Error("Markdown book requires Revelation chapters 1 through 22 in order");
  }

  const verseKeys = new Set<string>();
  let verseCount = 0;
  for (const chapter of chapters) {
    chapter.verses.forEach((verse, index) => {
      if (verse.number !== index + 1) throw new Error(`Revelation ${chapter.chapter} has a missing or out-of-order verse`);
      const key = `${chapter.chapter}:${verse.number}`;
      if (verseKeys.has(key)) throw new Error(`Duplicate verse in Markdown book: Revelation ${key}`);
      verseKeys.add(key);
      verseCount += 1;
    });
  }
  if (verseCount !== 404) throw new Error(`Markdown book requires 404 verses, received ${verseCount}`);
  if (scenes.length !== 90) throw new Error(`Markdown book requires 90 scenes, received ${scenes.length}`);

  const sceneIds = new Set<string>();
  const imageUrls = new Set<string>();
  const scenesAt = new Map<string, Array<{ scene: Scene; imageUrl: string }>>();
  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) throw new Error(`Duplicate scene ID in Markdown book: ${scene.id}`);
    sceneIds.add(scene.id);
    const anchor = scene.scriptureSpans[0];
    const anchorKey = anchor && `${anchor.startChapter}:${anchor.startVerse}`;
    if (!anchorKey || !verseKeys.has(anchorKey)) throw new Error(`${scene.id}: first scripture anchor is missing from Revelation`);
    if (!scene.images.reader.startsWith("releases/") || scene.images.reader.startsWith("/") || scene.images.reader.includes("..")) {
      throw new Error(`${scene.id}: reader image must be a canonical release key`);
    }
    const imageUrl = new URL(scene.images.reader, `${origin}/`).href;
    if (imageUrls.has(imageUrl)) throw new Error(`Duplicate reader image URL in Markdown book: ${imageUrl}`);
    imageUrls.add(imageUrl);
    scenesAt.set(anchorKey, [...(scenesAt.get(anchorKey) ?? []), { scene, imageUrl }]);
  }

  const lines = [
    "---",
    'title: "The Revelation to John"',
    'subtitle: "An Illuminated Prophecy in Six Movements"',
    'creator: "Ali Rahman / Divergent World"',
    'lang: "en"',
    'rights: "Artwork CC BY-SA 4.0; Scripture World English Bible, public domain"',
    "---",
    "",
    "# The Revelation to John",
    "",
    "*An illuminated prophecy in six movements*",
    "",
    "Scripture: World English Bible, public domain. Artwork © Ali Rahman / Divergent World, CC BY-SA 4.0.",
    "",
  ];
  const emitted = new Set<string>();

  for (const chapter of chapters) {
    lines.push(`## Revelation ${chapter.chapter}`, "");
    for (const verse of chapter.verses) {
      for (const { scene, imageUrl } of scenesAt.get(`${chapter.chapter}:${verse.number}`) ?? []) {
        if (emitted.has(scene.id)) throw new Error(`Scene emitted twice in Markdown book: ${scene.id}`);
        emitted.add(scene.id);
        const roman = romans[scene.tapestry];
        if (!roman) throw new Error(`${scene.id}: movement number must be between 1 and 6`);
        lines.push(
          `![${escapeMarkdown(scene.alt)}](${imageUrl})`,
          "",
          `*Movement ${roman} · ${scene.id} · ${escapeMarkdown(scene.title)} · ${escapeMarkdown(scene.displayReference)}*`,
          `*Artwork © ${escapeMarkdown(scene.attribution)} · ${escapeMarkdown(scene.license)}*`,
          "",
        );
      }
      lines.push(`**${chapter.chapter}:${verse.number}** ${verse.text}`, "");
    }
  }

  if (emitted.size !== 90 || imageUrls.size !== 90) {
    throw new Error(`Markdown book emitted ${emitted.size} scenes and ${imageUrls.size} unique image URLs; expected 90 of each`);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
```

Do not import `assetUrl()` into this file; explicit input keeps the renderer deterministic and testable.

- [ ] **Step 4: Run the renderer tests and verify GREEN**

Run:

```bash
rtk node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test test/markdown-book.test.mjs
```

Expected: 6 tests pass.

- [ ] **Step 5: Make the repository test command warning-free for native TypeScript imports**

Change only the `test` script in `package.json`:

```json
"test": "node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test"
```

Run:

```bash
rtk npm test
```

Expected: all existing and new Node tests pass without the module-type warning.

- [ ] **Step 6: Commit the renderer**

```bash
rtk git add lib/markdown-book.ts test/markdown-book.test.mjs package.json
rtk git diff --cached --check
rtk git commit -m "feat: render illuminated Markdown book"
```

---

### Task 3: Publish and Download the Static Markdown Edition

**Files:**

- Create: `app/export.md/route.ts`
- Modify: `scripts/serve-static.mjs:10`
- Modify: `app/page.tsx:41-48`
- Modify: `e2e/exhibition.spec.ts`

**Interfaces:**

- Consumes: `renderMarkdownBook()`, `allScenes`, `revelationChapters`, `NEXT_PUBLIC_ASSET_BASE_URL`, and the local origin fallback.
- Produces: a static `/export.md` response and a native homepage download link; Task 4 preserves this link inside the new colophon.

- [ ] **Step 1: Re-read the installed Next.js route/static-export rules**

Read these files completely before writing the route:

```bash
rtk sed -n '1,260p' node_modules/next/dist/docs/01-app/01-getting-started/15-route-handlers.md
rtk sed -n '1,340p' node_modules/next/dist/docs/01-app/02-guides/static-exports.md
```

Confirm the route does not access `Request`, cookies, headers, network data, or filesystem state.

- [ ] **Step 2: Add a failing export integration test**

Append to `e2e/exhibition.spec.ts`:

```ts
test("homepage downloads the complete illuminated Markdown edition", async ({ page }) => {
  await page.goto("/");
  const exportLink = page.getByRole("link", { name: "export.md" });
  await expect(exportLink).toHaveAttribute("href", "/export.md");
  await expect(exportLink).toHaveAttribute("download", "");

  const response = await page.request.get("/export.md");
  expect(response.ok()).toBe(true);
  expect(response.headers()["content-type"]).toContain("text/markdown");
  const markdown = await response.text();
  expect(markdown).toContain("# The Revelation to John");
  expect(markdown.match(/^!\[/gm)).toHaveLength(90);
  expect(markdown).toContain("· T6-B07 · Saint John before God · Revelation 22:9–13");
  expect(markdown).toContain("http://127.0.0.1:3101/releases/v1/web/1920/T1-00.webp");
});
```

- [ ] **Step 3: Run the export integration test and verify RED**

Run:

```bash
rtk npm run test:e2e -- --project=chromium --grep "downloads the complete illuminated"
```

Expected: FAIL because the `export.md` link and route do not exist.

- [ ] **Step 4: Implement the static Route Handler**

Create `app/export.md/route.ts`:

```ts
import { allScenes, revelationChapters } from "@/lib/content";
import { renderMarkdownBook } from "@/lib/markdown-book";

export const dynamic = "force-static";

export function GET() {
  const body = renderMarkdownBook({
    chapters: revelationChapters,
    scenes: allScenes,
    assetBaseUrl: process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "http://127.0.0.1:3101",
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="export.md"',
    },
  });
}
```

- [ ] **Step 5: Add native download UI and local Markdown media type**

Add the export action to the existing archive actions before the artwork ZIP:

```tsx
<a className="button button-primary" href="/export.md" download>export.md</a>
```

In `scripts/serve-static.mjs`, add the exact map entry:

```js
".md": "text/markdown; charset=utf-8",
```

- [ ] **Step 6: Build and inspect the static artifact**

Run:

```bash
rtk npm run build
rtk ls -lh out/export.md
rtk rg -c '^!\[' out/export.md
rtk rg -c '^\*\*[0-9]+:[0-9]+\*\* ' out/export.md
```

Expected: build exits 0; `out/export.md` exists; counts are 90 figures and 404 verses.

- [ ] **Step 7: Re-run the export integration test and verify GREEN**

```bash
rtk npm run test:e2e -- --project=chromium --grep "downloads the complete illuminated"
```

Expected: PASS in Chromium.

- [ ] **Step 8: Commit the static export route**

```bash
rtk git add app/export.md/route.ts scripts/serve-static.mjs app/page.tsx e2e/exhibition.spec.ts
rtk git diff --cached --check
rtk git commit -m "feat: publish illuminated Markdown edition"
```

---

### Task 4: Build the Illuminated-Ledger Homepage

**Files:**

- Create: `app/page.module.css`
- Modify: `app/page.tsx`
- Modify: `app/globals.css:39-58,154-156`
- Modify: `e2e/exhibition.spec.ts`

**Interfaces:**

- Consumes: `allTapestries`, `getScene()`, `archiveUrl`, `ArtworkImage`, `/export.md`, shared color/font variables, and shared `.button` classes.
- Produces: a server-rendered hero, six-entry movement ledger, and archive colophon with no new client state.

- [ ] **Step 1: Add failing desktop and mobile layout tests**

Append:

```ts
test("homepage opens as an illuminated movement ledger", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name === "mobile");
  await page.goto("/");
  const hero = page.getByRole("region", { name: "A prophecy in six movements" });
  const feature = hero.locator("figure");
  await expect(feature.getByRole("img", { name: /New Jerusalem/ })).toBeVisible();
  await expect(hero.locator("dl dd")).toHaveText(["06", "22", "90"]);

  const movementIndex = page.getByRole("region", { name: "The six movements" });
  const entries = movementIndex.locator("ol > li");
  await expect(entries).toHaveCount(6);
  await expect(entries.locator("img")).toHaveCount(6);
  await expect(entries.first().getByRole("link", { name: /Movement I.*The Scroll Opens/ })).toHaveAttribute("href", "/tapestries/1/");

  const headingBox = await hero.getByRole("heading", { level: 1 }).boundingBox();
  const featureBox = await feature.boundingBox();
  expect(headingBox).not.toBeNull();
  expect(featureBox).not.toBeNull();
  expect(featureBox!.x).toBeGreaterThan(headingBox!.x + headingBox!.width);
  await expect(feature.locator("img")).toHaveCSS("object-fit", "contain");
});

test("homepage illuminated ledger stacks cleanly on mobile", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "mobile");
  await page.goto("/");
  const hero = page.getByRole("region", { name: "A prophecy in six movements" });
  const headingBox = await hero.getByRole("heading", { level: 1 }).boundingBox();
  const featureBox = await hero.locator("figure").boundingBox();
  expect(headingBox).not.toBeNull();
  expect(featureBox).not.toBeNull();
  expect(featureBox!.y).toBeGreaterThan(headingBox!.y + headingBox!.height);
  await expect(page.getByRole("region", { name: "The six movements" }).locator("ol > li")).toHaveCount(6);
});

test("homepage movement links keep visible focus and reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const firstMovement = page.getByRole("region", { name: "The six movements" }).getByRole("link").first();
  await firstMovement.focus();
  await expect(firstMovement).toBeFocused();
  await expect(firstMovement).toHaveCSS("outline-style", "solid");
  await expect(firstMovement.locator("img")).toHaveCSS("transition-duration", "1e-05s");
});
```

- [ ] **Step 2: Run the layout tests and verify RED**

Run:

```bash
rtk npm run test:e2e -- --grep "illuminated movement ledger|illuminated ledger stacks|visible focus and reduced motion"
```

Expected: the two project-specific tests and the focus/motion test fail because the current homepage has no named hero region, feature figure, stats ledger, or movement artwork.

- [ ] **Step 3: Rewrite the homepage as a Server Component using existing data**

Use this structure in `app/page.tsx`; keep exact copy and semantic landmarks while allowing line wrapping to follow formatting:

```tsx
import Link from "next/link";

import { ArtworkImage } from "@/components/ArtworkImage";
import { allTapestries, archiveUrl, getScene, type Scene } from "@/lib/content";
import styles from "./page.module.css";

function requiredScene(id: string): Scene {
  const scene = getScene(id);
  if (!scene) throw new Error(`Homepage scene missing: ${id}`);
  return scene;
}

export default function HomePage() {
  const feature = requiredScene("T6-B03");
  const movements = allTapestries.map((tapestry) => ({
    tapestry,
    lead: requiredScene(tapestry.leadSceneId),
  }));

  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="home-title">
        <div className={styles.heroCopy}>
          <p className="eyebrow">The Revelation to John</p>
          <h1 id="home-title">A prophecy in six movements</h1>
          <p className={styles.intro}>Ninety illuminations follow John from Patmos through throne, judgment, dragon, Babylon, and the radiant city at the end of the world.</p>
          <div className={styles.actions}>
            <Link className="button button-primary" href="/tapestries/1/">Enter Movement I</Link>
            <Link className="button" href="/revelation/">Read Revelation</Link>
          </div>
          <dl className={styles.facts}>
            <div><dt>Movements</dt><dd>06</dd></div>
            <div><dt>Chapters</dt><dd>22</dd></div>
            <div><dt>Illuminations</dt><dd>90</dd></div>
          </dl>
        </div>
        <figure className={styles.feature}>
          <div className={styles.featureFrame}><ArtworkImage scene={feature} size="reader" eager /></div>
          <figcaption><span>Movement VI · {feature.id}</span><strong>{feature.title}</strong><small>{feature.displayReference}</small></figcaption>
        </figure>
      </section>

      <section className={styles.movements} aria-labelledby="six-movements">
        <header className={styles.sectionHeading}>
          <p className="eyebrow">I — VI</p>
          <h2 id="six-movements">The six movements</h2>
        </header>
        <ol className={styles.movementList}>
          {movements.map(({ tapestry, lead }) => (
            <li key={tapestry.id}>
              <Link href={`/tapestries/${tapestry.id}/`} aria-label={`Movement ${tapestry.roman}: ${tapestry.title}`}>
                <span className={styles.roman}>{tapestry.roman}</span>
                <span className={styles.movementCopy}><small>Movement {tapestry.roman}</small><strong>{tapestry.title}</strong><span>{tapestry.summary}</span></span>
                <span className={styles.movementArt}><ArtworkImage scene={lead} size="preview" /></span>
                <span className={styles.enter}>Enter movement <span aria-hidden="true">↗</span></span>
              </Link>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.archive} aria-labelledby="archive-title">
        <p className="eyebrow">Open archive · Edition v1</p>
        <h2 id="archive-title">The whole prophecy, in your hands.</h2>
        <p className={styles.archiveIntro}>Export all 22 chapters and 90 unique illuminations as an editable Markdown book, or keep the complete archival artwork release.</p>
        <div className={styles.actions}>
          <a className="button button-primary" href="/export.md" download>export.md</a>
          <a className="button" href={archiveUrl}>Download artwork v1</a>
          <a className="button" href="https://github.com/Divergent-World/revelations">Fork the source</a>
        </div>
        <p className={styles.exportNote}>Pandoc-ready · 22 chapters · 90 linked images · DOCX, EPUB, or PDF</p>
      </section>
    </div>
  );
}
```

- [ ] **Step 4: Add isolated illuminated-ledger styles**

Create `app/page.module.css` with all homepage layout in the module. Use these exact structural values; do not add animation JavaScript:

```css
.page { overflow: clip; background: radial-gradient(circle at 84% 8%, rgba(55, 76, 105, .28), transparent 34rem), linear-gradient(180deg, transparent, rgba(4, 5, 7, .45)); }
.hero, .movements, .archive { width: min(100%, 100rem); margin: auto; padding-inline: clamp(1rem, 7vw, 8rem); }
.hero { position: relative; display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(18rem, .7fr); gap: clamp(3rem, 8vw, 9rem); align-items: center; min-height: calc(100svh - 5.5rem); padding-block: clamp(5rem, 10vw, 9rem); }
.hero::before { position: absolute; inset: 8% 3% auto auto; width: 15rem; aspect-ratio: 1; content: ""; border: 1px solid rgba(214, 187, 120, .12); transform: rotate(45deg); pointer-events: none; }
.heroCopy { position: relative; z-index: 1; }
.hero h1 { max-width: 10ch; margin-bottom: 2rem; }
.intro { max-width: 43rem; color: #c2c0ba; font: clamp(1.15rem, 2.1vw, 1.65rem)/1.55 var(--font-display), serif; }
.actions { display: flex; flex-wrap: wrap; gap: .8rem; margin-top: 2rem; }
.facts { display: grid; grid-template-columns: repeat(3, 1fr); max-width: 36rem; margin: 4rem 0 0; border-block: 1px solid var(--line); }
.facts div { display: flex; flex-direction: column-reverse; gap: .3rem; padding: 1rem 1rem 1rem 0; }
.facts div + div { padding-left: 1rem; border-left: 1px solid var(--line); }
.facts dt { color: var(--muted); font-size: .58rem; letter-spacing: .15em; text-transform: uppercase; }
.facts dd { margin: 0; color: var(--gold); font: 1.7rem/1 var(--font-display), serif; font-variant-numeric: tabular-nums; }
.feature { position: relative; width: min(100%, 34rem); margin: 0 auto; padding: clamp(.7rem, 1.5vw, 1rem); border: 1px solid rgba(214, 187, 120, .4); box-shadow: 0 2rem 7rem rgba(0, 0, 0, .5); }
.feature::before, .feature::after { position: absolute; content: ""; pointer-events: none; }
.feature::before { inset: .45rem; border: 1px solid rgba(214, 187, 120, .14); }
.feature::after { inset: -1rem 1rem 1rem -1rem; z-index: -1; border: 1px solid rgba(117, 138, 166, .2); }
.featureFrame { display: grid; aspect-ratio: 16 / 9; place-items: center; overflow: hidden; background: #07090c; }
.featureFrame img, .featureFrame > div { width: 100%; height: 100%; object-fit: contain; }
.feature figcaption { display: grid; grid-template-columns: auto 1fr; gap: .25rem 1rem; padding: 1rem .25rem .2rem; }
.feature figcaption span { grid-row: 1 / 3; color: var(--gold); font-size: .6rem; letter-spacing: .1em; text-transform: uppercase; }
.feature figcaption strong { font: 1.2rem/1 var(--font-display), serif; }
.feature figcaption small { color: var(--muted); }
.movements { padding-block: clamp(6rem, 11vw, 10rem); }
.sectionHeading { display: flex; align-items: end; justify-content: space-between; gap: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--line); }
.sectionHeading h2 { margin-bottom: 0; }
.movementList { margin: 0; padding: 0; list-style: none; }
.movementList li { border-bottom: 1px solid var(--line); }
.movementList a { display: grid; grid-template-columns: 5rem minmax(16rem, 1fr) minmax(9rem, 15rem) 8rem; gap: clamp(1rem, 3vw, 3rem); align-items: center; min-height: 13rem; padding-block: 1.5rem; }
.roman { color: var(--gold); font: clamp(2.5rem, 5vw, 4.75rem)/1 var(--font-display), serif; }
.movementCopy { display: grid; gap: .45rem; }
.movementCopy small, .enter { color: var(--gold); font-size: .6rem; letter-spacing: .12em; text-transform: uppercase; }
.movementCopy strong { font: clamp(1.5rem, 2.8vw, 2.5rem)/1 var(--font-display), serif; font-weight: 500; }
.movementCopy > span { max-width: 44rem; color: var(--muted); font-size: .88rem; line-height: 1.65; }
.movementArt { display: grid; height: 10rem; place-items: center; overflow: hidden; background: #080a0d; border: 1px solid rgba(255, 255, 255, .07); }
.movementArt img, .movementArt > div { width: 100%; height: 100%; object-fit: contain; transition: transform .35s ease; }
.enter { justify-self: end; text-align: right; }
.movementList a:hover .movementArt img, .movementList a:focus-visible .movementArt img { transform: scale(1.025); }
.movementList a:hover .movementCopy strong, .movementList a:focus-visible .movementCopy strong { color: var(--gold); }
.archive { position: relative; padding-block: clamp(6rem, 12vw, 11rem); border-top: 1px solid var(--line); }
.archive::after { position: absolute; right: clamp(1rem, 7vw, 8rem); bottom: 3rem; color: rgba(214, 187, 120, .14); content: "Ω"; font: clamp(7rem, 18vw, 18rem)/1 var(--font-display), serif; pointer-events: none; }
.archive h2 { max-width: 11ch; }
.archiveIntro { max-width: 48rem; color: var(--muted); font: 1.2rem/1.7 var(--font-display), serif; }
.exportNote { margin: 1.5rem 0 0; color: var(--muted); font-size: .62rem; letter-spacing: .1em; text-transform: uppercase; }
@media (max-width: 900px) {
  .hero { grid-template-columns: 1fr; min-height: auto; }
  .feature { width: min(100%, 42rem); }
  .movementList a { grid-template-columns: 3.5rem 1fr minmax(8rem, 12rem); }
  .enter { display: none; }
}
@media (max-width: 640px) {
  .hero, .movements, .archive { padding-inline: 1rem; }
  .facts { margin-top: 3rem; }
  .facts div { padding-inline: .6rem; }
  .movementList a { grid-template-columns: 3rem 1fr; padding-block: 2rem; }
  .movementArt { grid-column: 2; width: 100%; height: 12rem; }
  .sectionHeading { display: block; }
  .archive::after { opacity: .45; }
}
@media (prefers-reduced-motion: reduce) {
  .movementArt img { transition: none; }
}
```

- [ ] **Step 5: Remove only superseded global homepage selectors**

Delete `.hero`, `.hero h1`, `.hero-copy`, `.hero-actions`, `.tapestry-index`, `.section-heading`, `.tapestry-list`, and `.archive-callout` rules from `app/globals.css`, plus their homepage-only responsive overrides. Retain `.button`, `.button-primary`, `.eyebrow`, all reader/viewer styles, and the global reduced-motion rule.

Run this ownership check before deletion:

```bash
rtk rg -n 'hero-actions|tapestry-index|tapestry-list|archive-callout|section-heading' app components
```

Expected after the rewrite: matches occur only in the old global CSS being removed; no component still consumes them.

- [ ] **Step 6: Run desktop/mobile homepage tests and verify GREEN**

```bash
rtk npm run test:e2e -- --grep "illuminated movement ledger|illuminated ledger stacks|visible focus and reduced motion"
```

Expected: one desktop test passes under Chromium, one mobile test passes under the mobile project, each is skipped only in the opposite project, and the shared focus/motion test passes in both projects.

- [ ] **Step 7: Run related regression tests**

```bash
rtk npm run test:e2e -- --project=chromium --grep "public taxonomy presents|downloads the complete illuminated|reduced motion|embed route"
```

Expected: all selected behaviors pass.

- [ ] **Step 8: Commit the homepage overhaul**

```bash
rtk git add app/page.tsx app/page.module.css app/globals.css e2e/exhibition.spec.ts
rtk git diff --cached --check
rtk git commit -m "feat: open with an illuminated movement ledger"
```

---

### Task 5: Document and Prove the Pandoc Workflow

**Files:**

- Create: `docs/book-export.md`
- Modify: `README.md`

**Interfaces:**

- Consumes: built `out/export.md`, the local asset server on port 3101, Pandoc 3.x, and generated reader images under `dist/releases/v1/web/1920/`.
- Produces: exact DOCX, EPUB, PDF, and Google Docs instructions plus a verified self-contained DOCX/EPUB conversion path.

- [ ] **Step 1: Write the conversion guide**

Create `docs/book-export.md` with these sections and commands:

````markdown
# Convert the illuminated Markdown book

## Download the source

Choose `export.md` in the homepage’s Open archive section. A production export uses public R2 image URLs. A local export uses `http://127.0.0.1:3101`, so keep the local asset server running while Pandoc converts it.

## Install Pandoc on macOS

```bash
brew install pandoc
```

## Convert a local export

From the repository, keep this running in one terminal:

```bash
npm run dev:local
```

In another terminal, change to the folder containing `export.md`.

### Microsoft Word / Google Docs

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc -o revelations.docx
```

Upload `revelations.docx` to Google Drive, right-click it, and choose **Open with → Google Docs**. Edit normally. To make a PDF, choose **File → Download → PDF Document (.pdf)** in Google Docs.

### EPUB

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc --split-level=2 -o revelations.epub
```

Pandoc downloads the linked images during conversion and includes them in the EPUB.

### PDF

If Pandoc already has access to a compatible PDF engine:

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc -o revelations.pdf
```

If no PDF engine is configured, use the DOCX → Google Docs → Download as PDF path above.

## Troubleshooting missing images

- Local export: confirm `npm run dev:local` is still running and `http://127.0.0.1:3101/releases/v1/web/1920/T1-00.webp` opens.
- Production export: confirm the R2 custom domain is reachable from the machine running Pandoc.
- Re-download `export.md` after changing `NEXT_PUBLIC_ASSET_BASE_URL`; the URLs are generated at build time.
````

- [ ] **Step 2: Link the guide from the README**

Add after the Content section:

```markdown
## Book export

The homepage’s `export.md` action downloads all 22 chapters with 90 unique linked illuminations. See [Convert the illuminated Markdown book](docs/book-export.md) for Pandoc commands that create DOCX, EPUB, and PDF files and for the Google Docs import workflow.
```

- [ ] **Step 3: Build the final Markdown source**

```bash
rtk npm run build
rtk rg -c '^!\[' out/export.md
rtk rg -c '^\*\*[0-9]+:[0-9]+\*\* ' out/export.md
```

Expected: counts are 90 and 404.

- [ ] **Step 4: Start only the local asset server for conversion**

In a dedicated terminal/session, run:

```bash
rtk node scripts/serve-static.mjs --root dist --port 3101
```

Verify:

```bash
rtk curl -I http://127.0.0.1:3101/releases/v1/web/1920/T1-00.webp
```

Expected: HTTP 200 and `Content-Type: image/webp`.

- [ ] **Step 5: Convert and inspect a real DOCX**

```bash
rtk pandoc out/export.md --from=gfm+yaml_metadata_block --standalone --toc -o /private/tmp/revelations.docx
rtk unzip -Z1 /private/tmp/revelations.docx | rtk rg '^word/media/' | rtk wc -l
```

Expected: Pandoc exits 0 and the DOCX contains 90 media files.

- [ ] **Step 6: Convert and inspect a real EPUB**

```bash
rtk pandoc out/export.md --from=gfm+yaml_metadata_block --standalone --toc --split-level=2 -o /private/tmp/revelations.epub
rtk unzip -Z1 /private/tmp/revelations.epub | rtk rg '\.(webp|png|jpe?g)$' | rtk wc -l
```

Expected: Pandoc exits 0 and the EPUB contains 90 image files. Stop the temporary asset server after both conversions.

- [ ] **Step 7: Commit the guide**

```bash
rtk git add docs/book-export.md README.md
rtk git diff --cached --check
rtk git commit -m "docs: explain illuminated book conversion"
```

---

### Task 6: Full Verification and Visual QA

**Files:**

- Verify only; change production files only if a failing check reveals a real defect, and use a new failing regression test before the fix.

**Interfaces:**

- Consumes: all deliverables from Tasks 1–5.
- Produces: fresh evidence that the coordinated release satisfies the approved spec.

- [ ] **Step 1: Run all non-browser checks**

```bash
rtk git diff --check
rtk npm test
rtk npm run content:validate
rtk npm run build
```

Expected: every command exits 0; the build route table includes `/export.md` as static output.

- [ ] **Step 2: Audit the built Markdown independently of renderer helpers**

Run this literal-count check:

```bash
rtk node -e 'const fs=require("node:fs"); const md=fs.readFileSync("out/export.md","utf8"); const chapters=md.match(/^## Revelation \d+$/gm)||[]; const verses=md.match(/^\*\*\d+:\d+\*\* /gm)||[]; const images=[...md.matchAll(/^!\[[^\n]+\]\((https?:\/\/[^)]+)\)$/gm)].map(m=>m[1]); const scenes=[...md.matchAll(/^\*Movement [IVX]+ · (T\d-(?:00|[TB]\d{2})) ·/gm)].map(m=>m[1]); if(chapters.length!==22||verses.length!==404||images.length!==90||new Set(images).size!==90||scenes.length!==90||new Set(scenes).size!==90) throw new Error(JSON.stringify({chapters:chapters.length,verses:verses.length,images:images.length,uniqueImages:new Set(images).size,scenes:scenes.length,uniqueScenes:new Set(scenes).size})); console.log("export.md: 22 chapters · 404 verses · 90 unique scenes · 90 unique images")'
```

Expected: the exact success line prints.

- [ ] **Step 3: Run the complete browser suite**

```bash
rtk npm run test:e2e
```

Expected: all Chromium and mobile tests pass with zero failures.

- [ ] **Step 4: Inspect the rendered homepage at desktop and mobile sizes**

Serve the completed static build:

```bash
rtk npm start -- --port 3100
```

Inspect `/` at 1440×1000 and 390×844. Confirm:

- New Jerusalem is fully contained and not cropped.
- The hero is side-by-side on desktop and stacked on mobile.
- All six movement entries show one lead artwork and readable summaries.
- `export.md` is the primary archive action.
- No horizontal overflow occurs.
- Keyboard tab order follows hero actions, movement links, then archive actions.
- Focus rings are visible and reduced motion removes image transforms.

Capture screenshots for the work log, then stop the server.

- [ ] **Step 5: Re-run real artifact conversion after final build**

Repeat Task 5’s asset-server, DOCX, and EPUB commands against the final `out/export.md`. Expected: both archives contain 90 images and Pandoc reports no missing resources.

- [ ] **Step 6: Review scope and repository status**

```bash
rtk git status --short
rtk git log -6 --oneline
```

Expected: implementation commits are present. Only the pre-existing `.DS_Store` modification and untracked `graphify-out/` remain outside commits. Do not stage or discard the user-owned `.DS_Store` change.

---

## Requirement Coverage

- Prophecy/movement terminology: Task 1.
- Stable internal routes and canonical titles/scripture: Global Constraints and Task 1.
- Pure 22-chapter/404-verse/90-artwork Markdown generation: Task 2.
- Absolute local/R2 image URLs and static `/export.md`: Task 3.
- Premium illuminated-ledger homepage and archive export button: Task 4.
- Pandoc DOCX/EPUB/PDF and Google Docs instructions: Task 5.
- Build-time failure, duplicate prevention, accessibility, responsive layout, real conversion, and full regression evidence: Tasks 2–6.
