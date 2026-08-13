import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { revelationChapters, scenesForVerse } from "@/lib/content";
import { VerseText } from "@/components/VerseText";

export const dynamicParams = false;
export function generateStaticParams() { return revelationChapters.map(({ chapter }) => ({ chapter: String(chapter) })); }

export async function generateMetadata({ params }: { params: Promise<{ chapter: string }> }): Promise<Metadata> {
  return { title: `Revelation ${Number((await params).chapter)}` };
}

export default async function RevelationChapterPage({ params }: { params: Promise<{ chapter: string }> }) {
  const chapterNumber = Number((await params).chapter);
  const chapter = revelationChapters.find(({ chapter }) => chapter === chapterNumber);
  if (!chapter) notFound();
  return (
    <article className="scripture-reader">
      <header>
        <p className="eyebrow">World English Bible</p>
        <h1>Revelation {chapterNumber}</h1>
      </header>
      <div className="chapter-text">
        {chapter.verses.map((verse) => {
          const scenes = scenesForVerse(chapterNumber, verse.number);
          return (
            <div className="verse" id={`verse-${verse.number}`} key={verse.number}>
              <span className="verse-number">{verse.number}</span>
              <p><VerseText verse={verse} /></p>
              {scenes.length > 0 && <div className="verse-scenes" aria-label={`Artwork for verse ${verse.number}`}>{scenes.map((scene) => <Link key={scene.id} href={`/tapestries/${scene.tapestry}/?scene=${scene.id}`}>{scene.id} · {scene.title}</Link>)}</div>}
            </div>
          );
        })}
      </div>
      <nav className="chapter-nav" aria-label="Chapter navigation">
        {chapterNumber > 1 ? <Link href={`/revelation/${chapterNumber - 1}/`}>← Chapter {chapterNumber - 1}</Link> : <span />}
        <Link href="/revelation/">All chapters</Link>
        {chapterNumber < 22 ? <Link href={`/revelation/${chapterNumber + 1}/`}>Chapter {chapterNumber + 1} →</Link> : <Link href="/tapestries/6/">Return to Tapestry VI →</Link>}
      </nav>
    </article>
  );
}
