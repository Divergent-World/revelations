import { notFound } from "next/navigation";

import { TapestryViewer } from "@/components/TapestryViewer";
import { allTapestries, getTapestry } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return allTapestries.map(({ id }) => ({ id: String(id) })); }

export default async function EmbeddedTapestryPage({ params }: { params: Promise<{ id: string }> }) {
  const tapestry = getTapestry(Number((await params).id));
  if (!tapestry) notFound();
  return <TapestryViewer tapestry={tapestry} embedded />;
}
