import type { Scene, ScriptureChapter } from "./content";

export type MarkdownBookInput = {
  chapters: ScriptureChapter[];
  scenes: Scene[];
  assetBaseUrl: string;
};

const romans = ["", "I", "II", "III", "IV", "V", "VI"];

function cleanOrigin(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`Book asset origin must be an absolute HTTP or HTTPS URL: ${value}`);
  }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
    throw new Error(`Book asset origin must be a clean absolute HTTP or HTTPS origin: ${value}`);
  }
  return url.origin;
}

function escapeMarkdown(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("[", "\\[").replaceAll("]", "\\]").replaceAll("*", "\\*").replaceAll("_", "\\_");
}

export function renderMarkdownBook({ chapters, scenes, assetBaseUrl }: MarkdownBookInput) {
  const origin = cleanOrigin(assetBaseUrl);
  if (chapters.length !== 22 || chapters.some(({ chapter }, index) => chapter !== index + 1)) {
    throw new Error("Markdown book requires Revelation chapters 1 through 22 in order");
  }

  const verseKeys = new Set<string>();
  let verseCount = 0;
  for (const chapter of chapters) {
    chapter.verses.forEach((verse, index) => {
      if (verse.number !== index + 1) throw new Error(`Revelation ${chapter.chapter} has a missing or out-of-order verse`);
      const key = `${chapter.chapter}:${verse.number}`;
      if (verseKeys.has(key)) throw new Error(`Duplicate verse in Markdown book: Revelation ${key}`);
      verseKeys.add(key);
      verseCount += 1;
    });
  }
  if (verseCount !== 404) throw new Error(`Markdown book requires 404 verses, received ${verseCount}`);
  if (scenes.length !== 90) throw new Error(`Markdown book requires 90 scenes, received ${scenes.length}`);

  const sceneIds = new Set<string>();
  const readerKeys = new Set<string>();
  const imageUrls = new Set<string>();
  const scenesAt = new Map<string, Array<{ scene: Scene; imageUrl: string }>>();
  for (const scene of scenes) {
    if (sceneIds.has(scene.id)) throw new Error(`Duplicate scene ID in Markdown book: ${scene.id}`);
    sceneIds.add(scene.id);
    const anchor = scene.scriptureSpans[0];
    const anchorKey = anchor && `${anchor.startChapter}:${anchor.startVerse}`;
    if (!anchorKey || !verseKeys.has(anchorKey)) throw new Error(`${scene.id}: first scripture anchor is missing from Revelation`);
    if (readerKeys.has(scene.images.reader)) throw new Error(`Duplicate reader image URL in Markdown book: ${scene.images.reader}`);
    readerKeys.add(scene.images.reader);
    if (scene.images.reader !== `releases/v1/web/1920/${scene.id}.webp`) {
      throw new Error(`${scene.id}: reader image must be a canonical release key`);
    }
    const imageUrl = new URL(scene.images.reader, `${origin}/`).href;
    imageUrls.add(imageUrl);
    scenesAt.set(anchorKey, [...(scenesAt.get(anchorKey) ?? []), { scene, imageUrl }]);
  }

  const lines = [
    "---",
    'title: "The Revelation to John"',
    'subtitle: "An Illuminated Prophecy in Six Movements"',
    'creator: "Ali Rahman / Divergent World"',
    'lang: "en"',
    'rights: "Artwork CC BY-SA 4.0; Scripture World English Bible, public domain"',
    "---",
    "",
    "# The Revelation to John",
    "",
    "*An illuminated prophecy in six movements*",
    "",
    "Scripture: World English Bible, public domain. Artwork © Ali Rahman / Divergent World, CC BY-SA 4.0.",
    "",
  ];
  const emitted = new Set<string>();

  for (const chapter of chapters) {
    lines.push(`## Revelation ${chapter.chapter}`, "");
    for (const verse of chapter.verses) {
      for (const { scene, imageUrl } of scenesAt.get(`${chapter.chapter}:${verse.number}`) ?? []) {
        if (emitted.has(scene.id)) throw new Error(`Scene emitted twice in Markdown book: ${scene.id}`);
        emitted.add(scene.id);
        const roman = romans[scene.tapestry];
        if (!roman) throw new Error(`${scene.id}: movement number must be between 1 and 6`);
        lines.push(
          `![${escapeMarkdown(scene.alt)}](${imageUrl})`,
          "",
          `*Movement ${roman} · ${scene.id} · ${escapeMarkdown(scene.title)} · ${escapeMarkdown(scene.displayReference)}*`,
          `*Artwork © ${escapeMarkdown(scene.attribution)} · ${escapeMarkdown(scene.license)}*`,
          "",
        );
      }
      lines.push(`**${chapter.chapter}:${verse.number}** ${verse.text}`, "");
    }
  }

  if (emitted.size !== 90 || imageUrls.size !== 90) {
    throw new Error(`Markdown book emitted ${emitted.size} scenes and ${imageUrls.size} unique image URLs; expected 90 of each`);
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
