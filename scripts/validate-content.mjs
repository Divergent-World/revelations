import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { validateSceneMetadata } from "./lib/content.mjs";

const root = path.resolve(import.meta.dirname, "..");
const sourceMap = JSON.parse(await readFile(path.join(root, "content", "source-map.json"), "utf8"));
const sceneMetadata = JSON.parse(await readFile(path.join(root, "content", "scene-metadata.json"), "utf8"));
const { tapestries, scenes } = JSON.parse(await readFile(path.join(root, "content", "tapestries.json"), "utf8"));
const { chapters } = JSON.parse(await readFile(path.join(root, "content", "revelation.web.json"), "utf8"));
const metadataById = validateSceneMetadata(sceneMetadata, sourceMap.map(({ id }) => id), chapters);

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
}

for (const tapestry of tapestries) {
  assert.equal(tapestry.sceneIds.length, 15, `Tapestry ${tapestry.id} must contain 15 scenes`);
  const entries = tapestry.sceneIds.map((id) => scenes.find((scene) => scene.id === id));
  assert.ok(entries.every(Boolean), `Tapestry ${tapestry.id} references a missing scene`);
  assert.equal(entries.filter(({ row }) => row === "lead").length, 1);
  assert.equal(entries.filter(({ row }) => row === "top").length, 7);
  assert.equal(entries.filter(({ row }) => row === "bottom").length, 7);
}

console.log("Content valid: 6 tapestries · 90 scenes · 22 chapters · 0 research references");
