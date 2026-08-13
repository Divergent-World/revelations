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

export function validateSceneMetadata(records, expectedIds, chapters) {
  const expected = new Set(expectedIds);
  const chapterVerseCounts = new Map(chapters.map(({ chapter, verses }) => [chapter, verses.length]));
  const metadata = new Map();

  for (const record of records) {
    if (!record || typeof record !== "object" || Array.isArray(record)) throw new Error("metadata record must be an object");
    const unsupported = Object.keys(record).find((key) => !["id", "title", "anchor"].includes(key));
    if (unsupported) throw new Error(`${record.id ?? "metadata record"}: unsupported metadata field ${unsupported}`);
    if (!expected.has(record.id)) throw new Error(`unknown scene ID ${record.id}`);
    if (metadata.has(record.id)) throw new Error(`duplicate scene ID ${record.id}`);
    if (typeof record.title !== "string" || !record.title.trim()) throw new Error(`${record.id}: title must not be empty`);
    if (typeof record.anchor !== "string" || !record.anchor.trim()) throw new Error(`${record.id}: anchor must be a non-empty string`);
    const spans = parseRevelationAnchor(record.anchor);

    for (const span of spans) {
      const startCount = chapterVerseCounts.get(span.startChapter);
      const endCount = chapterVerseCounts.get(span.endChapter);
      if (!startCount) throw new Error(`${record.id}: Revelation chapter ${span.startChapter} is out of bounds`);
      if (!endCount) throw new Error(`${record.id}: Revelation chapter ${span.endChapter} is out of bounds`);
      if (span.startVerse < 1 || span.startVerse > startCount) {
        throw new Error(`${record.id}: Revelation ${span.startChapter}:${span.startVerse} is out of bounds`);
      }
      if (span.endVerse !== null && (span.endVerse < 1 || span.endVerse > endCount)) {
        throw new Error(`${record.id}: Revelation ${span.endChapter}:${span.endVerse} is out of bounds`);
      }
      if (
        span.endChapter < span.startChapter ||
        (span.endChapter === span.startChapter && span.endVerse !== null && span.endVerse < span.startVerse)
      ) {
        throw new Error(`${record.id}: reversed Revelation span`);
      }
    }

    metadata.set(record.id, { ...record, title: record.title.trim(), spans });
  }

  for (const id of expected) {
    if (!metadata.has(id)) throw new Error(`missing scene ID ${id}`);
  }
  return metadata;
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

const SPEECH_START = "\u{f0000}";
const SPEECH_END = "\u{f0001}";

function cleanUsfmVerse(text, label) {
  const stripped = text
    .replace(/\\f \+.*?\\f\*/g, "")
    .replace(/\\x \+.*?\\x\*/g, "")
    .replace(/\\\+?w ([^|\\]+?)(?:\|[^\\]+)?\\\+?w\*/g, "$1")
    .replace(/\\wj\*/g, SPEECH_END)
    .replace(/\\wj\b/g, SPEECH_START)
    .replace(/\\(?:add|nd|bk)\*?/g, "")
    .replace(/\\[a-z0-9]+\*?/gi, "");

  const chars = [];
  let activeSegment = null;
  let segmentCount = 0;
  for (const char of stripped) {
    if (char === SPEECH_START) {
      if (activeSegment !== null) throw new Error(`${label}: overlapping \\wj markers`);
      activeSegment = segmentCount;
      segmentCount += 1;
    } else if (char === SPEECH_END) {
      if (activeSegment === null) throw new Error(`${label}: closing \\wj marker without an opening marker`);
      activeSegment = null;
    } else {
      chars.push({ char, segment: activeSegment });
    }
  }
  if (activeSegment !== null) throw new Error(`${label}: unterminated \\wj marker`);

  const normalized = [];
  for (let index = 0; index < chars.length;) {
    if (!/\s/.test(chars[index].char)) {
      normalized.push(chars[index]);
      index += 1;
      continue;
    }

    let end = index + 1;
    while (end < chars.length && /\s/.test(chars[end].char)) end += 1;
    const next = chars[end]?.char;
    if (normalized.length && next && !/[,.;:?!”]/.test(next)) {
      const segment = chars.slice(index, end).every(({ segment }) => segment !== null && segment === chars[index].segment)
        ? chars[index].segment
        : null;
      normalized.push({ char: " ", segment });
    }
    index = end;
  }

  const ranges = [];
  let rangeStart = null;
  let rangeSegment = null;
  for (let index = 0; index <= normalized.length; index += 1) {
    const segment = normalized[index]?.segment ?? null;
    if (segment === rangeSegment) continue;
    if (rangeSegment !== null) ranges.push({ start: rangeStart, end: index });
    rangeStart = segment === null ? null : index;
    rangeSegment = segment;
  }
  if (ranges.length !== segmentCount) throw new Error(`${label}: empty \\wj range`);

  return { text: normalized.map(({ char }) => char).join(""), ranges };
}

function parseAnnotatedUsfmRevelation(usfm) {
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
      verse = { number: Number(verseMatch[1]), raw: verseMatch[2] };
      chapter.verses.push(verse);
      continue;
    }
    if (verse && (line && !line.startsWith("\\") || /^\\(?:p|q\d*|m|nb)\s+\S/.test(line))) {
      verse.raw += ` ${line}`;
    }
  }

  return chapters.map(({ chapter: chapterNumber, verses }) => ({
    chapter: chapterNumber,
    verses: verses.map(({ number, raw }) => {
      const { text, ranges } = cleanUsfmVerse(raw, `Revelation ${chapterNumber}:${number}`);
      return { number, text, ranges };
    }),
  }));
}

export function parseUsfmRevelation(usfm) {
  return parseAnnotatedUsfmRevelation(usfm).map(({ chapter, verses }) => ({
    chapter,
    verses: verses.map(({ number, text }) => ({ number, text })),
  }));
}

export function annotateWordsOfJesus(vplChapters, usfm) {
  const usfmChapters = parseAnnotatedUsfmRevelation(usfm);
  if (usfmChapters.length !== vplChapters.length) {
    throw new Error(`USFM chapter count mismatch: expected ${vplChapters.length}, found ${usfmChapters.length}`);
  }

  return vplChapters.map(({ chapter, verses }) => {
    const usfmChapter = usfmChapters.find(({ chapter: number }) => number === chapter);
    if (!usfmChapter) throw new Error(`Revelation ${chapter}: missing from USFM source`);
    if (usfmChapter.verses.length !== verses.length) {
      throw new Error(`Revelation ${chapter}: USFM verse count mismatch`);
    }

    return {
      chapter,
      verses: verses.map((verse) => {
        const usfmVerse = usfmChapter.verses.find(({ number }) => number === verse.number);
        const label = `Revelation ${chapter}:${verse.number}`;
        if (!usfmVerse) throw new Error(`${label}: missing from USFM source`);
        if (usfmVerse.text !== verse.text) {
          throw new Error(`${label}: USFM wording mismatch with canonical VPL text`);
        }
        return usfmVerse.ranges.length ? { ...verse, wordsOfJesus: usfmVerse.ranges } : { ...verse };
      }),
    };
  });
}

export function validateWordsOfJesusRanges(verse, label) {
  if (verse.wordsOfJesus === undefined) return;
  if (!Array.isArray(verse.wordsOfJesus)) throw new Error(`${label}: wordsOfJesus must be an array`);

  let previous;
  for (const range of verse.wordsOfJesus) {
    if (!Number.isInteger(range?.start) || !Number.isInteger(range?.end)) {
      throw new Error(`${label}: speech range start and end must be integers`);
    }
    if (range.start < 0 || range.start >= range.end || range.end > verse.text.length) {
      throw new Error(`${label}: speech range is out of bounds`);
    }
    if (previous && range.start < previous.start) throw new Error(`${label}: speech ranges must be sorted`);
    if (previous && range.start < previous.end) throw new Error(`${label}: speech ranges must not overlap`);
    previous = range;
  }
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
