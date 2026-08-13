"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { assetUrl, type Scene } from "@/lib/content";
import { VerseText } from "./VerseText";
import { ZoomableArtwork } from "./ZoomableArtwork";

export function SceneDialog({ scene, previous, next, onClose, onNavigate }: {
  scene: Scene;
  previous?: Scene;
  next?: Scene;
  onClose: () => void;
  onNavigate: (scene: Scene) => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!element.open) element.showModal();
    const onCancel = (event: Event) => { event.preventDefault(); onClose(); };
    element.addEventListener("cancel", onCancel);
    return () => element.removeEventListener("cancel", onCancel);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft" && previous) onNavigate(previous);
      if (event.key === "ArrowRight" && next) onNavigate(next);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [next, onNavigate, previous]);

  useEffect(() => setCopied(false), [scene.id]);

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
  }

  return (
    <dialog ref={dialog} className="scene-dialog" onClose={onClose} aria-labelledby="scene-dialog-title">
      <button className="dialog-close" type="button" onClick={onClose} aria-label="Close scene">×</button>
      <div className="dialog-art">
        <ZoomableArtwork key={scene.id} scene={scene} />
      </div>
      <article className="dialog-reading">
        <p className="eyebrow">Scene {scene.id}</p>
        <h2 id="scene-dialog-title">{scene.title}</h2>
        <p className="scripture-reference">{scene.displayReference}</p>
        {scene.passages.map((passage) => (
          <section className="passage" key={passage.reference}>
            {scene.passages.length > 1 && <h3>{passage.reference}</h3>}
            {passage.verses.map((verse) => <p key={`${verse.chapter}-${verse.verse}`}><sup>{verse.verse}</sup><VerseText verse={verse} /></p>)}
          </section>
        ))}
        <div className="scene-meta">
          <p>{scene.attribution} · <a href="https://creativecommons.org/licenses/by-sa/4.0/">{scene.license}</a></p>
          <button type="button" onClick={copyLink}>{copied ? "Link copied" : "Copy scene link"}</button>
          <a href={assetUrl(scene.images.original)} download>Download high-resolution original</a>
          <Link href={`/revelation/${scene.scriptureSpans[0].startChapter}/#verse-${scene.scriptureSpans[0].startVerse}`}>Read in full chapter</Link>
        </div>
        <nav className="dialog-nav" aria-label="Scene navigation">
          <button type="button" disabled={!previous} onClick={() => previous && onNavigate(previous)}>← Previous</button>
          <button type="button" disabled={!next} onClick={() => next && onNavigate(next)}>Next →</button>
        </nav>
      </article>
    </dialog>
  );
}
