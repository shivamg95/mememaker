import { DEFAULT_FONT_FAMILY } from "./fonts";
import { displaySize, layoutPanels } from "./geometry";
import { uid } from "./ids";
import type {
  CanvasObject,
  ImageObject,
  Panel,
  PersistedDocument,
  StudioTemplate,
  StripAxis,
  StrokeObject,
  TextObject,
  UserUpload,
} from "./types";
import { defaultFilters } from "./types";

function fontSizeFor(width: number) {
  return Math.round(Math.min(72, Math.max(28, width * 0.085)));
}

export function createPanelFromTemplate(template: StudioTemplate): Panel {
  return {
    id: uid(),
    src: template.url,
    name: template.name,
    naturalWidth: template.width,
    naturalHeight: template.height,
    width: template.width,
    height: template.height,
    x: 0,
    y: 0,
    crop: null,
    flipH: false,
    flipV: false,
    rotation: 0,
    fill: template.fill ?? "#141416",
    fill2: template.fill2,
    filters: defaultFilters(),
  };
}

export function createPanelFromImage(
  image: { src: string; width: number; height: number; name: string },
): Panel {
  return {
    id: uid(),
    src: image.src,
    name: image.name,
    naturalWidth: image.width,
    naturalHeight: image.height,
    width: image.width,
    height: image.height,
    x: 0,
    y: 0,
    crop: null,
    flipH: false,
    flipV: false,
    rotation: 0,
    fill: "#141416",
    filters: defaultFilters(),
  };
}

export function createTextObject(
  panel: Panel,
  partial: Partial<TextObject> & { y: number },
): TextObject {
  const size = displaySize(panel);
  const fontSize = fontSizeFor(size.width);
  return {
    id: uid(),
    panelId: panel.id,
    type: "text",
    x: size.width * 0.04,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    text: "",
    placeholder: "TEXT",
    fontFamily: DEFAULT_FONT_FAMILY,
    fontSize,
    fill: "#FFFFFF",
    stroke: "#000000",
    strokeWidth: Math.max(5, Math.round(fontSize * 0.12)),
    shadow: true,
    align: "center",
    uppercase: true,
    letterSpacing: 0,
    lineHeight: 1.05,
    width: size.width * 0.92,
    ...partial,
  };
}

export function createDefaultTexts(panel: Panel, boxCount: number): TextObject[] {
  const size = displaySize(panel);
  const count = boxCount > 0 ? boxCount : 2;
  const fontSize = fontSizeFor(size.width);
  const inset = Math.max(16, size.height * 0.045);

  if (count === 1) {
    return [
      createTextObject(panel, {
        y: inset,
        placeholder: "TEXT",
      }),
    ];
  }

  if (count === 2) {
    return [
      createTextObject(panel, { y: inset, placeholder: "TOP TEXT" }),
      createTextObject(panel, {
        y: size.height - inset - fontSize * 1.25,
        placeholder: "BOTTOM TEXT",
      }),
    ];
  }

  const usable = size.height - inset * 2 - fontSize;
  return Array.from({ length: count }, (_, index) =>
    createTextObject(panel, {
      y: inset + (usable * index) / (count - 1),
      placeholder: `TEXT ${index + 1}`,
    }),
  );
}

export function createStickerObject(
  panel: Panel,
  sticker: { src: string; name: string; width?: number; height?: number },
): ImageObject {
  const box = displaySize(panel);
  const naturalW = sticker.width ?? 160;
  const naturalH = sticker.height ?? 160;
  const max = Math.min(box.width, box.height) * 0.34;
  const scale = max / Math.max(naturalW, naturalH);
  const width = naturalW * scale;
  const height = naturalH * scale;
  return {
    id: uid(),
    panelId: panel.id,
    type: "sticker",
    src: sticker.src,
    name: sticker.name,
    x: (box.width - width) / 2,
    y: (box.height - height) / 2,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    flipH: false,
    flipV: false,
  };
}

export function createImageObject(
  panel: Panel,
  image: { src: string; name: string; width: number; height: number },
): ImageObject {
  const box = displaySize(panel);
  const max = Math.min(box.width, box.height) * 0.45;
  const scale = Math.min(max / image.width, max / image.height, 1);
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    id: uid(),
    panelId: panel.id,
    type: "image",
    src: image.src,
    name: image.name,
    x: (box.width - width) / 2,
    y: (box.height - height) / 2,
    width,
    height,
    rotation: 0,
    opacity: 1,
    locked: false,
    visible: true,
    flipH: false,
    flipV: false,
  };
}

export function cloneObject(object: CanvasObject): CanvasObject {
  return {
    ...object,
    id: uid(),
    x: object.x + 16,
    y: object.y + 16,
    ...(object.type === "stroke"
      ? { points: [...object.points] }
      : {}),
  } as CanvasObject;
}

export function emptyDocument(): PersistedDocument {
  return {
    panels: [],
    objects: [],
    templateName: "Untitled",
    templateId: null,
    stripAxis: "vertical",
    uploads: [],
  };
}

export function reflow(
  panels: Panel[],
  axis: StripAxis,
): Panel[] {
  return layoutPanels(panels, axis);
}

export function targetPanel(
  panels: Panel[],
  panelId?: string | null,
): Panel | undefined {
  return panels.find((panel) => panel.id === panelId) ?? panels[0];
}

export function nextRotation(current: Panel["rotation"]): Panel["rotation"] {
  return ((current + 90) % 360) as Panel["rotation"];
}

export function objectLabel(object: CanvasObject) {
  if (object.type === "text") {
    const value = object.text.trim() || object.placeholder;
    return value.slice(0, 28) || "Text";
  }
  if (object.type === "stroke") {
    return object.tool === "eraser" ? "Eraser" : "Stroke";
  }
  return object.name || (object.type === "sticker" ? "Sticker" : "Image");
}

export function createStrokeObject(stroke: Omit<StrokeObject, "id" | "type" | "rotation" | "locked" | "visible" | "x" | "y" | "opacity"> & Partial<StrokeObject>): StrokeObject {
  return {
    id: uid(),
    type: "stroke",
    x: 0,
    y: 0,
    rotation: 0,
    opacity: stroke.tool === "highlighter" ? 0.38 : 1,
    locked: false,
    visible: true,
    panelId: stroke.panelId,
    points: stroke.points,
    color: stroke.color ?? "#E8B86D",
    strokeWidth: stroke.strokeWidth ?? 6,
    tool: stroke.tool ?? "pen",
  };
}

export function rememberUpload(
  uploads: UserUpload[],
  image: UserUpload,
): UserUpload[] {
  const existing = uploads.find((item) => item.src === image.src);
  if (existing) return uploads;
  return [image, ...uploads].slice(0, 24);
}
