# Proportional Book Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Preserve native artwork proportions in every Markdown-book conversion output.

**Architecture:** Calculate print dimensions in `renderMarkdownBook` from each scene's canonical pixel dimensions. Emit those dimensions as Pandoc image attributes so the DOCX writer receives a distinct, ratio-correct drawing extent for every image. No release assets or conversion commands change.

**Tech Stack:** TypeScript Markdown renderer, Pandoc 3.x, Node test runner, DOCX OOXML inspection.

## Global Constraints

- Keep all 90 scenes unique and in their existing canonical placement.
- Preserve every source image's native aspect ratio; do not crop or resample.
- Constrain every printed image to at most 6.25 inches wide and 7.25 inches high.
- Retain existing red-letter spans and book-safe JPEG URLs.

---

### Task 1: Emit print-safe proportional image dimensions

**Files:**
- Modify: `test/markdown-book.test.mjs`
- Modify: `lib/markdown-book.ts`

**Interfaces:**
- Consumes: `Scene.width`, `Scene.height`, and `renderMarkdownBook()`.
- Produces: image Markdown in the form `![alt](url){width=6.25in height=4.17in}`.

- [ ] **Step 1: Write the failing test**

Add a test that renders the canonical book and parses the image attributes for `T1-00` (1024 × 1536) and `T1-T01` (1536 × 1024). Assert that each printed dimension is within the 6.25 × 7.25 inch bounds and that `width / height` equals the source ratio within `0.01`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- test/markdown-book.test.mjs`

Expected: FAIL because the renderer emits image links without width and height attributes.

- [ ] **Step 3: Write minimal implementation**

Add a local `printImageDimensions(width, height)` helper in `lib/markdown-book.ts`. Scale by `Math.min(6.25 / width, 7.25 / height)` and emit both dimensions in inches rounded to two decimal places on every figure link.

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- test/markdown-book.test.mjs`

Expected: PASS with all existing content and red-letter assertions still green.

- [ ] **Step 5: Commit**

```bash
rtk git add lib/markdown-book.ts test/markdown-book.test.mjs
rtk git commit -m "fix: preserve book image proportions"
```

### Task 2: Regenerate and inspect the uploadable DOCX

**Files:**
- Generated: `out/export.md`
- Generated: `/private/tmp/The-Revelation-to-John-Illuminated-Proportional.docx`

**Interfaces:**
- Consumes: completed proportional Markdown image attributes, `out/red-letter-reference.docx`, and the local release image server.
- Produces: a Google Docs-uploadable DOCX containing 90 JPEGs with ratio-correct OOXML extents.

- [ ] **Step 1: Build the static export**

Run: `rtk env NEXT_PUBLIC_ASSET_BASE_URL='http://127.0.0.1:3102' npm run build`

Expected: `out/export.md` contains all 90 explicit image dimensions.

- [ ] **Step 2: Create the red-letter DOCX**

Serve `dist/` on port 3102, then run:

```bash
rtk pandoc out/export.md --from=gfm+yaml_metadata_block+bracketed_spans --standalone --toc --reference-doc=out/red-letter-reference.docx -o /private/tmp/The-Revelation-to-John-Illuminated-Proportional.raw.docx
```

Sanitize the title block with `google_docs_title_sanitize.py` to create `/private/tmp/The-Revelation-to-John-Illuminated-Proportional.docx`.

- [ ] **Step 3: Verify embedded image ratios and render pages**

Inspect `word/document.xml` to confirm all 90 image drawing extents match their embedded media ratios. Render the sanitized DOCX with `render_docx.py` and visually inspect the portrait and landscape pages.

- [ ] **Step 4: Run final regression checks**

Run: `rtk npm test && rtk npm run test:e2e`

Expected: unit and browser suites pass; the output keeps 90 images, 404 verses, and 91 red-letter ranges.
