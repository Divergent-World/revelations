import { type ReactNode } from "react";

import { type TextRange } from "@/lib/content";

export function VerseText({ verse }: { verse: { text: string; wordsOfJesus?: TextRange[] } }) {
  const ranges = verse.wordsOfJesus ?? [];
  if (ranges.length === 0) return verse.text;

  let cursor = 0;
  return <>{ranges.flatMap((range, index) => {
    const parts: ReactNode[] = [verse.text.slice(cursor, range.start)];
    parts.push(
      <span className="words-of-jesus" key={`${range.start}-${range.end}-${index}`}>
        {verse.text.slice(range.start, range.end)}
      </span>,
    );
    cursor = range.end;
    if (index === ranges.length - 1) parts.push(verse.text.slice(cursor));
    return parts;
  })}</>;
}
