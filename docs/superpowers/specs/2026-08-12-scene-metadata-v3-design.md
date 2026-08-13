# Corrected Scene Metadata Design

## Goal

Update the exhibition to use the corrected scene titles and Revelation anchors from `MASTER_INDEX_v3.json` without copying its unrelated authoring and image-generation fields into this repository.

The change must preserve all 90 stable scene IDs and their existing image files, canvas positions, tapestry order, checksums, measured dimensions, attribution, and licenses.

## Canonical Metadata

Add one compact checked-in file, `content/scene-metadata.json`, containing exactly 90 records with only these fields:

```json
{
  "id": "T1-T01",
  "title": "Corrected scene title",
  "anchor": "Rev 2:1–7"
}
```

The supplied `MASTER_INDEX_v3.json` is an extraction source, not a runtime or repository dependency. Its status, canvas preset, output dimensions, style, template, reference, and other generation fields are deliberately excluded.

Scene IDs remain permanent. The compact file must contain every existing scene ID exactly once and may change only its title and scripture anchor.

## Generation Flow

`scripts/generate-content.mjs` will read the compact metadata file instead of the obsolete `INDEX/Master Index.md` metadata table.

The canvases remain authoritative for which source image belongs to each scene and for visual ordering. Existing source files are never renamed or modified. Actual source-image inspection remains authoritative for dimensions and checksums; v3 output-target dimensions are ignored.

For every scene, generation will combine:

- the stable ID and image assignment derived from the canvas;
- the corrected title and anchor from `content/scene-metadata.json`;
- the existing attribution and licensing constants;
- derived normalized scripture spans, display reference, WEB passage text, alt text, and image URLs.

All verse-to-scene backlinks continue to derive from normalized scripture spans, so correcting an anchor automatically updates the Revelation reader without maintaining a second mapping.

`content/source-map.json` and `content/revelation.web.json` should remain byte-for-byte unchanged. `content/tapestries.json` is regenerated and should differ only where a corrected title or anchor changes its derived fields.

## Validation and Failure Behavior

Generation and content validation must fail with a clear error when:

- the compact metadata file does not contain exactly 90 records;
- an ID is missing, duplicated, unknown, or assigned to a different tapestry slot;
- a title is empty;
- an anchor cannot be normalized into a valid Revelation verse span; or
- a normalized span falls outside the 22 WEB chapters and their verse bounds.

Content validation will compare every generated scene against the compact record, including title and normalized anchor, so stale checked-in output cannot pass validation.

Display references must be unambiguous. Whole-chapter and cross-chapter anchors must retain chapter meaning rather than being formatted as a same-chapter verse range.

## Release Artifacts

After regenerating canonical content, rebuild and validate the local v1 release so its manifest and ZIP contain the corrected `tapestries.json`. The 90 originals and their WebP derivatives remain visually and byte-for-byte equivalent because no asset assignment or processing setting changes.

Generated files under `dist/` remain ignored and local. This work does not upload to R2, alter versioned remote objects, or check large media into Git.

## Testing

Add focused tests that prove:

- all 90 compact records map one-to-one to the 90 canonical scene IDs;
- the corrected metadata produces the expected title and normalized spans;
- missing, duplicate, unknown, empty-title, malformed-anchor, and out-of-bounds records fail;
- whole-chapter and cross-chapter display references are accurate;
- generated content still has six tapestries, 15 scenes per tapestry, and 22 WEB chapters;
- source paths, source checksums, scene ordering, image dimensions, attribution, and license data do not change;
- release validation succeeds after the manifest and ZIP are rebuilt.

## Out of Scope

- Copying the full v3 master index into this repository.
- Changing image files, filenames, scene IDs, canvas order, artwork derivatives, attribution, or licensing.
- Uploading or replacing an R2 release.
- Community database, account, comment, voting, upload, or remix features.
