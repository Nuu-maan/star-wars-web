"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";

import { scenes, storyPages, type Hotspot } from "@/data/story";

const WHEEL_THRESHOLD = 64;
const WHEEL_IDLE_MS = 170;
const TURN_COOLDOWN_MS = 420;

const reduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function TatooineExperience() {
  const frameRef = useRef<HTMLDivElement>(null);
  const stageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const camRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const spotStageRef = useRef<HTMLDivElement>(null);
  const spotCamRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLElement | null)[]>([]);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);

  const shownIndex = useRef(0);
  const lockedUntil = useRef(0);
  const wheelDelta = useRef(0);
  const wheelIdle = useRef<number | null>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // Tweened as one object so a single onUpdate writes the whole atmosphere.
  const grade = useRef({
    scale: storyPages[0].camera.scale,
    r: storyPages[0].tint[0],
    g: storyPages[0].tint[1],
    b: storyPages[0].tint[2],
    a: storyPages[0].tint[3],
    mist: storyPages[0].mist,
    bloom: storyPages[0].bloom,
  });

  const [index, setIndex] = useState(0);
  const [note, setNote] = useState<Hotspot | null>(null);
  const [transmitted, setTransmitted] = useState(false);
  const [fragment, setFragment] = useState(-1);

  const page = storyPages[index];
  const last = storyPages.length - 1;
  const activeScene = page.scene;
  // Reaching the envoy page without playing the message still has to show her.
  const envoyVisible = transmitted || page.id === "envoy";

  const goTo = useCallback((next: number) => {
    setIndex((current) => {
      const clamped = Math.max(0, Math.min(storyPages.length - 1, next));
      if (clamped === current) return current;
      setNote(null);
      setFragment(-1);
      return clamped;
    });
  }, []);

  const turn = useCallback(
    (direction: -1 | 1) => {
      const now = performance.now();
      if (now < lockedUntil.current) return;
      lockedUntil.current = now + TURN_COOLDOWN_MS;
      setIndex((current) => {
        const next = Math.max(0, Math.min(storyPages.length - 1, current + direction));
        if (next !== current) {
          setNote(null);
          setFragment(-1);
        }
        return next;
      });
    },
    [],
  );

  const paintGrade = useCallback(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const { scale, r, g, b, a, mist, bloom } = grade.current;
    frame.style.setProperty("--cam-scale", String(scale));
    frame.style.setProperty("--tint", `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${a})`);
    frame.style.setProperty("--mist", String(mist));
    frame.style.setProperty("--bloom", String(bloom));
  }, []);

  useLayoutEffect(() => {
    // gsap.context + revert (not kill) so React's double-invoked mount effect
    // cannot leave a half-played intro's autoAlpha baked into the DOM.
    const ctx = gsap.context(() => {
      const first = storyPages[0];
      Object.entries(stageRefs.current).forEach(([id, el]) => {
        if (!el) return;
        gsap.set(el, { autoAlpha: id === first.scene ? 1 : 0 });
        const opening = storyPages.find((entry) => entry.scene === id) ?? first;
        gsap.set(camRefs.current[id] ?? null, {
          scale: opening.camera.scale,
          xPercent: opening.camera.x * opening.camera.scale,
          yPercent: opening.camera.y * opening.camera.scale,
          force3D: true,
        });
      });
      gsap.set(spotCamRef.current, {
        scale: first.camera.scale,
        xPercent: first.camera.x * first.camera.scale,
        yPercent: first.camera.y * first.camera.scale,
        force3D: true,
      });
      pageRefs.current.forEach((el, i) => {
        if (el) gsap.set(el, { autoAlpha: i === 0 ? 1 : 0 });
      });
      paintGrade();

      if (reduced()) return;

      gsap
        .timeline({ defaults: { force3D: true } })
        .from(frameRef.current, { autoAlpha: 0, scale: 0.985, duration: 0.9, ease: "power2.out" })
        .from(
          copyRefs.current[0]?.children ?? [],
          { autoAlpha: 0, y: 28, duration: 0.9, ease: "power3.out", stagger: 0.08 },
          0.25,
        )
        .from(
          // .hint is left out on purpose: its visibility is CSS-driven, and a
          // `from` tween would bake the wrong end value into inline styles.
          [".chrome--top > *", ".spine", ".chrome--bottom"],
          {
            autoAlpha: 0,
            duration: 0.7,
            ease: "power2.out",
            stagger: 0.06,
            clearProps: "opacity,visibility",
          },
          0.35,
        );
    }, frameRef);

    return () => ctx.revert();
  }, [paintGrade]);

  useLayoutEffect(() => {
    if (!frameRef.current) return;

    const from = shownIndex.current;
    if (from === index) return;
    shownIndex.current = index;

    const next = storyPages[index];
    const slow = reduced();

    // Any page we skipped past mid-flight could be left part-faded.
    pageRefs.current.forEach((el, i) => {
      if (el && i !== from && i !== index) gsap.set(el, { autoAlpha: 0 });
    });

    const tl = gsap.timeline({ defaults: { overwrite: "auto", force3D: true } });

    {
      const previous = storyPages[from];
      const camera = {
        scale: next.camera.scale,
        xPercent: next.camera.x * next.camera.scale,
        yPercent: next.camera.y * next.camera.scale,
      };
      const cam = camRefs.current[next.scene] ?? null;

      if (previous.scene !== next.scene) {
        // A different room, not a different corner of the same one: retreat the
        // old scene and let the new one settle in from slightly too wide.
        tl.to(
          stageRefs.current[previous.scene] ?? null,
          { autoAlpha: 0, duration: slow ? 0 : 0.65, ease: "power2.inOut" },
          0,
        );
        gsap.set(cam, { ...camera, scale: camera.scale * 1.1 });
        tl.to(
          stageRefs.current[next.scene] ?? null,
          { autoAlpha: 1, duration: slow ? 0 : 0.85, ease: "power2.out" },
          slow ? 0 : 0.2,
        );
        tl.to(cam, { ...camera, duration: slow ? 0 : 1.6, ease: "power2.out" }, slow ? 0 : 0.2);
        tl.set(spotCamRef.current, camera, slow ? 0 : 0.45);
      } else {
        tl.to(
          [cam, spotCamRef.current],
          { ...camera, duration: slow ? 0 : 1.35, ease: "power2.inOut" },
          0,
        );
      }

      // Markers belong to a page, so they never cross a turn on screen.
      tl.to(spotStageRef.current, { autoAlpha: 0, duration: slow ? 0 : 0.28 }, 0);
      tl.to(spotStageRef.current, { autoAlpha: 1, duration: slow ? 0 : 0.5 }, slow ? 0 : 0.55);

      tl.to(
        grade.current,
        {
          scale: next.camera.scale,
          r: next.tint[0],
          g: next.tint[1],
          b: next.tint[2],
          a: next.tint[3],
          mist: next.mist,
          bloom: next.bloom,
          duration: slow ? 0 : 1.35,
          ease: "power1.inOut",
          onUpdate: paintGrade,
        },
        0,
      );

      const forward = index > from;

      // The article carries the readability scrim, so it owns the crossfade;
      // the copy only rises, which keeps exactly one scrim on screen.
      if (pageRefs.current[from]) {
        tl.to(pageRefs.current[from], { autoAlpha: 0, duration: slow ? 0 : 0.4, ease: "power2.in" }, 0);
        tl.to(
          copyRefs.current[from]?.children ?? [],
          { y: forward ? -20 : 20, duration: slow ? 0 : 0.4, ease: "power2.in" },
          0,
        );
      }

      if (pageRefs.current[index]) {
        tl.to(
          pageRefs.current[index],
          { autoAlpha: 1, duration: slow ? 0 : 0.6, ease: "power2.out" },
          slow ? 0 : 0.3,
        );
        tl.fromTo(
          copyRefs.current[index]?.children ?? [],
          { y: forward ? 34 : -34 },
          {
            y: 0,
            duration: slow ? 0 : 0.9,
            ease: "power3.out",
            stagger: slow ? 0 : 0.07,
          },
          slow ? 0 : 0.3,
        );
      }
    }

    // kill, never revert: an interrupted turn should hand its current values to
    // the next timeline instead of snapping back.
    return () => {
      tl.kill();
    };
  }, [index, paintGrade]);

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
    // Accumulate the gesture rather than locking on the first event: one
    // trackpad flick is dozens of wheel events and should still be one page.
    const onWheel = (event: WheelEvent) => {
      const delta = event.deltaY;
      if (delta * wheelDelta.current < 0) wheelDelta.current = 0;
      wheelDelta.current += delta;

      if (wheelIdle.current) window.clearTimeout(wheelIdle.current);
      wheelIdle.current = window.setTimeout(() => {
        wheelDelta.current = 0;
      }, WHEEL_IDLE_MS);

      if (Math.abs(wheelDelta.current) < WHEEL_THRESHOLD) return;
      wheelDelta.current = 0;
      turn(delta > 0 ? 1 : -1);
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
      if (wheelIdle.current) window.clearTimeout(wheelIdle.current);
    };
  }, [turn]);

  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (reduced()) return;

    const active = stageRefs.current[activeScene];
    const layers = Array.from(
      (active ?? frame).querySelectorAll<HTMLElement>("[data-depth]"),
    );
    const movers = layers.map((layer) => ({
      depth: Number(layer.dataset.depth ?? 1),
      x: gsap.quickTo(layer, "x", { duration: 0.9, ease: "power2.out" }),
      y: gsap.quickTo(layer, "y", { duration: 0.9, ease: "power2.out" }),
    }));

    const cursor = cursorRef.current;
    const cursorX = cursor ? gsap.quickTo(cursor, "x", { duration: 0.28, ease: "power3.out" }) : null;
    const cursorY = cursor ? gsap.quickTo(cursor, "y", { duration: 0.28, ease: "power3.out" }) : null;

    let queued = 0;
    let px = 0;
    let py = 0;

    const apply = () => {
      queued = 0;
      const x = px / window.innerWidth - 0.5;
      const y = py / window.innerHeight - 0.5;
      movers.forEach((mover) => {
        mover.x(x * mover.depth * -16);
        mover.y(y * mover.depth * -9);
      });
      cursorX?.(px);
      cursorY?.(py);
    };

    const onMove = (event: PointerEvent) => {
      px = event.clientX;
      py = event.clientY;
      cursor?.setAttribute("data-visible", "true");
      if (!queued) queued = requestAnimationFrame(apply);
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
      if (queued) cancelAnimationFrame(queued);
      gsap.killTweensOf(layers);
    };
  }, [activeScene]);

  useEffect(() => {
    const el = frameRef.current?.querySelector<HTMLElement>('[data-layer="hs-envoy"]');
    if (!el) return;
    if (!envoyVisible) {
      gsap.set(el, { autoAlpha: 0 });
      return;
    }
    gsap.fromTo(
      el,
      { autoAlpha: 0, scaleY: reduced() ? 1 : 0.82, transformOrigin: "50% 100%" },
      { autoAlpha: 0.92, scaleY: 1, duration: reduced() ? 0 : 1.1, ease: "power2.out" },
    );
  }, [envoyVisible]);

  const playTransmission = useCallback(() => {
    const lines = page.transmission?.fragments ?? [];
    setTransmitted(true);
    setFragment(0);
    if (reduced()) {
      setFragment(lines.length);
      return;
    }
    const tl = gsap.timeline();
    const el = frameRef.current?.querySelector<HTMLElement>('[data-layer="hs-envoy"]');
    if (el) {
      // signal interference before the figure resolves
      tl.to(el, { autoAlpha: 0.34, duration: 0.07, repeat: 7, yoyo: true, ease: "none" }, 0.35);
      tl.to(el, { autoAlpha: 0.92, duration: 0.5, ease: "power2.out" }, 1.2);
    }
    lines.forEach((_, i) => {
      tl.call(() => setFragment(i + 1), undefined, 1.1 + i * 1.9);
    });
  }, [page.transmission]);

  useEffect(() => {
    if (!note) return;
    const el = frameRef.current?.querySelector(".note");
    if (!el) return;
    gsap.fromTo(
      el,
      { autoAlpha: 0, x: reduced() ? 0 : 26 },
      { autoAlpha: 1, x: 0, duration: reduced() ? 0 : 0.55, ease: "power3.out" },
    );
  }, [note]);

  return (
    <main className="book">
      <div ref={frameRef} className="frame">
        {Object.entries(scenes).map(([sceneId, layers]) => (
          <div
            key={sceneId}
            className="stage"
            aria-hidden="true"
            ref={(el) => {
              stageRefs.current[sceneId] = el;
            }}
          >
            <div
              className="camera"
              ref={(el) => {
                camRefs.current[sceneId] = el;
              }}
            >
              <div className="scene">
                {layers.map((layer) =>
                  layer.src ? (
                    <div
                      key={layer.id}
                      className={`layer layer--${layer.id}`}
                      data-depth={layer.depth}
                      data-layer={layer.id}
                    >
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
                    <div
                      key={layer.id}
                      className={`layer layer--${layer.id}`}
                      data-depth={layer.depth}
                      data-layer={layer.id}
                    />
                  ),
                )}
              </div>
            </div>
          </div>
        ))}

        <div className="bloom" aria-hidden="true" />
        <div className="tint" aria-hidden="true" />
        <div className="veil" aria-hidden="true">
          <Image src="/assets/tatooine/dust-overlay.png" alt="" fill sizes="140vw" draggable={false} />
        </div>
        <div className="grain" aria-hidden="true" />
        <div className="vignette" aria-hidden="true" />

        <p className="visually-hidden">
          An illustrated desert settlement stretches beneath the twin suns of Tatooine, framed by
          dark sandstone cliffs.
        </p>

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
              ref={(el) => {
                pageRefs.current[entryIndex] = el;
              }}
              data-align={entry.align}
              aria-hidden={entryIndex !== index}
              inert={entryIndex !== index}
            >
              <div
                className="page__copy"
                ref={(el) => {
                  copyRefs.current[entryIndex] = el;
                }}
              >
                <p className="page__kicker">{entry.kicker}</p>
                <h1 className="page__title">{entry.title}</h1>
                <p className="page__body">{entry.body}</p>
                {entry.quote && <blockquote className="page__quote">{entry.quote}</blockquote>}
                {entry.transmission && (
                  <div className="signal">
                    <button
                      className="signal__play"
                      type="button"
                      onClick={playTransmission}
                      disabled={fragment >= 0}
                    >
                      <span className="signal__wave" aria-hidden="true">
                        <i />
                        <i />
                        <i />
                        <i />
                      </span>
                      {fragment < 0 ? entry.transmission.action : "Receiving"}
                    </button>
                    <ol className="signal__log" aria-live="polite">
                      {entry.transmission.fragments.slice(0, Math.max(fragment, 0)).map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ol>
                    {fragment > entry.transmission.fragments.length - 1 && fragment > 0 && (
                      <p className="signal__closing">{entry.transmission.closing}</p>
                    )}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="stage stage--spots" ref={spotStageRef}>
          <div ref={spotCamRef} className="camera">
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
          </div>
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

        <p className="visually-hidden" role="status" aria-live="polite">
          Page {index + 1} of {storyPages.length}. {page.chapter}.
        </p>
      </div>

      <div ref={cursorRef} className="cursor" data-visible="false" aria-hidden="true" />
    </main>
  );
}
