export type SceneLayer = {
  id: string;
  src: string;
  depth: number;
  priority?: boolean;
  sizes?: string;
};

export const sceneLayers: SceneLayer[] = [
  { id: "sky", src: "/assets/tatooine/sky.png", depth: 0.1, priority: true, sizes: "100vw" },
  { id: "suns", src: "/assets/tatooine/twin-suns.png", depth: 0.24, priority: true, sizes: "46vw" },
  { id: "far", src: "/assets/tatooine/far-mountains.png", depth: 0.44, sizes: "112vw" },
  { id: "mid", src: "/assets/tatooine/midground-mesas.png", depth: 0.68, sizes: "116vw" },
  { id: "ground", src: "/assets/tatooine/desert-ground.png", depth: 0.9, priority: true, sizes: "100vw" },
  { id: "settlement", src: "/assets/tatooine/settlement.png", depth: 1.15, priority: true, sizes: "56vw" },
  { id: "haze", src: "", depth: 1.3 },
  { id: "dust", src: "/assets/tatooine/dust-overlay.png", depth: 1.5, sizes: "130vw" },
  { id: "left", src: "/assets/tatooine/foreground-left.png", depth: 2.2, sizes: "60vw" },
  { id: "right", src: "/assets/tatooine/foreground-right.png", depth: 2.45, sizes: "60vw" },
  { id: "center", src: "/assets/tatooine/foreground-center.png", depth: 2.9, sizes: "80vw" },
];

export type Hotspot = {
  id: string;
  x: number;
  y: number;
  label: string;
  title: string;
  body: string;
  facts: [string, string][];
};

export type Camera = {
  scale: number;
  x: number;
  y: number;
};

export type StoryPage = {
  id: string;
  numeral: string;
  chapter: string;
  kicker: string;
  title: string;
  body: string;
  quote?: string;
  align: "left" | "center" | "right";
  camera: Camera;
  tint: string;
  mist: number;
  bloom: number;
  hotspots: Hotspot[];
};

export const storyPages: StoryPage[] = [
  {
    id: "arrival",
    numeral: "I",
    chapter: "The Waiting World",
    kicker: "Outer Rim Territories · Arkanis sector",
    title: "Tatooine",
    body: "Two suns, one horizon, and a boy who kept looking at it. Before the rebellion, before the legend, there was only the long dry patience of this place.",
    align: "left",
    camera: { scale: 1.04, x: 0, y: 0 },
    tint: "rgba(24, 12, 16, 0.16)",
    mist: 0.5,
    bloom: 0.25,
    hotspots: [
      {
        id: "anchorhead",
        x: 22,
        y: 47,
        label: "Anchorhead",
        title: "A town the maps forgot",
        body: "Sandstone domes built low against the wind. Everyone here knows the shape of everyone else's day, and no one asks where the ships are going.",
        facts: [
          ["Population", "1,400"],
          ["Trade", "Moisture, scrap"],
          ["Law", "Whoever is armed"],
        ],
      },
    ],
  },
  {
    id: "homestead",
    numeral: "II",
    chapter: "The Long Way Home",
    kicker: "Chapter II",
    title: "He knew every machine on the farm.",
    body: "Luke Skywalker repaired vaporators, chased another harvest, and watched ships become silver scratches in the high blue sky. He was useful here. He was loved here. Part of him was always somewhere else.",
    align: "left",
    camera: { scale: 1.55, x: 16.5, y: 8 },
    tint: "rgba(30, 14, 10, 0.2)",
    mist: 0.28,
    bloom: 0.18,
    hotspots: [
      {
        id: "vaporator",
        x: 34,
        y: 45,
        label: "GX-8 vaporator",
        title: "Water, coaxed out of nothing",
        body: "A condenser tall as two men, pulling a few litres a day from air that would rather keep them. Break one and the season breaks with it.",
        facts: [
          ["Yield", "1.6 L / day"],
          ["Upkeep", "Constant"],
          ["Age", "Older than Luke"],
        ],
      },
    ],
  },
  {
    id: "promise",
    numeral: "III",
    chapter: "The Promise",
    kicker: "Chapter III",
    title: "The suns always set together. Luke watched alone.",
    body: "He promised himself there would be another season, another chance to leave. But wait long enough and the life you postponed quietly becomes the only life you know.",
    quote: "Somewhere beyond the ridge, the future was already looking for him.",
    align: "right",
    camera: { scale: 1.35, x: -14, y: 14 },
    tint: "rgba(58, 20, 10, 0.24)",
    mist: 0.2,
    bloom: 0.95,
    hotspots: [
      {
        id: "binary",
        x: 77,
        y: 20,
        label: "Tatoo I & II",
        title: "A binary sunset",
        body: "Two stars locked in the same slow argument. On Tatooine nothing casts a single shadow, and nothing is ever quite alone.",
        facts: [
          ["Class", "G / K binary"],
          ["Daylight", "23 standard hrs"],
          ["Shadows", "Always two"],
        ],
      },
    ],
  },
  {
    id: "signal",
    numeral: "IV",
    chapter: "A Voice in the Dust",
    kicker: "Chapter IV",
    title: "An old droid carried a message meant for someone else.",
    body: "It was incomplete and frightened — a stranger asking for help. Luke could have looked away. Instead he leaned closer. Great journeys sometimes begin with the simple decision to listen.",
    align: "center",
    camera: { scale: 1.78, x: 9, y: 11 },
    tint: "rgba(14, 8, 14, 0.42)",
    mist: 0.92,
    bloom: 0.1,
    hotspots: [
      {
        id: "transmission",
        x: 24,
        y: 56,
        label: "Recovered transmission",
        title: "…help me. You're my only hope.",
        body: "A princess. A rebellion. A plea that will make this small world impossible to return to unchanged.",
        facts: [
          ["Source", "Unknown"],
          ["Integrity", "38%"],
          ["Loop", "Endless"],
        ],
      },
    ],
  },
  {
    id: "departure",
    numeral: "V",
    chapter: "Beyond the Ridge",
    kicker: "Chapter V",
    title: "Some journeys begin with courage. His began with curiosity.",
    body: "To understand why Luke leaves, remember what asked him to stay: a home sturdy enough to dream from, and precious enough to make the leaving hurt.",
    align: "center",
    camera: { scale: 1, x: 0, y: -3 },
    tint: "rgba(20, 10, 14, 0.3)",
    mist: 0.42,
    bloom: 0.4,
    hotspots: [],
  },
];
