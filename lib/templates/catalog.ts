import type { StudioTemplate, TemplateCategory } from "../types";

type ImgflipMeme = {
  id: string;
  name: string;
  url: string;
  width: number;
  height: number;
  box_count: number;
};

const NSFW_NAME =
  /\b(nsfw|onlyfans|porn|hentai|nude|naked|sex|xxx|boob|dick|cock|pussy|anal|hentai)\b/i;

const CLASSIC = [
  "drake",
  "distracted boyfriend",
  "two buttons",
  "expanding brain",
  "change my mind",
  "woman yelling at a cat",
  "this is fine",
  "bernie",
  "stonks",
  "always has been",
  "one does not simply",
  "ancient aliens",
  "batman slapping",
  "hide the pain",
  "waiting skeleton",
  "success kid",
  "bad luck brian",
  "y u no",
  "futurama fry",
  "first world problems",
  "grumpy cat",
  "doge",
  "roll safe",
  "left exit 12",
  "running away balloon",
  "is this a pigeon",
  "mocking spongebob",
  "surprised pikachu",
  "uno draw 25",
  "they don't know",
  "epic handshake",
  "trade offer",
  "buff doge",
  "panik",
  "anakin",
  "i bet he's thinking",
  "disaster girl",
  "boardroom meeting",
  "x, x everywhere",
  "the most interesting man",
  "but that's none of my business",
  "oprah",
  "leonardo dicaprio cheers",
  "matrix morpheus",
  "first world problems",
  "that would be great",
  "evil kermit",
  "american chopper",
  "tuxedo winnie",
  "spongebob",
  "patrick star",
];

const ANIMALS = [
  "cat",
  "dog",
  "doge",
  "cheems",
  "monkey",
  "ape",
  "shiba",
  "lion",
  "bear",
  "horse",
  "bird",
  "frog",
  "duck",
  "panda",
  "hamster",
];

const MOVIES = [
  "star wars",
  "anakin",
  "prequel",
  "lotr",
  "gandalf",
  "boromir",
  "avenger",
  "thanos",
  "oppenheimer",
  "joker",
  "batman",
  "spongebob",
  "simpsons",
  "homer",
  "peter parker",
  "tobey",
  "office",
  "michael scott",
  "shrek",
  "buzz lightyear",
  "woody",
  "matrix",
  "morpheus",
  "leo",
  "dicaprio",
  "toy story",
];

function includesAny(name: string, list: string[]) {
  return list.some((item) => name.includes(item));
}

export function isDenied(meme: { name: string; id: string }) {
  return NSFW_NAME.test(meme.name);
}

export function categoryFor(name: string): TemplateCategory {
  const n = name.toLowerCase();
  if (/blank|empty|solid/.test(n)) return "Blank";
  if (includesAny(n, CLASSIC)) return "Classic";
  if (includesAny(n, ANIMALS)) return "Animals";
  if (includesAny(n, MOVIES)) return "Movies";
  return "Reaction";
}

export function aliasesFor(name: string) {
  const n = name.toLowerCase();
  const extra: string[] = [];
  if (n.includes("drake")) extra.push("hotline bling", "approve", "reject");
  if (n.includes("distracted")) extra.push("cheating", "girlfriend");
  if (n.includes("two buttons")) extra.push("daily struggle");
  if (n.includes("expanding brain")) extra.push("galaxy brain");
  if (n.includes("pigeon")) extra.push("is this");
  if (n.includes("woman yelling")) extra.push("confused cat");
  if (n.includes("spongebob") && n.includes("mock")) extra.push("sarcasm");
  return extra;
}

export function overlayTemplate(raw: ImgflipMeme): StudioTemplate {
  return {
    id: raw.id,
    name: raw.name,
    url: raw.url,
    width: raw.width,
    height: raw.height,
    boxCount: raw.box_count,
    category: categoryFor(raw.name),
    aliases: aliasesFor(raw.name),
  };
}

export const CATEGORIES: Array<TemplateCategory | "All" | "Trending"> = [
  "Trending",
  "All",
  "Classic",
  "Reaction",
  "Movies",
  "Animals",
  "Blank",
];
