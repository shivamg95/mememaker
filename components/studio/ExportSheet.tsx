"use client";

import { FieldLabel, GhostButton, PrimaryButton, Segmented } from "@/components/studio/controls";
import {
  SHARE_LINKS,
  compositeWatermark,
  copyDataUrl,
  downloadDataUrl,
  exportFileName,
  shareDataUrl,
} from "@/lib/export";
import { documentSize } from "@/lib/geometry";
import { getStudioStage } from "@/lib/stage-ref";
import { useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import type { ExportFormat, ExportScale } from "@/lib/types";
import { useEffect, useState } from "react";

export function ExportSheet() {
  const open = useStudioStore((state) => state.exportOpen);
  const setExportOpen = useStudioStore((state) => state.setExportOpen);
  const settings = useStudioStore((state) => state.exportSettings);
  const patchExport = useStudioStore((state) => state.patchExport);
  const setExporting = useStudioStore((state) => state.setExporting);
  const select = useStudioStore((state) => state.select);
  const showToast = useStudioStore((state) => state.showToast);
  const panels = useDocStore((state) => state.panels);
  const stripAxis = useDocStore((state) => state.stripAxis);
  const templateName = useDocStore((state) => state.templateName);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const dataUrl = await renderExport();
        if (!cancelled) setPreview(dataUrl);
      } catch {
        if (!cancelled) showToast("Could not render export");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, settings.format, settings.scale, settings.watermark, settings.quality]);

  if (!open) return null;

  async function renderExport() {
    select([]);
    setExporting(true);
    await new Promise((resolve) => setTimeout(resolve, 80));
    const stage = getStudioStage();
    const node = stage?.findOne("#document");
    if (!node) {
      setExporting(false);
      throw new Error("Nothing to export");
    }
    stage?.find("Transformer").forEach((item) => item.visible(false));
    const doc = documentSize(panels, stripAxis);
    const sourceLongest = Math.max(
      0,
      ...panels.map((panel) => Math.max(panel.naturalWidth, panel.naturalHeight)),
    );
    const cap = Math.max(2048, sourceLongest);
    const longest = Math.max(doc.width, doc.height);
    const desired = longest * settings.scale;
    const pixelRatio = desired > cap ? cap / longest : settings.scale;
    const raw = node.toDataURL({
      pixelRatio,
      mimeType: "image/png",
    });
    const composed = await compositeWatermark(raw, settings);
    stage?.find("Transformer").forEach((item) => item.visible(true));
    setExporting(false);
    return composed;
  }

  async function withPreview(action: (dataUrl: string) => Promise<void> | void) {
    setBusy(true);
    try {
      const dataUrl = preview ?? (await renderExport());
      await action(dataUrl);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "Export failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close export"
        onClick={() => setExportOpen(false)}
      />
      <div className="relative w-full max-w-lg rounded-[16px] bg-surface p-5 ring-1 ring-hairline">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-serif text-2xl italic">Export</h2>
          <button
            type="button"
            onClick={() => setExportOpen(false)}
            className="text-[12px] text-muted hover:text-bone"
          >
            Close
          </button>
        </div>
        <div className="mb-4 overflow-hidden rounded-[10px] bg-bg ring-1 ring-hairline">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview} alt="Export preview" className="mx-auto max-h-64" />
          ) : (
            <div className="flex h-40 items-center justify-center text-[12px] text-muted">
              Rendering…
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <FieldLabel>Format</FieldLabel>
            <Segmented<ExportFormat>
              value={settings.format}
              onChange={(format) => patchExport({ format })}
              options={[
                { id: "png", label: "PNG" },
                { id: "jpg", label: "JPG" },
              ]}
            />
          </div>
          <div>
            <FieldLabel>Scale</FieldLabel>
            <Segmented<ExportScale>
              value={settings.scale}
              onChange={(scale) => patchExport({ scale })}
              options={[
                { id: 1, label: "1×" },
                { id: 2, label: "2×" },
              ]}
            />
          </div>
        </div>
        <label className="mt-4 flex items-center justify-between text-[13px]">
          <span>Atelier watermark</span>
          <input
            type="checkbox"
            checked={settings.watermark}
            onChange={(event) => patchExport({ watermark: event.target.checked })}
          />
        </label>
        <div className="mt-5 flex flex-wrap gap-2">
          <PrimaryButton
            disabled={busy}
            onClick={() =>
              withPreview((dataUrl) => {
                downloadDataUrl(dataUrl, exportFileName(templateName, settings.format));
              })
            }
          >
            Download
          </PrimaryButton>
          <GhostButton
            disabled={busy}
            onClick={() =>
              withPreview(async (dataUrl) => {
                await copyDataUrl(dataUrl);
                showToast("Image copied");
              })
            }
          >
            Copy
          </GhostButton>
          <GhostButton
            disabled={busy}
            onClick={() =>
              withPreview(async (dataUrl) => {
                const result = await shareDataUrl(
                  dataUrl,
                  exportFileName(templateName, settings.format),
                );
                showToast(result === "shared" ? "Shared" : "Image copied. Paste into your post.");
              })
            }
          >
            Share
          </GhostButton>
        </div>
        <p className="mt-4 text-[12px] text-muted">
          Social apps need a paste. Copy first, then open Reddit, X, or WhatsApp.
        </p>
        <div className="mt-2 flex gap-2">
          {(
            [
              ["Reddit", SHARE_LINKS.reddit],
              ["X", SHARE_LINKS.x],
              ["WhatsApp", SHARE_LINKS.whatsapp],
            ] as const
          ).map(([label, href]) => (
            <GhostButton
              key={label}
              onClick={() =>
                withPreview(async (dataUrl) => {
                  try {
                    await copyDataUrl(dataUrl);
                    showToast("Image copied. Paste into your post.");
                  } catch {
                    showToast("Download first, then attach the file.");
                  }
                  window.open(href, "_blank", "noopener,noreferrer");
                })
              }
            >
              {label}
            </GhostButton>
          ))}
        </div>
      </div>
    </div>
  );
}
