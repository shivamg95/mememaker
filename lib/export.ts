import { loadHtmlImage } from "./image-src";
import type { ExportSettings } from "./types";

export function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(header)?.[1] ?? "image/png";
  const binary = atob(data);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function exportFileName(templateName: string, format: ExportSettings["format"]) {
  const slug = templateName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "atelier";
  return `${slug}.${format === "jpg" ? "jpg" : "png"}`;
}

export async function compositeWatermark(
  dataUrl: string,
  settings: ExportSettings,
) {
  const img = await loadHtmlImage(dataUrl);
  const canvas = document.createElement("canvas");
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  if (settings.format === "jpg") {
    ctx.fillStyle = "#0B0B0C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0);
  if (settings.watermark) {
    const size = Math.max(16, Math.round(canvas.width * 0.026));
    ctx.font = `italic ${size}px Newsreader, Georgia, serif`;
    ctx.fillStyle = "rgba(245, 242, 234, 0.4)";
    ctx.textAlign = "right";
    ctx.textBaseline = "bottom";
    ctx.fillText("Atelier", canvas.width - Math.round(size * 0.9), canvas.height - Math.round(size * 0.7));
  }
  const mime = settings.format === "jpg" ? "image/jpeg" : "image/png";
  return canvas.toDataURL(mime, settings.quality);
}

export function downloadDataUrl(dataUrl: string, name: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = name;
  link.click();
}

export async function copyDataUrl(dataUrl: string) {
  const blob = dataUrlToBlob(dataUrl);
  if (!navigator.clipboard?.write) {
    throw new Error("Clipboard is not available");
  }
  await navigator.clipboard.write([
    new ClipboardItem({ [blob.type]: blob }),
  ]);
}

export async function shareDataUrl(dataUrl: string, name: string) {
  const blob = dataUrlToBlob(dataUrl);
  const extension = blob.type.includes("jpeg") ? "jpg" : "png";
  const file = new File([blob], name.endsWith(`.${extension}`) ? name : `${name}.${extension}`, {
    type: blob.type,
  });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ files: [file], title: "Atelier" });
    return "shared" as const;
  }
  await copyDataUrl(dataUrl);
  return "copied" as const;
}

export const SHARE_LINKS = {
  reddit: "https://www.reddit.com/submit",
  x: "https://twitter.com/intent/tweet?text=Made%20in%20Atelier",
  whatsapp: "https://wa.me/?text=Made%20in%20Atelier",
};
