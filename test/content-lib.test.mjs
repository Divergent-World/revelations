import assert from "node:assert/strict";
import test from "node:test";

import {
  annotateWordsOfJesus,
  canonicalImageNodes,
  displayReference,
  mapCanvasToSceneIds,
  parseRevelationAnchor,
  parseUsfmRevelation,
  parseVplRevelation,
  validateWordsOfJesusRanges,
  validateSceneMetadata,
} from "../scripts/lib/content.mjs";

const twoVerseChapter = [{ chapter: 1, verses: [{ number: 1 }, { number: 2 }] }];

test("validateSceneMetadata normalizes exact scene metadata", () => {
  const metadata = validateSceneMetadata(
    [{ id: "T1-00", title: "Reader", anchor: "Rev 1:1–2" }],
    ["T1-00"],
    twoVerseChapter,
  );
  assert.deepEqual([...metadata.values()], [{
    id: "T1-00",
    title: "Reader",
    anchor: "Rev 1:1–2",
    spans: [{ startChapter: 1, startVerse: 1, endChapter: 1, endVerse: 2 }],
  }]);
});

test("validateSceneMetadata rejects duplicate scene IDs", () => {
  const record = { id: "T1-00", title: "Reader", anchor: "Rev 1:1" };
  assert.throws(() => validateSceneMetadata([record, record], ["T1-00"], twoVerseChapter), /duplicate scene ID T1-00/);
});

test("validateSceneMetadata rejects missing and unknown scene IDs", () => {
  assert.throws(() => validateSceneMetadata([], ["T1-00"], twoVerseChapter), /missing scene ID T1-00/);
  assert.throws(
    () => validateSceneMetadata([{ id: "T9-00", title: "Unknown", anchor: "Rev 1:1" }], ["T1-00"], twoVerseChapter),
    /unknown scene ID T9-00/,
  );
});

test("validateSceneMetadata rejects empty titles and malformed anchors", () => {
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: " ", anchor: "Rev 1:1" }], ["T1-00"], twoVerseChapter),
    /T1-00: title must not be empty/,
  );
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: "Reader", anchor: "Chapter one" }], ["T1-00"], twoVerseChapter),
    /Unsupported Revelation anchor/,
  );
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: "Reader" }], ["T1-00"], twoVerseChapter),
    /T1-00: anchor must be a non-empty string/,
  );
  assert.throws(
    () => validateSceneMetadata([null], ["T1-00"], twoVerseChapter),
    /metadata record must be an object/,
  );
});

test("validateSceneMetadata rejects unrelated authoring fields", () => {
  assert.throws(
    () => validateSceneMetadata(
      [{ id: "T1-00", title: "Reader", anchor: "Rev 1:1", status: "survives" }],
      ["T1-00"],
      twoVerseChapter,
    ),
    /T1-00: unsupported metadata field status/,
  );
});

test("validateSceneMetadata rejects reversed and out-of-bounds spans", () => {
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: "Reader", anchor: "Rev 1:2–1" }], ["T1-00"], twoVerseChapter),
    /T1-00: reversed Revelation span/,
  );
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: "Reader", anchor: "Rev 1:3" }], ["T1-00"], twoVerseChapter),
    /T1-00: Revelation 1:3 is out of bounds/,
  );
  assert.throws(
    () => validateSceneMetadata([{ id: "T1-00", title: "Reader", anchor: "Rev 2" }], ["T1-00"], twoVerseChapter),
    /T1-00: Revelation chapter 2 is out of bounds/,
  );
});

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

const wordsOfJesusUsfm = String.raw`\c 1
\v 1 Before \wj I am \w Jesus|lemma="Jesus"\w*\wj* after.
\v 2 \wj First\wj* and \wj second\f + \ft note\f* phrase\wj*.
\v 3 Ordinary text.`;

const wordsOfJesusVpl = [{
  chapter: 1,
  verses: [
    { number: 1, text: "Before I am Jesus after." },
    { number: 2, text: "First and second phrase." },
    { number: 3, text: "Ordinary text." },
  ],
}];

test("annotateWordsOfJesus derives exact words of Jesus ranges without changing VPL text", () => {
  const annotated = annotateWordsOfJesus(wordsOfJesusVpl, wordsOfJesusUsfm);

  assert.deepEqual(annotated[0].verses[0].wordsOfJesus, [{ start: 7, end: 17 }]);
  assert.equal(annotated[0].verses[0].text.slice(7, 17), "I am Jesus");
  assert.deepEqual(annotated[0].verses[1].wordsOfJesus, [
    { start: 0, end: 5 },
    { start: 10, end: 23 },
  ]);
  assert.equal(annotated[0].verses[2].wordsOfJesus, undefined);
  assert.deepEqual(wordsOfJesusVpl[0].verses[0], { number: 1, text: "Before I am Jesus after." });
});

test("annotateWordsOfJesus attaches a marked closing quote after a speech footnote", () => {
  const usfm = String.raw`\c 1
\v 1 \wj “Alpha,\wj*\f + \ft note\f*\wj ”\wj* says.`;
  const vpl = [{ chapter: 1, verses: [{ number: 1, text: "“Alpha,” says." }] }];

  assert.deepEqual(annotateWordsOfJesus(vpl, usfm)[0].verses[0].wordsOfJesus, [
    { start: 0, end: 7 },
    { start: 7, end: 8 },
  ]);
});

test("annotateWordsOfJesus rejects words of Jesus wording mismatches", () => {
  const vpl = structuredClone(wordsOfJesusVpl);
  vpl[0].verses[0].text = "Different wording.";

  assert.throws(
    () => annotateWordsOfJesus(vpl, wordsOfJesusUsfm),
    /Revelation 1:1.*wording mismatch/,
  );
});

test("annotateWordsOfJesus rejects unterminated words of Jesus markers", () => {
  const usfm = String.raw`\c 1
\v 1 Before \wj speech.`;
  const vpl = [{ chapter: 1, verses: [{ number: 1, text: "Before speech." }] }];

  assert.throws(
    () => annotateWordsOfJesus(vpl, usfm),
    /Revelation 1:1.*unterminated \\wj/,
  );
});

test("annotateWordsOfJesus rejects overlapping speech ranges", () => {
  const usfm = String.raw`\c 1
\v 1 \wj First \wj second\wj* phrase\wj*.`;
  const vpl = [{ chapter: 1, verses: [{ number: 1, text: "First second phrase." }] }];

  assert.throws(
    () => annotateWordsOfJesus(vpl, usfm),
    /Revelation 1:1.*overlapping \\wj/,
  );
});

test("validateWordsOfJesusRanges rejects invalid and out-of-bounds speech ranges", () => {
  assert.throws(
    () => validateWordsOfJesusRanges({ text: "Jesus", wordsOfJesus: [{ start: 0, end: 6 }] }, "Revelation 1:1"),
    /Revelation 1:1.*out of bounds/,
  );
  assert.throws(
    () => validateWordsOfJesusRanges({ text: "Jesus", wordsOfJesus: [{ start: 0.5, end: 5 }] }, "Revelation 1:1"),
    /Revelation 1:1.*integers/,
  );
  assert.throws(
    () => validateWordsOfJesusRanges({ text: "Jesus said", wordsOfJesus: [{ start: 6, end: 10 }, { start: 0, end: 5 }] }, "Revelation 1:1"),
    /Revelation 1:1.*sorted/,
  );
  assert.throws(
    () => validateWordsOfJesusRanges({ text: "Jesus said", wordsOfJesus: [{ start: 0, end: 7 }, { start: 6, end: 10 }] }, "Revelation 1:1"),
    /Revelation 1:1.*overlap/,
  );
});
