import type { NextConfig } from "next";

const assetBaseUrl = process.env.NEXT_PUBLIC_ASSET_BASE_URL;
if (process.env.VERCEL_ENV === "production") {
  if (!assetBaseUrl) throw new Error("NEXT_PUBLIC_ASSET_BASE_URL is required for a production Vercel deployment.");
  const assetOrigin = new URL(assetBaseUrl);
  if (assetOrigin.protocol !== "https:" || assetOrigin.username || assetOrigin.password || assetOrigin.pathname !== "/" || assetOrigin.search || assetOrigin.hash) {
    throw new Error("NEXT_PUBLIC_ASSET_BASE_URL must be a clean HTTPS origin without credentials, path, query, or fragment.");
  }
  const hostname = assetOrigin.hostname;
  if (hostname.endsWith(".r2.dev")) {
    throw new Error("Production deployments must use an R2 custom domain, not r2.dev.");
  }
}

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
