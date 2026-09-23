"use client";

import {
  ColorField,
  FieldLabel,
  GhostButton,
  PrimaryButton,
  Segmented,
  SliderField,
} from "@/components/studio/controls";
import { MEME_FONTS } from "@/lib/fonts";
import { composeCrop, displaySize } from "@/lib/geometry";
import { pauseHistory, resumeHistory, useDocStore } from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import type { DrawTool, ImageObject, StrokeObject, TextObject } from "@/lib/types";
import { isImageObj, isStroke, isText } from "@/lib/types";
import { readImageFile } from "@/lib/image-src";
import { cn } from "@/lib/cn";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  FlipHorizontal,
  FlipVertical,
  Pencil,
  RotateCw,
} from "lucide-react";
import { useRef } from "react";

export function Inspector() {
  const objects = useDocStore((state) => state.objects);
  const panels = useDocStore((state) => state.panels);
  const selection = useStudioStore((state) => state.selection);
  const tool = useStudioStore((state) => state.tool);
  const cropPanelId = useStudioStore((state) => state.cropPanelId);
  const activePanelId = useStudioStore((state) => state.activePanelId);
  const selected = objects.find((object) => object.id === selection[0]);
  const panel =
    panels.find((item) => item.id === (selected?.panelId ?? activePanelId ?? cropPanelId)) ??
    panels[0];

  return (
    <aside className="flex w-full shrink-0 flex-col border-l border-hairline bg-surface/90 backdrop-blur-md lg:w-[320px]">
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {cropPanelId && panel ? (
          <CropInspector panelId={cropPanelId} />
        ) : selected && isText(selected) ? (
          <TextInspector object={selected} />
        ) : selected && isImageObj(selected) ? (
          <ImageInspector object={selected} />
        ) : selected && isStroke(selected) ? (
          <StrokeInspector object={selected} />
        ) : tool !== "select" ? (
          <DrawInspector />
        ) : panel ? (
          <CanvasInspector panelId={panel.id} />
        ) : (
          <p className="text-[13px] text-muted">Choose a template to begin.</p>
        )}
      </div>
    </aside>
  );
}

function TextInspector({ object }: { object: TextObject }) {
  const updateObject = useDocStore((state) => state.updateObject);
  const addText = useDocStore((state) => state.addText);
  const deleteObjects = useDocStore((state) => state.deleteObjects);
  const select = useStudioStore((state) => state.select);
  const activePanelId = useStudioStore((state) => state.activePanelId);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-muted">Click the text on the canvas to edit it.</p>
      <div>
        <FieldLabel>Typeface</FieldLabel>
        <div className="max-h-44 overflow-y-auto rounded-[10px] ring-1 ring-hairline">
          {MEME_FONTS.map((font) => (
            <button
              key={font.name}
              type="button"
              onClick={() => updateObject(object.id, { fontFamily: font.family })}
              className={cn(
                "flex h-9 w-full items-center px-3 text-[14px] transition-colors duration-150",
                object.fontFamily === font.family
                  ? "bg-raised text-bone"
                  : "text-muted hover:text-bone",
              )}
              style={{ fontFamily: font.family }}
            >
              {font.name}
            </button>
          ))}
        </div>
      </div>
      <div>
        <FieldLabel>Size {object.fontSize}</FieldLabel>
        <SliderField
          min={12}
          max={160}
          value={object.fontSize}
          onChange={(value) => {
            pauseHistory();
            updateObject(object.id, { fontSize: value, strokeWidth: Math.max(3, Math.round(value * 0.12)) });
          }}
          onCommit={() => {
            resumeHistory();
            updateObject(object.id, { fontSize: object.fontSize });
          }}
        />
      </div>
      <div>
        <FieldLabel>Fill</FieldLabel>
        <ColorField
          value={object.fill}
          onChange={(fill) => updateObject(object.id, { fill })}
        />
      </div>
      <div>
        <FieldLabel>Outline</FieldLabel>
        <ColorField
          value={object.stroke}
          onChange={(stroke) => updateObject(object.id, { stroke })}
        />
        <div className="mt-2">
          <SliderField
            min={0}
            max={24}
            value={object.strokeWidth}
            onChange={(strokeWidth) => {
              pauseHistory();
              updateObject(object.id, { strokeWidth });
            }}
            onCommit={() => {
              resumeHistory();
              updateObject(object.id, { strokeWidth: object.strokeWidth });
            }}
          />
        </div>
      </div>
      <div>
        <FieldLabel>Align</FieldLabel>
        <div className="flex gap-1">
          {[
            { id: "left" as const, icon: AlignLeft },
            { id: "center" as const, icon: AlignCenter },
            { id: "right" as const, icon: AlignRight },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => updateObject(object.id, { align: item.id })}
              className={`flex h-8 w-8 items-center justify-center rounded-[10px] ${
                object.align === item.id ? "bg-raised text-bone" : "text-muted hover:text-bone"
              }`}
            >
              <item.icon size={14} />
            </button>
          ))}
        </div>
      </div>
      <label className="flex items-center justify-between text-[13px]">
        <span>All caps</span>
        <input
          type="checkbox"
          checked={object.uppercase}
          onChange={(event) => updateObject(object.id, { uppercase: event.target.checked })}
        />
      </label>
      <label className="flex items-center justify-between text-[13px]">
        <span>Shadow</span>
        <input
          type="checkbox"
          checked={object.shadow}
          onChange={(event) => updateObject(object.id, { shadow: event.target.checked })}
        />
      </label>
      <div>
        <FieldLabel>Opacity {Math.round(object.opacity * 100)}%</FieldLabel>
        <SliderField
          min={0}
          max={1}
          step={0.01}
          value={object.opacity}
          onChange={(opacity) => {
            pauseHistory();
            updateObject(object.id, { opacity });
          }}
          onCommit={() => {
            resumeHistory();
            updateObject(object.id, { opacity: object.opacity });
          }}
        />
      </div>
      <div>
        <FieldLabel>Tracking {object.letterSpacing}</FieldLabel>
        <SliderField
          min={-4}
          max={20}
          value={object.letterSpacing}
          onChange={(letterSpacing) => {
            pauseHistory();
            updateObject(object.id, { letterSpacing });
          }}
          onCommit={() => {
            resumeHistory();
            updateObject(object.id, { letterSpacing: object.letterSpacing });
          }}
        />
      </div>
      <div className="flex gap-2">
        <GhostButton
          onClick={() => {
            const id = addText(object.panelId ?? activePanelId);
            if (id) select([id]);
          }}
        >
          Add text
        </GhostButton>
        <GhostButton onClick={() => deleteObjects([object.id])}>Delete</GhostButton>
      </div>
    </div>
  );
}

function ImageInspector({ object }: { object: ImageObject }) {
  const updateObject = useDocStore((state) => state.updateObject);
  const deleteObjects = useDocStore((state) => state.deleteObjects);
  return (
    <div className="flex flex-col gap-4">
      <FieldLabel>{object.type === "sticker" ? "Sticker" : "Image"}</FieldLabel>
      <p className="text-[13px] text-muted">{object.name}</p>
      <div>
        <FieldLabel>Opacity {Math.round(object.opacity * 100)}%</FieldLabel>
        <SliderField
          min={0}
          max={1}
          step={0.01}
          value={object.opacity}
          onChange={(opacity) => {
            pauseHistory();
            updateObject(object.id, { opacity });
          }}
          onCommit={() => {
            resumeHistory();
            updateObject(object.id, { opacity: object.opacity });
          }}
        />
      </div>
      <div className="flex gap-2">
        <GhostButton
          onClick={() => updateObject(object.id, { flipH: !object.flipH })}
        >
          <FlipHorizontal size={14} />
        </GhostButton>
        <GhostButton
          onClick={() => updateObject(object.id, { flipV: !object.flipV })}
        >
          <FlipVertical size={14} />
        </GhostButton>
        <GhostButton
          onClick={() =>
            updateObject(object.id, { rotation: (object.rotation + 90) % 360 })
          }
        >
          <RotateCw size={14} />
        </GhostButton>
      </div>
      <GhostButton onClick={() => deleteObjects([object.id])}>Delete</GhostButton>
    </div>
  );
}

function StrokeInspector({ object }: { object: StrokeObject }) {
  const updateObject = useDocStore((state) => state.updateObject);
  const deleteObjects = useDocStore((state) => state.deleteObjects);
  return (
    <div className="flex flex-col gap-4">
      <FieldLabel>Stroke</FieldLabel>
      <ColorField
        value={object.color}
        onChange={(color) => updateObject(object.id, { color })}
      />
      <div>
        <FieldLabel>Width {object.strokeWidth}</FieldLabel>
        <SliderField
          min={2}
          max={48}
          value={object.strokeWidth}
          onChange={(strokeWidth) => {
            pauseHistory();
            updateObject(object.id, { strokeWidth });
          }}
          onCommit={() => {
            resumeHistory();
            updateObject(object.id, { strokeWidth: object.strokeWidth });
          }}
        />
      </div>
      <GhostButton onClick={() => deleteObjects([object.id])}>Delete</GhostButton>
    </div>
  );
}

function DrawInspector() {
  const tool = useStudioStore((state) => state.tool);
  const setTool = useStudioStore((state) => state.setTool);
  const drawColor = useStudioStore((state) => state.drawColor);
  const setDrawColor = useStudioStore((state) => state.setDrawColor);
  const drawWidth = useStudioStore((state) => state.drawWidth);
  const setDrawWidth = useStudioStore((state) => state.setDrawWidth);

  return (
    <div className="flex flex-col gap-4">
      <FieldLabel>Draw</FieldLabel>
      <Segmented<DrawTool>
        value={tool === "select" ? "pen" : tool}
        onChange={setTool}
        options={[
          { id: "pen", label: "Pen" },
          { id: "highlighter", label: "Ink" },
          { id: "eraser", label: "Erase" },
        ]}
      />
      <ColorField value={drawColor} onChange={setDrawColor} />
      <div>
        <FieldLabel>Size {drawWidth}</FieldLabel>
        <SliderField min={2} max={40} value={drawWidth} onChange={setDrawWidth} />
      </div>
    </div>
  );
}

function CropInspector({ panelId }: { panelId: string }) {
  const panel = useDocStore((state) => state.panels.find((item) => item.id === panelId));
  const applyCrop = useDocStore((state) => state.applyCrop);
  const cropDraft = useStudioStore((state) => state.cropDraft);
  const setCropPanelId = useStudioStore((state) => state.setCropPanelId);
  const cropLockAspect = useStudioStore((state) => state.cropLockAspect);
  const setCropLockAspect = useStudioStore((state) => state.setCropLockAspect);
  const requestFit = useStudioStore((state) => state.requestFit);
  return (
    <div className="flex flex-col gap-4">
      <FieldLabel>Crop</FieldLabel>
      <p className="text-[13px] text-muted">Drag the frame, then apply.</p>
      <label className="flex items-center justify-between text-[13px]">
        <span>Lock aspect</span>
        <input
          type="checkbox"
          checked={cropLockAspect}
          onChange={(event) => setCropLockAspect(event.target.checked)}
        />
      </label>
      <div className="flex gap-2">
        <GhostButton onClick={() => setCropPanelId(null)}>Cancel</GhostButton>
        <PrimaryButton
          disabled={!panel || !cropDraft}
          onClick={() => {
            if (panel && cropDraft) {
              applyCrop(panel.id, composeCrop(panel, cropDraft));
              requestFit();
            }
            setCropPanelId(null);
          }}
        >
          Apply crop
        </PrimaryButton>
      </div>
    </div>
  );
}

function CanvasInspector({ panelId }: { panelId: string }) {
  const panel = useDocStore((state) => state.panels.find((item) => item.id === panelId));
  const updatePanel = useDocStore((state) => state.updatePanel);
  const setPanelFilters = useDocStore((state) => state.setPanelFilters);
  const applyCrop = useDocStore((state) => state.applyCrop);
  const addPanel = useDocStore((state) => state.addPanel);
  const addText = useDocStore((state) => state.addText);
  const removePanel = useDocStore((state) => state.removePanel);
  const requestFit = useStudioStore((state) => state.requestFit);
  const setCropPanelId = useStudioStore((state) => state.setCropPanelId);
  const setTool = useStudioStore((state) => state.setTool);
  const select = useStudioStore((state) => state.select);
  const setActivePanel = useStudioStore((state) => state.setActivePanel);
  const showToast = useStudioStore((state) => state.showToast);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!panel) return null;
  const size = displaySize(panel);

  return (
    <div className="flex flex-col gap-4">
      <FieldLabel>Canvas</FieldLabel>
      <p className="text-[13px] text-muted">
        {panel.name} · {Math.round(size.width)}×{Math.round(size.height)}
      </p>
      <div className="flex flex-wrap gap-2">
        <GhostButton
          onClick={() => {
            const id = addText(panel.id);
            if (id) select([id]);
          }}
        >
          Add text
        </GhostButton>
        <GhostButton onClick={() => setCropPanelId(panel.id)}>Crop</GhostButton>
        <GhostButton
          className="gap-1.5"
          onClick={() => {
            setTool("pen");
            select([]);
          }}
        >
          <Pencil size={14} />
          Draw
        </GhostButton>
        <GhostButton
          onClick={() => {
            applyCrop(panel.id, null);
            requestFit();
          }}
        >
          Reset crop
        </GhostButton>
      </div>
      <div className="flex gap-2">
        <GhostButton onClick={() => updatePanel(panel.id, { flipH: !panel.flipH })}>
          <FlipHorizontal size={14} />
        </GhostButton>
        <GhostButton onClick={() => updatePanel(panel.id, { flipV: !panel.flipV })}>
          <FlipVertical size={14} />
        </GhostButton>
        <GhostButton
          onClick={() => {
            updatePanel(panel.id, { rotation: nextRot(panel.rotation) });
            requestFit();
          }}
        >
          <RotateCw size={14} />
        </GhostButton>
      </div>
      <div>
        <FieldLabel>Brightness</FieldLabel>
        <SliderField
          min={-0.5}
          max={0.5}
          step={0.01}
          value={panel.filters.brightness}
          onChange={(brightness) => {
            pauseHistory();
            setPanelFilters(panel.id, { brightness });
          }}
          onCommit={() => {
            resumeHistory();
            setPanelFilters(panel.id, { brightness: panel.filters.brightness });
          }}
        />
      </div>
      <div>
        <FieldLabel>Contrast</FieldLabel>
        <SliderField
          min={-50}
          max={50}
          value={panel.filters.contrast}
          onChange={(contrast) => {
            pauseHistory();
            setPanelFilters(panel.id, { contrast });
          }}
          onCommit={() => {
            resumeHistory();
            setPanelFilters(panel.id, { contrast: panel.filters.contrast });
          }}
        />
      </div>
      <div>
        <FieldLabel>Blur</FieldLabel>
        <SliderField
          min={0}
          max={20}
          value={panel.filters.blur}
          onChange={(blur) => {
            pauseHistory();
            setPanelFilters(panel.id, { blur });
          }}
          onCommit={() => {
            resumeHistory();
            setPanelFilters(panel.id, { blur: panel.filters.blur });
          }}
        />
      </div>
      <div className="flex flex-col gap-2 text-[13px]">
        <label className="flex items-center justify-between">
          Grayscale
          <input
            type="checkbox"
            checked={panel.filters.grayscale}
            onChange={(event) => setPanelFilters(panel.id, { grayscale: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between">
          Sepia
          <input
            type="checkbox"
            checked={panel.filters.sepia}
            onChange={(event) => setPanelFilters(panel.id, { sepia: event.target.checked })}
          />
        </label>
        <label className="flex items-center justify-between">
          Invert
          <input
            type="checkbox"
            checked={panel.filters.invert}
            onChange={(event) => setPanelFilters(panel.id, { invert: event.target.checked })}
          />
        </label>
      </div>
      <FieldLabel>Add panel</FieldLabel>
      <div className="grid grid-cols-2 gap-2">
        {(["above", "below", "left", "right"] as const).map((side) => (
          <GhostButton
            key={side}
            onClick={() => {
              const id = addPanel(side);
              if (id) setActivePanel(id);
              requestFit();
            }}
          >
            {side}
          </GhostButton>
        ))}
      </div>
      <GhostButton onClick={() => fileRef.current?.click()}>Replace image</GhostButton>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          try {
            const image = await readImageFile(file);
            updatePanel(panel.id, {
              src: image.src,
              name: image.name,
              naturalWidth: image.width,
              naturalHeight: image.height,
              width: image.width,
              height: image.height,
              crop: null,
            });
            requestFit();
          } catch (error) {
            showToast(error instanceof Error ? error.message : "Could not upload");
          }
        }}
      />
      <GhostButton onClick={() => removePanel(panel.id)}>Remove panel</GhostButton>
    </div>
  );
}

function nextRot(current: 0 | 90 | 180 | 270): 0 | 90 | 180 | 270 {
  return ((current + 90) % 360) as 0 | 90 | 180 | 270;
}
