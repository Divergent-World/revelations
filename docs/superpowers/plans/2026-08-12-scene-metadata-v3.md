# Corrected Scene Metadata Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the obsolete master-index metadata dependency with a compact 90-scene mapping containing only corrected IDs, titles, and Revelation anchors, then regenerate and validate all derived content and local release metadata.

**Architecture:** `content/scene-metadata.json` becomes the checked-in authority for scene titles and anchors while Obsidian canvases remain authoritative for image assignment and order. A small validator in the existing content library enforces exact ID coverage and scripture bounds; both generation and checked-in content validation use it. Existing release tooling rebuilds the ignored local v1 artifact after canonical JSON changes.

**Tech Stack:** Node.js ES modules, Node's built-in test runner and assertions, JSON, Sharp, existing release scripts.

## Global Constraints

- Check in only `id`, `title`, and `anchor` from `MASTER_INDEX_v3.json`.
- Preserve all 90 scene IDs, image assignments, canvas order, source paths, checksums, measured dimensions, attribution, and licenses.
- Do not copy the supplied v3 file or its status, preset, output-size, style, template, or reference fields.
- Do not mutate the Obsidian vault or upload to R2.
- Keep generated `dist/` media ignored and local.
- Add no dependencies and no speculative abstractions.

---

### Task 1: Add the compact metadata contract and validation

**Files:**
- Create: `content/scene-metadata.json`
- Modify: `scripts/lib/content.mjs`
- Modify: `test/content-lib.test.mjs`

**Interfaces:**
- Consumes: v3 records with `slot_id`, `title`, and `rev_anchor`; canonical scene IDs; parsed WEB chapters.
- Produces: `validateSceneMetadata(records, expectedIds, chapters) -> Map<string, { id, title, anchor, spans }>`.

- [x] **Step 1: Extract only compact records**

Create `content/scene-metadata.json` by projecting the supplied 90-record v3 index to:

```json
[
  {
    "id": "T1-00",
    "title": "Saint John reading the Apocalypse",
    "anchor": "Rev 1:1–11"
  }
]
```

Confirm that the checked-in objects expose exactly the keys `id`, `title`, and `anchor`.

- [x] **Step 2: Write failing metadata-validation tests**

Add tests exercising real records and small synthetic chapter fixtures:

```js
test("validateSceneMetadata returns normalized records for exact scene IDs", () => {
  const records = [{ id: "T1-00", title: "Reader", anchor: "Rev 1:1–2" }];
  const chapters = [{ chapter: 1, verses: [{ number: 1 }, { number: 2 }] }];
  assert.deepEqual([...validateSceneMetadata(records, ["T1-00"], chapters).values()], [{
    id: "T1-00",
    title: "Reader",
    anchor: "Rev 1:1–2",
    spans: [{ startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 2 }],
  }]);
});
```

Add separate assertions for duplicate, missing, unknown, empty-title, malformed-anchor, reversed-range, and out-of-bounds metadata.

- [x] **Step 3: Run tests and verify RED**

Run: `npm test -- test/content-lib.test.mjs`

Expected: FAIL because `validateSceneMetadata` is not exported.

- [x] **Step 4: Implement the minimal validator**

In `scripts/lib/content.mjs`, parse each anchor with `parseRevelationAnchor`, reject duplicate/unknown/missing IDs, and verify every start/end chapter and explicit verse against the supplied WEB chapter map. Return the validated records in a `Map` with their normalized `spans`.

- [x] **Step 5: Run tests and verify GREEN**

Run: `npm test -- test/content-lib.test.mjs`

Expected: all content-library tests pass.

### Task 2: Generate canonical content from the compact mapping

**Files:**
- Modify: `scripts/generate-content.mjs`
- Modify: `scripts/validate-content.mjs`
- Modify: `content/tapestries.json`
- Verify unchanged: `content/source-map.json`
- Verify unchanged: `content/revelation.web.json`

**Interfaces:**
- Consumes: `content/scene-metadata.json` and `validateSceneMetadata` from Task 1.
- Produces: corrected titles, scripture spans, display references, WEB passages, alt text, and verse backlinks through `content/tapestries.json`.

- [x] **Step 1: Write a failing checked-in-content validation**

Update `scripts/validate-content.mjs` to load the compact metadata, validate exact scene coverage, and assert for every scene:

```js
assert.equal(scene.title, metadata.title, `${scene.id}: stale title`);
assert.deepEqual(scene.scriptureSpans, metadata.spans, `${scene.id}: stale scripture spans`);
```

- [x] **Step 2: Run validation and verify RED**

Run: `npm run content:validate`

Expected: FAIL on the first scene whose checked-in title or scripture span differs from v3.

- [x] **Step 3: Replace the obsolete metadata source**

Remove `extractMasterIndex` and the `INDEX/Master Index.md` read from `scripts/generate-content.mjs`. Load `content/scene-metadata.json`, validate it against the 90 IDs produced by six tapestries with one lead and two rows of seven, and derive `row` and `position` directly from the stable scene ID.

Use each validated record's `title` and `spans`; leave the existing canvas path, Sharp metadata, SHA-256, URLs, attribution, and license flow unchanged.

- [x] **Step 4: Regenerate content**

Run: `npm run content:generate`

Expected: six tapestries, 90 scenes, and 22 chapters generated.

- [x] **Step 5: Prove immutable content stayed unchanged**

Run:

```bash
git diff --exit-code -- content/source-map.json content/revelation.web.json
```

Expected: no diff. Inspect `content/tapestries.json` and confirm every change is limited to `title`, `scriptureSpans`, `displayReference`, `passages`, or `alt` for corrected records.

- [x] **Step 6: Run content validation and unit tests**

Run: `npm run content:validate && npm test`

Expected: all validation and unit tests pass.

### Task 3: Rebuild and validate release metadata

**Files:**
- Regenerate ignored: `dist/releases/v1/manifest.json`
- Regenerate ignored: `dist/releases/v1/revelations-artwork-v1.zip`
- Verify ignored derivatives and originals through existing validation.

**Interfaces:**
- Consumes: corrected `content/tapestries.json` and unchanged `content/source-map.json`.
- Produces: a local release tree and ZIP whose manifest exactly matches canonical content.

- [x] **Step 1: Rebuild the local release**

Run: `npm run assets:release`

Expected: 90 originals and 180 WebP derivatives generated under `dist/releases/v1`.

- [x] **Step 2: Validate release inventory and checksums**

Run: `npm run assets:validate`

Expected: exact filenames, matching canonical/archive manifests, 90 original checksums, derivative dimensions/content, and ZIP integrity all pass.

### Task 4: Final repository verification

**Files:**
- Verify all modified files from Tasks 1–3.

**Interfaces:**
- Consumes: completed canonical metadata pipeline.
- Produces: verified source changes ready for review; no push or R2 mutation.

- [x] **Step 1: Run the production checks**

Run: `npm run content:validate && npm test && npm run build`

Expected: content validation succeeds, all Node tests pass, and Next.js static export completes.

- [x] **Step 2: Audit the final diff**

Run: `git diff --check` and inspect `git diff --stat`, `git status --short`, and the changed JSON keys. Confirm unrelated `next-env.d.ts`, `.DS_Store`, and `yarn.lock` remain unstaged and unmodified by this task.

- [x] **Step 3: Commit the implementation**

Stage only the compact metadata, generator/library/validator/test changes, regenerated checked-in canonical content, and this plan. Commit with:

```bash
git commit -m "fix: update scene titles and scripture anchors"
```
