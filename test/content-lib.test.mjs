import assert from "node:assert/strict";
import test from "node:test";

import {
  canonicalImageNodes,
  displayReference,
  mapCanvasToSceneIds,
  parseRevelationAnchor,
  parseUsfmRevelation,
  parseVplRevelation,
} from "../scripts/lib/content.mjs";

test("parseRevelationAnchor normalizes ranges and multiple references", () => {
  assert.deepEqual(parseRevelationAnchor("Rev 1:11; Rev 2–3"), [
    { startChapter: 1, startVerse: 11, endChapter: 1, endVerse: 11 },
    { startChapter: 2, startVerse: 1, endChapter: 3, endVerse: null },
  ]);
  assert.deepEqual(parseRevelationAnchor("Rev 19:19–21"), [
    { startChapter: 19, startVerse: 19, endChapter: 19, endVerse: 21 },
  ]);
});

test("displayReference does not confuse a chapter range with a verse range", () => {
  assert.equal(displayReference(parseRevelationAnchor("Rev 2–3")), "Revelation 2–3");
  assert.equal(displayReference(parseRevelationAnchor("Rev 19:19–21")), "Revelation 19:19–21");
});

test("parseVplRevelation returns all Revelation verses by chapter", () => {
  const vpl = "GEN 1:1 Ignored\nREV 1:1 First verse.\nREV 1:2 Second verse.\nREV 2:1 New chapter.";
  assert.deepEqual(parseVplRevelation(vpl), [
    { chapter: 1, verses: [{ number: 1, text: "First verse." }, { number: 2, text: "Second verse." }] },
    { chapter: 2, verses: [{ number: 1, text: "New chapter." }] },
  ]);
});

test("canonicalImageNodes excludes research references", () => {
  const nodes = [
    { id: "lead", type: "file", file: "Apocalypse Tapestry/Tapestries/I/1.png" },
    { id: "scene", type: "file", file: "Apocalypse Tapestry/Tapestries/I/01-01.png" },
    { id: "historic", type: "file", file: "Apocalypse Tapestry/Tapestries/I/16 - Counting of the elected.jpg" },
    { id: "reference", type: "file", file: "Apocalypse Tapestry/References/example.jpg" },
    { id: "note", type: "file", file: "Apocalypse Tapestry/Tapestries/I/Tapestry I.md" },
  ];
  assert.deepEqual(canonicalImageNodes(nodes).map(({ id }) => id), ["lead", "scene"]);
});

test("mapCanvasToSceneIds finds the portrait lead and orders two rows", () => {
  const nodes = [
    { id: "b2", type: "file", file: "b2.png", x: 100, y: 500, width: 400, height: 225 },
    { id: "lead", type: "file", file: "lead.jpg", x: 0, y: 0, width: 267, height: 400 },
    { id: "t2", type: "file", file: "t2.png", x: 100, y: 100, width: 400, height: 225 },
    { id: "b1", type: "file", file: "b1.png", x: 0, y: 500, width: 400, height: 225 },
    { id: "t1", type: "file", file: "t1.png", x: 0, y: 100, width: 400, height: 225 },
  ];
  assert.deepEqual(mapCanvasToSceneIds(4, nodes, 2), [
    ["T4-00", "lead"],
    ["T4-T01", "t1"],
    ["T4-T02", "t2"],
    ["T4-B01", "b1"],
    ["T4-B02", "b2"],
  ]);
});

test("mapCanvasToSceneIds rejects malformed row counts", () => {
  assert.throws(
    () => mapCanvasToSceneIds(1, [{ id: "lead", file: "lead.png", width: 200, height: 400 }], 7),
    /expected 15 canonical images/,
  );
});

test("parseUsfmRevelation strips study markup without changing verse words", () => {
  const usfm = String.raw`\id REV
\c 1
\p
\v 1 \w This|strong="G1"\w* is \wj “written\wj* text.\f + \ft a note\f*
\v 2 Second verse.\x + \xt John 1:1\x*
\c 2
\v 1 Another chapter.`;
  assert.deepEqual(parseUsfmRevelation(usfm), [
    { chapter: 1, verses: [{ number: 1, text: "This is “written text." }, { number: 2, text: "Second verse." }] },
    { chapter: 2, verses: [{ number: 1, text: "Another chapter." }] },
  ]);
});
