import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import sharp from "sharp";

import { releasePaths } from "./lib/release.mjs";

const root = path.resolve(import.meta.dirname, "..");
const vault = path.resolve(process.env.APOCALYPSE_VAULT ?? path.join(root, "..", "Apocalypse Tapestry"));
const releaseRoot = path.join(root, "dist", "releases", "v1");
const archiveStage = path.join(releaseRoot, "archive");
const sources = JSON.parse(await readFile(path.join(root, "content", "source-map.json"), "utf8"));
const manifest = JSON.parse(await readFile(path.join(root, "content", "tapestries.json"), "utf8"));

function sha256(buffer) { return createHash("sha256").update(buffer).digest("hex"); }

async function run(command, args, cwd) {
  await new Promise((resolve, reject) => {
    const child = spawn(command, args, { cwd, stdio: "inherit" });
    child.on("exit", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)));
  });
}

await rm(releaseRoot, { recursive: true, force: true });
await Promise.all([
  mkdir(path.join(releaseRoot, "originals"), { recursive: true }),
  mkdir(path.join(releaseRoot, "web", "640"), { recursive: true }),
  mkdir(path.join(releaseRoot, "web", "1920"), { recursive: true }),
  mkdir(path.join(releaseRoot, "book", "images"), { recursive: true }),
  mkdir(path.join(archiveStage, "originals"), { recursive: true }),
]);

const sums = [];
for (const source of sources) {
  const input = path.join(vault, source.sourcePath);
  const paths = releasePaths(source.id, source.originalExtension);
  const outputOriginal = path.join(root, "dist", paths.original);
  const archiveOriginal = path.join(archiveStage, "originals", `${source.id}${source.originalExtension}`);
  const preview = path.join(root, "dist", paths.preview);
  const reader = path.join(root, "dist", paths.reader);
  const book = path.join(root, "dist", paths.book);
  const inputBuffer = await readFile(input);
  if (sha256(inputBuffer) !== source.checksum) throw new Error(`${source.id}: source checksum changed; regenerate content before releasing`);
  await Promise.all([copyFile(input, outputOriginal), copyFile(input, archiveOriginal)]);
  const metadata = await sharp(input).metadata();
  await Promise.all([
    sharp(input).resize({ width: Math.min(640, metadata.width), withoutEnlargement: true }).webp({ quality: 82 }).toFile(preview),
    sharp(input).resize({ width: Math.min(1920, metadata.width), withoutEnlargement: true }).webp({ quality: 82 }).toFile(reader),
    sharp(input).resize({ width: Math.min(1920, metadata.width), withoutEnlargement: true }).jpeg({ quality: 88, mozjpeg: true }).toFile(book),
  ]);
  sums.push(`${source.checksum}  originals/${source.id}${source.originalExtension}`);
}

const license = `Apocalypse Tapestry Artwork License\n\nArtwork © Ali Rahman / Divergent World.\nLicensed under Creative Commons Attribution-ShareAlike 4.0 International.\nhttps://creativecommons.org/licenses/by-sa/4.0/\n`;
const readme = `Revelations Artwork v1\n\nThis archive contains the 90 canonical high-resolution images for Tapestries I–VI.\nScene IDs and order are defined in manifest.json. Verify files with SHA256SUMS.txt.\n`;
await Promise.all([
  writeFile(path.join(archiveStage, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(path.join(archiveStage, "ATTRIBUTION.txt"), "Artwork: Ali Rahman / Divergent World\n"),
  writeFile(path.join(archiveStage, "LICENSE-ARTWORK.txt"), license),
  writeFile(path.join(archiveStage, "README.txt"), readme),
  writeFile(path.join(archiveStage, "SHA256SUMS.txt"), `${sums.join("\n")}\n`),
  writeFile(path.join(releaseRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`),
  writeFile(path.join(releaseRoot, "SHA256SUMS.txt"), `${sums.join("\n")}\n`),
]);

await run("zip", ["-q", "-r", path.join(releaseRoot, "revelations-artwork-v1.zip"), "."], archiveStage);
await rm(archiveStage, { recursive: true, force: true });
console.log(`Release built at ${releaseRoot} with ${sources.length} originals, 180 WebP derivatives, and 90 book JPEGs.`);
