"use client";

import Image from "next/image";

import { sceneLayers, storyPages } from "@/data/story";

export function TatooineExperience() {
  const index = 0;

  const page = storyPages[index];

  return (
    <main className="book">
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
      </div>
    </main>
  );
}
