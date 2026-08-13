# Convert the illuminated Markdown book

## Download the source

Choose both `export.md` and `red-letter reference` in the homepage’s Open archive section, and keep them in the same folder. The reference document makes the exact words of Jesus render in crimson (`#9B1C31`) in Word and Google Docs. A production export uses public R2 image URLs. A local export uses `http://127.0.0.1:3101`, so keep the local asset server running while Pandoc converts it.

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

### Microsoft Word / Google Docs (red-letter edition)

```bash
pandoc export.md --from=markdown+yaml_metadata_block+bracketed_spans+link_attributes --standalone --toc --reference-doc=red-letter-reference.docx -o revelations.docx
```

Upload `revelations.docx` to Google Drive, right-click it, and choose **Open with → Google Docs**. The 90 JPEG illuminations and red-letter formatting are retained; edit normally. To make a PDF there, choose **File → Download → PDF Document (.pdf)**.

### EPUB

```bash
pandoc export.md --from=markdown+yaml_metadata_block+bracketed_spans+link_attributes --standalone --toc --split-level=2 -o revelations.epub
```

Pandoc downloads the linked images during conversion and includes them in the EPUB.

### PDF

Install WeasyPrint once. It avoids the `pdflatex not found` error and preserves the red-letter HTML styling:

```bash
brew install weasyprint
```

```bash
pandoc export.md --from=markdown+yaml_metadata_block+bracketed_spans+link_attributes --to=html5 --standalone --toc --pdf-engine=weasyprint -o revelations.pdf
```

If you do not want to install WeasyPrint, use the DOCX → Google Docs → Download as PDF path above.

## Troubleshooting missing images

- Local export: confirm `npm run dev:local` is still running and `http://127.0.0.1:3101/releases/v1/book/images/T1-00.jpg` opens.
- Production export: confirm the R2 custom domain is reachable from the machine running Pandoc.
- Re-download `export.md` after changing `NEXT_PUBLIC_ASSET_BASE_URL`; the URLs are generated at build time.
- For red lettering in Word or Google Docs, ensure `red-letter-reference.docx` is beside `export.md` when running the DOCX command.
