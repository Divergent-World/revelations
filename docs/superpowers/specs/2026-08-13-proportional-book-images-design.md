# Proportional illuminated-book images

## Goal

Preserve every artwork's native aspect ratio in the exported DOCX, EPUB, and PDF editions. Portrait reader images must never be forced into the landscape frame used by the current Pandoc DOCX output.

## Cause

The Markdown renderer currently emits image links with no dimensions. Pandoc therefore applies one default DOCX drawing extent to every image (`3810000 × 2540000` EMU), which is 3:2. Native 2:3 portrait images are stretched horizontally into that landscape box.

## Design

`renderMarkdownBook` will attach explicit Markdown image attributes for every artwork. Dimensions are calculated from the scene's canonical `width` and `height`, preserving the exact aspect ratio and fitting within a printable maximum of 6.25 inches wide by 7.25 inches high.

For each scene, scale both dimensions by the smaller of the width and height bounds; round only the emitted inch values to two decimals. The output will therefore declare both `width` and `height`, allowing Pandoc to create matching DOCX drawing extents. The same attributes are kept by the EPUB and HTML/PDF paths.

The book-safe JPEG derivatives remain unchanged. No image is cropped, recompressed, duplicated, or moved.

## Verification

- A Markdown renderer test will assert that a 2:3 scene receives a 2:3 image box and a 3:2 scene receives a 3:2 image box, both within the print bounds.
- A generated DOCX inspection will compare each drawing extent against the embedded image's native ratio.
- The existing 90-image, 404-verse, and 91-red-letter-range checks remain green.
