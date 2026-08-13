import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

import { displayReference, mapCanvasToSceneIds, parseVplRevelation, relativeObjectKey, validateSceneMetadata } from "./lib/content.mjs";

const repoRoot = path.resolve(import.meta.dirname, "..");
const vaultRoot = path.resolve(process.env.APOCALYPSE_VAULT ?? path.join(repoRoot, "..", "Apocalypse Tapestry"));
const vplPath = process.env.WEB_VPL_PATH ?? "/private/tmp/engwebp_vpl.txt";
const contentDir = path.join(repoRoot, "content");
const romans = ["I", "II", "III", "IV", "V", "VI"];

const summaries = [
  "Christ is revealed as king, the Lamb is found worthy, and the opened scroll sets judgment in motion.",
  "God seals the faithful, heaven prepares the trumpets, and creation gives way to escalating judgment.",
  "The witnesses are vindicated, the dragon fails to destroy the woman, and beastly powers demand worship.",
  "The beast gathers worship, the Lamb answers, heaven warns, and the world is harvested.",
  "The bowls are poured out, Babylon is exposed and destroyed, and the marriage of the Lamb appears.",
  "Christ returns in victory, evil is judged, and the holy city opens into the life and presence of God.",
];

const movements = [
  ["Revelation", "Heavenly worship", "The Lamb and the scroll", "Judgment and preservation"],
  ["The faithful sealed", "Trumpets prepared", "Creation struck", "The abyss and war unleashed"],
  ["Prophetic witness", "Martyrdom and vindication", "Cosmic war", "The beasts arise"],
  ["Counterfeit worship", "The Lamb's answer", "Angelic warnings", "Harvest and wrath"],
  ["Bowls of wrath", "Babylon revealed", "Babylon falls", "The true wedding"],
  ["The victorious rider", "Evil overthrown", "Final judgment", "New Jerusalem and communion"],
];

function versesForSpans(chapters, spans) {
  return spans.map((span) => ({
    reference: displayReference([span]),
    verses: chapters
      .filter(({ chapter }) => chapter >= span.startChapter && chapter <= span.endChapter)
      .flatMap(({ chapter, verses }) => {
        const maxVerse = span.endVerse ?? Number.POSITIVE_INFINITY;
        return verses
          .filter(({ number }) => (chapter > span.startChapter || number >= span.startVerse) && (chapter < span.endChapter || number <= maxVerse))
          .map(({ number, text }) => ({ chapter, verse: number, text }));
      }),
  }));
}

async function hashFile(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function main() {
  const vpl = await readFile(vplPath, "utf8").catch(() => {
    throw new Error(`WEB verse-per-line source missing at ${vplPath}. Set WEB_VPL_PATH to engwebp_vpl.txt.`);
  });
  const revelation = parseVplRevelation(vpl);
  if (revelation.length !== 22) throw new Error(`Expected 22 Revelation chapters, found ${revelation.length}`);

  const expectedSceneIds = romans.flatMap((_, index) => {
    const tapestry = index + 1;
    return [
      `T${tapestry}-00`,
      ...["T", "B"].flatMap((row) => Array.from({ length: 7 }, (__, position) => `T${tapestry}-${row}${String(position + 1).padStart(2, "0")}`)),
    ];
  });
  const compactMetadata = JSON.parse(await readFile(path.join(contentDir, "scene-metadata.json"), "utf8"));
  const metadata = validateSceneMetadata(compactMetadata, expectedSceneIds, revelation);
  const sourceMap = [];
  const scenes = [];
  const tapestries = [];

  for (let index = 0; index < romans.length; index += 1) {
    const tapestryNumber = index + 1;
    const roman = romans[index];
    const canvas = JSON.parse(await readFile(path.join(vaultRoot, "Tapestries", roman, `${roman}.canvas`), "utf8"));
    const assignments = mapCanvasToSceneIds(tapestryNumber, canvas.nodes);
    const nodes = new Map(canvas.nodes.map((node) => [node.id, node]));
    const sceneIds = [];

    for (const [sceneId, nodeId] of assignments) {
      const node = nodes.get(nodeId);
      const slot = metadata.get(sceneId);
      if (!node || !slot) throw new Error(`${sceneId}: canvas node or scene metadata missing`);
      const sourcePath = node.file.replace(/^Apocalypse Tapestry\//, "");
      const absolutePath = path.join(vaultRoot, sourcePath);
      const image = await sharp(absolutePath).metadata();
      const checksum = await hashFile(absolutePath);
      const spans = slot.spans;
      const sceneSlot = sceneId.split("-")[1];
      const row = sceneSlot === "00" ? "lead" : sceneSlot.startsWith("T") ? "top" : "bottom";
      const position = sceneSlot === "00" ? 0 : Number(sceneSlot.slice(1));
      const originalKey = relativeObjectKey(sceneId, sourcePath);
      const originalExtension = path.extname(sourcePath).toLowerCase();
      const scene = {
        id: sceneId,
        tapestry: tapestryNumber,
        row,
        position,
        title: slot.title,
        scriptureSpans: spans,
        displayReference: displayReference(spans),
        passages: versesForSpans(revelation, spans),
        alt: `${slot.title}, illustrating ${displayReference(spans)}.`,
        images: {
          preview: `releases/v1/web/640/${sceneId}.webp`,
          reader: `releases/v1/web/1920/${sceneId}.webp`,
          original: originalKey,
        },
        width: image.width,
        height: image.height,
        checksum,
        attribution: "Ali Rahman / Divergent World",
        license: "CC BY-SA 4.0",
      };
      scenes.push(scene);
      sceneIds.push(sceneId);
      sourceMap.push({ id: sceneId, sourcePath, originalExtension, checksum });
    }

    tapestries.push({
      id: tapestryNumber,
      roman,
      summary: summaries[index],
      movements: movements[index],
      leadSceneId: `T${tapestryNumber}-00`,
      sceneIds,
    });
  }

  await mkdir(contentDir, { recursive: true });
  await Promise.all([
    writeFile(path.join(contentDir, "source-map.json"), `${JSON.stringify(sourceMap, null, 2)}\n`),
    writeFile(path.join(contentDir, "tapestries.json"), `${JSON.stringify({ version: "v1", tapestries, scenes }, null, 2)}\n`),
    writeFile(path.join(contentDir, "revelation.web.json"), `${JSON.stringify({ translation: "World English Bible", source: "https://ebible.org/engwebp/", chapters: revelation }, null, 2)}\n`),
  ]);
  console.log(`Generated ${tapestries.length} tapestries, ${scenes.length} scenes, and ${revelation.length} chapters.`);
}

await main();
