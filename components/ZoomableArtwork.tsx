"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

import { assetUrl, type Scene } from "@/lib/content";
import { ArtworkImage } from "./ArtworkImage";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const SCALE_STEP = 0.5;
const DRAG_THRESHOLD = 4;

type Point = { x: number; y: number };
type Transform = Point & { scale: number };
type Drag = { pointerId: number; start: Point; transform: Transform };
type Pinch = {
  distance: number;
  scale: number;
  content: Point;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

function boundedTransform(next: Transform, viewport: HTMLDivElement | null, scene: Scene): Transform {
  const scale = clamp(next.scale, MIN_SCALE, MAX_SCALE);
  if (!viewport || scale === MIN_SCALE) return { scale, x: 0, y: 0 };
  const { clientWidth: width, clientHeight: height } = viewport;
  const artworkRatio = scene.width / scene.height;
  const viewportRatio = width / height;
  const fittedWidth = artworkRatio > viewportRatio ? width : height * artworkRatio;
  const fittedHeight = artworkRatio > viewportRatio ? width / artworkRatio : height;
  const maxX = Math.max(0, (fittedWidth * scale - width) / 2);
  const maxY = Math.max(0, (fittedHeight * scale - height) / 2);
  return { scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
}

export function ZoomableArtwork({ scene }: { scene: Scene }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const drag = useRef<Drag | undefined>(undefined);
  const pinch = useRef<Pinch | undefined>(undefined);
  const moved = useRef(false);
  const transformRef = useRef<Transform>({ scale: MIN_SCALE, x: 0, y: 0 });
  const [transform, setTransform] = useState(transformRef.current);
  const [unavailable, setUnavailable] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [lens, setLens] = useState<Point>();

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(() => {
      const clamped = boundedTransform(transformRef.current, viewport, scene);
      transformRef.current = clamped;
      setTransform(clamped);
    });
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [scene]);

  function applyTransform(next: Transform) {
    const clamped = boundedTransform(next, viewportRef.current, scene);
    transformRef.current = clamped;
    setTransform(clamped);
  }

  function zoomAround(nextScale: number, anchor?: Point) {
    const viewport = viewportRef.current;
    if (!viewport || unavailable) return;
    const current = transformRef.current;
    const rect = viewport.getBoundingClientRect();
    const point = anchor ?? { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const relative = { x: point.x - rect.left - rect.width / 2, y: point.y - rect.top - rect.height / 2 };
    const scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const ratio = scale / current.scale;
    applyTransform({
      scale,
      x: relative.x - (relative.x - current.x) * ratio,
      y: relative.y - (relative.y - current.y) * ratio,
    });
    if (scale > MIN_SCALE) setLens(undefined);
  }

  function reset() {
    applyTransform({ scale: MIN_SCALE, x: 0, y: 0 });
    setDragging(false);
  }

  function beginPinch() {
    const viewport = viewportRef.current;
    const active = [...pointers.current.values()];
    if (!viewport || active.length < 2) return;
    const current = transformRef.current;
    const rect = viewport.getBoundingClientRect();
    const center = midpoint(active[0], active[1]);
    const relative = { x: center.x - rect.left - rect.width / 2, y: center.y - rect.top - rect.height / 2 };
    pinch.current = {
      distance: Math.max(distance(active[0], active[1]), 1),
      scale: current.scale,
      content: {
        x: (relative.x - current.x) / current.scale,
        y: (relative.y - current.y) / current.scale,
      },
    };
    moved.current = true;
    setDragging(true);
    setLens(undefined);
  }

  function updateLens(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "mouse" || transformRef.current.scale !== MIN_SCALE || unavailable) return;
    const rect = event.currentTarget.getBoundingClientRect();
    setLens({ x: event.clientX - rect.left, y: event.clientY - rect.top });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (unavailable) return;
    if (pointers.current.size === 0) moved.current = false;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, start: point, transform: transformRef.current };
    if (pointers.current.size === 2) beginPinch();
    else if (transformRef.current.scale > MIN_SCALE) setDragging(true);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    updateLens(event);
    if (!pointers.current.has(event.pointerId)) return;
    const point = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, point);

    if (pointers.current.size >= 2) {
      if (!pinch.current) beginPinch();
      const baseline = pinch.current;
      const viewport = viewportRef.current;
      const active = [...pointers.current.values()];
      if (!baseline || !viewport) return;
      const center = midpoint(active[0], active[1]);
      const rect = viewport.getBoundingClientRect();
      const relative = { x: center.x - rect.left - rect.width / 2, y: center.y - rect.top - rect.height / 2 };
      const scale = clamp(baseline.scale * distance(active[0], active[1]) / baseline.distance, MIN_SCALE, MAX_SCALE);
      applyTransform({
        scale,
        x: relative.x - baseline.content.x * scale,
        y: relative.y - baseline.content.y * scale,
      });
      return;
    }

    const baseline = drag.current;
    if (!baseline || baseline.pointerId !== event.pointerId) return;
    const delta = { x: point.x - baseline.start.x, y: point.y - baseline.start.y };
    if (Math.hypot(delta.x, delta.y) > DRAG_THRESHOLD) moved.current = true;
    if (transformRef.current.scale > MIN_SCALE) {
      applyTransform({
        scale: baseline.transform.scale,
        x: baseline.transform.x + delta.x,
        y: baseline.transform.y + delta.y,
      });
    }
  }

  function finishPointer(event: PointerEvent<HTMLDivElement>, cancelled = false) {
    const wasPinching = pointers.current.size > 1 || Boolean(pinch.current);
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    pinch.current = undefined;

    const remaining = [...pointers.current.entries()][0];
    if (remaining) {
      drag.current = { pointerId: remaining[0], start: remaining[1], transform: transformRef.current };
      return;
    }

    setDragging(false);
    drag.current = undefined;
    if (!cancelled && !wasPinching && !moved.current && event.pointerType === "mouse") {
      zoomAround(transformRef.current.scale === MIN_SCALE ? 2 : MIN_SCALE, { x: event.clientX, y: event.clientY });
    }
    moved.current = false;
  }

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (unavailable) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      zoomAround(transformRef.current.scale === MIN_SCALE ? 2 : MIN_SCALE);
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomAround(transformRef.current.scale + SCALE_STEP);
    } else if (event.key === "-") {
      event.preventDefault();
      zoomAround(transformRef.current.scale - SCALE_STEP);
    } else if (event.key === "Escape" || event.key === "0") {
      event.preventDefault();
      reset();
    }
  }

  const scaleLabel = `${Number(transform.scale.toFixed(1))}×`;
  const lensPosition = lens && viewportRef.current
    ? { x: lens.x / viewportRef.current.clientWidth * 100, y: lens.y / viewportRef.current.clientHeight * 100 }
    : undefined;

  return (
    <div className="zoom-artwork">
      <div
        ref={viewportRef}
        className="zoom-artwork__viewport"
        role="button"
        tabIndex={unavailable ? -1 : 0}
        aria-label={`Zoom artwork: ${scene.title}`}
        aria-disabled={unavailable}
        data-enlarged={transform.scale > MIN_SCALE}
        data-dragging={dragging}
        onKeyDown={onKeyDown}
        onPointerEnter={updateLens}
        onPointerLeave={() => { if (pointers.current.size === 0) setLens(undefined); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => finishPointer(event)}
        onPointerCancel={(event) => finishPointer(event, true)}
      >
        <ArtworkImage
          scene={scene}
          size="reader"
          eager
          className="zoom-artwork__image"
          style={{ transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})` }}
          draggable={false}
          onLoad={() => setUnavailable(false)}
          onUnavailable={() => { setUnavailable(true); reset(); }}
        />
        {lens && transform.scale === MIN_SCALE && !unavailable && (
          <span
            className="art-lens"
            aria-hidden="true"
            style={{
              left: lens.x,
              top: lens.y,
              backgroundImage: `url(${assetUrl(scene.images.reader)}), url(${assetUrl(scene.images.preview)})`,
              backgroundPosition: `${lensPosition?.x ?? 50}% ${lensPosition?.y ?? 50}%`,
            }}
          />
        )}
      </div>
      <div className="zoom-toolbar" role="group" aria-label="Artwork zoom controls">
        <button type="button" aria-label="Zoom out" disabled={unavailable || transform.scale <= MIN_SCALE} onClick={() => zoomAround(transform.scale - SCALE_STEP)}>−</button>
        <output aria-live="polite" aria-label="Artwork zoom level">{scaleLabel}</output>
        <button type="button" aria-label="Zoom in" disabled={unavailable || transform.scale >= MAX_SCALE} onClick={() => zoomAround(transform.scale + SCALE_STEP)}>+</button>
        <button type="button" disabled={unavailable || transform.scale === MIN_SCALE} onClick={reset} aria-label="Reset artwork zoom">Reset</button>
      </div>
    </div>
  );
}
