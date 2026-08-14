import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { renderMarkdownBook } from "../lib/markdown-book.ts";

const { chapters } = JSON.parse(await readFile(new URL("../content/revelation.web.json", import.meta.url), "utf8"));
const { scenes } = JSON.parse(await readFile(new URL("../content/tapestries.json", import.meta.url), "utf8"));

const render = (overrides = {}) => renderMarkdownBook({
  chapters,
  scenes,
  assetBaseUrl: "https://assets.example.test",
  ...overrides,
});

test("renders the complete illuminated Revelation with every artwork once", () => {
  const markdown = render();
  const chapterHeadings = markdown.match(/^## Revelation \d+$/gm) ?? [];
  const verseLines = markdown.match(/^\*\*\d+:\d+\*\* /gm) ?? [];
  const figureLines = markdown.match(/^!\[[^\n]+\]\((https:\/\/assets\.example\.test\/releases\/v1\/book\/images\/[^)]+\.jpg)\)\{width=\d+\.\d+in height=\d+\.\d+in\}$/gm) ?? [];
  const sceneCaptions = [...markdown.matchAll(/^\*Movement [IVX]+ · (T\d-(?:00|[TB]\d{2})) ·/gm)].map((match) => match[1]);

  assert.equal(chapterHeadings.length, 22);
  assert.equal(verseLines.length, 404);
  assert.equal(figureLines.length, 90);
  assert.equal(sceneCaptions.length, 90);
  assert.equal(new Set(sceneCaptions).size, 90);
  assert.match(markdown, /^---\ntitle: "The Revelation to John"/);
  assert.match(markdown, /\*\*22:21\*\* The grace of the Lord Jesus Christ be with all the saints\. Amen\./);
});

test("emits print-safe image boxes with each scene's native aspect ratio", () => {
  const markdown = render();
  const dimensionsFor = (sceneId) => {
    const match = markdown.match(new RegExp(`https://assets\\.example\\.test/releases/v1/book/images/${sceneId}\\.jpg\\)\\{width=(\\d+\\.\\d+)in height=(\\d+\\.\\d+)in\\}`));
    assert.ok(match, `missing dimensions for ${sceneId}`);
    return { width: Number(match[1]), height: Number(match[2]) };
  };

  for (const [sceneId, ratio] of [["T1-00", 2 / 3], ["T1-T01", 3 / 2]]) {
    const { width, height } = dimensionsFor(sceneId);
    assert.ok(width <= 6.25 && height <= 7.25, `${sceneId} exceeds print bounds`);
    assert.ok(Math.abs(width / height - ratio) < 0.01, `${sceneId} is not proportional`);
  }
});

test("embeds a print-only aspect-ratio guard for PDF conversion", () => {
  const markdown = render();
  assert.match(markdown, /@media print \{ img \{ height: auto !important; max-width: 100%; object-fit: contain; \} \}/);
});

test("annotates every canonical words-of-Jesus range without changing scripture", () => {
  const markdown = render();
  const annotation = /\[([^\]]*)\]\{\.words-of-jesus style="color: #9B1C31" custom-style="Words of Jesus"\}/g;
  const expectedRanges = chapters.reduce(
    (count, chapter) => count + chapter.verses.reduce((verseCount, verse) => verseCount + (verse.wordsOfJesus?.length ?? 0), 0),
    0,
  );
  assert.equal([...markdown.matchAll(annotation)].length, expectedRanges);

  for (const chapter of chapters) {
    for (const verse of chapter.verses) {
      const line = markdown.split("\n").find((candidate) => candidate.startsWith(`**${chapter.chapter}:${verse.number}** `));
      assert.ok(line, `missing Revelation ${chapter.chapter}:${verse.number}`);
      const reconstructed = line.slice(`**${chapter.chapter}:${verse.number}** `.length).replaceAll(annotation, "$1");
      assert.equal(reconstructed, verse.text, `Revelation ${chapter.chapter}:${verse.number} changed`);
    }
  }
});

test("publishes a red-letter reference DOCX for Pandoc", () => {
  const reference = fileURLToPath(new URL("../public/red-letter-reference.docx", import.meta.url));
  const styles = execFileSync("unzip", ["-p", reference, "word/styles.xml"], { encoding: "utf8" });
  assert.match(styles, /<w:style[^>]+w:type="character"[^>]+w:styleId="WordsofJesus"/);
  assert.match(styles, /<w:name w:val="Words of Jesus"\s*\/>/);
  assert.match(styles, /<w:color w:val="9B1C31"\s*\/>/);
});

test("documents Pandoc's Markdown extensions for red letters and proportional figures", async () => {
  const instructions = await readFile(new URL("../docs/book-export.md", import.meta.url), "utf8");
  assert.match(instructions, /--from=markdown\+yaml_metadata_block\+bracketed_spans\+link_attributes/);
});

test("places shared and multi-span scenes once at their first verse", () => {
  const markdown = render();
  const verseOne = markdown.indexOf("**1:1**");
  assert.ok(markdown.indexOf("· T1-00 ·") < verseOne);

  const verseNineteenEleven = markdown.indexOf("**19:11**");
  const shared = ["T6-00", "T6-T01", "T6-T03"].map((id) => markdown.indexOf(`· ${id} ·`));
  assert.ok(shared.every((index) => index >= 0 && index < verseNineteenEleven));
  assert.deepEqual([...shared].sort((a, b) => a - b), shared);
  assert.equal(markdown.match(/· T1-T01 ·/g)?.length, 1);
});

test("rejects a relative asset origin", () => {
  assert.throws(() => render({ assetBaseUrl: "/assets" }), /absolute HTTP or HTTPS/);
});

test("rejects duplicate scene IDs and duplicate image URLs", () => {
  const duplicateId = scenes.map((scene, index) => index === 1 ? { ...scene, id: scenes[0].id } : scene);
  assert.throws(() => render({ scenes: duplicateId }), /Duplicate scene ID/);

  const duplicateImage = scenes.map((scene, index) => index === 1 ? { ...scene, images: { ...scene.images, reader: scenes[0].images.reader } } : scene);
  assert.throws(() => render({ scenes: duplicateImage }), /Duplicate reader image URL/);
});

test("rejects incomplete scripture and invalid first anchors", () => {
  assert.throws(() => render({ chapters: chapters.slice(0, 21) }), /chapters 1 through 22/);
  const invalidAnchor = scenes.map((scene, index) => index === 0 ? {
    ...scene,
    scriptureSpans: [{ ...scene.scriptureSpans[0], startChapter: 99 }],
  } : scene);
  assert.throws(() => render({ scenes: invalidAnchor }), /first scripture anchor is missing/);
});

test("rejects reader image keys that escape the canonical release tree", () => {
  const invalidImage = scenes.map((scene, index) => index === 0 ? {
    ...scene,
    images: { ...scene.images, reader: "https://unexpected.example/T1-00.webp" },
  } : scene);
  assert.throws(() => render({ scenes: invalidImage }), /canonical release key/);
});

for (const [mutation, reader] of [
  ["encoded traversal", "releases/%2e%2e/private.webp"],
  ["wrong release tree", "releases/v1/web/640/T1-00.webp"],
  ["query string", "releases/v1/web/1920/T1-00.webp?download=1"],
  ["fragment", "releases/v1/web/1920/T1-00.webp#artwork"],
]) {
  test(`rejects a reader image key with ${mutation}`, () => {
    const invalidImage = scenes.map((scene, index) => index === 0 ? {
      ...scene,
      images: { ...scene.images, reader },
    } : scene);
    assert.throws(() => render({ scenes: invalidImage }), /canonical release key/);
  });
}
