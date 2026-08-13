import Link from "next/link";

import { revelationChapters } from "@/lib/content";

export default function RevelationIndexPage() {
  return (
    <div className="reader-index">
      <header className="reader-hero">
        <p className="eyebrow">World English Bible</p>
        <h1>The Revelation to John</h1>
        <p>Read the complete twenty-two-chapter text. Illuminated verse markers return you to scenes across the six movements.</p>
      </header>
      <ol className="chapter-grid">
        {revelationChapters.map(({ chapter, verses }) => (
          <li key={chapter}><Link href={`/revelation/${chapter}/`}><span>{String(chapter).padStart(2, "0")}</span><strong>Chapter {chapter}</strong><small>{verses.length} verses</small></Link></li>
        ))}
      </ol>
    </div>
  );
}
