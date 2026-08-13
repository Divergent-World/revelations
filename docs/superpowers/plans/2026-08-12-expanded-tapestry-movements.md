# Expanded Tapestry Movements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the terse movement labels beside every lead reader image with four or five numbered title-and-description cards faithful to the Obsidian canvas summaries.

**Architecture:** Keep movement copy in the existing generated tapestry manifest, but change each movement from a string to a `{ label, title, description }` object. The shared viewer renders full titles and descriptions, while the homepage and page heading preserve their compact lists with `movements.map(({ label }) => label)`.

**Tech Stack:** Next.js 16.3 App Router, React 19, TypeScript 5.9, global CSS, Node.js test runner, Playwright.

## Global Constraints

- Tapestries I and III–VI use their numbered canvas summary boxes; Tapestry II uses the four movement paragraphs supplied by the project owner.
- Preserve each source's event order and theological emphasis; edit only for clean web prose.
- Keep the cards beside the reader image and preserve the existing mobile single-column behavior.
- Do not change artwork mapping, scene metadata, scripture text, navigation, or the Obsidian vault.
- Add no dependencies or new content files.

---

### Task 1: Define and populate the structured movement contract

**Files:**
- Modify: `scripts/validate-content.mjs`
- Modify: `scripts/generate-content.mjs`
- Modify: `content/tapestries.json`
- Modify: `lib/content.ts`

**Interfaces:**
- Produces: `Movement = { label: string; title: string; description: string }`
- Produces: `Tapestry.movements: Movement[]`
- Consumes: the existing six-entry `movements` authoring array in `scripts/generate-content.mjs`

- [ ] **Step 1: Add failing manifest assertions**

Inside the existing `for (const tapestry of tapestries)` loop in `scripts/validate-content.mjs`, add:

```js
const expectedMovementCounts = [4, 4, 5, 5, 5, 5];
assert.equal(tapestry.movements.length, expectedMovementCounts[tapestry.id - 1], `Tapestry ${tapestry.id} has the wrong movement count`);
for (const [index, movement] of tapestry.movements.entries()) {
  assert.equal(typeof movement.label, "string", `Tapestry ${tapestry.id} movement ${index + 1} needs a label`);
  assert.ok(movement.label.trim(), `Tapestry ${tapestry.id} movement ${index + 1} label must not be empty`);
  assert.equal(typeof movement.title, "string", `Tapestry ${tapestry.id} movement ${index + 1} needs a title`);
  assert.ok(movement.title.trim(), `Tapestry ${tapestry.id} movement ${index + 1} title must not be empty`);
  assert.equal(typeof movement.description, "string", `Tapestry ${tapestry.id} movement ${index + 1} needs a description`);
  assert.ok(movement.description.trim(), `Tapestry ${tapestry.id} movement ${index + 1} description must not be empty`);
}
```

- [ ] **Step 2: Run the validator and confirm the old string schema fails**

Run: `npm run content:validate`

Expected: FAIL because the first existing movement string has no `title`.

- [ ] **Step 3: Replace the generator's movement strings with source-backed objects**

Populate `scripts/generate-content.mjs` from these canvas nodes, ordered by the leading movement number:

| Tapestry | Canvas nodes |
| --- | --- |
| I | `1f0e219b81055f89`, `7db61909060e6776`, `d4a61905c002a6c7`, `bc6355bac6e01c0d` |
| II | Use the four exact objects below |
| III | `d2f053778aa2495a`, `b35a508302854032`, `2cbc06ddc06ecd61`, `bad372256c65eb62`, `ac044da7ef667ca2` |
| IV | `69749e4f5595944a`, `953d5ac1d7acc657`, `3b2ff6eef1022441`, `e3080b974497ff19`, `faf8e5055c066255` |
| V | `49880cc001d94fe4`, `2f417ae32642e56a`, `f30bf5aeb1f441d8`, `bed08dd603e4454e`, `c26640a3f8f0697a` |
| VI | `0da7384a92592968`, `64bab01c602816f7`, `4e5f44b56c802dcb`, `9c91ca741439796e`, `a7fee560d493a10e` |

Represent each entry as:

```js
{
  label: "Revelation",
  title: "Christ appears and the revelation begins.",
  description: "The first scenes establish that John has received a divine vision. Christ is shown in majesty among the candlesticks, and the ‘seven churches’ are invoked as the audience of the revelation. The point here is not yet catastrophe. The point is authority: this vision comes from Christ, and it is meant for the Church.",
}
```

Use these exact Tapestry II objects:

```js
[
  {
    label: "The faithful sealed",
    title: "God marks out His people before the next wave of judgment.",
    description: "The tapestry opens with the 144,000 sealed. So before the next catastrophes begin, there is first an image of distinction and protection: God knows who are His. In the historical cycle, this functions like a pause after the seals and before the trumpets.",
  },
  {
    label: "Trumpets prepared",
    title: "Heaven prepares judgment through liturgy.",
    description: "Then the mood shifts upward: the angels receive the seven trumpets, and another angel handles the incense that represents the prayers of the saints. This is important because the coming judgments are not shown as random chaos. They are framed as proceeding from heaven, with the prayers of the faithful rising before God. The angel then casts the incense/fire to the earth, and the trumpet cycle begins.",
  },
  {
    label: "Creation struck",
    title: "Creation itself begins to break apart.",
    description: "The first run of trumpets strikes the natural world: hail and fire, the burning mountain thrown into the sea, Wormwood falling from heaven into the waters, and then the darkening of the sun, moon, and stars. So this middle section of Tapestry 2 is really about the world becoming disordered at the cosmic level — land, sea, rivers, sky, light itself.",
  },
  {
    label: "The abyss and war unleashed",
    title: "Judgment becomes demonic and militarized.",
    description: "Then the imagery grows more frightening and surreal. The fifth trumpet brings the locusts from the pit; the sixth trumpet releases the four angels; and finally comes the apocalyptic cavalry, the riders on fire-breathing horses, killing on a massive scale. So Tapestry 2 does not end with a quiet symbol. It ends with an escalation: from environmental catastrophe to infernal torment to warlike devastation.",
  },
]
```

Copy the same objects into the six tapestry records at the top of `content/tapestries.json`, leaving all scene records untouched.

- [ ] **Step 4: Update the TypeScript contract**

In `lib/content.ts`, add:

```ts
export type Movement = { label: string; title: string; description: string };
```

Change `Tapestry.movements` from `string[]` to `Movement[]`.

- [ ] **Step 5: Run the validator and unit tests**

Run: `npm run content:validate && npm test`

Expected: PASS with six tapestries, 90 scenes, and every movement carrying non-empty copy.

- [ ] **Step 6: Commit the content contract**

```bash
git add scripts/validate-content.mjs scripts/generate-content.mjs content/tapestries.json lib/content.ts
git commit -m "feat: add narrative tapestry movements"
```

---

### Task 2: Render the numbered narrative cards

**Files:**
- Modify: `e2e/exhibition.spec.ts`
- Modify: `components/TapestryViewer.tsx`
- Modify: `app/page.tsx`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: `Tapestry.movements: Movement[]` from Task 1
- Produces: one `.movement-list li` with an `h2` and paragraph per movement

- [ ] **Step 1: Add a failing browser assertion for the full Tapestry II copy**

Append this test to `e2e/exhibition.spec.ts`:

```ts
test("tapestry movements present the full narrative beside the reader", async ({ page }) => {
  await page.goto("/tapestries/2/");
  const movements = page.locator(".movement-list li");
  await expect(movements).toHaveCount(4);
  await expect(movements.first()).toContainText("God marks out His people");
  await expect(movements.first()).toContainText("144,000 sealed");
  await expect(movements.last()).toContainText("Judgment becomes demonic and militarized");
  await expect(movements.last()).toContainText("riders on fire-breathing horses");
});
```

- [ ] **Step 2: Run the focused browser test and confirm rendering fails**

Run: `npx playwright test e2e/exhibition.spec.ts --grep "full narrative"`

Expected: FAIL because the existing list renders object values directly and has no narrative paragraphs.

- [ ] **Step 3: Update all compact movement-title consumers**

In `components/TapestryViewer.tsx` and `app/page.tsx`, replace `tapestry.movements.join(" · ")` with:

```tsx
tapestry.movements.map(({ label }) => label).join(" · ")
```

- [ ] **Step 4: Render semantic movement cards**

Replace the movement list body in `components/TapestryViewer.tsx` with:

```tsx
<ol>
  {tapestry.movements.map(({ title, description }) => (
    <li key={title}>
      <h2>{title}</h2>
      <p>{description}</p>
    </li>
  ))}
</ol>
```

- [ ] **Step 5: Extend the existing global movement styles**

Keep the two-column desktop and one-column mobile grid. Change the `li` rule to normal sans-serif body flow, then add:

```css
.movement-list li::marker { color: var(--gold); font: .7rem var(--font-sans), sans-serif; }
.movement-list h2 { margin: 0; font: 1.3rem/1.15 var(--font-display), serif; }
.movement-list li p { margin: .8rem 0 0; color: var(--muted); font: .9rem/1.65 var(--font-sans), sans-serif; }
```

- [ ] **Step 6: Run the focused browser test**

Run: `npx playwright test e2e/exhibition.spec.ts --grep "full narrative"`

Expected: PASS.

- [ ] **Step 7: Commit the presentation**

```bash
git add e2e/exhibition.spec.ts components/TapestryViewer.tsx app/page.tsx app/globals.css
git commit -m "feat: expand tapestry movement cards"
```

---

### Task 3: Verify every page and responsive layout

**Files:**
- Verify only; no planned file changes

**Interfaces:**
- Consumes: the structured content and renderer from Tasks 1–2
- Produces: evidence that the static build and shared regular/embed presentation remain valid

- [ ] **Step 1: Run all deterministic checks**

Run: `npm run content:validate && npm test && npm run build`

Expected: all commands exit 0; Next.js statically generates all tapestry and embed routes.

- [ ] **Step 2: Run the exhibition browser suite**

Run: `npx playwright test e2e/exhibition.spec.ts`

Expected: all exhibition tests pass.

- [ ] **Step 3: Inspect representative layouts**

Open `/tapestries/2/` at desktop width and `/tapestries/6/` at mobile width. Confirm the reader image remains beside the two-column movement grid on desktop, cards stack in one column on mobile, and no title or paragraph is clipped.

- [ ] **Step 4: Check the final diff**

Run: `git diff --check && git status --short`

Expected: no whitespace errors; only the plan, movement content/schema, shared renderers, CSS, validator, and focused browser test are changed.
