# PDF Proportional Images Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the PDF conversion preserve image proportions without requiring a separate stylesheet download.

**Architecture:** Add print-only CSS to the Markdown book metadata. Pandoc carries the metadata into standalone HTML; WeasyPrint applies it only when making PDF, while DOCX and EPUB retain their existing dimension behavior.

**Tech Stack:** TypeScript Markdown renderer, Pandoc 3.x, WeasyPrint, Node test runner.

## Global Constraints

- Continue emitting both explicit width and height attributes for DOCX.
- The PDF guard must be embedded in `export.md`; no extra stylesheet download.
- The guard applies only under `@media print`.
- Do not change artwork files, chapter text, red-letter spans, DOCX, or EPUB output.

---

### Task 1: Embed the PDF ratio guard

**Files:**
- Modify: `test/markdown-book.test.mjs`
- Modify: `lib/markdown-book.ts`

**Interfaces:**
- Consumes: `renderMarkdownBook()` front matter.
- Produces: a `header-includes` block containing the print-only CSS guard.

- [ ] **Step 1: Write the failing test**

Add a renderer assertion that `export.md` includes `@media print` and `height: auto !important`.

- [ ] **Step 2: Run test to verify it fails**

Run: `rtk npm test -- test/markdown-book.test.mjs`

Expected: FAIL because the existing front matter contains no PDF-specific CSS.

- [ ] **Step 3: Write minimal implementation**

Append this YAML metadata to the book header:

```markdown
header-includes:
  - |
    <style>
    @media print { img { height: auto !important; max-width: 100%; object-fit: contain; } }
    </style>
```

- [ ] **Step 4: Run test to verify it passes**

Run: `rtk npm test -- test/markdown-book.test.mjs`

Expected: PASS.

### Task 2: Render and verify the one-file PDF path

**Files:**
- Generated: `out/export.md`
- Generated: `/private/tmp/The-Revelation-to-John-Illuminated-PDF-Fixed.pdf`

**Interfaces:**
- Consumes: `out/export.md` and the local book JPEG release.
- Produces: a WeasyPrint PDF with portrait and landscape images preserving their native ratios.

- [ ] **Step 1: Build the export and render PDF**

Build with a local asset base, then run Pandoc using the published PDF command.

- [ ] **Step 2: Inspect PDF pages**

Render PDF pages to PNG and compare a portrait and a landscape artwork visually against their known native proportions.

- [ ] **Step 3: Run full checks and commit**

Run `rtk npm test` and `rtk npm run test:e2e`, then commit the renderer, test, and plan.
