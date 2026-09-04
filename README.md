# Tatooine — Galactic Archive

An illustrated, interactive storybook of the desert world of Tatooine, built with
Next.js. Five chapters are framed as a single cinematic panel: one painted
parallax diorama that the camera moves through as you turn the page.

## The idea

The artwork is a matte-painting diorama assembled from separate plates — sky,
twin suns, distant ridges, mesas, ground, settlement, drifting dust and
foreground rock. Nothing re-mounts between chapters. Turning a page only moves a
CSS camera (`scale`, `x`, `y`) and shifts the tint, mist and sun bloom, so the
transition reads as a camera move through one continuous painting rather than a
slideshow.

- **Turn a page** with the wheel, a swipe, the arrow keys, space, `Home` / `End`,
  the corner arrows, or the chapter numerals.
- **Inspect the scene** by opening the hotspots pinned to the artwork; they share
  the camera transform, so they stay attached to what they label.
- Dust drifts behind the art and a second veil drifts in front of the title.
- Layers respond to the pointer, with a trailing cursor ring on fine pointers.

## Accessibility

Inactive pages are `inert` and hidden from the accessibility tree, page changes
are announced through a live region, every control is reachable by keyboard, and
`prefers-reduced-motion` disables the camera move, the drift and the parallax.

## Running it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

```bash
npm run build   # production build
npm run lint    # eslint
```
