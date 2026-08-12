import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";

import { localDevCommands } from "./lib/dev-local.mjs";

const root = path.resolve(import.meta.dirname, "..");
await access(path.join(root, "dist", "releases", "v1")).catch(() => {
  throw new Error("Local release assets are missing. Run `npm run assets:release` or `yarn assets:release` first.");
});

const children = localDevCommands().map(({ command, args, env }) => spawn(command, args, {
  cwd: root,
  env: { ...process.env, ...env },
  stdio: "inherit",
}));

let stopping = false;
function stop(signal = "SIGTERM") {
  if (stopping) return;
  stopping = true;
  for (const child of children) child.kill(signal);
}

process.on("SIGINT", () => stop("SIGINT"));
process.on("SIGTERM", () => stop("SIGTERM"));

const result = await Promise.race(children.map((child) => new Promise((resolve) => {
  child.once("exit", (code, signal) => resolve({ child, code, signal }));
})));
stop();
await Promise.all(children.filter((child) => child !== result.child).map((child) => new Promise((resolve) => child.once("exit", resolve))));
process.exitCode = result.code ?? (result.signal ? 1 : 0);
