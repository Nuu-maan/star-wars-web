"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";

import { sceneLayers, storyPages } from "@/data/story";

const TURN_LOCK_MS = 820;

export function TatooineExperience() {
  const lockedUntil = useRef(0);

  const [index, setIndex] = useState(0);
  const [ready, setReady] = useState(false);

  const page = storyPages[index];
  const last = storyPages.length - 1;

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(storyPages.length - 1, next));
    setIndex((current) => {
      if (clamped === current) return current;
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

  return (
    <main className="book" data-ready={ready}>
      <div
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
      </div>
    </main>
  );
}
