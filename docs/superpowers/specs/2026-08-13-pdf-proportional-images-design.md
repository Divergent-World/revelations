# PDF proportional-image guard

## Goal

Prevent WeasyPrint PDF conversion from distorting artwork after it scales an image to fit the printable page, while leaving DOCX and EPUB behavior unchanged.

## Constraint

The DOCX writer requires both explicit width and height image attributes to avoid its default 3:2 frame. Removing either dimension therefore fixes neither the DOCX nor the one-file export requirement.

## Design

Embed a print-media CSS rule in the `export.md` YAML metadata through Pandoc's `header-includes` field. The rule applies only to print media:

```css
@media print {
  img { height: auto !important; max-width: 100%; object-fit: contain; }
}
```

WeasyPrint applies the rule when converting the standalone HTML to PDF. If an image's declared width is reduced to fit the printable page, its height recomputes from its natural aspect ratio rather than remaining a fixed value. DOCX does not consume the HTML print stylesheet, and EPUB does not apply print-media rules.

No companion stylesheet is required; the user continues to download only `export.md` plus the existing DOCX red-letter reference document.

## Verification

- Renderer tests assert the print-media rule is present in the book metadata.
- Generated standalone HTML contains the rule and image attributes.
- A WeasyPrint PDF renders portrait and landscape samples without stretching.
- Existing DOCX ratio, EPUB, image-count, verse-count, and red-letter checks remain green.
