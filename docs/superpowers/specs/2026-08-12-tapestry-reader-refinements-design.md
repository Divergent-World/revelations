# Tapestry Reader Refinements

## Goal

Make every tapestry page easier to enter and inspect: replace the long movement-derived heading with a concise exhibition title, show the complete two-row tapestry at the default Near scale, add detailed artwork zooming in the scene reader, and accent the words of Jesus within the scripture displayed beside the artwork.

## Tapestry titles

Each tapestry receives one short title:

1. **The Scroll Opens**
2. **The Trumpets Sound**
3. **The Dragon Makes War**
4. **The Earth Is Reaped**
5. **Babylon Falls**
6. **All Things Made New**

Add `title` to each tapestry record in the generated manifest. The tapestry page hero and homepage index use this title. Movement cards retain their full titles and descriptions. The now-unused compact `label` property is removed from movement records, their TypeScript type, generator data, and validation.

## Default tapestry scale

The existing scale choices remain `Near`, `Room`, and `Detail`, but the initial selection changes from Room to Near. Near calculates a card width that fits all seven scenes and six gaps within the available desktop stage width, so both authored rows are visible without initial horizontal scrolling. Room and Detail retain larger fixed card widths and horizontal scrolling. Existing mobile behavior remains a single full-width column.

Keyboard `+` and `−` controls continue to move through the three gallery scales, starting from Near.

## Reader artwork interaction

Create a focused zoomable artwork stage inside the existing scene dialog without adding a dependency.

### Shared controls

- Overlay `−`, `+`, and `Reset` controls on the artwork pane.
- Use bounded zoom steps from `1×` through `4×` and expose the current scale as accessible text.
- Disable decrement and Reset at `1×`, and disable increment at `4×`.
- Reset zoom and pan whenever the selected scene changes.
- At enlarged scales, the artwork can be dragged to pan within its pane.
- Preserve the existing reader-to-preview image fallback. If both sources fail, show the current descriptive fallback and disable zoom controls.

### Desktop and pointer devices

- At `1×`, hovering over the artwork displays a magnified detail lens centered on the pointer position.
- The lens is visual-only and does not intercept pointer events.
- Clicking the artwork toggles between fitted `1×` and persistent `2×`, anchored around the clicked point.
- At persistent zoom, hide the hover lens and use grab/grabbing cursors for panning.

### iPad and touch devices

- Do not show the hover lens on devices without hover capability.
- A two-finger pinch changes persistent artwork zoom smoothly between `1×` and `4×`, anchored around the gesture midpoint.
- One-finger dragging pans an enlarged image.
- Keep the existing split dialog on iPad-sized viewports so the artwork and independently scrollable scripture remain visible together. Phone-sized layouts continue to stack artwork above scripture.
- The on-image controls remain available as a discoverable fallback to gestures.

## Words of Jesus

The canonical displayed wording remains the committed World English Bible verse-per-line text. The official WEB Revelation USFM file supplies only its `\wj … \wj*` semantic markers.

During content generation:

1. Parse the Revelation USFM file and clean word, note, and study markup without losing `\wj` boundaries.
2. Extract each words-of-Jesus phrase by chapter and verse.
3. Match those phrases sequentially against the canonical VPL verse text.
4. Store matched character ranges on the generated verse as `wordsOfJesus: { start: number; end: number }[]`.
5. Fail generation if a marked phrase cannot be matched exactly, if ranges overlap, or if a range falls outside its verse.

`WEB_USFM_PATH` points to either the Revelation `.usfm` file or the official `engwebp_usfm.zip`; the generator selects `96-REVengwebp.usfm` from the archive. Update `.env.example` and content-generation documentation accordingly. Static builds do not require either source file because they consume the committed generated JSON.

In both `SceneDialog` and the full chapter reader, split verse text at the generated ranges and render only marked spans with a `words-of-jesus` class. Use the existing gold color at normal font weight. Narration inside a partially marked verse remains unchanged. Both reading surfaces share the same range-rendering helper so their treatment cannot drift.

## Components and data flow

- `scripts/lib/content.mjs` parses and validates USFM speech spans.
- `scripts/generate-content.mjs` combines canonical VPL text with USFM ranges and writes them to `content/revelation.web.json`.
- `lib/content.ts` adds tapestry titles and optional verse speech ranges to the public types.
- `components/TapestryViewer.tsx` renders tapestry titles and defaults to the fitted Near scale.
- `components/SceneDialog.tsx` owns reader zoom state, pointer/touch gestures, and highlighted scripture rendering.
- `components/ArtworkImage.tsx` remains the single image-loading and fallback boundary; it exposes only the minimal load/failure information the zoom stage needs.
- `app/globals.css` supplies fitted gallery sizing, zoom-stage/lens/control styling, touch and pointer states, and gold speech styling.

No new package, route, canvas rendering layer, or persistent user preference is introduced.

## Accessibility and failure behavior

- Zoom controls are real buttons with explicit accessible names and disabled states.
- The scale readout uses an accessible status label without announcing continuous pointer movement.
- Keyboard focus remains visible, Escape still closes the dialog, and scene navigation remains unchanged.
- Reduced-motion preferences remove zoom transition animation without disabling zoom.
- Image fallback content remains readable and does not expose nonfunctional zoom controls.
- Invalid USFM or mismatched canonical wording stops content generation with a chapter-and-verse-specific error.

## Verification

- Unit-test USFM parsing for fully marked, partially marked, multi-line, unmarked, and mismatched verses.
- Validate tapestry titles, exact movement counts, and every generated speech range.
- Browser-test all six short titles and Near as the initial pressed scale.
- Verify Near has no initial horizontal overflow on desktop.
- Browser-test desktop lens visibility, click-to-zoom, controls, Reset, panning, scene-change reset, and the failed-image state.
- Browser-test representative full, partial, and unmarked scripture highlighting.
- Exercise pinch and pan with touch pointer events and visually inspect an iPad portrait and landscape layout.
- Run content validation, unit tests, the production build, and the complete desktop/mobile exhibition suite.

## Scope

This change does not alter movement summaries, scene metadata, artwork mapping, canonical scripture wording, navigation, licensing, or the Obsidian vault. The full chapter reader changes only by applying the same generated gold speech spans used beside scene artwork.
