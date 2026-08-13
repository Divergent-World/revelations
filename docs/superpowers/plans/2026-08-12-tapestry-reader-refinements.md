# Tapestry Reader Refinements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the tapestry pages easier to enter and study by shortening their titles, fitting the full gallery at the default Near scale, adding natural desktop and touch image inspection, and highlighting the words marked as Jesus’ speech in the official WEB USFM source.

**Architecture:** Keep the committed VPL file as the canonical scripture text and treat the official USFM file only as speech-range metadata. Generate compact title and speech-range fields into the existing content JSON, then render them through the current server-component data path. Encapsulate image gestures in one client component with native pointer events and CSS transforms, avoiding a new dependency.

**Tech Stack:** Next.js 16.3, React 19, TypeScript, CSS, Node.js content scripts, Node test runner, Playwright.

**Global constraints:** Work on `codex/expanded-tapestry-movements`; preserve the untracked `.DS_Store` and `yarn.lock`; use the supplied Tapestry II master-node movement text; do not alter the displayed WEB scripture wording; do not add a gesture library.

---

## Task 1: Add compact tapestry titles and make Near the fitted default

**Files:**

- Modify: `scripts/generate-content.mjs`
- Modify: `scripts/validate-content.mjs`
- Modify: `lib/content.ts`
- Modify: `app/page.tsx`
- Modify: `app/tapestries/[slug]/page.tsx`
- Modify: `components/TapestryExplorer.tsx`
- Modify: `app/globals.css`
- Modify: `tests/content.test.mjs`
- Modify: `tests/e2e/explorer.spec.ts`
- Regenerate: `content/tapestries.json`

### Step 1: Write failing content and browser tests

Add assertions that every tapestry has the approved compact title and that movement objects no longer expose the redundant `label` field:

```js
const titles = [
  "The Scroll Opens",
  "The Trumpets Sound",
  "The Dragon Makes War",
  "The Earth Is Reaped",
  "Babylon Falls",
  "All Things Made New",
];

assert.deepEqual(tapestries.map(({ title }) => title), titles);
assert.ok(tapestries.every(({ movements }) =>
  movements.every((movement) => !("label" in movement))
));
```

Extend the explorer Playwright test to verify that `Near` is pressed on first load and the seven tapestry cards fit inside the stage without horizontal overflow at a desktop viewport:

```ts
await expect(page.getByRole("button", { name: "Near" })).toHaveAttribute("aria-pressed", "true");
const overflow = await page.locator(".tapestry-stage").evaluate(
  (node) => node.scrollWidth - node.clientWidth,
);
expect(overflow).toBeLessThanOrEqual(1);
```

Run the focused tests and confirm they fail:

```bash
rtk npm test -- --test-name-pattern="compact titles|movement labels"
rtk npx playwright test tests/e2e/explorer.spec.ts
```

### Step 2: Generate and consume compact titles

Add one title per tapestry in `scripts/generate-content.mjs`:

```js
const tapestryTitles = [
  "The Scroll Opens",
  "The Trumpets Sound",
  "The Dragon Makes War",
  "The Earth Is Reaped",
  "Babylon Falls",
  "All Things Made New",
];
```

Emit `title` at tapestry level, stop emitting movement `label`, and require the new title in `scripts/validate-content.mjs`. Update `Tapestry` and `TapestryMovement` in `lib/content.ts` to match. Replace the long generated headings on the home cards and tapestry pages with `tapestry.title` while retaining the roman numeral as the series marker.

### Step 3: Default to Near and fit the complete gallery

Initialize the scale index to the Near option in `components/TapestryExplorer.tsx`. Keep Room available but no longer selected on load.

Adjust `.zoom-0` and stage spacing so seven cards and six gaps fit within the desktop stage width:

```css
.tapestry-stage {
  --stage-pad: clamp(1rem, 4vw, 4rem);
  padding-inline: var(--stage-pad);
}

.tapestry-stage.zoom-0 .tapestry-card {
  width: calc((100vw - var(--stage-pad) - var(--stage-pad) - 4.5rem) / 7);
}
```

Retain the existing one-column mobile override and ensure card labels remain readable at the smaller fitted size.

### Step 4: Regenerate and verify

```bash
rtk npm run content:generate
rtk npm run content:validate
rtk npm test
rtk npx playwright test tests/e2e/explorer.spec.ts
```

Commit:

```bash
rtk git add scripts/generate-content.mjs scripts/validate-content.mjs lib/content.ts app/page.tsx 'app/tapestries/[slug]/page.tsx' components/TapestryExplorer.tsx app/globals.css tests/content.test.mjs tests/e2e/explorer.spec.ts content/tapestries.json
rtk git commit -m "feat: refine tapestry titles and framing"
```

## Task 2: Derive exact words-of-Jesus ranges from official USFM

**Files:**

- Modify: `scripts/lib/content.mjs`
- Modify: `scripts/generate-content.mjs`
- Modify: `scripts/validate-content.mjs`
- Modify: `lib/content.ts`
- Modify: `tests/content.test.mjs`
- Modify: `.env.example`
- Modify: `README.md`
- Regenerate: `content/revelation.web.json`
- Regenerate: `content/tapestries.json`

### Step 1: Write failing parser and validation tests

Add a small USFM fixture that includes speech markers, inline word markup, a footnote inside speech, multiple speech segments, and an unmarked verse:

```js
const usfm = String.raw`\c 1
\v 1 Before \wj I am \w Jesus|lemma="Jesus"\w*\wj* after.
\v 2 \wj First\wj* and \wj second\f + \ft note\f* phrase\wj*.
\v 3 Ordinary text.`;
```

Test a public helper such as `annotateWordsOfJesus(vplChapters, usfm)`:

```js
assert.deepEqual(annotated[0].verses[0].wordsOfJesus, [{ start: 7, end: 17 }]);
assert.equal(
  annotated[0].verses[0].text.slice(7, 17),
  "I am Jesus",
);
assert.deepEqual(annotated[0].verses[2].wordsOfJesus, undefined);
```

Add negative tests for wording mismatches, unterminated `\wj`, overlapping ranges, and out-of-bounds validation. Run and confirm failure:

```bash
rtk npm test -- --test-name-pattern="words of Jesus|speech ranges"
```

### Step 2: Parse USFM speech state without changing scripture text

In `scripts/lib/content.mjs`, add an exported parser that:

1. Walks Revelation chapter and verse markers.
2. Removes notes, cross-references, and character formatting using the same cleanup rules as the existing USFM parser.
3. Tracks `\wj`/`\wj*` state while producing each verse’s clean USFM text.
4. Records half-open character ranges `{ start, end }` in that cleaned text.
5. Compares the entire cleaned USFM verse string with the canonical VPL verse string.
6. Copies only verified ranges onto the VPL verse object.
7. Throws a chapter-and-verse-specific error for mismatches or malformed markers.

Keep verses with no marked speech compact by omitting `wordsOfJesus`.

### Step 3: Load `.usfm` files and official ZIP archives

In `scripts/generate-content.mjs`, read `WEB_USFM_PATH` as either:

- a plain `.usfm` file through `readFile`, or
- a `.zip` file through `execFile("unzip", ["-p", path, "96-REVengwebp.usfm"])`.

Fail with an actionable message if the path is absent, the extension is unsupported, or the Revelation entry cannot be read. Parse VPL first, then call `annotateWordsOfJesus` before building tapestry passages so the same range objects flow into both generated JSON files.

Document in `.env.example`:

```dotenv
WEB_USFM_PATH=/absolute/path/to/engwebp_usfm.zip
```

Update the README’s content-generation section to state that VPL supplies visible scripture and USFM supplies only `\wj` ranges.

### Step 4: Validate generated ranges and passage consistency

Extend `scripts/validate-content.mjs` with a helper that verifies:

- `start` and `end` are integers;
- `0 <= start < end <= verse.text.length`;
- ranges are sorted and do not overlap;
- each scene passage verse has the same speech ranges as its canonical Revelation verse.

Update the `Verse` type in `lib/content.ts`:

```ts
export type TextRange = { start: number; end: number };

export type Verse = {
  chapter: number;
  verse: number;
  text: string;
  wordsOfJesus?: TextRange[];
};
```

### Step 5: Generate from the official local sources and prove wording stability

Generate with the already-downloaded official WEB files:

```bash
rtk env WEB_VPL_PATH=/private/tmp/engwebp_vpl.txt WEB_USFM_PATH=/private/tmp/engwebp_usfm.zip npm run content:generate
rtk npm run content:validate
rtk npm test
```

Before accepting the generated diff, compare the old and new verse text arrays with a small read-only Node command and assert zero wording changes; only range metadata may differ.

Commit:

```bash
rtk git add scripts/lib/content.mjs scripts/generate-content.mjs scripts/validate-content.mjs lib/content.ts tests/content.test.mjs .env.example README.md content/revelation.web.json content/tapestries.json
rtk git commit -m "feat: derive words of Jesus from WEB USFM"
```

## Task 3: Render marked speech in the reader passage

**Files:**

- Modify: `components/SceneDialog.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/explorer.spec.ts`

### Step 1: Write a failing red-letter browser test

Open a scene whose passage includes a `wordsOfJesus` range and assert that:

- a `.words-of-jesus` span exists;
- its text equals the corresponding substring in generated JSON;
- surrounding scripture stays in the normal passage color;
- the full-chapter reader does not add red-letter spans.

Run:

```bash
rtk npx playwright test tests/e2e/explorer.spec.ts --grep "words of Jesus"
```

### Step 2: Split verse text by half-open ranges

Add a small renderer in `components/SceneDialog.tsx` that walks a verse’s sorted ranges and emits plain fragments between accented spans:

```tsx
function VerseText({ verse }: { verse: Verse }) {
  const ranges = verse.wordsOfJesus ?? [];
  let cursor = 0;

  return <>{ranges.flatMap((range, index) => {
    const parts = [verse.text.slice(cursor, range.start)];
    parts.push(
      <span className="words-of-jesus" key={`${range.start}-${range.end}-${index}`}>
        {verse.text.slice(range.start, range.end)}
      </span>,
    );
    cursor = range.end;
    if (index === ranges.length - 1) parts.push(verse.text.slice(cursor));
    return parts;
  })}</>;
}
```

Handle the no-range case by returning the complete verse text directly. Use the helper only inside scene-dialog passages; leave the chapter-reader component unchanged.

### Step 3: Style the accent and verify

Use the existing gold token, normal font weight, and inherited typography:

```css
.words-of-jesus {
  color: var(--gold);
  font-weight: inherit;
}
```

Run:

```bash
rtk npx playwright test tests/e2e/explorer.spec.ts --grep "words of Jesus"
rtk npm test
```

Commit:

```bash
rtk git add components/SceneDialog.tsx app/globals.css tests/e2e/explorer.spec.ts
rtk git commit -m "feat: highlight words of Jesus in scene passages"
```

## Task 4: Add dependency-free artwork zoom for mouse, keyboard, and touch

**Files:**

- Create: `components/ZoomableArtwork.tsx`
- Modify: `components/ArtworkImage.tsx`
- Modify: `components/SceneDialog.tsx`
- Modify: `app/globals.css`
- Modify: `tests/e2e/explorer.spec.ts`

### Step 1: Write failing desktop interaction tests

Add Playwright coverage for the reader artwork:

1. The overlay starts at `1×` with Reset and minus disabled.
2. Clicking the artwork sets zoom to `2×`; clicking again returns to `1×`.
3. Plus and minus change the displayed scale by fixed increments and stop at `1×`/`4×`.
4. Reset restores `1×` after zooming and panning.
5. Hovering at `1×` shows the magnifier lens; zooming hides it.
6. Opening a different scene starts back at `1×`.

Prefer accessible roles and labels over CSS selectors:

```ts
await page.getByRole("button", { name: "Zoom in" }).click();
await expect(page.getByText("1.5×", { exact: true })).toBeVisible();
```

Run and confirm failure:

```bash
rtk npx playwright test tests/e2e/explorer.spec.ts --grep "artwork zoom"
```

### Step 2: Let the image component report availability

Extend `ArtworkImage` with optional callbacks:

```ts
type ArtworkImageProps = {
  scene: Scene;
  size: "preview" | "reader";
  onLoad?: () => void;
  onUnavailable?: () => void;
  draggable?: boolean;
};
```

Call `onUnavailable` only after both reader and preview candidates fail. Preserve the existing reader-to-preview fallback. Reset internal source/error state when `scene.id` or `size` changes.

### Step 3: Build the zoom viewport and toolbar

Create `components/ZoomableArtwork.tsx` as a client component. Keep the interaction state local:

```ts
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;
```

Render:

- an overflow-hidden viewport;
- `ArtworkImage` transformed around an explicitly tracked origin;
- an overlay toolbar with minus, current scale, plus, and Reset;
- a hover lens only for fine-pointer desktop input at `1×`;
- an unavailable state that hides/disables the zoom toolbar.

Use pointer events rather than a dependency. Clamp the transform after every scale and pan update so blank space cannot be dragged into the viewport. Give the viewport `role="button"`, a descriptive `aria-label`, and keyboard handling: Enter/Space toggles `1×`/`2×`, `+`/`-` adjust scale, and Escape/`0` resets.

On desktop:

- update the lens origin from pointer position while hovering at `1×`;
- click without meaningful movement toggles `1×` and `2×`, anchored at the pointer;
- drag pans only while enlarged;
- switch the cursor between zoom-in, grab, and grabbing.

### Step 4: Add native-feeling iPad and touch gestures

Track active pointers in a `Map<number, Point>`:

- one pointer pans when scale is greater than `1×`;
- two pointers establish a pinch baseline;
- pinch distance controls scale from `1×` to `4×`;
- pinch midpoint anchors the content under the fingers;
- pointer up/cancel ends the gesture without triggering click-toggle.

Set `touch-action: none` only on the artwork viewport so dialog text remains naturally scrollable. Keep the current two-column reader layout at iPad widths and existing stacked layout at phone widths.

### Step 5: Compose the zoom view into the dialog

Replace the direct reader-size `ArtworkImage` in `SceneDialog` with:

```tsx
<ZoomableArtwork key={scene.id} scene={scene} />
```

The scene key guarantees a clean reset whenever a new detail panel opens.

### Step 6: Add responsive styling and verify manually

Add focused styles for `.zoom-artwork`, `.zoom-artwork__viewport`, `.zoom-toolbar`, and `.art-lens`. Ensure controls have at least 44px touch targets, visible focus states, strong contrast, and do not cover the dialog close button or passage heading.

At desktop and iPad viewport sizes, confirm:

- artwork and text remain visible together;
- the toolbar stays reachable;
- pinch/pan does not scroll the page behind the dialog;
- text scrolling is unaffected;
- closing the dialog restores page scrolling.

Run:

```bash
rtk npx playwright test tests/e2e/explorer.spec.ts --grep "artwork zoom"
rtk npx playwright test tests/e2e/explorer.spec.ts --project=chromium
```

Commit:

```bash
rtk git add components/ZoomableArtwork.tsx components/ArtworkImage.tsx components/SceneDialog.tsx app/globals.css tests/e2e/explorer.spec.ts
rtk git commit -m "feat: add responsive artwork zoom"
```

## Task 5: Full verification and branch handoff

**Files:**

- Review all changed files
- Modify only files required by verification failures

### Step 1: Run the complete local quality gate

```bash
rtk npm run content:validate
rtk npm test
rtk npm run build
rtk npx playwright test
```

Record the exact passing counts and any intentional skips.

### Step 2: Inspect the final diff and repository state

```bash
rtk git diff --check
rtk git status --short
rtk git log --oneline --decorate -8
```

Confirm that:

- only intended files changed;
- `.DS_Store` and `yarn.lock` remain untouched and untracked;
- all six tapestry titles are compact;
- Near is the selected default and shows all seven cards on desktop;
- all six expanded movement narratives remain intact, including the supplied four-part Tapestry II text;
- generated scripture wording is byte-for-byte unchanged apart from added range metadata;
- zoom works with mouse, keyboard, and touch semantics;
- only scene-dialog scripture receives the gold speech accent.

### Step 3: Request focused code review

Use `superpowers:requesting-code-review` against the completed branch diff. Address any correctness, accessibility, or regression findings and rerun the relevant tests.

### Step 4: Finish without publishing

Use `superpowers:finishing-a-development-branch` to summarize integration options. Do not push, merge, or open a pull request unless the user explicitly requests it.
