import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";

const rootIndex = process.argv.indexOf("--root");
const root = path.resolve(import.meta.dirname, "..", rootIndex >= 0 ? process.argv[rootIndex + 1] : "out");
const portIndex = process.argv.indexOf("--port");
const port = Number(portIndex >= 0 ? process.argv[portIndex + 1] : process.env.PORT ?? 3000);
const types = { ".css": "text/css", ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".md": "text/markdown; charset=utf-8", ".svg": "image/svg+xml", ".txt": "text/plain", ".webp": "image/webp" };

createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url ?? "/", "http://localhost").pathname);
  let file = path.resolve(root, `.${pathname}`);
  if (!file.startsWith(`${root}${path.sep}`) && file !== root) {
    response.writeHead(403).end();
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = path.join(file, "index.html");
    await stat(file);
  } catch {
    file = path.join(root, "404.html");
    response.statusCode = 404;
  }
  response.setHeader("Content-Type", types[path.extname(file)] ?? "application/octet-stream");
  createReadStream(file).pipe(response);
}).listen(port, "127.0.0.1", () => console.log(`${path.relative(path.resolve(import.meta.dirname, ".."), root)} available at http://127.0.0.1:${port}`));
