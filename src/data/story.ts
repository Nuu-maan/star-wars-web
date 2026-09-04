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

export const storyPages: StoryPage[] = [];
