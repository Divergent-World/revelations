export function localDevCommands({ assetPort = 3101, appPort = 3000 } = {}) {
  return [
    {
      command: process.execPath,
      args: ["scripts/serve-static.mjs", "--root", "dist", "--port", String(assetPort)],
      env: {},
    },
    {
      command: process.execPath,
      args: ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(appPort)],
      env: { NEXT_PUBLIC_ASSET_BASE_URL: `http://127.0.0.1:${assetPort}` },
    },
  ];
}
