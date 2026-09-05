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

## Lettering

Three faces, loaded from Google Fonts:

- **Anton** — poster titles: the logo, the act cards, the end card
- **Bangers** — lettering furniture: speaker tags, sound effects, controls
- **Comic Neue** — the reading type: caption boxes and balloon dialogue

Balloons are set in caps with an ink outline and a tail drawn as a rotated
square carrying only its two outer edges, so the tail and the body share one
`drop-shadow`. Captions are newsprint paper with a halftone screen, and the
whole frame is printed inside a panel gutter (`#frame`).

## Camera

Each act carries a `data-cam` string of keyframes: `t` is the position on the
act timeline, `s` the zoom, and `fx`/`fy` the point of the plate to put under
the middle of the frame. `pan()` in `story.js` converts that to a translation
and clamps it so no edge of the plate can slide into shot — the plates are
centred horizontally but hang from the top of the frame, so the two axes are
clamped differently.

## Agent skills

`.agents/skills/` holds the official GreenSock GSAP skills, installed with:

```
npx skills add https://github.com/greensock/gsap-skills
```
