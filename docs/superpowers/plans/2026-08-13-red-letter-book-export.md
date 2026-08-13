# Red-Letter Book Export Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish red-letter Markdown that converts reliably to Google Docs-compatible DOCX, EPUB, and PDF with all 90 images.

**Architecture:** Reuse the canonical `wordsOfJesus` character ranges in the Markdown renderer and Pandoc's native bracketed-span/custom-style support. Add deterministic JPEG book derivatives to the existing release pipeline and ship one reference DOCX that defines the red character style.

**Tech Stack:** TypeScript, Node.js test runner, Sharp, Pandoc, OOXML, LibreOffice render QA.

## Global Constraints

- The red-letter color is exactly `#9B1C31`.
- Scripture remains 22 chapters and 404 verses with unchanged wording.
- All 90 artworks appear exactly once and use unique JPEG book-image URLs.
- Existing preview, reader, original, archive, and route keys remain stable.
- No new npm dependency.

---

### Task 1: Semantic red-letter Markdown and book image keys

**Files:**
- Modify: `test/markdown-book.test.mjs`
- Modify: `test/release-lib.test.mjs`
- Modify: `lib/markdown-book.ts`
- Modify: `scripts/lib/release.mjs`
- Modify: `scripts/build-release.mjs`
- Modify: `scripts/validate-release.mjs`

**Interfaces:**
- Consumes: `ScriptureChapter.verses[].wordsOfJesus`, existing scene IDs, and `releasePaths(sceneId, extension)`.
- Produces: annotated verse text and `releases/v1/book/images/<scene-id>.jpg` derivatives.

- [ ] **Step 1: Write failing renderer and release-path tests**

Assert exact bracketed-span output for a partial verse, unchanged reconstruction after stripping annotations, JPEG figure URLs, and the new `book` path/inventory.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `npm test -- test/markdown-book.test.mjs test/release-lib.test.mjs`

Expected: failures for missing semantic spans and missing `book` release paths.

- [ ] **Step 3: Implement the minimal renderer and release changes**

Split each verse by its validated ranges, wrap only speech with `{.words-of-jesus style="color: #9B1C31" custom-style="Words of Jesus"}`, create deterministic JPEG derivatives with Sharp, and validate their exact filenames, format, dimensions, and bytes.

- [ ] **Step 4: Run focused and full unit tests**

Run: `npm test -- test/markdown-book.test.mjs test/release-lib.test.mjs`

Run: `npm test`

Expected: all tests pass without warnings.

### Task 2: Pandoc companion and conversion documentation

**Files:**
- Create: `public/red-letter-reference.docx`
- Modify: `docs/book-export.md`
- Modify: `README.md`
- Test: `test/markdown-book.test.mjs`

**Interfaces:**
- Consumes: Pandoc bracketed spans and the `Words of Jesus` custom style name.
- Produces: a downloadable DOCX reference style and exact DOCX, EPUB, and PDF commands.

- [ ] **Step 1: Add a failing reference-style assertion**

Read `word/styles.xml` from the companion DOCX and assert a character style named `Words of Jesus` contains `<w:color w:val="9B1C31"/>`.

- [ ] **Step 2: Verify the assertion fails while the companion is absent**

Run: `npm test -- test/markdown-book.test.mjs`

Expected: failure because `public/red-letter-reference.docx` does not exist.

- [ ] **Step 3: Create the minimal reference DOCX and update commands**

Base the file on Pandoc's default reference document, add only the red character style, and document `+bracketed_spans`, `--reference-doc`, EPUB, and WeasyPrint PDF conversion.

- [ ] **Step 4: Build and verify static publication**

Run: `npm run build`

Expected: `/export.md` and `/red-letter-reference.docx` are present in `out/`.

### Task 3: Generate and inspect final artifacts

**Files:**
- Generated: `dist/releases/v1/book/images/*.jpg`
- Generated: `out/export.md`
- Generated outside git: final DOCX, EPUB, PDF, and render PNGs.

**Interfaces:**
- Consumes: final static Markdown, JPEG derivatives, and reference DOCX.
- Produces: user-deliverable DOCX and verified EPUB/PDF conversions.

- [ ] **Step 1: Rebuild and validate release assets**

Run: `npm run assets:release`

Run: `npm run assets:validate`

Expected: 90 originals, 180 WebP derivatives, 90 JPEG book derivatives, and a valid archive.

- [ ] **Step 2: Convert all formats**

Use the commands from `docs/book-export.md` against `out/export.md`, keeping the local asset server available.

- [ ] **Step 3: Audit structure and render**

Assert 90 embedded images in DOCX and EPUB, render the DOCX to PNG pages, inspect every page, and confirm representative words-of-Jesus runs use `9B1C31`.

- [ ] **Step 4: Run final verification and commit**

Run: `npm test`

Run: `npm run test:e2e`

Expected: zero failures; commit and push the focused change to the existing PR branch.
