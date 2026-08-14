# Red-Letter Book Export Design

## Goal

Preserve the canonical words-of-Jesus ranges in `export.md` and make them render as a restrained crimson in Google Docs-compatible DOCX, EPUB, and PDF editions without changing verse wording, numbering, or artwork placement.

## Design

The Markdown renderer will wrap each existing `wordsOfJesus` character range in a Pandoc bracketed span with three attributes: the `words-of-jesus` class, inline `color: #9B1C31` for EPUB/HTML, and the `Words of Jesus` custom character style for DOCX. Text outside those ranges, including verse numbers, remains unstyled. Readers that ignore Pandoc attributes still show the complete scripture text.

The release builder will add one 1920px-or-smaller JPEG derivative per scene at `releases/v1/book/images/<scene-id>.jpg`. `export.md` will use those 90 keys instead of WebP reader keys because Google Docs can omit WebP media embedded in DOCX. Existing preview, reader, original, and archive paths remain unchanged.

A small `public/red-letter-reference.docx` will define the `Words of Jesus` character style in `#9B1C31`. Pandoc's DOCX command will enable `bracketed_spans` and use that reference document. EPUB will preserve the inline class and color attribute. PDF instructions will use WeasyPrint through Pandoc's HTML path so the same inline color survives without LaTeX; Google Docs export remains a supported fallback.

## Validation

- The generated Markdown contains exactly one semantic span for every canonical `wordsOfJesus` range and reconstructs every verse exactly after annotations are removed.
- It contains 22 chapters, 404 verses, 90 unique scene captions, and 90 unique JPEG book-image URLs.
- Release validation requires 90 deterministic book JPEGs in addition to the existing assets.
- The reference DOCX contains a `Words of Jesus` character style with color `9B1C31`.
- Fresh DOCX, EPUB, and PDF conversions contain all 90 images; the DOCX is rendered page-by-page and visually inspected for red speech, artwork, clipping, and layout defects.

## Non-goals

- No changes to canonical scripture wording or USFM-derived ranges.
- No new runtime dependency or client-side document generator.
- No redesign of the reader or homepage.
