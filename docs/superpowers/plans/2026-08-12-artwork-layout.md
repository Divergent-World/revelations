# Artwork Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent preview distortion and allow full reader artwork to be explored by scrolling.

**Architecture:** Keep the existing components and image pipeline. Add browser-level geometry regressions, then correct only the frame and overflow rules in `app/globals.css`.

**Tech Stack:** Next.js, React, TypeScript, plain CSS, Playwright.

## Global Constraints

- Preserve complete artwork; do not crop previews.
- Keep the two-row desktop exhibition and linear mobile sequence.
- Add no dependencies or JavaScript layout logic.

---

### Task 1: Correct preview and reader geometry

**Files:**
- Modify: `e2e/exhibition.spec.ts`
- Modify: `app/globals.css`

**Interfaces:**
- Consumes: existing `.scene-card`, `.dialog-art`, and `.dialog-reading` markup.
- Produces: stable preview frames and independently scrollable reader panels.

- [ ] Add failing Playwright assertions for preview aspect ratio, `object-fit: contain`, and artwork-panel overflow.
- [ ] Run the focused tests and confirm they fail against the current CSS.
- [ ] Add minimal CSS rules that give buttons stable frames, override image height, and allow vertical artwork overflow.
- [ ] Run focused tests, then the full unit/build/browser suites.
- [ ] Inspect real generated WebPs at desktop and mobile viewport sizes.
