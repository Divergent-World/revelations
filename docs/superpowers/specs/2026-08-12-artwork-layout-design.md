# Artwork Layout Design

## Goal

Render every tapestry preview without distortion and make oversized reader artwork vertically scrollable while scripture retains its independent scroll area.

## Design

- Scene cards use stable landscape frames; lead scenes use stable portrait frames.
- Images fill those frames with `object-fit: contain`, preserving the complete artwork and allowing subtle letterboxing where source ratios differ.
- Explicit CSS width and height override HTML dimension attributes so those attributes cannot elongate previews.
- Desktop reader artwork fills the available panel width at its natural aspect ratio. The artwork and scripture panels scroll independently.
- Mobile retains a viewport-height artwork panel whose contents can scroll vertically, followed by the scripture content.

## Verification

- Browser tests assert landscape preview geometry, non-distorting `contain` behavior, and scrollable reader artwork.
- Existing desktop/mobile ordering, dialog, keyboard, fallback, embed, and scripture tests remain green.
- Visual verification uses the generated local WebP assets at desktop and mobile viewports.
