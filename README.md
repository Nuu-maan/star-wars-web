# The Waiting World

A scroll-driven illustrated comic in three acts. Pure HTML, CSS and vanilla
JavaScript with GSAP and ScrollTrigger from a CDN. No build step.

## Run

Serve the folder with any static server, for example:

```
python3 -m http.server 8000
```

## Layout

- `index.html` — all three acts and twelve scenes as real text, with camera
  and layer keyframes in `data-*` attributes
- `style.css` — stage geometry, art anchoring, text styling, static fallback
- `story.js` — reads the DOM and builds the scroll timelines
- `assets/` — one WebP per plate, converted from the source art

The story is readable with JavaScript disabled, and `prefers-reduced-motion`
or the "Skip the animation" control turns it into a stacked document.
