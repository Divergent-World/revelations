import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { contentDispositionFor, contentTypeFor } from "./lib/release.mjs";

const required = ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"];
for (const key of required) if (!process.env[key]) throw new Error(`${key} is required`);

const root = path.resolve(import.meta.dirname, "..", "dist", "releases", "v1");
const client = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? files(path.join(directory, entry.name)) : [path.join(directory, entry.name)]))).flat();
}

const releaseFiles = await files(root);
for (const file of releaseFiles) {
  const relative = path.relative(path.dirname(path.dirname(root)), file).split(path.sep).join("/");
  const body = await readFile(file);
  const checksum = createHash("sha256").update(body).digest("hex");
  try {
    const existing = await client.send(new HeadObjectCommand({ Bucket: process.env.R2_BUCKET, Key: relative }));
    if (existing.Metadata?.sha256 === checksum) {
      console.log(`${relative} (already uploaded)`);
      continue;
    }
    throw new Error(`${relative} already exists with different or unverifiable content. Immutable releases cannot be overwritten.`);
  } catch (error) {
    if (error?.$metadata?.httpStatusCode !== 404 && error?.name !== "NotFound") throw error;
  }
  await client.send(new PutObjectCommand({
    Bucket: process.env.R2_BUCKET,
    Key: relative,
    Body: body,
    ContentType: contentTypeFor(file),
    ContentDisposition: contentDispositionFor(file),
    CacheControl: "public, max-age=31536000, immutable",
    Metadata: { sha256: checksum },
    IfNoneMatch: "*",
  }));
  console.log(relative);
}
console.log(`Uploaded ${releaseFiles.length} immutable objects to ${process.env.R2_BUCKET}.`);
