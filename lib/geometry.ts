import type { CropRect, Panel, StripAxis } from "./types";

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function displaySize(panel: Panel) {
  const rotated = panel.rotation === 90 || panel.rotation === 270;
  return {
    width: rotated ? panel.height : panel.width,
    height: rotated ? panel.width : panel.height,
  };
}

export function layoutPanels(panels: Panel[], axis: StripAxis): Panel[] {
  let x = 0;
  let y = 0;
  return panels.map((panel) => {
    const size = displaySize(panel);
    const next = { ...panel, x, y };
    if (axis === "vertical") y += size.height;
    else x += size.width;
    return next;
  });
}

export function documentSize(panels: Panel[], axis: StripAxis) {
  if (panels.length === 0) return { width: 800, height: 800 };
  const laid = layoutPanels(panels, axis);
  let width = 0;
  let height = 0;
  for (const panel of laid) {
    const size = displaySize(panel);
    width = Math.max(width, panel.x + size.width);
    height = Math.max(height, panel.y + size.height);
  }
  return { width, height };
}

export function fitZoom(
  viewport: { width: number; height: number },
  doc: { width: number; height: number },
  padding = 56,
) {
  if (viewport.width <= 0 || viewport.height <= 0) return 1;
  const sx = (viewport.width - padding) / doc.width;
  const sy = (viewport.height - padding) / doc.height;
  return clamp(Math.min(sx, sy), 0.08, 4);
}

export function centerStage(
  viewport: { width: number; height: number },
  doc: { width: number; height: number },
  zoom: number,
) {
  return {
    x: (viewport.width - doc.width * zoom) / 2,
    y: (viewport.height - doc.height * zoom) / 2,
  };
}

export function panelAtPoint(
  panels: Panel[],
  x: number,
  y: number,
): Panel | undefined {
  for (let i = panels.length - 1; i >= 0; i--) {
    const panel = panels[i];
    const size = displaySize(panel);
    if (
      x >= panel.x &&
      x <= panel.x + size.width &&
      y >= panel.y &&
      y <= panel.y + size.height
    ) {
      return panel;
    }
  }
  return undefined;
}

export function initialCropRect(panel: Panel): CropRect {
  const size = displaySize(panel);
  return {
    x: size.width * 0.08,
    y: size.height * 0.08,
    width: size.width * 0.84,
    height: size.height * 0.84,
  };
}

export function composeCrop(panel: Panel, display: CropRect): CropRect {
  const srcW = panel.crop?.width ?? panel.naturalWidth;
  const srcH = panel.crop?.height ?? panel.naturalHeight;
  const originX = panel.crop?.x ?? 0;
  const originY = panel.crop?.y ?? 0;
  const scaleX = srcW / Math.max(1, panel.width);
  const scaleY = srcH / Math.max(1, panel.height);
  return {
    x: originX + display.x * scaleX,
    y: originY + display.y * scaleY,
    width: display.width * scaleX,
    height: display.height * scaleY,
  };
}
