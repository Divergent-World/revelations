import { allScenes, revelationChapters } from "@/lib/content";
import { renderMarkdownBook } from "@/lib/markdown-book";

export const dynamic = "force-static";

export function GET() {
  const body = renderMarkdownBook({
    chapters: revelationChapters,
    scenes: allScenes,
    assetBaseUrl: process.env.NEXT_PUBLIC_ASSET_BASE_URL ?? "http://127.0.0.1:3101",
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="export.md"',
    },
  });
}
