import assert from "node:assert/strict";
import test from "node:test";

import { readFile } from "node:fs/promises";

const { tapestries } = JSON.parse(await readFile(new URL("../content/tapestries.json", import.meta.url), "utf8"));

test("compact titles replace redundant movement labels", () => {
  const titles = [
    "The Scroll Opens",
    "The Trumpets Sound",
    "The Dragon Makes War",
    "The Earth Is Reaped",
    "Babylon Falls",
    "All Things Made New",
  ];

  assert.deepEqual(tapestries.map(({ title }) => title), titles);
  assert.ok(tapestries.every(({ movements }) =>
    movements.every((movement) => !("label" in movement)),
  ));
});

test("movement narrative retains approved spacing", () => {
  assert.match(
    tapestries[1].movements[2].description,
    /cosmic level — land, sea, rivers, sky, light itself/,
  );
});
