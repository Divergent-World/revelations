import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TapestryViewer } from "@/components/TapestryViewer";
import { allTapestries, getTapestry } from "@/lib/content";

export const dynamicParams = false;
export function generateStaticParams() { return allTapestries.map(({ id }) => ({ id: String(id) })); }

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const tapestry = getTapestry(Number((await params).id));
  return { title: tapestry ? `Tapestry ${tapestry.roman}` : "Tapestry" };
}

export default async function TapestryPage({ params }: { params: Promise<{ id: string }> }) {
  const tapestry = getTapestry(Number((await params).id));
  if (!tapestry) notFound();
  return <TapestryViewer tapestry={tapestry} />;
}
