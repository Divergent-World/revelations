"use client";

import { useState } from "react";

import { assetUrl, type Scene } from "@/lib/content";

export function ArtworkImage({ scene, size, eager = false, className }: { scene: Scene; size: "preview" | "reader"; eager?: boolean; className?: string }) {
  const [source, setSource] = useState(size);
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className={`image-fallback ${className ?? ""}`} role="img" aria-label={scene.alt}><span>{scene.title}</span><small>{scene.displayReference}</small></div>;
  }

  return (
    <img
      className={className}
      src={assetUrl(scene.images[source])}
      alt={scene.alt}
      width={scene.width}
      height={scene.height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      onError={() => {
        if (source === "reader") setSource("preview");
        else setFailed(true);
      }}
    />
  );
}
