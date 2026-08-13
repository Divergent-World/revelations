import revelationData from "@/content/revelation.web.json";
import tapestryData from "@/content/tapestries.json";

export type SceneId = `T${number}-${"00" | `T${string}` | `B${string}`}`;
export type VerseSpan = {
  startChapter: number;
  startVerse: number;
  endChapter: number;
  endVerse: number | null;
};
export type Verse = { chapter: number; verse: number; text: string };
export type Passage = { reference: string; verses: Verse[] };
export type Movement = { title: string; description: string };
export type Scene = {
  id: SceneId;
  tapestry: number;
  row: "lead" | "top" | "bottom";
  position: number;
  title: string;
  scriptureSpans: VerseSpan[];
  displayReference: string;
  passages: Passage[];
  alt: string;
  images: { preview: string; reader: string; original: string };
  width: number;
  height: number;
  checksum: string;
  attribution: string;
  license: string;
};
export type Tapestry = {
  id: number;
  roman: string;
  title: string;
  summary: string;
  movements: Movement[];
  leadSceneId: SceneId;
  sceneIds: SceneId[];
};
export type ScriptureChapter = { chapter: number; verses: { number: number; text: string }[] };

const scenes = tapestryData.scenes as Scene[];
const tapestries = tapestryData.tapestries as Tapestry[];
const chapters = revelationData.chapters as ScriptureChapter[];

export const contentVersion = tapestryData.version;
export const allScenes = scenes;
export const allTapestries = tapestries;
export const revelationChapters = chapters;

export function getTapestry(id: number) {
  return tapestries.find((tapestry) => tapestry.id === id);
}

export function getScene(id: string | null | undefined) {
  return scenes.find((scene) => scene.id === id);
}

export function scenesForTapestry(tapestry: Tapestry) {
  return tapestry.sceneIds.map((id) => getScene(id)).filter((scene): scene is Scene => Boolean(scene));
}

export function scenesForVerse(chapter: number, verse: number) {
  return scenes.filter((scene) =>
    scene.scriptureSpans.some((span) => {
      if (chapter < span.startChapter || chapter > span.endChapter) return false;
      if (chapter === span.startChapter && verse < span.startVerse) return false;
      if (chapter === span.endChapter && span.endVerse !== null && verse > span.endVerse) return false;
      return true;
    }),
  );
}

export function assetUrl(key: string) {
  const base = process.env.NEXT_PUBLIC_ASSET_BASE_URL?.replace(/\/$/, "") ?? "";
  return `${base}/${key}`;
}

export const archiveUrl = assetUrl(`releases/${contentVersion}/revelations-artwork-${contentVersion}.zip`);
