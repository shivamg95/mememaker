export type StripAxis = "vertical" | "horizontal";

export type TemplateCategory =
  | "Classic"
  | "Reaction"
  | "Movies"
  | "Animals"
  | "Blank";

export type StudioTemplate = {
  id: string;
  name: string;
  url: string | null;
  width: number;
  height: number;
  boxCount: number;
  category: TemplateCategory;
  aliases: string[];
  fill?: string;
  fill2?: string;
};

export type PanelFilters = {
  brightness: number;
  contrast: number;
  blur: number;
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
};

export type CropRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Panel = {
  id: string;
  src: string | null;
  name: string;
  naturalWidth: number;
  naturalHeight: number;
  width: number;
  height: number;
  x: number;
  y: number;
  crop: CropRect | null;
  flipH: boolean;
  flipV: boolean;
  rotation: 0 | 90 | 180 | 270;
  fill: string;
  fill2?: string;
  filters: PanelFilters;
};

export type ObjectBase = {
  id: string;
  panelId: string;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
};

export type TextAlign = "left" | "center" | "right";

export type TextObject = ObjectBase & {
  type: "text";
  text: string;
  placeholder: string;
  fontFamily: string;
  fontSize: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  shadow: boolean;
  align: TextAlign;
  uppercase: boolean;
  letterSpacing: number;
  lineHeight: number;
  width: number;
};

export type ImageObject = ObjectBase & {
  type: "sticker" | "image";
  src: string;
  name: string;
  width: number;
  height: number;
  flipH: boolean;
  flipV: boolean;
};

export type DrawTool = "pen" | "highlighter" | "eraser";

export type StrokeObject = ObjectBase & {
  type: "stroke";
  points: number[];
  color: string;
  strokeWidth: number;
  tool: DrawTool;
};

export type CanvasObject = TextObject | ImageObject | StrokeObject;

export type ExportFormat = "png" | "jpg";
export type ExportScale = 1 | 2;

export type ExportSettings = {
  format: ExportFormat;
  scale: ExportScale;
  quality: number;
  watermark: boolean;
};

export type Tool = "select" | DrawTool;

export type LeftTab = "templates" | "stickers" | "uploads";

export type MobileSheet =
  | "templates"
  | "stickers"
  | "layers"
  | "adjust"
  | "text"
  | "draw"
  | null;

export type UserUpload = {
  id: string;
  src: string;
  name: string;
  width: number;
  height: number;
};

export type DraftStroke = {
  panelId: string;
  points: number[];
  color: string;
  strokeWidth: number;
  tool: DrawTool;
};

export type PersistedDocument = {
  panels: Panel[];
  objects: CanvasObject[];
  templateName: string;
  templateId: string | null;
  stripAxis: StripAxis;
  uploads: UserUpload[];
};

export function isText(o: CanvasObject): o is TextObject {
  return o.type === "text";
}

export function isImageObj(o: CanvasObject): o is ImageObject {
  return o.type === "sticker" || o.type === "image";
}

export function isStroke(o: CanvasObject): o is StrokeObject {
  return o.type === "stroke";
}

export function defaultFilters(): PanelFilters {
  return {
    brightness: 0,
    contrast: 0,
    blur: 0,
    grayscale: false,
    sepia: false,
    invert: false,
  };
}
