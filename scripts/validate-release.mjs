import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

import { expectedReleaseFiles, validateReleaseInventory } from "./lib/release.mjs";

const root = path.resolve(import.meta.dirname, "..");
const releaseRoot = path.join(root, "dist", "releases", "v1");
const archive = path.join(releaseRoot, "revelations-artwork-v1.zip");
const sourceMap = JSON.parse(await readFile(path.join(root, "content", "source-map.json"), "utf8"));

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "inherit"] });
    let output = "";
    child.stdout.on("data", (chunk) => { output += chunk; });
    child.on("exit", (code) => code === 0 ? resolve(output) : reject(new Error(`${command} exited ${code}`)));
  });
}

function sha256(buffer) {
  return createHash("sha256").update(buffer).digest("hex");
}

function hashZipEntry(entry) {
  return new Promise((resolve, reject) => {
    const child = spawn("unzip", ["-p", archive, entry], { stdio: ["ignore", "pipe", "inherit"] });
    const hash = createHash("sha256");
    child.stdout.on("data", (chunk) => hash.update(chunk));
    child.on("exit", (code) => code === 0 ? resolve(hash.digest("hex")) : reject(new Error(`unzip exited ${code}`)));
  });
}

function assertExactFiles(actual, expected, label) {
  const normalized = [...actual].sort();
  if (JSON.stringify(normalized) !== JSON.stringify(expected)) {
    throw new Error(`${label} filenames do not match the canonical source map`);
  }
}

async function walk(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const relative = path.posix.join(prefix, entry.name);
    return entry.isDirectory() ? walk(path.join(directory, entry.name), relative) : [relative];
  }));
  return nested.flat();
}

const [originals, previews, readers, zipList] = await Promise.all([
  readdir(path.join(releaseRoot, "originals")),
  readdir(path.join(releaseRoot, "web", "640")),
  readdir(path.join(releaseRoot, "web", "1920")),
  run("unzip", ["-Z1", archive]),
]);
const zipFiles = zipList.split("\n").filter((entry) => entry && !entry.endsWith("/"));
const expected = expectedReleaseFiles(sourceMap);
validateReleaseInventory({
  originals: originals.length,
  previews: previews.length,
  readers: readers.length,
  zipFiles: zipFiles.length,
  archiveOriginals: zipFiles.filter((entry) => entry.startsWith("originals/")).length,
});
assertExactFiles(originals, expected.originals, "original");
assertExactFiles(previews, expected.previews, "preview derivative");
assertExactFiles(readers, expected.readers, "reader derivative");
assertExactFiles(zipFiles, [
  "ATTRIBUTION.txt",
  "LICENSE-ARTWORK.txt",
  "README.txt",
  "SHA256SUMS.txt",
  "manifest.json",
  ...expected.originals.map((file) => `originals/${file}`),
].sort(), "archive");
assertExactFiles(await walk(releaseRoot), [
  "SHA256SUMS.txt",
  "manifest.json",
  "revelations-artwork-v1.zip",
  ...expected.originals.map((file) => `originals/${file}`),
  ...expected.previews.map((file) => `web/640/${file}`),
  ...expected.readers.map((file) => `web/1920/${file}`),
].sort(), "release tree");

const canonicalManifest = await readFile(path.join(root, "content", "tapestries.json"), "utf8");
const canonicalScenes = new Map(JSON.parse(canonicalManifest).scenes.map((scene) => [scene.id, scene]));
const releaseManifest = await readFile(path.join(releaseRoot, "manifest.json"), "utf8");
const archiveManifest = await run("unzip", ["-p", archive, "manifest.json"]);
if (releaseManifest !== canonicalManifest || archiveManifest !== canonicalManifest) {
  throw new Error("release manifests do not match content/tapestries.json");
}

const expectedSums = `${sourceMap.map((source) => `${source.checksum}  originals/${source.id}${source.originalExtension}`).join("\n")}\n`;
const releaseSums = await readFile(path.join(releaseRoot, "SHA256SUMS.txt"), "utf8");
const archiveSums = await run("unzip", ["-p", archive, "SHA256SUMS.txt"]);
if (releaseSums !== expectedSums || archiveSums !== expectedSums) {
  throw new Error("release checksum manifests do not match content/source-map.json");
}

for (const source of sourceMap) {
  const original = path.join(releaseRoot, "originals", `${source.id}${source.originalExtension}`);
  const checksum = sha256(await readFile(original));
  if (checksum !== source.checksum) throw new Error(`${source.id}: release checksum mismatch`);
  const archiveChecksum = await hashZipEntry(`originals/${source.id}${source.originalExtension}`);
  if (archiveChecksum !== source.checksum) throw new Error(`${source.id}: archive checksum mismatch`);
}

for (const [directory, maximumWidth] of [["640", 640], ["1920", 1920]]) {
  for (const file of await readdir(path.join(releaseRoot, "web", directory))) {
    const derivativePath = path.join(releaseRoot, "web", directory, file);
    const derivative = await readFile(derivativePath);
    const metadata = await sharp(derivative).metadata();
    const sceneId = path.basename(file, ".webp");
    const scene = canonicalScenes.get(sceneId);
    const expectedWidth = Math.min(maximumWidth, scene?.width ?? 0);
    const expectedHeight = Math.round((expectedWidth * (scene?.height ?? 0)) / (scene?.width ?? 1));
    if (metadata.format !== "webp" || metadata.width !== expectedWidth || Math.abs((metadata.height ?? 0) - expectedHeight) > 1) {
      throw new Error(`${directory}/${file}: invalid derivative format or dimensions`);
    }
    const source = sourceMap.find(({ id }) => id === sceneId);
    const original = path.join(releaseRoot, "originals", `${sceneId}${source.originalExtension}`);
    const regenerated = await sharp(original).resize({ width: expectedWidth, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
    if (sha256(derivative) !== sha256(regenerated)) {
      throw new Error(`${directory}/${file}: derivative does not match its canonical original`);
    }
  }
}

await run("unzip", ["-tq", archive]);
console.log("Release validated: 90 originals, 180 WebP derivatives, matching checksums, and a complete ZIP archive.");
