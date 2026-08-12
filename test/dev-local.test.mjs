import assert from "node:assert/strict";
import test from "node:test";

import { localDevCommands } from "../scripts/lib/dev-local.mjs";

test("localDevCommands serves dist and points Next.js at the local asset origin", () => {
  assert.deepEqual(localDevCommands({ assetPort: 3101, appPort: 3000 }), [
    {
      command: process.execPath,
      args: ["scripts/serve-static.mjs", "--root", "dist", "--port", "3101"],
      env: {},
    },
    {
      command: process.execPath,
      args: ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", "3000"],
      env: { NEXT_PUBLIC_ASSET_BASE_URL: "http://127.0.0.1:3101" },
    },
  ]);
});
