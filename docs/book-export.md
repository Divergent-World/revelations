# Convert the illuminated Markdown book

## Download the source

Choose `export.md` in the homepage’s Open archive section. A production export uses public R2 image URLs. A local export uses `http://127.0.0.1:3101`, so keep the local asset server running while Pandoc converts it.

## Install Pandoc on macOS

```bash
brew install pandoc
```

## Convert a local export

From the repository, keep this running in one terminal:

```bash
npm run dev:local
```

In another terminal, change to the folder containing `export.md`.

### Microsoft Word / Google Docs

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc -o revelations.docx
```

Upload `revelations.docx` to Google Drive, right-click it, and choose **Open with → Google Docs**. Edit normally. To make a PDF, choose **File → Download → PDF Document (.pdf)** in Google Docs.

### EPUB

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc --split-level=2 -o revelations.epub
```

Pandoc downloads the linked images during conversion and includes them in the EPUB.

### PDF

If Pandoc already has access to a compatible PDF engine:

```bash
pandoc export.md --from=gfm+yaml_metadata_block --standalone --toc -o revelations.pdf
```

If no PDF engine is configured, use the DOCX → Google Docs → Download as PDF path above.

## Troubleshooting missing images

- Local export: confirm `npm run dev:local` is still running and `http://127.0.0.1:3101/releases/v1/web/1920/T1-00.webp` opens.
- Production export: confirm the R2 custom domain is reachable from the machine running Pandoc.
- Re-download `export.md` after changing `NEXT_PUBLIC_ASSET_BASE_URL`; the URLs are generated at build time.
