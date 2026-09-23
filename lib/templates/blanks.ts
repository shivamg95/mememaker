import { uid } from "../ids";
import type { StudioTemplate } from "../types";

export const BLANKS: StudioTemplate[] = [
  {
    id: "blank-square",
    name: "Square 1:1",
    url: null,
    width: 1080,
    height: 1080,
    boxCount: 2,
    category: "Blank",
    aliases: ["empty", "solid"],
    fill: "#141416",
  },
  {
    id: "blank-portrait",
    name: "Portrait 4:5",
    url: null,
    width: 1080,
    height: 1350,
    boxCount: 2,
    category: "Blank",
    aliases: ["instagram"],
    fill: "#141416",
  },
  {
    id: "blank-story",
    name: "Story 9:16",
    url: null,
    width: 1080,
    height: 1920,
    boxCount: 2,
    category: "Blank",
    aliases: ["reel", "tiktok"],
    fill: "#141416",
  },
  {
    id: "blank-wide",
    name: "Wide 16:9",
    url: null,
    width: 1920,
    height: 1080,
    boxCount: 2,
    category: "Blank",
    aliases: ["youtube", "banner"],
    fill: "#141416",
  },
  {
    id: "blank-amber",
    name: "Amber field",
    url: null,
    width: 1080,
    height: 1080,
    boxCount: 2,
    category: "Blank",
    aliases: ["gold"],
    fill: "#2A2114",
    fill2: "#E8B86D",
  },
  {
    id: "blank-bone",
    name: "Bone field",
    url: null,
    width: 1080,
    height: 1080,
    boxCount: 2,
    category: "Blank",
    aliases: ["light"],
    fill: "#E7E1D4",
  },
];

export function uniqueBlankId(base: string) {
  return `${base}-${uid()}`;
}
