# Revelations

An open-source, static exhibition of the Book of Revelation as a prophecy in six movements by Ali Rahman / Divergent World. The Next.js portal presents 90 canonical scenes beside the public-domain World English Bible text of Revelation.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_ASSET_BASE_URL` to a public R2 URL containing the `releases/v1/` tree. The `r2.dev` URL is appropriate only for development; use an R2 custom domain for production.

Before R2 is configured, run the app and generated `dist/` assets together with either package manager:

```bash
npm run dev:local
# or
yarn dev:local
```

This serves the application at `http://127.0.0.1:3000` and injects the local asset origin at `http://127.0.0.1:3101`. Generate the ignored release first with `npm run assets:release` or `yarn assets:release` if `dist/releases/v1` is absent.

## Content

- `content/tapestries.json` is the public, canonical scene manifest.
- `content/source-map.json` records private-vault source paths and checksums for reproducible releases.
- `content/revelation.web.json` contains all 22 Revelation chapters from the World English Bible verse-per-line distribution, with words-of-Jesus ranges derived from official USFM markers.

Regenerate content only with access to the sibling `Apocalypse Tapestry` vault, the official `engwebp_vpl.txt` file, and the official USFM file or ZIP archive:

```bash
WEB_VPL_PATH=/absolute/path/engwebp_vpl.txt WEB_USFM_PATH=/absolute/path/engwebp_usfm.zip npm run content:generate
npm run content:validate
```

VPL supplies the visible canonical scripture wording; USFM supplies only verified `\wj` words-of-Jesus ranges. The generator reads the vault but never renames, moves, or writes its files.

## Book export

The homepage’s `export.md` action downloads all 22 chapters with 90 unique linked illuminations. Download its companion `red-letter reference` file when creating DOCX: it preserves the words of Jesus in crimson in Word and Google Docs. See [Convert the illuminated Markdown book](docs/book-export.md) for Pandoc commands that create red-letter DOCX, EPUB, and PDF files.

## Build the artwork release

```bash
npm run assets:release
npm run assets:validate
```

This creates ignored files under `dist/releases/v1/`: 90 checksum-verified originals, 640px and 1920px WebP derivatives, 1920px-or-smaller book-safe JPEGs, the release manifest, checksums, and `revelations-artwork-v1.zip`.

Upload after setting the four R2 credentials shown in `.env.example`:

```bash
npm run assets:upload
```

Versioned uploads are append-only. The uploader validates the release and refuses to overwrite an existing `v1` object.

Connect a custom domain to the bucket, enable HTTPS and Cloudflare caching, then use that origin as `NEXT_PUBLIC_ASSET_BASE_URL` in Vercel. All versioned objects are uploaded with one-year immutable caching.

## Deployment

1. Import `Divergent-World/revelations` into Vercel.
2. Set `NEXT_PUBLIC_ASSET_BASE_URL` to the production R2 custom domain.
3. Keep the default build command (`npm run build`) and static `out/` output.
4. Smoke-test `/`, `/tapestries/1/`, `/embed/tapestries/1/`, and `/revelation/1/`.

Vercel Hobby is for personal, non-commercial use. Upgrade to Pro or another suitable host before commercial operation.

## Provenance and licenses

- Application and scripts: MIT (`LICENSE`).
- Artwork: CC BY-SA 4.0 (`LICENSE-ARTWORK.md`).
- Scripture: [World English Bible](https://ebible.org/engwebp/), public domain. Its text is stored unmodified; “World English Bible” is a trademark of eBible.org.
