"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import { sceneLayers, storyPages, type Hotspot } from "@/data/story";

const TURN_LOCK_MS = 820;

export function TatooineExperience() {
  const frameRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const lockedUntil = useRef(0);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const [index, setIndex] = useState(0);
  const [note, setNote] = useState<Hotspot | null>(null);
  const [ready, setReady] = useState(false);

  const page = storyPages[index];
  const last = storyPages.length - 1;

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(storyPages.length - 1, next));
    setIndex((current) => {
      if (clamped === current) return current;
      setNote(null);
      return clamped;
    });
  }, []);

  const turn = useCallback(
    (direction: -1 | 1) => {
      const now = performance.now();
      if (now < lockedUntil.current) return;
      lockedUntil.current = now + TURN_LOCK_MS;
      setIndex((current) => {
        const next = Math.max(0, Math.min(storyPages.length - 1, current + direction));
        if (next !== current) setNote(null);
        return next;
      });
    },
    [],
  );

  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), 80);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      switch (event.key) {
        case "Escape":
          setNote(null);
          return;
        case "ArrowRight":
        case "ArrowDown":
        case "PageDown":
        case " ":
          event.preventDefault();
          turn(1);
          return;
        case "ArrowLeft":
        case "ArrowUp":
        case "PageUp":
          event.preventDefault();
          turn(-1);
          return;
        case "Home":
          event.preventDefault();
          goTo(0);
          return;
        case "End":
          event.preventDefault();
          goTo(storyPages.length - 1);
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goTo, turn]);

  useEffect(() => {
    const onWheel = (event: WheelEvent) => {
      if (Math.abs(event.deltaY) < 12) return;
      turn(event.deltaY > 0 ? 1 : -1);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.changedTouches[0];
      touchStart.current = { x: touch.clientX, y: touch.clientY };
    };

    const onTouchEnd = (event: TouchEvent) => {
      const start = touchStart.current;
      if (!start) return;
      touchStart.current = null;

      const touch = event.changedTouches[0];
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const travel = Math.abs(dx) > Math.abs(dy) ? dx : dy;
      if (Math.abs(travel) < 48) return;
      turn(travel < 0 ? 1 : -1);
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [turn]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layers = Array.from(frame.querySelectorAll<HTMLElement>("[data-depth]"));
    const movers = layers.map((layer) => ({
      depth: Number(layer.dataset.depth ?? 1),
      x: gsap.quickTo(layer, "x", { duration: 0.85, ease: "power3.out" }),
      y: gsap.quickTo(layer, "y", { duration: 0.85, ease: "power3.out" }),
    }));

    const cursor = cursorRef.current;
    const cursorX = cursor ? gsap.quickTo(cursor, "x", { duration: 0.32, ease: "power3.out" }) : null;
    const cursorY = cursor ? gsap.quickTo(cursor, "y", { duration: 0.32, ease: "power3.out" }) : null;

    const onMove = (event: PointerEvent) => {
      const x = event.clientX / window.innerWidth - 0.5;
      const y = event.clientY / window.innerHeight - 0.5;

      movers.forEach((mover) => {
        mover.x(x * mover.depth * -16);
        mover.y(y * mover.depth * -9);
      });

      cursorX?.(event.clientX);
      cursorY?.(event.clientY);
      cursor?.setAttribute("data-visible", "true");
    };

    const onLeave = () => {
      movers.forEach((mover) => {
        mover.x(0);
        mover.y(0);
      });
      cursor?.setAttribute("data-visible", "false");
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    return () => {
      window.removeEventListener("pointermove", onMove);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      gsap.killTweensOf(layers);
    };
  }, []);

  return (
    <main className="book" data-ready={ready}>
      <div
        ref={frameRef}
        className="frame"
        style={
          {
            "--cam-scale": page.camera.scale,
            "--cam-x": `${page.camera.x}%`,
            "--cam-y": `${page.camera.y}%`,
            "--tint": page.tint,
            "--mist": page.mist,
            "--bloom": page.bloom,
          } as React.CSSProperties
        }
      >
        <div className="scene" aria-hidden="true">
          {sceneLayers.map((layer) =>
            layer.src ? (
              <div key={layer.id} className={`layer layer--${layer.id}`} data-depth={layer.depth}>
                <Image
                  src={layer.src}
                  alt=""
                  fill
                  priority={layer.priority}
                  sizes={layer.sizes ?? "100vw"}
                  draggable={false}
                />
              </div>
            ) : (
              <div key={layer.id} className={`layer layer--${layer.id}`} data-depth={layer.depth} />
            ),
          )}
        </div>

        <div className="bloom" aria-hidden="true" />

        <div className="tint" aria-hidden="true" />
        <div className="veil" aria-hidden="true">
          <Image src="/assets/tatooine/dust-overlay.png" alt="" fill sizes="140vw" draggable={false} />
        </div>
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />

        <header className="chrome chrome--top">
          <p className="mark">
            <span className="mark__orbit" aria-hidden="true" />
            Galactic Archive
          </p>
          <p className="folio">
            {String(index + 1).padStart(2, "0")}
            <span aria-hidden="true"> / </span>
            {String(storyPages.length).padStart(2, "0")}
          </p>
        </header>

        <p className="spine" aria-hidden="true">
          <span>{page.numeral}</span>
          <i />
          <span>{page.chapter}</span>
        </p>

        <div className="pages">
          {storyPages.map((entry, entryIndex) => (
            <article
              key={entry.id}
              className="page"
              data-state={
                entryIndex === index ? "active" : entryIndex < index ? "before" : "after"
              }
              data-align={entry.align}
            >
              <div className="page__copy">
                <p className="page__kicker">{entry.kicker}</p>
                <h1 className="page__title">{entry.title}</h1>
                <p className="page__body">{entry.body}</p>
                {entry.quote && <blockquote className="page__quote">{entry.quote}</blockquote>}
              </div>
            </article>
          ))}
        </div>

        <div className="hotspots">
          {page.hotspots.map((hotspot) => (
            <button
              key={hotspot.id}
              className="hotspot"
              type="button"
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
              aria-expanded={note?.id === hotspot.id}
              onClick={() => setNote((current) => (current?.id === hotspot.id ? null : hotspot))}
            >
              <span className="hotspot__pulse" aria-hidden="true" />
              <span className="hotspot__ring" aria-hidden="true" />
              <span className="hotspot__label">{hotspot.label}</span>
            </button>
          ))}
        </div>

        {note && (
          <aside className="note" aria-label={note.title}>
            <button
              className="note__close"
              type="button"
              aria-label="Close field note"
              onClick={() => setNote(null)}
            >
              <span aria-hidden="true">×</span>
            </button>
            <p className="note__index">Field note · {page.numeral}</p>
            <h2>{note.title}</h2>
            <p className="note__body">{note.body}</p>
            <dl>
              {note.facts.map(([term, value]) => (
                <div key={term}>
                  <dt>{term}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
          </aside>
        )}

        <nav className="chrome chrome--bottom" aria-label="Story pages">
          <button
            className="turn"
            type="button"
            aria-label="Previous page"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
          >
            <span aria-hidden="true">←</span>
          </button>

          <ol className="ticks">
            {storyPages.map((entry, entryIndex) => (
              <li key={entry.id}>
                <button
                  type="button"
                  className={entryIndex === index ? "tick tick--active" : "tick"}
                  aria-current={entryIndex === index ? "step" : undefined}
                  onClick={() => goTo(entryIndex)}
                >
                  <span className="tick__numeral">{entry.numeral}</span>
                  <span className="visually-hidden">{entry.chapter}</span>
                </button>
              </li>
            ))}
          </ol>

          <button
            className="turn"
            type="button"
            aria-label="Next page"
            disabled={index === last}
            onClick={() => goTo(index + 1)}
          >
            <span aria-hidden="true">→</span>
          </button>
        </nav>

        <p className="hint" data-visible={index === 0}>
          <i aria-hidden="true" />
          Scroll, swipe or use ← → to turn the page
        </p>
      </div>

      <div ref={cursorRef} className="cursor" data-visible="false" aria-hidden="true" />
    </main>
  );
}
