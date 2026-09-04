export type SceneLayer = {
  id: string;
  src: string;
  depth: number;
  priority?: boolean;
  sizes?: string;
  /** Only painted once this reveal has been triggered on the page. */
  reveal?: string;
};

const outerWaste: SceneLayer[] = [
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

const homestead: SceneLayer[] = [
  {
    id: "hs-room",
    src: "/assets/tatooine/chapter-02-message/homestead-interior-master.png",
    depth: 0.16,
    sizes: "100vw",
  },
  {
    id: "hs-droid",
    src: "/assets/tatooine/chapter-02-message/utility-droid.png",
    depth: 1.05,
    sizes: "22vw",
  },
  {
    id: "hs-mechanic",
    src: "/assets/tatooine/chapter-02-message/farm-mechanic.png",
    depth: 1.25,
    sizes: "28vw",
  },
  {
    id: "hs-envoy",
    src: "/assets/tatooine/chapter-02-message/rebel-envoy-hologram.png",
    depth: 0.95,
    sizes: "24vw",
    reveal: "transmission",
  },
  {
    id: "hs-arch",
    src: "/assets/tatooine/chapter-02-message/foreground-arch.png",
    depth: 2.6,
    sizes: "110vw",
  },
];

export const scenes: Record<string, SceneLayer[]> = {
  "outer-waste": outerWaste,
  homestead,
};

export const sceneIds = Object.keys(scenes);

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

/** [r, g, b, a] so the grade can be interpolated between pages. */
export type Tint = [number, number, number, number];

export type Transmission = {
  /** Label on the control that starts the playback. */
  action: string;
  /** Revealed one at a time as the signal resolves. */
  fragments: string[];
  closing: string;
};

export type StoryPage = {
  id: string;
  scene: string;
  numeral: string;
  chapter: string;
  kicker: string;
  title: string;
  body: string;
  quote?: string;
  align: "left" | "center" | "right";
  camera: Camera;
  tint: Tint;
  mist: number;
  bloom: number;
  hotspots: Hotspot[];
  transmission?: Transmission;
};

export const storyPages: StoryPage[] = [
  {
    id: "arrival",
    scene: "outer-waste",
    numeral: "I",
    chapter: "The Waiting World",
    kicker: "Outer Rim Territories · Arkanis sector",
    title: "Tatooine",
    body: "Two suns, one horizon, and a boy who kept looking at it. Before the rebellion, before the legend, there was only the long dry patience of this place.",
    align: "left",
    camera: { scale: 1.04, x: 0, y: 0 },
    tint: [24, 12, 16, 0.16],
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
    id: "vaporators",
    scene: "outer-waste",
    numeral: "II",
    chapter: "The Long Way Home",
    kicker: "Chapter One",
    title: "He knew every machine on the farm.",
    body: "Luke Skywalker repaired vaporators, chased another harvest, and watched ships become silver scratches in the high blue sky. He was useful here. He was loved here. Part of him was always somewhere else.",
    align: "left",
    camera: { scale: 1.55, x: 16.5, y: 8 },
    tint: [30, 14, 10, 0.2],
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
    scene: "outer-waste",
    numeral: "III",
    chapter: "The Promise",
    kicker: "Chapter One",
    title: "The suns always set together. Luke watched alone.",
    body: "He promised himself there would be another season, another chance to leave. But wait long enough and the life you postponed quietly becomes the only life you know.",
    quote: "Somewhere beyond the ridge, the future was already looking for him.",
    align: "left",
    camera: { scale: 1.3, x: -10, y: 12 },
    tint: [104, 38, 14, 0.3],
    mist: 0.22,
    bloom: 0.58,
    hotspots: [
      {
        id: "binary",
        x: 80,
        y: 19,
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
    scene: "outer-waste",
    numeral: "IV",
    chapter: "A Voice in the Dust",
    kicker: "Chapter One",
    title: "An old droid carried a message meant for someone else.",
    body: "It was incomplete and frightened — a stranger asking for help. Luke could have looked away. Instead he leaned closer. Great journeys sometimes begin with the simple decision to listen.",
    align: "center",
    camera: { scale: 1.78, x: 9, y: 11 },
    tint: [14, 8, 14, 0.42],
    mist: 0.92,
    bloom: 0.1,
    hotspots: [
      {
        id: "transmission",
        x: 24,
        y: 50,
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
    scene: "outer-waste",
    numeral: "V",
    chapter: "Beyond the Ridge",
    kicker: "Chapter One",
    title: "Some journeys begin with courage. His began with curiosity.",
    body: "To understand why Luke leaves, remember what asked him to stay: a home sturdy enough to dream from, and precious enough to make the leaving hurt.",
    align: "center",
    camera: { scale: 1, x: 0, y: -3 },
    tint: [20, 10, 14, 0.3],
    mist: 0.42,
    bloom: 0.4,
    hotspots: [],
  },
  {
    id: "threshold",
    scene: "homestead",
    numeral: "VI",
    chapter: "Out of the Heat",
    kicker: "Chapter Two",
    title: "Inside, the day gave up at the door.",
    body: "Thick walls, cool air, and the particular quiet of a room built to outlast weather. He set the droid down where the light was best and let the sand fall off both of them.",
    align: "left",
    camera: { scale: 1.05, x: 0, y: 0 },
    tint: [26, 14, 12, 0.18],
    mist: 0.12,
    bloom: 0.3,
    hotspots: [
      {
        id: "arch-window",
        x: 68,
        y: 34,
        label: "The far window",
        title: "The desert, kept at arm's length",
        body: "A single opening onto the waste, angled so the suns never fall directly on the table. The room was built by someone who intended to stay.",
        facts: [
          ["Aspect", "West"],
          ["Glass", "None"],
          ["Purpose", "Air, not view"],
        ],
      },
    ],
  },
  {
    id: "trust",
    scene: "homestead",
    numeral: "VII",
    chapter: "What the Droid Carried",
    kicker: "Chapter Two",
    title: "He waited for it to decide he was worth trusting.",
    body: "The droid had been somewhere it would not talk about. Its casing was scored, its charge was low, and it kept turning its lens toward the table as though checking that the room was empty.",
    align: "left",
    camera: { scale: 1.3, x: -2, y: -6 },
    tint: [30, 16, 14, 0.2],
    mist: 0.1,
    bloom: 0.24,
    hotspots: [
      {
        id: "droid",
        x: 67,
        y: 72,
        label: "Utility unit",
        title: "Older than its owner, ruder than both",
        body: "A farm droid with a courier's memory buffer, which is not a combination anyone builds on purpose. Whatever it is carrying, it was not carrying it for him.",
        facts: [
          ["Charge", "11%"],
          ["Buffer", "Sealed"],
          ["Origin", "Refuses"],
        ],
      },
    ],
  },
  {
    id: "table",
    scene: "homestead",
    numeral: "VIII",
    chapter: "The Table Wakes",
    kicker: "Chapter Two",
    title: "The table woke before he touched it.",
    body: "A cold blue thread climbed out of the emitter and hung there, waiting to be told it was allowed. Some part of him already knew that playing it would cost him the evening, and then rather more than the evening.",
    align: "left",
    camera: { scale: 1.5, x: -1, y: -8 },
    tint: [18, 14, 26, 0.26],
    mist: 0.14,
    bloom: 0.18,
    hotspots: [],
    transmission: {
      action: "Play the transmission",
      fragments: [
        "…signal degraded. Reconstructing.",
        "…if this reaches anyone still listening in the Outer Rim…",
        "…they have taken the archive. What is left of it is on this unit.",
      ],
      closing: "There is no one else. There is only whoever is standing there.",
    },
  },
  {
    id: "envoy",
    scene: "homestead",
    numeral: "IX",
    chapter: "A Route Into the Waste",
    kicker: "Chapter Two",
    title: "She was not speaking to him. He listened anyway.",
    body: "The message ended the way all honest pleas end — without a promise that anyone would come. Then the light folded itself into a line of coordinates, and the line pointed east, into the dune sea.",
    quote: "Curiosity had brought him this far. Something heavier would have to carry him the rest of the way.",
    align: "right",
    camera: { scale: 1.2, x: 8, y: -2 },
    tint: [22, 15, 24, 0.24],
    mist: 0.2,
    bloom: 0.42,
    hotspots: [
      {
        id: "route",
        x: 50,
        y: 66,
        label: "Plotted route",
        title: "East, past the last marker",
        body: "Eleven hours by skiff if the weather holds, and the weather does not hold. Beyond the canyon the maps stop agreeing with each other.",
        facts: [
          ["Bearing", "084°"],
          ["Distance", "310 km"],
          ["Escort", "None"],
        ],
      },
    ],
  },
];
