"use client";

import { CropOverlay } from "@/components/studio/CropOverlay";
import { displaySize, documentSize, fitZoom, centerStage, panelAtPoint, clamp, composeCrop } from "@/lib/geometry";
import { resolveSrc, readImageFile } from "@/lib/image-src";
import { setStudioStage } from "@/lib/stage-ref";
import {
  clearHistory,
  pauseHistory,
  resumeHistory,
  useDocStore,
} from "@/lib/store/document";
import { useStudioStore } from "@/lib/store/studio";
import type {
  CanvasObject,
  ImageObject,
  Panel,
  StrokeObject,
  TextObject,
} from "@/lib/types";
import { isImageObj, isStroke, isText } from "@/lib/types";
import Konva from "konva";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Group, Image as KonvaImage, Layer, Line, Rect, Stage, Text, Transformer } from "react-konva";
import useImage from "use-image";

export default function CanvasStage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const cropRef = useRef<Konva.Rect>(null);
  const cropTrRef = useRef<Konva.Transformer>(null);
  const [viewport, setViewport] = useState({ width: 800, height: 800 });
  const [fontsReady, setFontsReady] = useState(false);
  const [guides, setGuides] = useState<{ v?: number; h?: number }>({});

  const panels = useDocStore((state) => state.panels);
  const objects = useDocStore((state) => state.objects);
  const stripAxis = useDocStore((state) => state.stripAxis);
  const updateObject = useDocStore((state) => state.updateObject);
  const addStroke = useDocStore((state) => state.addStroke);
  const applyCrop = useDocStore((state) => state.applyCrop);

  const zoom = useStudioStore((state) => state.zoom);
  const setZoom = useStudioStore((state) => state.setZoom);
  const stagePos = useStudioStore((state) => state.stagePos);
  const setStagePos = useStudioStore((state) => state.setStagePos);
  const selection = useStudioStore((state) => state.selection);
  const select = useStudioStore((state) => state.select);
  const setActivePanel = useStudioStore((state) => state.setActivePanel);
  const tool = useStudioStore((state) => state.tool);
  const spacePressed = useStudioStore((state) => state.spacePressed);
  const fitNonce = useStudioStore((state) => state.fitNonce);
  const cropPanelId = useStudioStore((state) => state.cropPanelId);
  const cropDraft = useStudioStore((state) => state.cropDraft);
  const setCropDraft = useStudioStore((state) => state.setCropDraft);
  const cropLockAspect = useStudioStore((state) => state.cropLockAspect);
  const setCropPanelId = useStudioStore((state) => state.setCropPanelId);
  const requestFit = useStudioStore((state) => state.requestFit);
  const draftStroke = useStudioStore((state) => state.draftStroke);
  const setDraftStroke = useStudioStore((state) => state.setDraftStroke);
  const drawColor = useStudioStore((state) => state.drawColor);
  const drawWidth = useStudioStore((state) => state.drawWidth);
  const exporting = useStudioStore((state) => state.exporting);
  const editingTextId = useStudioStore((state) => state.editingTextId);
  const setEditingTextId = useStudioStore((state) => state.setEditingTextId);

  const doc = useMemo(
    () => documentSize(panels, stripAxis),
    [panels, stripAxis],
  );
  const drawing = tool !== "select" && !cropPanelId;

  useEffect(() => {
    document.fonts.ready.then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      setViewport({
        width: Math.max(1, Math.floor(entry.contentRect.width)),
        height: Math.max(1, Math.floor(entry.contentRect.height)),
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const nextZoom = fitZoom(viewport, doc);
    setZoom(nextZoom);
    setStagePos(centerStage(viewport, doc, nextZoom));
  }, [fitNonce, viewport.width, viewport.height]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setStudioStage(stageRef.current);
    return () => setStudioStage(null);
  });

  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr || !stage) return;
    const node = selection[0] && !drawing && !cropPanelId && selection[0] !== editingTextId
      ? stage.findOne(`#obj-${selection[0]}`)
      : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selection, drawing, cropPanelId, objects, fontsReady, editingTextId]);

  useEffect(() => {
    const tr = cropTrRef.current;
    const node = cropRef.current;
    if (!tr) return;
    tr.nodes(node && cropPanelId ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [cropPanelId, cropDraft]);

  function clientToDoc() {
    return stageRef.current?.getRelativePointerPosition() ?? null;
  }

  function applyCropDraft() {
    const panel = panels.find((item) => item.id === cropPanelId);
    const draft = useStudioStore.getState().cropDraft;
    if (panel && draft) {
      applyCrop(panel.id, composeCrop(panel, draft));
      requestFit();
    }
    setCropPanelId(null);
  }

  function startStroke() {
    if (spacePressed || !drawing) return;
    const pos = clientToDoc();
    if (!pos) return;
    const panel = panelAtPoint(panels, pos.x, pos.y);
    if (!panel) return;
    pauseHistory();
    setDraftStroke({
      panelId: panel.id,
      points: [pos.x - panel.x, pos.y - panel.y],
      color: tool === "eraser" ? "#000000" : drawColor,
      strokeWidth: tool === "highlighter" ? drawWidth * 2.4 : drawWidth,
      tool,
    });
  }

  function moveStroke() {
    const current = useStudioStore.getState().draftStroke;
    if (!current) return;
    const pos = clientToDoc();
    if (!pos) return;
    const panel = panels.find((item) => item.id === current.panelId);
    if (!panel) return;
    setDraftStroke({
      ...current,
      points: [...current.points, pos.x - panel.x, pos.y - panel.y],
    });
  }

  function endStroke() {
    const current = useStudioStore.getState().draftStroke;
    if (!current) return;
    resumeHistory();
    if (current.points.length >= 4) addStroke(current);
    setDraftStroke(null);
  }

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full touch-none overflow-hidden bg-bg"
      onDragOver={(event) => event.preventDefault()}
      onDrop={async (event) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (!file) return;
        try {
          const image = await readImageFile(file);
          if (useDocStore.getState().panels.length === 0) {
            useDocStore.getState().loadImageAsTemplate(image);
            clearHistory();
          } else {
            const id = useDocStore.getState().addImageObject(
              image,
              useStudioStore.getState().activePanelId,
            );
            if (id) useStudioStore.getState().select([id]);
          }
          useStudioStore.getState().requestFit();
        } catch (error) {
          useStudioStore.getState().showToast(
            error instanceof Error ? error.message : "Could not upload",
          );
        }
      }}
    >
      <Stage
        ref={stageRef}
        width={viewport.width}
        height={viewport.height}
        x={stagePos.x}
        y={stagePos.y}
        scaleX={zoom}
        scaleY={zoom}
        draggable={spacePressed}
        onDragEnd={(event) => {
          if (event.target === stageRef.current) {
            setStagePos({ x: event.target.x(), y: event.target.y() });
          }
        }}
        onWheel={(event) => {
          event.evt.preventDefault();
          const stage = stageRef.current;
          if (!stage) return;
          const old = zoom;
          const next = event.evt.deltaY > 0 ? old / 1.06 : old * 1.06;
          const pointer = stage.getPointerPosition();
          if (!pointer) return;
          const mousePointTo = {
            x: (pointer.x - stagePos.x) / old,
            y: (pointer.y - stagePos.y) / old,
          };
          const z = clamp(next, 0.08, 4);
          setZoom(z);
          setStagePos({
            x: pointer.x - mousePointTo.x * z,
            y: pointer.y - mousePointTo.y * z,
          });
        }}
        onMouseDown={(event) => {
          if (spacePressed) return;
          if (!drawing) {
            if (event.target === event.target.getStage()) select([]);
            return;
          }
          startStroke();
        }}
        onMouseMove={moveStroke}
        onMouseUp={endStroke}
        onMouseLeave={endStroke}
        onTouchStart={(event) => {
          event.evt.preventDefault();
          startStroke();
        }}
        onTouchMove={(event) => {
          event.evt.preventDefault();
          moveStroke();
        }}
        onTouchEnd={endStroke}
        style={{ cursor: spacePressed ? "grab" : drawing ? "crosshair" : "default" }}
      >
        <Layer>
          <Group id="document">
            {panels.map((panel) => (
              <PanelGroup
                key={panel.id}
                panel={panel}
                objects={objects.filter((object) => object.panelId === panel.id)}
                drawing={drawing}
                exporting={exporting}
                fontsReady={fontsReady}
                cropPanelId={cropPanelId}
                selectedId={selection[0] ?? null}
                editingTextId={editingTextId}
                onSelectPanel={() => {
                  if (drawing) return;
                  select([]);
                  setActivePanel(panel.id);
                }}
                onSelectObject={(id) => {
                  if (drawing) return;
                  setActivePanel(panel.id);
                  select([id]);
                }}
                onEditText={setEditingTextId}
                onObjectChange={updateObject}
                onGuides={setGuides}
              />
            ))}
            {draftStroke && (
              <Group
                x={panels.find((panel) => panel.id === draftStroke.panelId)?.x ?? 0}
                y={panels.find((panel) => panel.id === draftStroke.panelId)?.y ?? 0}
              >
                <StrokeLine object={{ ...draftStroke, id: "draft", type: "stroke", x: 0, y: 0, rotation: 0, opacity: draftStroke.tool === "highlighter" ? 0.38 : 1, locked: false, visible: true }} />
              </Group>
            )}
          </Group>
          {guides.v != null && (
            <Line points={[guides.v, -4000, guides.v, 8000]} stroke="#E8B86D" strokeWidth={1 / zoom} dash={[6 / zoom, 4 / zoom]} listening={false} />
          )}
          {guides.h != null && (
            <Line points={[-4000, guides.h, 8000, guides.h]} stroke="#E8B86D" strokeWidth={1 / zoom} dash={[6 / zoom, 4 / zoom]} listening={false} />
          )}
          {cropPanelId && cropDraft && (
            <Group
              x={panels.find((panel) => panel.id === cropPanelId)?.x ?? 0}
              y={panels.find((panel) => panel.id === cropPanelId)?.y ?? 0}
            >
              <Rect
                ref={cropRef}
                x={cropDraft.x}
                y={cropDraft.y}
                width={cropDraft.width}
                height={cropDraft.height}
                stroke="#E8B86D"
                strokeWidth={1 / zoom}
                fill="rgba(232,184,109,0.08)"
                draggable
                onDragEnd={(event) =>
                  setCropDraft({
                    ...cropDraft,
                    x: event.target.x(),
                    y: event.target.y(),
                  })
                }
                onTransformEnd={(event) => {
                  const node = event.target;
                  const scaleX = node.scaleX();
                  const scaleY = node.scaleY();
                  node.scaleX(1);
                  node.scaleY(1);
                  setCropDraft({
                    x: node.x(),
                    y: node.y(),
                    width: Math.max(16, node.width() * scaleX),
                    height: Math.max(16, node.height() * scaleY),
                  });
                }}
              />
              <Transformer
                ref={cropTrRef}
                rotateEnabled={false}
                keepRatio={cropLockAspect}
                borderStroke="#E8B86D"
                anchorFill="#E8B86D"
                anchorStroke="#0B0B0C"
                anchorSize={8}
              />
            </Group>
          )}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            enabledAnchors={
              objects.find((object) => object.id === selection[0] && isText(object))
                ? ["middle-left", "middle-right", "top-center", "bottom-center"]
                : undefined
            }
            borderStroke="#E8B86D"
            anchorFill="#F5F2EA"
            anchorStroke="#E8B86D"
            anchorSize={8}
            boundBoxFunc={(oldBox, newBox) =>
              newBox.width < 12 || newBox.height < 12 ? oldBox : newBox
            }
          />
        </Layer>
      </Stage>
      {panels.length === 0 && (
        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-2">
          <p className="font-serif text-3xl italic text-bone">Atelier</p>
          <p className="text-[13px] text-muted">Choose a template to begin</p>
        </div>
      )}
      {cropPanelId && cropDraft && (
        <CropOverlay onCancel={() => setCropPanelId(null)} onApply={applyCropDraft} />
      )}
      {editingTextId && (
        <InlineTextEditor
          object={objects.find((object) => object.id === editingTextId)}
          panels={panels}
          zoom={zoom}
          stagePos={stagePos}
          onClose={() => setEditingTextId(null)}
        />
      )}
    </div>
  );
}

function PanelGroup({
  panel,
  objects,
  drawing,
  exporting,
  fontsReady,
  cropPanelId,
  selectedId,
  editingTextId,
  onSelectPanel,
  onSelectObject,
  onEditText,
  onObjectChange,
  onGuides,
}: {
  panel: Panel;
  objects: CanvasObject[];
  drawing: boolean;
  exporting: boolean;
  fontsReady: boolean;
  cropPanelId: string | null;
  selectedId: string | null;
  editingTextId: string | null;
  onSelectPanel: () => void;
  onSelectObject: (id: string) => void;
  onEditText: (id: string) => void;
  onObjectChange: (id: string, patch: Partial<CanvasObject>) => void;
  onGuides: (guides: { v?: number; h?: number }) => void;
}) {
  const size = displaySize(panel);
  const box = { width: panel.width, height: panel.height };

  return (
    <Group
      x={panel.x}
      y={panel.y}
      clipX={0}
      clipY={0}
      clipWidth={size.width}
      clipHeight={size.height}
    >
      <Group
        x={size.width / 2}
        y={size.height / 2}
        rotation={panel.rotation}
        listening={!drawing}
        onMouseDown={(event) => {
          event.cancelBubble = true;
          onSelectPanel();
        }}
      >
        <Group
          offsetX={box.width / 2}
          offsetY={box.height / 2}
          scaleX={panel.flipH ? -1 : 1}
          scaleY={panel.flipV ? -1 : 1}
        >
          {panel.src ? (
            <FilteredImage panel={panel} size={box} />
          ) : (
            <Rect
              width={box.width}
              height={box.height}
              fill={panel.fill}
              fillLinearGradientStartPoint={panel.fill2 ? { x: 0, y: 0 } : undefined}
              fillLinearGradientEndPoint={panel.fill2 ? { x: 0, y: box.height } : undefined}
              fillLinearGradientColorStops={
                panel.fill2 ? [0, panel.fill, 1, panel.fill2] : undefined
              }
            />
          )}
        </Group>
      </Group>
      <Rect
        width={size.width}
        height={size.height}
        stroke="rgba(245,242,234,0.08)"
        strokeWidth={1}
        listening={false}
      />
      {objects.map((object) =>
        object.visible ? (
          <ObjectNode
            key={object.id}
            object={object}
            panel={panel}
            drawing={drawing}
            exporting={exporting}
            fontsReady={fontsReady}
            disabled={Boolean(cropPanelId)}
            selected={object.id === selectedId}
            editing={object.id === editingTextId}
            onSelect={() => onSelectObject(object.id)}
            onEdit={() => {
              if (isText(object)) onEditText(object.id);
            }}
            onChange={(patch) => onObjectChange(object.id, patch)}
            onGuides={onGuides}
          />
        ) : null,
      )}
    </Group>
  );
}

function FilteredImage({
  panel,
  size,
}: {
  panel: Panel;
  size: { width: number; height: number };
}) {
  const [image] = useImage(resolveSrc(panel.src), "anonymous");
  const ref = useRef<Konva.Image>(null);
  const { brightness, contrast, blur, grayscale, sepia, invert } = panel.filters;
  const active =
    brightness !== 0 || contrast !== 0 || blur !== 0 || grayscale || sepia || invert;
  const filters = useMemo(() => {
    const list: Array<(typeof Konva.Filters)[keyof typeof Konva.Filters]> = [];
    if (grayscale) list.push(Konva.Filters.Grayscale);
    if (sepia) list.push(Konva.Filters.Sepia);
    if (invert) list.push(Konva.Filters.Invert);
    if (brightness !== 0) list.push(Konva.Filters.Brighten);
    if (contrast !== 0) list.push(Konva.Filters.Contrast);
    if (blur !== 0) list.push(Konva.Filters.Blur);
    return list;
  }, [brightness, contrast, blur, grayscale, sepia, invert]);

  useEffect(() => {
    const node = ref.current;
    if (!node || !image) return;
    if (active) node.cache();
    else node.clearCache();
    node.getLayer()?.batchDraw();
  }, [image, active, brightness, contrast, blur, grayscale, sepia, invert, size.width, size.height, panel.crop]);

  if (!image) {
    return <Rect width={size.width} height={size.height} fill="#141416" />;
  }

  return (
    <KonvaImage
      ref={ref}
      image={image}
      width={size.width}
      height={size.height}
      crop={panel.crop ?? undefined}
      filters={active ? filters : undefined}
      brightness={brightness}
      contrast={contrast}
      blurRadius={blur}
    />
  );
}

function ObjectNode({
  object,
  panel,
  drawing,
  exporting,
  fontsReady,
  disabled,
  selected,
  editing,
  onSelect,
  onEdit,
  onChange,
  onGuides,
}: {
  object: CanvasObject;
  panel: Panel;
  drawing: boolean;
  exporting: boolean;
  fontsReady: boolean;
  disabled: boolean;
  selected: boolean;
  editing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onChange: (patch: Partial<CanvasObject>) => void;
  onGuides: (guides: { v?: number; h?: number }) => void;
}) {
  const size = displaySize(panel);
  const listening = !drawing && !disabled && !object.locked;

  function snap(node: Konva.Node, width: number, height: number) {
    const threshold = 8;
    const next: { v?: number; h?: number } = {};
    let x = node.x();
    let y = node.y();
    const cx = x + width / 2;
    const cy = y + height / 2;
    if (Math.abs(cx - size.width / 2) < threshold) {
      x += size.width / 2 - cx;
      next.v = panel.x + size.width / 2;
    }
    if (Math.abs(cy - size.height / 2) < threshold) {
      y += size.height / 2 - cy;
      next.h = panel.y + size.height / 2;
    }
    if (Math.abs(x) < threshold) {
      x = 0;
      next.v = panel.x;
    } else if (Math.abs(x + width - size.width) < threshold) {
      x = size.width - width;
      next.v = panel.x + size.width;
    }
    if (Math.abs(y) < threshold) {
      y = 0;
      next.h = panel.y;
    } else if (Math.abs(y + height - size.height) < threshold) {
      y = size.height - height;
      next.h = panel.y + size.height;
    }
    node.x(x);
    node.y(y);
    onGuides(next);
  }

  const common = {
    id: `obj-${object.id}`,
    x: object.x,
    y: object.y,
    rotation: object.rotation,
    opacity: object.opacity,
    draggable: listening,
    listening,
    onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => {
      event.cancelBubble = true;
      onSelect();
    },
    onDragStart: () => pauseHistory(),
    onDragEnd: (event: Konva.KonvaEventObject<DragEvent>) => {
      resumeHistory();
      onChange({ x: event.target.x(), y: event.target.y() });
      onGuides({});
    },
    onTransformStart: () => pauseHistory(),
  };

  if (isText(object)) {
    return (
      <OutlinedText
        object={object}
        common={common}
        exporting={exporting}
        fontsReady={fontsReady}
        listening={listening}
        selected={selected}
        editing={editing}
        onEdit={onEdit}
        onSnap={snap}
        onChange={onChange}
      />
    );
  }

  if (isImageObj(object)) {
    return (
      <PlacedImage
        object={object}
        common={common}
        onSnap={snap}
        onChange={onChange}
      />
    );
  }

  if (isStroke(object)) {
    return (
      <Line
        {...common}
        points={object.points}
        stroke={object.color}
        strokeWidth={object.strokeWidth}
        lineCap="round"
        lineJoin="round"
        tension={0.15}
        hitStrokeWidth={Math.max(16, object.strokeWidth)}
        globalCompositeOperation={object.tool === "eraser" ? "destination-out" : "source-over"}
        onDragMove={(event) => snap(event.target, 40, 40)}
        onTransformEnd={(event) => {
          resumeHistory();
          onChange({ x: event.target.x(), y: event.target.y(), rotation: event.target.rotation() });
        }}
      />
    );
  }

  return null;
}

function outlineOffsets(width: number) {
  if (width <= 0) return [];
  const count = width < 4 ? 8 : 16;
  return Array.from({ length: count }, (_, index) => {
    const angle = (index / count) * Math.PI * 2;
    return { x: Math.cos(angle) * width, y: Math.sin(angle) * width };
  });
}

function OutlinedText({
  object,
  common,
  exporting,
  fontsReady,
  listening,
  selected,
  editing,
  onEdit,
  onSnap,
  onChange,
}: {
  object: TextObject;
  common: Record<string, unknown> & {
    onMouseDown: (event: Konva.KonvaEventObject<MouseEvent>) => void;
  };
  exporting: boolean;
  fontsReady: boolean;
  listening: boolean;
  selected: boolean;
  editing: boolean;
  onEdit: () => void;
  onSnap: (node: Konva.Node, width: number, height: number) => void;
  onChange: (patch: Partial<CanvasObject>) => void;
}) {
  const wasSelected = useRef(false);
  const editIfWasSelected = () => {
    if (wasSelected.current) onEdit();
  };
  const display = object.uppercase ? object.text.toUpperCase() : object.text;
  const shown = display || (exporting ? "" : object.placeholder);
  const empty = !object.text;
  const offsets = outlineOffsets(object.strokeWidth);
  const textProps = {
    text: shown,
    width: object.width,
    fontSize: object.fontSize,
    fontFamily: object.fontFamily,
    align: object.align,
    letterSpacing: object.letterSpacing,
    lineHeight: object.lineHeight,
    listening: false,
    perfectDrawEnabled: false,
  } as const;

  return (
    <Group
      {...common}
      visible={!editing}
      opacity={empty && !exporting ? 0.42 : object.opacity}
      listening={listening && fontsReady}
      onMouseDown={(event: Konva.KonvaEventObject<MouseEvent>) => {
        wasSelected.current = selected;
        common.onMouseDown(event);
      }}
      onTouchStart={() => {
        wasSelected.current = selected;
      }}
      onClick={editIfWasSelected}
      onTap={editIfWasSelected}
      onDblClick={onEdit}
      onDblTap={onEdit}
      onDragMove={(event: Konva.KonvaEventObject<DragEvent>) =>
        onSnap(event.target, object.width, object.fontSize)
      }
      onTransformEnd={(event: Konva.KonvaEventObject<Event>) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(1);
        node.scaleY(1);
        resumeHistory();
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(40, object.width * scaleX),
          fontSize: Math.max(8, Math.round(object.fontSize * scaleY)),
        });
      }}
    >
      {offsets.map((offset, index) => (
        <Text
          key={index}
          {...textProps}
          x={offset.x}
          y={offset.y}
          fill={object.stroke}
        />
      ))}
      <Text
        {...textProps}
        listening
        fill={object.fill}
        shadowEnabled={object.shadow && !empty}
        shadowColor={object.stroke}
        shadowBlur={object.shadow ? Math.max(1, object.strokeWidth * 0.2) : 0}
        shadowOffsetY={object.shadow ? 2 : 0}
        shadowOpacity={object.shadow ? 0.8 : 0}
      />
    </Group>
  );
}

function PlacedImage({
  object,
  common,
  onSnap,
  onChange,
}: {
  object: ImageObject;
  common: Record<string, unknown>;
  onSnap: (node: Konva.Node, width: number, height: number) => void;
  onChange: (patch: Partial<CanvasObject>) => void;
}) {
  const [image] = useImage(resolveSrc(object.src), "anonymous");
  return (
    <KonvaImage
      {...common}
      image={image}
      width={object.width}
      height={object.height}
      scaleX={object.flipH ? -1 : 1}
      scaleY={object.flipV ? -1 : 1}
      offsetX={object.flipH ? object.width : 0}
      offsetY={object.flipV ? object.height : 0}
      onDragMove={(event: Konva.KonvaEventObject<DragEvent>) =>
        onSnap(event.target, object.width, object.height)
      }
      onTransformEnd={(event: Konva.KonvaEventObject<Event>) => {
        const node = event.target;
        const scaleX = node.scaleX();
        const scaleY = node.scaleY();
        node.scaleX(object.flipH ? -1 : 1);
        node.scaleY(object.flipV ? -1 : 1);
        resumeHistory();
        onChange({
          x: node.x(),
          y: node.y(),
          rotation: node.rotation(),
          width: Math.max(12, Math.abs(object.width * scaleX)),
          height: Math.max(12, Math.abs(object.height * scaleY)),
        });
      }}
    />
  );
}

function StrokeLine({ object }: { object: StrokeObject }) {
  return (
    <Line
      points={object.points}
      stroke={object.color}
      strokeWidth={object.strokeWidth}
      lineCap="round"
      lineJoin="round"
      tension={0.15}
      opacity={object.opacity}
      globalCompositeOperation={object.tool === "eraser" ? "destination-out" : "source-over"}
      listening={false}
    />
  );
}

function InlineTextEditor({
  object,
  panels,
  zoom,
  stagePos,
  onClose,
}: {
  object?: CanvasObject;
  panels: Panel[];
  zoom: number;
  stagePos: { x: number; y: number };
  onClose: () => void;
}) {
  if (!object || !isText(object)) return null;
  const panel = panels.find((item) => item.id === object.panelId);
  if (!panel) return null;
  return (
    <TextOverlay
      key={object.id}
      object={object}
      panel={panel}
      zoom={zoom}
      stagePos={stagePos}
      onClose={onClose}
    />
  );
}

function TextOverlay({
  object,
  panel,
  zoom,
  stagePos,
  onClose,
}: {
  object: TextObject;
  panel: Panel;
  zoom: number;
  stagePos: { x: number; y: number };
  onClose: () => void;
}) {
  const updateObject = useDocStore((state) => state.updateObject);
  const ref = useRef<HTMLTextAreaElement>(null);
  const originalText = useRef(object.text);

  useEffect(() => {
    const id = object.id;
    pauseHistory();
    return () => {
      const current = useDocStore.getState().objects.find((item) => item.id === id);
      const finalText = current && isText(current) ? current.text : null;
      if (finalText === null || finalText === originalText.current) {
        resumeHistory();
        return;
      }
      // Restore while paused so the resumed update records original -> final as one undo step.
      updateObject(id, { text: originalText.current });
      resumeHistory();
      updateObject(id, { text: finalText });
    };
  }, [object.id, updateObject]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }, []);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${el.scrollHeight}px`;
  }, [object.text, object.fontSize, object.width, object.fontFamily, zoom]);

  return (
    <textarea
      ref={ref}
      value={object.text}
      placeholder={object.placeholder}
      spellCheck={false}
      rows={1}
      onChange={(event) => updateObject(object.id, { text: event.target.value })}
      onBlur={onClose}
      onKeyDown={(event) => {
        if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
      className="absolute z-10 m-0 block resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:opacity-40"
      style={{
        left: stagePos.x + (panel.x + object.x) * zoom,
        top: stagePos.y + (panel.y + object.y) * zoom,
        width: object.width * zoom,
        transform: `rotate(${object.rotation}deg)`,
        transformOrigin: "top left",
        fontFamily: object.fontFamily,
        fontSize: object.fontSize * zoom,
        lineHeight: object.lineHeight,
        letterSpacing: object.letterSpacing * zoom,
        textAlign: object.align as CSSProperties["textAlign"],
        textTransform: object.uppercase ? "uppercase" : "none",
        color: object.fill,
        caretColor: object.fill,
        opacity: object.opacity,
        WebkitTextStroke: object.strokeWidth
          ? `${object.strokeWidth * 2 * zoom}px ${object.stroke}`
          : undefined,
        paintOrder: "stroke fill",
      }}
    />
  );
}
