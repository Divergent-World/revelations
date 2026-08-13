"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { assetUrl, type Scene } from "@/lib/content";

type ArtworkImageProps = {
  scene: Scene;
  size: "preview" | "reader";
  eager?: boolean;
  className?: string;
  style?: CSSProperties;
  onLoad?: () => void;
  onUnavailable?: () => void;
  draggable?: boolean;
};

export function ArtworkImage({ scene, size, eager = false, className, style, onLoad, onUnavailable, draggable }: ArtworkImageProps) {
  const [source, setSource] = useState(size);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSource(size);
    setFailed(false);
  }, [scene.id, size]);

  if (failed) {
    return <div className={`image-fallback ${className ?? ""}`} role="img" aria-label={scene.alt}><span>{scene.title}</span><small>{scene.displayReference}</small></div>;
  }

  return (
    <img
      className={className}
      style={style}
      src={assetUrl(scene.images[source])}
      alt={scene.alt}
      width={scene.width}
      height={scene.height}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      draggable={draggable}
      onLoad={onLoad}
      onError={() => {
        if (source === "reader") setSource("preview");
        else {
          setFailed(true);
          onUnavailable?.();
        }
      }}
    />
  );
}
