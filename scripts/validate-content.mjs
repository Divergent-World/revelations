import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateSceneMetadata, validateWordsOfJesusRanges } from "./lib/content.mjs";

const root = path.resolve(import.meta.dirname, "..");
const sourceMap = JSON.parse(await readFile(path.join(root, "content", "source-map.json"), "utf8"));
const sceneMetadata = JSON.parse(await readFile(path.join(root, "content", "scene-metadata.json"), "utf8"));
const { tapestries, scenes } = JSON.parse(await readFile(path.join(root, "content", "tapestries.json"), "utf8"));
const { chapters } = JSON.parse(await readFile(path.join(root, "content", "revelation.web.json"), "utf8"));
const metadataById = validateSceneMetadata(sceneMetadata, sourceMap.map(({ id }) => id), chapters);
const canonicalVerses = new Map();

for (const { chapter, verses } of chapters) {
  for (const verse of verses) {
    const label = `Revelation ${chapter}:${verse.number}`;
    validateWordsOfJesusRanges(verse, label);
    canonicalVerses.set(`${chapter}:${verse.number}`, verse);
  }
}

assert.equal(tapestries.length, 6, "expected six tapestries");
assert.equal(scenes.length, 90, "expected 90 canonical scenes");
assert.equal(sourceMap.length, 90, "expected 90 source-map entries");
assert.equal(chapters.length, 22, "expected 22 Revelation chapters");
assert.equal(new Set(scenes.map(({ id }) => id)).size, 90, "scene IDs must be unique");
assert.equal(new Set(sourceMap.map(({ id }) => id)).size, 90, "source-map IDs must be unique");
assert.ok(sourceMap.every(({ sourcePath }) => !sourcePath.includes("References/") && !/16 - Counting|17 - The Seventh Seal/.test(sourcePath)), "research references must be excluded");

for (const scene of scenes) {
  const metadata = metadataById.get(scene.id);
  assert.equal(scene.title, metadata.title, `${scene.id}: stale title`);
  assert.deepEqual(scene.scriptureSpans, metadata.spans, `${scene.id}: stale scripture spans`);
  for (const passage of scene.passages) {
    for (const verse of passage.verses) {
      const label = `${scene.id} ${verse.chapter}:${verse.verse}`;
      const canonical = canonicalVerses.get(`${verse.chapter}:${verse.verse}`);
      assert.ok(canonical, `${label}: canonical Revelation verse missing`);
      validateWordsOfJesusRanges(verse, label);
      assert.deepEqual(verse.wordsOfJesus, canonical.wordsOfJesus, `${label}: stale words-of-Jesus ranges`);
    }
  }
}

const expectedMovementCounts = [4, 4, 5, 5, 5, 5];
for (const tapestry of tapestries) {
  assert.equal(typeof tapestry.title, "string", `Tapestry ${tapestry.id} needs a title`);
  assert.ok(tapestry.title.trim(), `Tapestry ${tapestry.id} title must not be empty`);
  assert.equal(tapestry.movements.length, expectedMovementCounts[tapestry.id - 1], `Tapestry ${tapestry.id} has the wrong movement count`);
  for (const [index, movement] of tapestry.movements.entries()) {
    assert.ok(!("label" in movement), `Tapestry ${tapestry.id} movement ${index + 1} must not expose a label`);
    assert.equal(typeof movement.title, "string", `Tapestry ${tapestry.id} movement ${index + 1} needs a title`);
    assert.ok(movement.title.trim(), `Tapestry ${tapestry.id} movement ${index + 1} title must not be empty`);
    assert.equal(typeof movement.description, "string", `Tapestry ${tapestry.id} movement ${index + 1} needs a description`);
    assert.ok(movement.description.trim(), `Tapestry ${tapestry.id} movement ${index + 1} description must not be empty`);
  }
  assert.equal(tapestry.sceneIds.length, 15, `Tapestry ${tapestry.id} must contain 15 scenes`);
  const entries = tapestry.sceneIds.map((id) => scenes.find((scene) => scene.id === id));
  assert.ok(entries.every(Boolean), `Tapestry ${tapestry.id} references a missing scene`);
  assert.equal(entries.filter(({ row }) => row === "lead").length, 1);
  assert.equal(entries.filter(({ row }) => row === "top").length, 7);
  assert.equal(entries.filter(({ row }) => row === "bottom").length, 7);
}

console.log("Content valid: 6 tapestries · 90 scenes · 22 chapters · 0 research references");
