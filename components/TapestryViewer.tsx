"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getScene, scenesForTapestry, type Scene, type Tapestry } from "@/lib/content";
import { ArtworkImage } from "./ArtworkImage";
import { SceneDialog } from "./SceneDialog";

const zoomNames = ["near", "room", "detail"] as const;

function SceneCard({ scene, eager, onOpen }: { scene: Scene; eager?: boolean; onOpen: (scene: Scene, trigger: HTMLButtonElement) => void }) {
  return (
    <figure className="scene-card" data-scene-id={scene.id}>
      <button type="button" onClick={(event) => onOpen(scene, event.currentTarget)} aria-label={`Open ${scene.title}`}>
        <ArtworkImage scene={scene} size="preview" eager={eager} />
      </button>
      <figcaption><span>{scene.id}</span><strong>{scene.title}</strong><small>{scene.displayReference}</small></figcaption>
    </figure>
  );
}

export function TapestryViewer({ tapestry, embedded = false }: { tapestry: Tapestry; embedded?: boolean }) {
  const scenes = useMemo(() => scenesForTapestry(tapestry), [tapestry]);
  const lead = scenes[0];
  const top = scenes.filter(({ row }) => row === "top");
  const bottom = scenes.filter(({ row }) => row === "bottom");
  const [zoom, setZoom] = useState(1);
  const [selected, setSelected] = useState<Scene>();
  const opener = useRef<HTMLButtonElement | null>(null);

  const readUrl = useCallback(() => getScene(new URL(window.location.href).searchParams.get("scene")), []);
  useEffect(() => {
    setSelected(readUrl());
    const onPopState = () => setSelected(readUrl());
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [readUrl]);

  const updateScene = useCallback((scene?: Scene, replace = false) => {
    const url = new URL(window.location.href);
    if (scene) url.searchParams.set("scene", scene.id); else url.searchParams.delete("scene");
    window.history[replace ? "replaceState" : "pushState"]({}, "", url);
    setSelected(scene);
  }, []);

  const openScene = useCallback((scene: Scene, trigger: HTMLButtonElement) => {
    opener.current = trigger;
    updateScene(scene);
  }, [updateScene]);

  const closeScene = useCallback(() => {
    updateScene();
    requestAnimationFrame(() => opener.current?.focus());
  }, [updateScene]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (selected) return;
      if (event.key === "+" || event.key === "=") setZoom((value) => Math.min(2, value + 1));
      if (event.key === "-") setZoom((value) => Math.max(0, value - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const selectedIndex = selected ? scenes.findIndex(({ id }) => id === selected.id) : -1;
  return (
    <div className={`viewer-shell ${embedded ? "viewer-embedded" : ""}`}>
      <header className="viewer-heading">
        <div>
          <p className="eyebrow">Tapestry {tapestry.roman}</p>
          <h1>{tapestry.movements.join(" · ")}</h1>
          <p>{tapestry.summary}</p>
        </div>
        <div className="viewer-controls">
          <span>Scale</span>
          {zoomNames.map((name, index) => <button key={name} type="button" aria-pressed={zoom === index} onClick={() => setZoom(index)}>{name}</button>)}
        </div>
      </header>

      <section className="lead-scene">
        <SceneCard scene={lead} eager onOpen={openScene} />
        <div className="movement-list">
          <p className="eyebrow">The movement</p>
          <ol>{tapestry.movements.map((movement) => <li key={movement}>{movement}</li>)}</ol>
        </div>
      </section>

      <section className={`tapestry-stage zoom-${zoom}`} aria-label={`Tapestry ${tapestry.roman} scenes`}>
        <div className="tapestry-row" data-row="top">{top.map((scene, index) => <SceneCard key={scene.id} scene={scene} eager={index === 0} onOpen={openScene} />)}</div>
        <div className="tapestry-row" data-row="bottom">{bottom.map((scene) => <SceneCard key={scene.id} scene={scene} onOpen={openScene} />)}</div>
      </section>

      <nav className="tapestry-pagination" aria-label="Tapestry navigation">
        {tapestry.id > 1 ? <Link href={`/tapestries/${tapestry.id - 1}/`}>← Tapestry {tapestry.id - 1}</Link> : <span />}
        <Link href="/">All tapestries</Link>
        {tapestry.id < 6 ? <Link href={`/tapestries/${tapestry.id + 1}/`}>Tapestry {tapestry.id + 1} →</Link> : <Link href="/revelation/22/">Read the ending →</Link>}
      </nav>

      {selected && <SceneDialog scene={selected} previous={scenes[selectedIndex - 1]} next={scenes[selectedIndex + 1]} onClose={closeScene} onNavigate={updateScene} />}
    </div>
  );
}
