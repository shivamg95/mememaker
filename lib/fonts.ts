export type MemeFont = {
  name: string;
  family: string;
};

export const MEME_FONTS: MemeFont[] = [
  { name: "Anton", family: "Anton, Impact, sans-serif" },
  { name: "Impact", family: "Impact, Haettenschweiler, Arial Black, sans-serif" },
  { name: "Bebas Neue", family: "'Bebas Neue', sans-serif" },
  { name: "Oswald", family: "Oswald, sans-serif" },
  { name: "Archivo Black", family: "'Archivo Black', sans-serif" },
  { name: "Russo One", family: "'Russo One', sans-serif" },
  { name: "Bangers", family: "Bangers, cursive" },
  { name: "Black Ops One", family: "'Black Ops One', sans-serif" },
  { name: "Comic Neue", family: "'Comic Neue', cursive" },
  { name: "Permanent Marker", family: "'Permanent Marker', cursive" },
  { name: "Inter", family: "Inter, sans-serif" },
  { name: "Montserrat", family: "Montserrat, sans-serif" },
  { name: "Roboto Condensed", family: "'Roboto Condensed', sans-serif" },
  { name: "Playfair Display", family: "'Playfair Display', serif" },
  { name: "Lobster", family: "Lobster, cursive" },
  { name: "Pacifico", family: "Pacifico, cursive" },
  { name: "Press Start 2P", family: "'Press Start 2P', cursive" },
  { name: "Creepster", family: "Creepster, cursive" },
  { name: "Instrument Sans", family: "'Instrument Sans', sans-serif" },
];

export const DEFAULT_FONT_FAMILY = MEME_FONTS[0].family;

export const MEME_FONT_HREF =
  "https://fonts.googleapis.com/css2?family=Anton&family=Archivo+Black&family=Bangers&family=Bebas+Neue&family=Black+Ops+One&family=Comic+Neue:wght@700&family=Creepster&family=Instrument+Sans:wght@400;500;600;700&family=Inter:wght@400;700&family=Lobster&family=Montserrat:wght@700;800&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,600;1,6..72,400;1,6..72,500&family=Oswald:wght@400;700&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:wght@700&family=Press+Start+2P&family=Roboto+Condensed:wght@700&family=Russo+One&display=swap";
