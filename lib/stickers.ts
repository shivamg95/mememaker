export type StickerDef = {
  id: string;
  name: string;
  src: string;
  width: number;
  height: number;
};

export const STICKERS: StickerDef[] = [
  { id: "glasses", name: "Deal with it", src: "/stickers/glasses.svg", width: 240, height: 64 },
  { id: "shades", name: "Shades", src: "/stickers/shades.svg", width: 240, height: 72 },
  { id: "cap", name: "Cap", src: "/stickers/cap.svg", width: 180, height: 140 },
  { id: "crown", name: "Crown", src: "/stickers/crown.svg", width: 180, height: 120 },
  { id: "speech", name: "Speech", src: "/stickers/bubble-speech.svg", width: 220, height: 180 },
  { id: "shout", name: "Shout", src: "/stickers/bubble-shout.svg", width: 220, height: 180 },
  { id: "whisper", name: "Whisper", src: "/stickers/bubble-whisper.svg", width: 200, height: 140 },
  { id: "thought", name: "Thought", src: "/stickers/bubble-thought.svg", width: 220, height: 180 },
  { id: "arrow", name: "Arrow", src: "/stickers/arrow.svg", width: 180, height: 80 },
  { id: "sparkles", name: "Sparkles", src: "/stickers/sparkles.svg", width: 160, height: 160 },
  { id: "xmark", name: "X", src: "/stickers/x-mark.svg", width: 140, height: 140 },
  { id: "heart", name: "Heart", src: "/stickers/heart.svg", width: 140, height: 140 },
  { id: "fire", name: "Fire", src: "/stickers/fire.svg", width: 120, height: 160 },
  { id: "banner", name: "Banner", src: "/stickers/banner.svg", width: 220, height: 90 },
  { id: "pointer", name: "Pointer", src: "/stickers/pointer.svg", width: 140, height: 160 },
  { id: "burst", name: "Burst", src: "/stickers/burst.svg", width: 160, height: 160 },
  { id: "mustache", name: "Mustache", src: "/stickers/mustache.svg", width: 180, height: 70 },
  { id: "tear", name: "Tear", src: "/stickers/tear.svg", width: 80, height: 120 },
];
