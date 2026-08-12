import path from "node:path";

export function releasePaths(sceneId, extension) {
  const ext = extension.toLowerCase();
  return {
    original: `releases/v1/originals/${sceneId}${ext}`,
    preview: `releases/v1/web/640/${sceneId}.webp`,
    reader: `releases/v1/web/1920/${sceneId}.webp`,
  };
}

export function contentTypeFor(filePath) {
  return ({
    ".avif": "image/avif",
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
    ".zip": "application/zip",
  })[path.extname(filePath).toLowerCase()] ?? "application/octet-stream";
}

export function contentDispositionFor(filePath) {
  const normalized = filePath.split(path.sep).join("/");
  if (!normalized.includes("/originals/") && !normalized.endsWith(".zip")) return undefined;
  return `attachment; filename="${path.basename(filePath)}"`;
}

export function expectedReleaseFiles(sources) {
  return {
    originals: sources.map(({ id, originalExtension }) => `${id}${originalExtension}`).sort(),
    previews: sources.map(({ id }) => `${id}.webp`).sort(),
    readers: sources.map(({ id }) => `${id}.webp`).sort(),
  };
}

export function validateReleaseInventory(inventory) {
  const expected = {
    originals: 90,
    previews: 90,
    readers: 90,
    zipFiles: 95,
    archiveOriginals: 90,
  };
  for (const [label, count] of Object.entries(expected)) {
    if (inventory[label] !== count) {
      const readableLabel = label.replace(/([A-Z])/g, " $1").toLowerCase();
      throw new Error(`${readableLabel}: expected ${count}, received ${inventory[label]}`);
    }
  }
}
