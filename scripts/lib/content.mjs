import path from "node:path";

const IMAGE_PATTERN = /\.(avif|gif|jpe?g|png|webp)$/i;
const EXCLUDED_PATTERN = /\/(16 - Counting of the elected|17 - The Seventh Seal)\.jpg$/;

export function canonicalImageNodes(nodes) {
  return nodes.filter(
    (node) =>
      node.type === "file" &&
      IMAGE_PATTERN.test(node.file) &&
      !node.file.includes("/References/") &&
      !EXCLUDED_PATTERN.test(node.file),
  );
}

function centerY(node) {
  return node.y + node.height / 2;
}

export function mapCanvasToSceneIds(tapestry, nodes, rowSize = 7) {
  const images = canonicalImageNodes(nodes);
  const expected = rowSize * 2 + 1;
  if (images.length !== expected) {
    throw new Error(`Tapestry ${tapestry}: expected ${expected} canonical images, found ${images.length}`);
  }

  const leadCandidates = images.filter((node) => node.height > node.width);
  if (leadCandidates.length !== 1) {
    throw new Error(`Tapestry ${tapestry}: expected one portrait lead, found ${leadCandidates.length}`);
  }
  const lead = leadCandidates[0];
  const scenes = images.filter((node) => node !== lead).sort((a, b) => centerY(a) - centerY(b));
  const top = scenes.slice(0, rowSize).sort((a, b) => a.x - b.x);
  const bottom = scenes.slice(rowSize).sort((a, b) => a.x - b.x);

  return [
    [`T${tapestry}-00`, lead.id],
    ...top.map((node, index) => [`T${tapestry}-T${String(index + 1).padStart(2, "0")}`, node.id]),
    ...bottom.map((node, index) => [`T${tapestry}-B${String(index + 1).padStart(2, "0")}`, node.id]),
  ];
}

function parsePart(part) {
  const match = part.trim().replace(/^Rev\s+/i, "").match(/^(\d+)(?::(\d+))?(?:[–-](?:(\d+):)?(\d+))?$/);
  if (!match) throw new Error(`Unsupported Revelation anchor: ${part}`);
  const startChapter = Number(match[1]);
  const startVerse = match[2] ? Number(match[2]) : 1;
  const endChapter = match[3] ? Number(match[3]) : startChapter;
  let endVerse = match[4] ? Number(match[4]) : match[2] ? startVerse : null;
  if (!match[2] && match[4]) {
    return { startChapter, startVerse: 1, endChapter: Number(match[4]), endVerse: null };
  }
  return { startChapter, startVerse, endChapter, endVerse };
}

export function parseRevelationAnchor(anchor) {
  return anchor.split(";").map((part) => parsePart(part));
}

export function displayReference(spans) {
  return spans
    .map((span) => {
      if (span.startChapter !== span.endChapter && span.endVerse === null) {
        return `Revelation ${span.startChapter}–${span.endChapter}`;
      }
      if (span.startChapter !== span.endChapter) {
        return `Revelation ${span.startChapter}:${span.startVerse}–${span.endChapter}:${span.endVerse}`;
      }
      if (span.endVerse === null) return `Revelation ${span.startChapter}`;
      if (span.startVerse === span.endVerse) return `Revelation ${span.startChapter}:${span.startVerse}`;
      return `Revelation ${span.startChapter}:${span.startVerse}–${span.endVerse}`;
    })
    .join("; ");
}

function cleanUsfmText(text) {
  return text
    .replace(/\\f \+.*?\\f\*/g, "")
    .replace(/\\x \+.*?\\x\*/g, "")
    .replace(/\\\+?w ([^|\\]+?)(?:\|[^\\]+)?\\\+?w\*/g, "$1")
    .replace(/\\(?:wj|add|nd|bk)\*?/g, "")
    .replace(/\\[a-z0-9]+\*?/gi, "")
    .replace(/\s+([,.;:?!])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function parseUsfmRevelation(usfm) {
  const chapters = [];
  let chapter;
  let verse;

  for (const rawLine of usfm.split(/\r?\n/)) {
    const line = rawLine.trim();
    const chapterMatch = line.match(/^\\c\s+(\d+)/);
    if (chapterMatch) {
      chapter = { chapter: Number(chapterMatch[1]), verses: [] };
      chapters.push(chapter);
      verse = undefined;
      continue;
    }
    const verseMatch = line.match(/^\\v\s+(\d+)\s+(.*)$/);
    if (verseMatch && chapter) {
      verse = { number: Number(verseMatch[1]), text: cleanUsfmText(verseMatch[2]) };
      chapter.verses.push(verse);
      continue;
    }
    if (verse && line && !line.startsWith("\\")) verse.text += ` ${cleanUsfmText(line)}`;
  }

  return chapters;
}

export function parseVplRevelation(vpl) {
  const byChapter = new Map();
  for (const line of vpl.split(/\r?\n/)) {
    const match = line.match(/^REV\s+(\d+):(\d+)\s+(.+)$/);
    if (!match) continue;
    const chapterNumber = Number(match[1]);
    const chapter = byChapter.get(chapterNumber) ?? { chapter: chapterNumber, verses: [] };
    chapter.verses.push({ number: Number(match[2]), text: match[3].trim() });
    byChapter.set(chapterNumber, chapter);
  }
  return [...byChapter.values()].sort((a, b) => a.chapter - b.chapter);
}

export function relativeObjectKey(sceneId, sourcePath) {
  return `releases/v1/originals/${sceneId}${path.extname(sourcePath).toLowerCase()}`;
}
