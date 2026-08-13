import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
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
  const figureLines = markdown.match(/^!\[[^\n]+\]\((https:\/\/assets\.example\.test\/releases\/v1\/web\/1920\/[^)]+\.webp)\)$/gm) ?? [];
  const sceneCaptions = [...markdown.matchAll(/^\*Movement [IVX]+ · (T\d-(?:00|[TB]\d{2})) ·/gm)].map((match) => match[1]);

  assert.equal(chapterHeadings.length, 22);
  assert.equal(verseLines.length, 404);
  assert.equal(figureLines.length, 90);
  assert.equal(sceneCaptions.length, 90);
  assert.equal(new Set(sceneCaptions).size, 90);
  assert.match(markdown, /^---\ntitle: "The Revelation to John"/);
  assert.match(markdown, /\*\*22:21\*\* The grace of the Lord Jesus Christ be with all the saints\. Amen\./);
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
